import { UNITE_PAR_DEFAUT } from "./devis-constants";
import type { Devis, LigneDevis, NouvelleLigneState } from "../types/devis";

export const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(Number.isFinite(montant) ? montant : 0);

const arrondirMontant = (valeur: number) =>
  Math.round((valeur + Number.EPSILON) * 100) / 100;

const securiserNombre = (valeur: unknown) => {
  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : 0;
};

export const getTauxTvaFallbackDevis = (
  devis: Partial<Devis> | null | undefined,
  tauxEntreprise?: number
) => {
  if (typeof devis?.tvaTaux === "number" && Number.isFinite(devis.tvaTaux)) {
    return devis.tvaTaux;
  }

  if (typeof tauxEntreprise === "number" && Number.isFinite(tauxEntreprise)) {
    return tauxEntreprise;
  }

  return 21;
};

export const normaliserLignesDevis = (
  devis: Partial<Devis> | null | undefined,
  tauxEntreprise?: number
): LigneDevis[] => {
  if (!devis || !Array.isArray(devis.lignes)) {
    return [];
  }

  const tvaFallback = getTauxTvaFallbackDevis(devis, tauxEntreprise);

  return devis.lignes.map((ligne) => ({
    id: ligne?.id ?? genererIdLigne(),
    designation: typeof ligne?.designation === "string" ? ligne.designation : "",
    quantite: securiserNombre(ligne?.quantite),
    unite:
      typeof ligne?.unite === "string" && ligne.unite.trim()
        ? ligne.unite.trim()
        : UNITE_PAR_DEFAUT,
    prixUnitaire: securiserNombre(ligne?.prixUnitaire),
    tvaTaux:
      typeof ligne?.tvaTaux === "number" && Number.isFinite(ligne.tvaTaux)
        ? ligne.tvaTaux
        : tvaFallback,
  }));
};

export const calculerTotalHt = (devis: Devis) =>
  normaliserLignesDevis(devis).reduce(
    (total, ligne) => total + ligne.quantite * ligne.prixUnitaire,
    0
  );

export const calculerTotauxDevis = (
  devis: Partial<Devis>,
  tauxEntreprise?: number
) => {
  const lignes = normaliserLignesDevis(devis, tauxEntreprise);
  const totalHt = arrondirMontant(
    lignes.reduce(
      (total, ligne) => total + ligne.quantite * ligne.prixUnitaire,
      0
    )
  );

  const groupes = new Map<
    string,
    { taux: number; montantHt: number; montantTva: number; totalTtc: number }
  >();

  lignes.forEach((ligne) => {
    const montantHt = arrondirMontant(ligne.quantite * ligne.prixUnitaire);
    const montantTva = arrondirMontant(montantHt * ((ligne.tvaTaux ?? 21) / 100));
    const totalTtc = arrondirMontant(montantHt + montantTva);
    const cle = String(ligne.tvaTaux ?? 21);
    const precedent = groupes.get(cle) ?? {
      taux: ligne.tvaTaux ?? 21,
      montantHt: 0,
      montantTva: 0,
      totalTtc: 0,
    };

    groupes.set(cle, {
      taux: ligne.tvaTaux ?? 21,
      montantHt: arrondirMontant(precedent.montantHt + montantHt),
      montantTva: arrondirMontant(precedent.montantTva + montantTva),
      totalTtc: arrondirMontant(precedent.totalTtc + totalTtc),
    });
  });

  const detailTva = Array.from(groupes.values()).sort(
    (a, b) => a.taux - b.taux
  );
  const totalTva = arrondirMontant(
    detailTva.reduce((total, ligne) => total + ligne.montantTva, 0)
  );
  const totalTtc = arrondirMontant(totalHt + totalTva);

  return {
    lignes,
    totalHt,
    detailTva,
    totalTva,
    totalTtc,
  };
};

export const calculerMontantTva = (devis: Devis) =>
  calculerTotauxDevis(devis).totalTva;

export const calculerTotalTvac = (devis: Devis) =>
  calculerTotauxDevis(devis).totalTtc;

const MS_PAR_JOUR = 24 * 60 * 60 * 1000;

const parserDateFr = (dateFr: string) => {
  if (!dateFr) return null;

  const [jour, mois, annee] = dateFr.split("/").map(Number);

  if (!jour || !mois || !annee) return null;

  const date = new Date(annee, mois - 1, jour);

  if (
    date.getFullYear() !== annee ||
    date.getMonth() !== mois - 1 ||
    date.getDate() !== jour
  ) {
    return null;
  }

  return date;
};

const formatterDateFr = (date: Date) =>
  new Intl.DateTimeFormat("fr-BE").format(date);

const debutJour = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const calculerValiditeDevis = (
  dateFr: string,
  validiteJours: number,
  maintenant = new Date()
) => {
  const dateEmission = parserDateFr(dateFr);
  const duree = Math.floor(Number(validiteJours));

  if (!dateEmission || !Number.isFinite(duree) || duree <= 0) {
    return {
      dateValidite: "",
      expire: false,
      joursRestants: null,
      statutLabel: "Validité non renseignée",
      label: "Validité non renseignée",
    };
  }

  const dateValidite = new Date(dateEmission);
  dateValidite.setDate(dateValidite.getDate() + duree);

  const joursRestantsBruts = Math.ceil(
    (debutJour(dateValidite).getTime() - debutJour(maintenant).getTime()) /
      MS_PAR_JOUR
  );
  const expire = joursRestantsBruts < 0;
  const joursRestants = expire ? null : joursRestantsBruts;
  const statutLabel = expire
    ? "Expiré"
    : `${joursRestants} jour${joursRestants === 1 ? "" : "s"} restant${
        joursRestants === 1 ? "" : "s"
      }`;
  const dateValiditeLabel = formatterDateFr(dateValidite);

  return {
    dateValidite: dateValiditeLabel,
    expire,
    joursRestants,
    statutLabel,
    label: `Jusqu'au ${dateValiditeLabel} - ${statutLabel}`,
  };
};

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
  const plusGrandNumero = devisExistants.reduce((max, devis) => {
    const match = devis.id?.match(/DEV-2026-(\d+)$/);
    if (!match) return max;

    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `DEV-2026-${String(plusGrandNumero + 1).padStart(3, "0")}`;
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
      const tvaTaux = Number(ligne.tvaTaux);

      if (
        !ligne.designation.trim() ||
        Number.isNaN(quantite) ||
        Number.isNaN(prixUnitaire) ||
        Number.isNaN(tvaTaux) ||
        quantite <= 0 ||
        prixUnitaire <= 0 ||
        tvaTaux < 0
      ) {
        return null;
      }

      return {
        id: genererIdLigne(),
        designation: ligne.designation.trim(),
        quantite,
        unite: ligne.unite.trim() || UNITE_PAR_DEFAUT,
        prixUnitaire,
        tvaTaux,
      } satisfies LigneDevis;
    })
    .filter(Boolean) as LigneDevis[];
};
