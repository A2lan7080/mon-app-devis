import { UNITE_PAR_DEFAUT } from "./devis-constants";
import type { Devis, LigneDevis, NouvelleLigneState } from "../types/devis";

export const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(montant) ? montant : 0);

const securiserNombre = (valeur: unknown) => {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : 0;
};

const securiserLignes = (devis: Devis | null | undefined): LigneDevis[] => {
  if (!devis || !Array.isArray(devis.lignes)) {
    return [];
  }

  return devis.lignes.map((ligne) => ({
    id: ligne?.id ?? genererIdLigne(),
    designation: typeof ligne?.designation === "string" ? ligne.designation : "",
    quantite: securiserNombre(ligne?.quantite),
    unite:
      typeof ligne?.unite === "string" && ligne.unite.trim()
        ? ligne.unite.trim()
        : UNITE_PAR_DEFAUT,
    prixUnitaire: securiserNombre(ligne?.prixUnitaire),
  }));
};

export const calculerTotalHt = (devis: Devis) =>
  securiserLignes(devis).reduce(
    (total, ligne) => total + ligne.quantite * ligne.prixUnitaire,
    0
  );

export const calculerMontantTva = (devis: Devis) => {
  const taux = securiserNombre(devis?.tvaTaux);
  return calculerTotalHt(devis) * (taux / 100);
};

export const calculerTotalTvac = (devis: Devis) =>
  calculerTotalHt(devis) + calculerMontantTva(devis);

export const formaterDate = (dateIso: string) => {
  if (!dateIso) return "";
  const [annee, mois, jour] = dateIso.split("-");
  if (!annee || !mois || !jour) return "";
  return `${jour}/${mois}/${annee}`;
};

export const convertirDateVersInput = (dateFr: string) => {
  if (!dateFr) return "";
  const [jour, mois, annee] = dateFr.split("/");
  if (!jour || !mois || !annee) return "";
  return `${annee}-${mois}-${jour}`;
};

export const genererNumeroDevis = (devisExistants: Devis[]) => {
  const prochainNumero = devisExistants.length + 1;
  return `DEV-2026-${String(prochainNumero).padStart(3, "0")}`;
};

export const genererIdLigne = () =>
  `L-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const convertirLignesFormStateEnLignesMetier = (
  lignes: NouvelleLigneState[]
): LigneDevis[] => {
  return lignes
    .map((ligne) => {
      const quantite = Number(ligne.quantite);
      const prixUnitaire = Number(ligne.prixUnitaire);

      if (
        !ligne.designation.trim() ||
        Number.isNaN(quantite) ||
        Number.isNaN(prixUnitaire) ||
        quantite <= 0 ||
        prixUnitaire <= 0
      ) {
        return null;
      }

      return {
        id: genererIdLigne(),
        designation: ligne.designation.trim(),
        quantite,
        unite: ligne.unite.trim() || UNITE_PAR_DEFAUT,
        prixUnitaire,
      } satisfies LigneDevis;
    })
    .filter(Boolean) as LigneDevis[];
};