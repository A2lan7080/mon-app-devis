import { NextResponse } from "next/server";
import { Resend } from "resend";
import {
  renderDevisEmailHtml,
  renderDevisEmailText,
} from "../../../../lib/render-devis-email";
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

    const devis = body.devis;
    const toEmail = body.toEmail?.trim();
    const entreprise = body.entreprise;

    if (!devis) {
      return NextResponse.json({ error: "Devis manquant." }, { status: 400 });
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
    const subject = `Devis ${devis.id} - ${entreprise.nom}`;

    const { data, error } = await resend.emails.send({
      from: `Batiflow <${process.env.BATIFLOW_FROM_EMAIL}>`,
      to: [toEmail],
      subject,
      html: renderDevisEmailHtml(devis, entreprise),
      text: renderDevisEmailText(devis, entreprise),
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