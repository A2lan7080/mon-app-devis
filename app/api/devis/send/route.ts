import { NextResponse } from "next/server";
import { Resend } from "resend";
import { FieldValue } from "firebase-admin/firestore";
import {
  renderDevisEmailHtml,
  renderDevisEmailText,
} from "../../../../lib/render-devis-email";
import { formatNumeroDevisPourAffichage } from "../../../../lib/format-numero-devis";
import {
  buildAcceptanceUrl,
  generateAcceptanceToken,
  getAcceptanceBaseUrl,
  hashAcceptanceToken,
} from "../../../../lib/devis-acceptance";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import type { Devis, Entreprise } from "../../../../types/devis";

export const runtime = "nodejs";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
  logoRemplaceNomEntreprise?: boolean;
};

type Payload = {
  devisId?: string;
  toEmail?: string;
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

  return messageNettoye ? messageNettoye.slice(0, 2000) : undefined;
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
    const devisSnap = await devisRef.get();
    const devisFirestore = devisSnap.data() as
      | (DevisBusiness & {
          acceptanceTokenHash?: string;
          acceptanceTokenCreatedAt?: number;
        })
      | undefined;

    if (
      !devisSnap.exists ||
      devisFirestore?.entrepriseId !== securiteEmail.entrepriseId
    ) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const entrepriseSnap = await adminDb
      .collection("entreprises")
      .doc(securiteEmail.entrepriseId)
      .get();

    if (!entrepriseSnap.exists) {
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
    const maintenant = Date.now();
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Devis ${formatNumeroDevisPourAffichage(devis.id)} - ${
      entreprise.nom || "Batiflow"
    }`;
    const devisPourEmail: DevisBusiness = {
      ...devis,
      statut: "Envoyé",
    };

    // TODO: joindre le PDF genere cote serveur quand le pipeline PDF serveur sera securise.
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
    });

    if (error) {
      console.error("Erreur Resend envoi devis :", {
        ...logContexte,
        resendEmailId: null,
        erreurResend: error,
      });

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
    const batch = adminDb.batch();

    if (
      devisFirestore.acceptanceTokenHash &&
      devisFirestore.acceptanceTokenHash !== acceptanceTokenHash
    ) {
      batch.delete(
        adminDb
          .collection("devisAcceptanceLinks")
          .doc(devisFirestore.acceptanceTokenHash)
      );
    }

    batch.set(acceptanceLinkRef, {
      devisId,
      entrepriseId: securiteEmail.entrepriseId,
      createdAt: maintenant,
      sentToEmail: toEmail,
    });

    batch.update(devisRef, {
      statut: "Envoyé",
      dateEnvoi: FieldValue.serverTimestamp(),
      emailDestinataire: toEmail,
      resendEmailId,
      acceptanceTokenHash,
      acceptanceTokenCreatedAt:
        devisFirestore.acceptanceTokenCreatedAt ?? maintenant,
      acceptanceTokenLastSentAt: maintenant,
    });

    await batch.commit();

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

    return NextResponse.json(
      { error: "Impossible d’envoyer le devis." },
      { status: 500 }
    );
  }
}
