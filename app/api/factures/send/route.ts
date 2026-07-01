import { NextResponse } from "next/server";
import { Resend } from "resend";
import { FieldValue } from "firebase-admin/firestore";
import {
  renderFactureEmailHtml,
  renderFactureEmailText,
} from "../../../../lib/render-facture-email";
import { adminAuth, adminDb } from "../../../../lib/firebase-admin";
import type { Facture } from "../../../../types/factures";
import type { Entreprise } from "../../../../types/devis";

export const runtime = "nodejs";

type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
};

type Payload = {
  factureId?: string;
  toEmail?: string;
};

type ProfilUtilisateurEmail = {
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

type FactureEmail = Facture & {
  emailSendLockId?: string;
  emailSendLockAt?: number;
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

  if (
    !emailNettoye ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNettoye)
  ) {
    return null;
  }

  return emailNettoye.slice(0, 254);
}

async function libererVerrouEnvoi(
  factureId: string,
  lockId: string
) {
  const factureRef = adminDb.collection("factures").doc(factureId);

  await adminDb.runTransaction(async (transaction) => {
    const factureSnap = await transaction.get(factureRef);

    if (
      factureSnap.exists &&
      factureSnap.data()?.emailSendLockId === lockId
    ) {
      transaction.update(factureRef, {
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
      return {
        response: NextResponse.json(
          { error: "Accès refusé." },
          { status: 403 }
        ),
      };
    }

    const profil = profilSnap.data() as ProfilUtilisateurEmail;
    const entrepriseId = profil.entrepriseId?.trim();

    if (profil.active !== true || profil.role !== "admin" || !entrepriseId) {
      return {
        response: NextResponse.json(
          { error: "Accès refusé." },
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
  let factureVerrouillee:
    | {
        factureId: string;
        lockId: string;
      }
    | undefined;

  try {
    const securiteEmail = await verifierAdminEmail(request);

    if ("response" in securiteEmail) {
      return securiteEmail.response;
    }

    const body = (await request.json().catch(() => ({}))) as Payload;

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY est manquante." },
        { status: 500 }
      );
    }

    const fromEmail = normaliserEmail(process.env.BATIFLOW_FROM_EMAIL);

    if (!fromEmail) {
      return NextResponse.json(
        { error: "BATIFLOW_FROM_EMAIL est invalide." },
        { status: 500 }
      );
    }

    const factureId = body.factureId?.trim();
    const toEmail = normaliserEmail(body.toEmail);

    if (!factureId) {
      return NextResponse.json(
        { error: "Identifiant facture manquant." },
        { status: 400 }
      );
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: "Email destinataire invalide." },
        { status: 400 }
      );
    }

    const factureRef = adminDb.collection("factures").doc(factureId);
    const lockId = crypto.randomUUID();
    const maintenant = Date.now();
    const facture = await adminDb.runTransaction(async (transaction) => {
      const factureSnap = await transaction.get(factureRef);

      if (!factureSnap.exists) {
        throw new Error("FACTURE_NOT_FOUND");
      }

      const factureFirestore = factureSnap.data() as FactureEmail;

      if (factureFirestore.entrepriseId !== securiteEmail.entrepriseId) {
        throw new Error("FACTURE_FORBIDDEN");
      }

      if (
        factureFirestore.emailSendLockId &&
        typeof factureFirestore.emailSendLockAt === "number" &&
        maintenant - factureFirestore.emailSendLockAt <
          DUREE_VERROU_ENVOI_MS
      ) {
        throw new Error("FACTURE_SEND_LOCKED");
      }

      transaction.update(factureRef, {
        emailSendLockId: lockId,
        emailSendLockAt: maintenant,
      });

      return {
        ...factureFirestore,
        id: factureId,
      };
    });

    factureVerrouillee = {
      factureId,
      lockId,
    };

    const entrepriseSnap = await adminDb
      .collection("entreprises")
      .doc(securiteEmail.entrepriseId)
      .get();

    if (!entrepriseSnap.exists) {
      await libererVerrouEnvoi(factureId, lockId);
      factureVerrouillee = undefined;

      return NextResponse.json(
        { error: "Entreprise introuvable." },
        { status: 404 }
      );
    }

    const entreprise = entrepriseSnap.data() as EntrepriseSettings;
    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Facture ${facture.reference} - ${entreprise.nom}`;
    const { data, error } = await resend.emails.send({
      from: `Batiflow <${fromEmail}>`,
      to: [toEmail],
      subject,
      html: renderFactureEmailHtml(facture, entreprise),
      text: renderFactureEmailText(facture, entreprise),
    });

    if (error) {
      await libererVerrouEnvoi(factureId, lockId);
      factureVerrouillee = undefined;

      return NextResponse.json(
        { error: error.message || "Erreur Resend." },
        { status: 500 }
      );
    }

    const emailId = data?.id ?? null;

    await adminDb.runTransaction(async (transaction) => {
      const factureSnap = await transaction.get(factureRef);

      if (
        !factureSnap.exists ||
        factureSnap.data()?.emailSendLockId !== lockId
      ) {
        throw new Error("FACTURE_SEND_LOCK_LOST");
      }

      const factureActuelle = factureSnap.data() as FactureEmail;

      transaction.update(factureRef, {
        ...(factureActuelle.statut === "Payée"
          ? {}
          : { statut: "Envoyée" }),
        dateEnvoi: FieldValue.serverTimestamp(),
        emailDestinataire: toEmail,
        resendEmailId: emailId,
        updatedAt: Date.now(),
        emailSendLockId: FieldValue.delete(),
        emailSendLockAt: FieldValue.delete(),
      });
    });
    factureVerrouillee = undefined;

    return NextResponse.json({
      success: true,
      emailId,
    });
  } catch (error) {
    console.error("Erreur route envoi facture :", error);

    if (factureVerrouillee) {
      await libererVerrouEnvoi(
        factureVerrouillee.factureId,
        factureVerrouillee.lockId
      ).catch((unlockError) => {
        console.error(
          "Erreur libération verrou envoi facture :",
          unlockError
        );
      });
    }

    if (error instanceof Error) {
      if (
        error.message === "FACTURE_NOT_FOUND" ||
        error.message === "FACTURE_FORBIDDEN"
      ) {
        return NextResponse.json(
          { error: "Accès refusé." },
          { status: 403 }
        );
      }

      if (error.message === "FACTURE_SEND_LOCKED") {
        return NextResponse.json(
          { error: "Un envoi de cette facture est déjà en cours." },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: "Impossible d’envoyer la facture." },
      { status: 500 }
    );
  }
}
