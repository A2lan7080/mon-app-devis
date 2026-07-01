import { NextResponse } from "next/server";
import { Resend } from "resend";
import { FieldValue } from "firebase-admin/firestore";
import {
  renderDevisEmailHtml,
  renderDevisEmailText,
} from "../../../../lib/render-devis-email";
import { buildDevisEmailSubject } from "../../../../lib/devis-email-defaults";
import { formatNumeroDevisPourAffichage } from "../../../../lib/format-numero-devis";
import { generateServerDevisPdf } from "../../../../lib/pdf/generate-server-devis-pdf";
import {
  buildAcceptanceUrl,
  generateAcceptanceToken,
  getAcceptanceBaseUrl,
  hashAcceptanceToken,
} from "../../../../lib/devis-acceptance";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import type { Devis, Entreprise } from "../../../../types/devis";

export const runtime = "nodejs";
export const maxDuration = 60;

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
  emailSendLockId?: string;
  emailSendLockAt?: number;
  acceptanceLockId?: string;
};

type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
  logoRemplaceNomEntreprise?: boolean;
};

type Payload = {
  devisId?: string;
  toEmail?: string;
  subject?: string;
  message?: string;
};

type ProfilUtilisateurEmail = {
  actif?: boolean;
  active?: boolean;
  role?: string;
  entrepriseId?: string;
};

type VerificationSecuriteEmail =
  | {
      uid: string;
      entrepriseId: string;
    }
  | {
      response: NextResponse;
    };

type LogContexteEnvoi = {
  devisId?: string;
  entrepriseId?: string;
  toEmail?: string;
  resendEmailId?: string | null;
};

const DUREE_VERROU_ENVOI_MS = 2 * 60 * 1000;

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
}

function normaliserEmail(email?: string) {
  const emailNettoye = email?.trim().toLowerCase() ?? "";

  if (!emailNettoye) {
    return null;
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNettoye)) {
    return null;
  }

  return emailNettoye.slice(0, 254);
}

function normaliserMessage(message?: string) {
  const messageNettoye = message?.trim() ?? "";

  return messageNettoye ? messageNettoye.slice(0, 4000) : undefined;
}

function normaliserObjet(subject?: string) {
  const objetNettoye = subject?.replaceAll(/[\r\n]+/g, " ").trim() ?? "";

  return objetNettoye ? objetNettoye.slice(0, 180) : undefined;
}

async function libererVerrouEnvoi(devisId: string, lockId: string) {
  const devisRef = adminDb.collection("devis").doc(devisId);

  await adminDb.runTransaction(async (transaction) => {
    const devisSnap = await transaction.get(devisRef);

    if (
      devisSnap.exists &&
      devisSnap.data()?.emailSendLockId === lockId
    ) {
      transaction.update(devisRef, {
        emailSendLockId: FieldValue.delete(),
        emailSendLockAt: FieldValue.delete(),
      });
    }
  });
}

async function verifierAdminEmail(
  request: Request
): Promise<VerificationSecuriteEmail> {
  const token = getBearerToken(request);

  if (!token) {
    return {
      response: NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      ),
    };
  }

  try {
    const decodedToken = await adminAuth.verifyIdToken(token);
    const profilSnap = await adminDb
      .collection("users")
      .doc(decodedToken.uid)
      .get();

    if (!profilSnap.exists) {
      console.warn("[devis.send] Profil utilisateur refusé", {
        uid: decodedToken.uid,
        actif: undefined,
        active: undefined,
        role: undefined,
        entrepriseId: undefined,
      });

      return {
        response: NextResponse.json(
          { error: "Profil utilisateur introuvable." },
          { status: 403 }
        ),
      };
    }

    const profil = profilSnap.data() as ProfilUtilisateurEmail;
    const entrepriseId = profil.entrepriseId?.trim();
    const utilisateurActif =
      profil.actif === true || profil.active === true;

    const journaliserProfilRefuse = () => {
      console.warn("[devis.send] Profil utilisateur refusé", {
        uid: decodedToken.uid,
        actif: profil.actif,
        active: profil.active,
        role: profil.role,
        entrepriseId,
      });
    };

    if (!utilisateurActif) {
      journaliserProfilRefuse();

      return {
        response: NextResponse.json(
          { error: "Utilisateur inactif." },
          { status: 403 }
        ),
      };
    }

    if (profil.role !== "admin") {
      journaliserProfilRefuse();

      return {
        response: NextResponse.json(
          { error: "Seul un administrateur peut envoyer un devis." },
          { status: 403 }
        ),
      };
    }

    if (!entrepriseId) {
      journaliserProfilRefuse();

      return {
        response: NextResponse.json(
          { error: "Entreprise non définie." },
          { status: 403 }
        ),
      };
    }

    return {
      uid: decodedToken.uid,
      entrepriseId,
    };
  } catch {
    return {
      response: NextResponse.json(
        { error: "Authentification requise." },
        { status: 401 }
      ),
    };
  }
}

