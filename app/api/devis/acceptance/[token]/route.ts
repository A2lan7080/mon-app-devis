import { NextResponse } from "next/server";
import { adminDb } from "../../../../../lib/firebase-admin";
import { hashAcceptanceToken } from "../../../../../lib/devis-acceptance";
import {
  calculerValiditeDevis,
  calculerTotauxDevis,
  formatMontant,
} from "../../../../../lib/devis-helpers";
import type { Devis, Entreprise } from "../../../../../types/devis";

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
  action?: "accept" | "refuse";
  comment?: string;
};

type EntreprisePublique = Entreprise & {
  logoUrl?: string;
  logoRemplaceNomEntreprise?: boolean;
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

function normaliserAction(action?: string) {
  if (!action) return "accept" as const;

  if (action !== "accept" && action !== "refuse") {
    throw new AcceptanceError("Action invalide.", 400);
  }

  return action;
}

function normaliserCommentaire(comment?: string) {
  const commentaire = comment?.trim() ?? "";
  return commentaire ? commentaire.slice(0, 1000) : "";
}

function toPublicDevis(devis: DevisBusiness) {
  const totaux = calculerTotauxDevis(devis);
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);

  return {
    id: devis.id,
    client: devis.client,
    adresse: devis.adresse,
    codePostal: devis.codePostal,
    ville: devis.ville,
    email: devis.email,
    telephone: devis.telephone,
    typeClient: devis.typeClient,
    societe: devis.societe,
    tvaClient: devis.tvaClient,
    date: devis.date,
    statut: devis.statut,
    chantierTitre: devis.chantierTitre,
    acomptePourcentage: devis.acomptePourcentage,
    validiteJours: devis.validiteJours,
    conditions: devis.conditions,
    lignes: totaux.lignes.map((ligne) => {
      const montantHt = ligne.quantite * ligne.prixUnitaire;
      const montantTva = montantHt * ((ligne.tvaTaux ?? 0) / 100);

      return {
        id: ligne.id,
        designation: ligne.designation,
        quantite: ligne.quantite,
        unite: ligne.unite,
        prixUnitaire: ligne.prixUnitaire,
        prixUnitaireLabel: formatMontant(ligne.prixUnitaire),
        tvaTaux: ligne.tvaTaux ?? 0,
        montantHtLabel: formatMontant(montantHt),
        montantTvaLabel: formatMontant(montantTva),
        totalTtcLabel: formatMontant(montantHt + montantTva),
      };
    }),
    detailTva: totaux.detailTva.map((ligne) => ({
      taux: ligne.taux,
      montantHtLabel: formatMontant(ligne.montantHt),
      montantTvaLabel: formatMontant(ligne.montantTva),
      totalTtcLabel: formatMontant(ligne.totalTtc),
    })),
    totalHt: totaux.totalHt,
    totalTva: totaux.totalTva,
    totalTvac: totaux.totalTtc,
    totalHtLabel: formatMontant(totaux.totalHt),
    totalTvaLabel: formatMontant(totaux.totalTva),
    totalTvacLabel: formatMontant(totaux.totalTtc),
    dateValidite: validite.dateValidite,
    validiteLabel: validite.label,
    validiteExpiree: validite.expire,
    joursRestants: validite.joursRestants,
    acceptedAt: devis.acceptedAt ?? null,
    acceptedByName: devis.acceptedByName ?? "",
    acceptedByEmail: devis.acceptedByEmail ?? "",
    refusedAt: devis.refusedAt ?? null,
    refusedByName: devis.refusedByName ?? "",
    refusedByEmail: devis.refusedByEmail ?? "",
  };
}

function toPublicEntreprise(entreprise: EntreprisePublique) {
  return {
    nom: entreprise.nom,
    adresse: entreprise.adresse,
    codePostal: entreprise.codePostal ?? "",
    ville: entreprise.ville ?? "",
    email: entreprise.email,
    telephone: entreprise.telephone,
    tva: entreprise.tva,
    iban: entreprise.iban,
    logoUrl: entreprise.logoUrl ?? "",
    logoRemplaceNomEntreprise:
      entreprise.logoRemplaceNomEntreprise === true,
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
    const entrepriseSnap = await adminDb
      .collection("entreprises")
      .doc(devis.entrepriseId as string)
      .get();

    if (!entrepriseSnap.exists) {
      throw new AcceptanceError("Entreprise introuvable.", 404);
    }

    return jsonSuccess({
      devis: toPublicDevis(devis),
      entreprise: toPublicEntreprise(
        entrepriseSnap.data() as EntreprisePublique
      ),
      alreadyAccepted: devis.statut === "Accepté" || Boolean(devis.acceptedAt),
      alreadyRefused: devis.statut === "Refusé" || Boolean(devis.refusedAt),
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
    const action = normaliserAction(body.action);
    const commentaire =
      action === "refuse" ? normaliserCommentaire(body.comment) : "";
    const tokenHash = hashAcceptanceToken(token);
    const maintenant = Date.now();
    const linkRef = adminDb.collection("devisAcceptanceLinks").doc(tokenHash);

    const updatedDevis = await adminDb.runTransaction(async (transaction) => {
      const statutFinal: DevisBusiness["statut"] =
        action === "accept" ? "Accepté" : "Refusé";
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

      if (
        devis.statut === "Accepté" ||
        devis.statut === "Refusé" ||
        devis.acceptedAt ||
        devis.refusedAt
      ) {
        throw new AcceptanceError("Ce devis est déjà traité.", 409);
      }

      const updateDevis =
        action === "accept"
          ? {
              statut: statutFinal,
              acceptedAt: maintenant,
              acceptedByName: identite.name,
              acceptedByEmail: identite.email,
            }
          : {
              statut: statutFinal,
              refusedAt: maintenant,
              refusedByName: identite.name,
              refusedByEmail: identite.email,
            };

      transaction.update(devisRef, updateDevis);

      transaction.update(linkRef, {
        usedAt: maintenant,
        usedAction: action,
        usedByName: identite.name,
        usedByEmail: identite.email,
        ...(commentaire ? { usedComment: commentaire } : {}),
      });

      return {
        ...devis,
        ...updateDevis,
      };
    });

    return jsonSuccess({
      success: true,
      devis: toPublicDevis(updatedDevis),
    });
  } catch (error) {
    if (error instanceof AcceptanceError) {
      return jsonError(error.message, error.status);
    }

    console.error("Erreur traitement devis :", error);
    return jsonError("Impossible de traiter le devis.", 500);
  }
}
