import { NextResponse } from "next/server";
import { createHash } from "crypto";
import {
  adminDb,
  adminStorage,
} from "../../../../../../lib/firebase-admin";
import { hashAcceptanceToken } from "../../../../../../lib/devis-acceptance";
import { formatNumeroDevisPourAffichage } from "../../../../../../lib/format-numero-devis";
import { generateServerDevisPdf } from "../../../../../../lib/pdf/generate-server-devis-pdf";
import type { Devis, Entreprise } from "../../../../../../types/devis";

export const runtime = "nodejs";
export const maxDuration = 60;

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

type AcceptanceLink = {
  devisId?: string;
  entrepriseId?: string;
};

type DevisPdf = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  entrepriseId?: string;
  acceptedPdfStoragePath?: string;
  acceptedPdfHash?: string;
};

type EntreprisePdf = Entreprise & {
  logoUrl?: string;
  logoStoragePath?: string;
  logoRemplaceNomEntreprise?: boolean;
};

function erreurPdf(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { token: tokenParam } = await context.params;
    const token = decodeURIComponent(tokenParam ?? "").trim();

    if (!token) {
      return erreurPdf("Lien de devis invalide.", 404);
    }

    const tokenHash = hashAcceptanceToken(token);
    const linkSnap = await adminDb
      .collection("devisAcceptanceLinks")
      .doc(tokenHash)
      .get();

    if (!linkSnap.exists) {
      return erreurPdf("Lien de devis invalide.", 404);
    }

    const link = linkSnap.data() as AcceptanceLink;

    if (!link.devisId || !link.entrepriseId) {
      return erreurPdf("Lien de devis invalide.", 404);
    }

    const [devisSnap, entrepriseSnap] = await Promise.all([
      adminDb.collection("devis").doc(link.devisId).get(),
      adminDb.collection("entreprises").doc(link.entrepriseId).get(),
    ]);

    if (!devisSnap.exists || !entrepriseSnap.exists) {
      return erreurPdf("Devis introuvable.", 404);
    }

    const devis = devisSnap.data() as DevisPdf;

    if (
      devis.entrepriseId !== link.entrepriseId ||
      devis.acceptanceTokenHash !== tokenHash
    ) {
      return erreurPdf("Lien de devis invalide.", 404);
    }

    const entreprise = entrepriseSnap.data() as EntreprisePdf;
    const pdf =
      devis.statut === "Accepté" && devis.acceptedPdfStoragePath
        ? (
            await adminStorage
              .bucket()
              .file(devis.acceptedPdfStoragePath)
              .download()
          )[0]
        : await generateServerDevisPdf(devis, entreprise);

    if (
      devis.statut === "Accepté" &&
      devis.acceptedPdfHash &&
      createHash("sha256").update(pdf).digest("hex") !==
        devis.acceptedPdfHash
    ) {
      return erreurPdf("Le PDF accepté est invalide.", 409);
    }
    const numeroDevis = formatNumeroDevisPourAffichage(devis.id).replaceAll(
      /[^a-zA-Z0-9_-]/g,
      "-"
    );

    return new Response(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Cache-Control": "no-store",
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${numeroDevis}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Erreur téléchargement PDF devis public :", error);
    return erreurPdf("Impossible de générer le PDF.", 500);
  }
}