export async function POST(request: Request) {
  let logContexte: LogContexteEnvoi = {};
  let devisVerrouille:
    | {
        devisId: string;
        lockId: string;
      }
    | undefined;

  try {
    const securiteEmail = await verifierAdminEmail(request);

    if ("response" in securiteEmail) {
      return securiteEmail.response;
    }

    const body = (await request.json()) as Payload;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY est manquante." },
        { status: 500 }
      );
    }

    const fromEmail = process.env.BATIFLOW_FROM_EMAIL?.trim();
    const fromName = process.env.BATIFLOW_FROM_NAME?.trim() || "BatiFlow";

    if (!fromEmail || !normaliserEmail(fromEmail)) {
      return NextResponse.json(
        { error: "BATIFLOW_FROM_EMAIL est invalide." },
        { status: 500 }
      );
    }

    const from = `${fromName} <${fromEmail}>`;

    const devisId = body.devisId?.trim();
    const toEmail = normaliserEmail(body.toEmail);
    const message = normaliserMessage(body.message);
    const subjectPersonnalise = normaliserObjet(body.subject);

    logContexte = {
      devisId,
      entrepriseId: securiteEmail.entrepriseId,
      toEmail: toEmail ?? body.toEmail?.trim(),
    };

    if (!devisId) {
      return NextResponse.json(
        { error: "Identifiant devis manquant." },
        { status: 400 }
      );
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: "Email destinataire invalide." },
        { status: 400 }
      );
    }

    const devisRef = adminDb.collection("devis").doc(devisId);
    const lockId = crypto.randomUUID();
    const maintenant = Date.now();
    const devisFirestore = await adminDb.runTransaction(
      async (transaction) => {
        const devisSnap = await transaction.get(devisRef);

        if (!devisSnap.exists) {
          throw new Error("DEVIS_FORBIDDEN");
        }

        const devisActuel = devisSnap.data() as DevisBusiness;

        if (devisActuel.entrepriseId !== securiteEmail.entrepriseId) {
          throw new Error("DEVIS_FORBIDDEN");
        }

        if (
          devisActuel.statut === "Accepté" ||
          devisActuel.statut === "Refusé"
        ) {
          throw new Error("DEVIS_FINAL");
        }

        if (devisActuel.acceptanceLockId) {
          throw new Error("DEVIS_ACCEPTANCE_LOCKED");
        }

        if (
          devisActuel.emailSendLockId &&
          typeof devisActuel.emailSendLockAt === "number" &&
          maintenant - devisActuel.emailSendLockAt <
            DUREE_VERROU_ENVOI_MS
        ) {
          throw new Error("DEVIS_SEND_LOCKED");
        }

        transaction.update(devisRef, {
          emailSendLockId: lockId,
          emailSendLockAt: maintenant,
        });

        return devisActuel;
      }
    );
    devisVerrouille = {
      devisId,
      lockId,
    };

    const entrepriseSnap = await adminDb
      .collection("entreprises")
      .doc(securiteEmail.entrepriseId)
      .get();

    if (!entrepriseSnap.exists) {
      await libererVerrouEnvoi(devisId, lockId);
      devisVerrouille = undefined;

      return NextResponse.json(
        { error: "Entreprise introuvable." },
        { status: 404 }
      );
    }

    const entreprise = entrepriseSnap.data() as EntrepriseSettings;
    const devis = {
      ...devisFirestore,
      id: devisId,
    } as DevisBusiness;
    const replyTo = normaliserEmail(entreprise.email);
    const acceptanceToken = generateAcceptanceToken();
    const acceptanceTokenHash = hashAcceptanceToken(acceptanceToken);
    const acceptanceUrl = buildAcceptanceUrl(
      getAcceptanceBaseUrl(request),
      acceptanceToken
    );
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject =
      subjectPersonnalise ??
      buildDevisEmailSubject(
        formatNumeroDevisPourAffichage(devis.id),
        entreprise.nom || "BatiFlow"
      );
    const devisPourEmail: DevisBusiness = {
      ...devis,
      statut: "Envoyé",
    };
    const numeroDevis = formatNumeroDevisPourAffichage(devis.id);
    const pdfDevis = await generateServerDevisPdf(
      devisPourEmail,
      entreprise
    );

    const { data, error } = await resend.emails.send({
      from,
      to: [toEmail],
      subject,
      ...(replyTo ? { replyTo } : {}),
      html: renderDevisEmailHtml(
        devisPourEmail,
        entreprise,
        acceptanceUrl,
        message
      ),
      text: renderDevisEmailText(
        devisPourEmail,
        entreprise,
        acceptanceUrl,
        message
      ),
      attachments: [
        {
          content: pdfDevis,
          filename: `${numeroDevis}.pdf`,
          contentType: "application/pdf",
        },
      ],
    });

    if (error) {
      console.error("Erreur Resend envoi devis :", {
        ...logContexte,
        resendEmailId: null,
        erreurResend: error,
      });

      await libererVerrouEnvoi(devisId, lockId);
      devisVerrouille = undefined;

      return NextResponse.json(
        { error: error.message || "Erreur Resend." },
        { status: 500 }
      );
    }

    const resendEmailId = data?.id ?? null;
    logContexte = {
      ...logContexte,
      resendEmailId,
    };

    const acceptanceLinkRef = adminDb
      .collection("devisAcceptanceLinks")
      .doc(acceptanceTokenHash);

    await adminDb.runTransaction(async (transaction) => {
      const devisSnap = await transaction.get(devisRef);

      if (
        !devisSnap.exists ||
        devisSnap.data()?.emailSendLockId !== lockId
      ) {
        throw new Error("DEVIS_SEND_LOCK_LOST");
      }

      const devisActuel = devisSnap.data() as DevisBusiness;

      if (
        devisActuel.statut === "Accepté" ||
        devisActuel.statut === "Refusé"
      ) {
        throw new Error("DEVIS_FINAL");
      }

      if (
        devisActuel.acceptanceTokenHash &&
        devisActuel.acceptanceTokenHash !== acceptanceTokenHash
      ) {
        transaction.delete(
          adminDb
            .collection("devisAcceptanceLinks")
            .doc(devisActuel.acceptanceTokenHash)
        );
      }

      transaction.set(acceptanceLinkRef, {
        devisId,
        entrepriseId: securiteEmail.entrepriseId,
        createdAt: maintenant,
        sentToEmail: toEmail,
      });

      transaction.update(devisRef, {
        statut: "Envoyé",
        dateEnvoi: FieldValue.serverTimestamp(),
        emailDestinataire: toEmail,
        resendEmailId,
        acceptanceTokenHash,
        acceptanceTokenCreatedAt:
          devisActuel.acceptanceTokenCreatedAt ?? maintenant,
        acceptanceTokenLastSentAt: maintenant,
        emailSendLockId: FieldValue.delete(),
        emailSendLockAt: FieldValue.delete(),
      });
    });
    devisVerrouille = undefined;

    console.info("Devis envoye via Resend :", logContexte);

    return NextResponse.json({
      success: true,
      emailId: resendEmailId,
    });
  } catch (error) {
    console.error("Erreur route envoi devis :", {
      ...logContexte,
      erreurResend: error,
    });

    if (devisVerrouille) {
      await libererVerrouEnvoi(
        devisVerrouille.devisId,
        devisVerrouille.lockId
      ).catch((unlockError) => {
        console.error(
          "Erreur libération verrou envoi devis :",
          unlockError
        );
      });
    }

    if (error instanceof Error) {
      if (error.message === "DEVIS_FORBIDDEN") {
        return NextResponse.json(
          { error: "Accès refusé." },
          { status: 403 }
        );
      }

      if (error.message === "DEVIS_FINAL") {
        return NextResponse.json(
          {
            error:
              "Ce devis est déjà finalisé et ne peut plus être renvoyé.",
          },
          { status: 409 }
        );
      }

      if (
        error.message === "DEVIS_SEND_LOCKED" ||
        error.message === "DEVIS_ACCEPTANCE_LOCKED"
      ) {
        return NextResponse.json(
          { error: "Une opération est déjà en cours sur ce devis." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Impossible d’envoyer le devis." },
      { status: 500 }
    );
  }
}
