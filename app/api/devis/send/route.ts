import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  renderDevisEmailHtml,
  renderDevisEmailText,
} from "../../../../lib/render-devis-email";
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
};

type Payload = {
  devis?: DevisBusiness;
  toEmail?: string;
  entreprise?: EntrepriseSettings;
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

function getBearerToken(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    return null;
  }

  const token = authorization.slice("Bearer ".length).trim();

  return token || null;
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
    const profilSnap = await adminDb.collection("users").doc(decodedToken.uid).get();

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

    if (!process.env.BATIFLOW_FROM_EMAIL) {
      return NextResponse.json(
        { error: "BATIFLOW_FROM_EMAIL est manquante." },
        { status: 500 }
      );
    }

    const devis = body.devis;
    const toEmail = body.toEmail?.trim();
    const entreprise = body.entreprise;

    if (!devis) {
      return NextResponse.json({ error: "Devis manquant." }, { status: 400 });
    }

    if (!devis.id) {
      return NextResponse.json(
        { error: "Identifiant devis manquant." },
        { status: 400 }
      );
    }

    if (!toEmail) {
      return NextResponse.json(
        { error: "Email destinataire manquant." },
        { status: 400 }
      );
    }

    if (!entreprise) {
      return NextResponse.json(
        { error: "Informations entreprise manquantes." },
        { status: 400 }
      );
    }

    const devisRef = adminDb.collection("devis").doc(devis.id);
    const devisSnap = await devisRef.get();
    const devisFirestore = devisSnap.data() as
      | {
          entrepriseId?: string;
          acceptanceTokenHash?: string;
          acceptanceTokenCreatedAt?: number;
        }
      | undefined;

    if (
      !devisSnap.exists ||
      devisFirestore?.entrepriseId !== securiteEmail.entrepriseId
    ) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const acceptanceToken = generateAcceptanceToken();
    const acceptanceTokenHash = hashAcceptanceToken(acceptanceToken);
    const acceptanceUrl = buildAcceptanceUrl(
      getAcceptanceBaseUrl(request),
      acceptanceToken
    );
    const maintenant = Date.now();
    const acceptanceLinkRef = adminDb
      .collection("devisAcceptanceLinks")
      .doc(acceptanceTokenHash);
    const batch = adminDb.batch();

    if (
      devisFirestore?.acceptanceTokenHash &&
      devisFirestore.acceptanceTokenHash !== acceptanceTokenHash
    ) {
      batch.delete(
        adminDb
          .collection("devisAcceptanceLinks")
          .doc(devisFirestore.acceptanceTokenHash)
      );
    }

    batch.set(acceptanceLinkRef, {
      devisId: devis.id,
      entrepriseId: securiteEmail.entrepriseId,
      createdAt: maintenant,
      sentToEmail: toEmail,
    });

    batch.update(devisRef, {
      acceptanceTokenHash,
      acceptanceTokenCreatedAt:
        devisFirestore?.acceptanceTokenCreatedAt ?? maintenant,
      acceptanceTokenLastSentAt: maintenant,
    });

    await batch.commit();

    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Devis ${devis.id} - ${entreprise.nom}`;

    const { data, error } = await resend.emails.send({
      from: `Batiflow <${process.env.BATIFLOW_FROM_EMAIL}>`,
      to: [toEmail],
      subject,
      html: renderDevisEmailHtml(devis, entreprise, acceptanceUrl),
      text: renderDevisEmailText(devis, entreprise, acceptanceUrl),
    });

    if (error) {
      return NextResponse.json(
        { error: error.message || "Erreur Resend." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      emailId: data?.id ?? null,
    });
  } catch (error) {
    console.error("Erreur route envoi devis :", error);

    return NextResponse.json(
      { error: "Impossible d’envoyer le devis." },
      { status: 500 }
    );
  }
}
