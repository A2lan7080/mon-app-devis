import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { hashAcceptanceToken } from "../../../../../lib/devis-acceptance";
import {
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
} from "../../../../../lib/devis-helpers";
import type { Devis } from "../../../../../types/devis";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    token: string;
  }>;
};

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type AcceptanceLink = {
  devisId?: string;
  entrepriseId?: string;
  createdAt?: number;
  sentToEmail?: string;
  usedAt?: number;
};

type AcceptanceBody = {
  name?: string;
  email?: string;
};

class AcceptanceError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function getToken(context: RouteContext) {
  const { token } = await context.params;
  return decodeURIComponent(token ?? "").trim();
}

function jsonError(message: string, status: number) {
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

function jsonSuccess(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store",
    },
  });
}

function normaliserIdentite(body: AcceptanceBody) {
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim().toLowerCase() ?? "";

  if (!name) {
    throw new AcceptanceError("Le nom est obligatoire.", 400);
  }

  if (!email) {
    throw new AcceptanceError("L'adresse email est obligatoire.", 400);
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new AcceptanceError("L'adresse email est invalide.", 400);
  }

  return {
    name: name.slice(0, 160),
    email: email.slice(0, 254),
  };
}

function toPublicDevis(devis: DevisBusiness) {
  const totalHt = calculerTotalHt(devis);
  const totalTvac = calculerTotalTvac(devis);

  return {
    id: devis.id,
    client: devis.client,
    date: devis.date,
    statut: devis.statut,
    chantierTitre: devis.chantierTitre,
    validiteJours: devis.validiteJours,
    totalHt,
    totalTvac,
    totalHtLabel: formatMontant(totalHt),
    totalTvacLabel: formatMontant(totalTvac),
    acceptedAt: devis.acceptedAt ?? null,
    acceptedByName: devis.acceptedByName ?? "",
    acceptedByEmail: devis.acceptedByEmail ?? "",
  };
}

async function getDevisByToken(token: string) {
  if (!token) {
    throw new AcceptanceError("Lien d'acceptation invalide.", 404);
  }

  const tokenHash = hashAcceptanceToken(token);
  const linkSnap = await adminDb
    .collection("devisAcceptanceLinks")
    .doc(tokenHash)
    .get();

  if (!linkSnap.exists) {
    throw new AcceptanceError("Lien d'acceptation invalide.", 404);
  }

  const link = linkSnap.data() as AcceptanceLink;

  if (!link.devisId || !link.entrepriseId) {
    throw new AcceptanceError("Lien d'acceptation invalide.", 404);
  }

  const devisSnap = await adminDb.collection("devis").doc(link.devisId).get();

  if (!devisSnap.exists) {
    throw new AcceptanceError("Devis introuvable.", 404);
  }

  const devis = devisSnap.data() as DevisBusiness;

  if (devis.entrepriseId !== link.entrepriseId) {
    throw new AcceptanceError("Lien d'acceptation invalide.", 404);
  }

  if (devis.acceptanceTokenHash !== tokenHash) {
    throw new AcceptanceError("Lien d'acceptation invalide.", 404);
  }

  return {
    devis,
    tokenHash,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const token = await getToken(context);
    const { devis } = await getDevisByToken(token);

    return jsonSuccess({
      devis: toPublicDevis(devis),
      alreadyAccepted: devis.statut === "Accepté" || Boolean(devis.acceptedAt),
    });
  } catch (error) {
    if (error instanceof AcceptanceError) {
      return jsonError(error.message, error.status);
    }

    console.error("Erreur lecture acceptation devis :", error);
    return jsonError("Impossible de charger le devis.", 500);
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const token = await getToken(context);
    const body = (await request.json()) as AcceptanceBody;
    const identite = normaliserIdentite(body);
    const tokenHash = hashAcceptanceToken(token);
    const maintenant = Date.now();
    const linkRef = adminDb.collection("devisAcceptanceLinks").doc(tokenHash);

    const acceptedDevis = await adminDb.runTransaction(async (transaction) => {
      const acceptedStatut = "Accepté" as const;
      const linkSnap = await transaction.get(linkRef);

      if (!linkSnap.exists) {
        throw new AcceptanceError("Lien d'acceptation invalide.", 404);
      }

      const link = linkSnap.data() as AcceptanceLink;

      if (!link.devisId || !link.entrepriseId) {
        throw new AcceptanceError("Lien d'acceptation invalide.", 404);
      }

      const devisRef = adminDb.collection("devis").doc(link.devisId);
      const devisSnap = await transaction.get(devisRef);

      if (!devisSnap.exists) {
        throw new AcceptanceError("Devis introuvable.", 404);
      }

      const devis = devisSnap.data() as DevisBusiness;

      if (devis.entrepriseId !== link.entrepriseId) {
        throw new AcceptanceError("Lien d'acceptation invalide.", 404);
      }

      if (devis.acceptanceTokenHash !== tokenHash) {
        throw new AcceptanceError("Lien d'acceptation invalide.", 404);
      }

      if (devis.statut === "Accepté" || devis.acceptedAt) {
        throw new AcceptanceError("Ce devis est déjà accepté.", 409);
      }

      transaction.update(devisRef, {
        statut: acceptedStatut,
        acceptedAt: maintenant,
        acceptedByName: identite.name,
        acceptedByEmail: identite.email,
      });

      transaction.update(linkRef, {
        usedAt: maintenant,
        usedByName: identite.name,
        usedByEmail: identite.email,
      });

      return {
        ...devis,
        statut: acceptedStatut,
        acceptedAt: maintenant,
        acceptedByName: identite.name,
        acceptedByEmail: identite.email,
      };
    });

    return jsonSuccess({
      success: true,
      devis: toPublicDevis(acceptedDevis),
    });
  } catch (error) {
    if (error instanceof AcceptanceError) {
      return jsonError(error.message, error.status);
    }

    console.error("Erreur acceptation devis :", error);
    return jsonError("Impossible d'accepter le devis.", 500);
  }
}
