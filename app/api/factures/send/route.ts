import { NextResponse } from "next/server";
import { Resend } from "resend";
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
  facture?: Facture;
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

    const facture = body.facture;
    const toEmail = body.toEmail?.trim();
    const entreprise = body.entreprise;

    if (!facture) {
      return NextResponse.json(
        { error: "Facture manquante." },
        { status: 400 }
      );
    }

    if (!facture.id) {
      return NextResponse.json(
        { error: "Identifiant facture manquant." },
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

    const factureSnap = await adminDb.collection("factures").doc(facture.id).get();
    const factureFirestore = factureSnap.data() as
      | { entrepriseId?: string }
      | undefined;

    if (
      !factureSnap.exists ||
      factureFirestore?.entrepriseId !== securiteEmail.entrepriseId
    ) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);
    const subject = `Facture ${facture.reference} - ${entreprise.nom}`;

    const { data, error } = await resend.emails.send({
      from: `Batiflow <${process.env.BATIFLOW_FROM_EMAIL}>`,
      to: [toEmail],
      subject,
      html: renderFactureEmailHtml(facture, entreprise),
      text: renderFactureEmailText(facture, entreprise),
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
    console.error("Erreur route envoi facture :", error);

    return NextResponse.json(
      { error: "Impossible d’envoyer la facture." },
      { status: 500 }
    );
  }
}
