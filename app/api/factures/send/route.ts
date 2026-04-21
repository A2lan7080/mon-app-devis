import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  renderFactureEmailHtml,
  renderFactureEmailText,
} from "../../../../lib/render-facture-email";
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

export async function POST(request: Request) {
  try {
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