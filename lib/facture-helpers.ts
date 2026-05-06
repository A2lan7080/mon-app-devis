import { formatMontant } from "./devis-helpers";
import { TAUX_TVA_AUTORISES } from "./devis-constants";
import type { Facture, LigneFacture } from "../types/factures";

export type LigneFactureFormState = {
  id: string;
  description: string;
  quantite: string;
  unite: string;
  prixUnitaireHt: string;
  tvaTaux: string;
};

export type InvoiceNumberSettings = {
  invoiceNumberPrefix?: string;
  invoiceNumberPadding?: number;
  invoiceNextNumber?: number;
  invoiceNumberFormat?: string;
  invoiceResetYearly?: boolean;
  invoiceLastYear?: number;
};

export const TAUX_TVA_FACTURE = TAUX_TVA_AUTORISES;

export const arrondirMontant = (valeur: number) =>
  Math.round((valeur + Number.EPSILON) * 100) / 100;

export const convertirNombre = (valeur: unknown) => {
  if (typeof valeur === "string") {
    const nombre = Number(valeur.replace(",", "."));
    return Number.isFinite(nombre) ? nombre : 0;
  }

  const nombre = Number(valeur);
  return Number.isFinite(nombre) ? nombre : 0;
};

export const genererIdLigneFacture = () =>
  `LF-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const creerLigneFactureFormVide = (
  tvaTaux = 21
): LigneFactureFormState => ({
  id: genererIdLigneFacture(),
  description: "",
  quantite: "1",
  unite: "forfait",
  prixUnitaireHt: "",
  tvaTaux: String(tvaTaux),
});

export const calculerLigneFacture = (ligne: {
  id: string;
  description: string;
  quantite: number;
  unite: string;
  prixUnitaireHt: number;
  tvaTaux: number;
}): LigneFacture => {
  const totalHt = arrondirMontant(ligne.quantite * ligne.prixUnitaireHt);
  const montantTva = arrondirMontant(totalHt * (ligne.tvaTaux / 100));
  const totalTtc = arrondirMontant(totalHt + montantTva);

  return {
    ...ligne,
    totalHt,
    montantTva,
    totalTtc,
  };
};

export const convertirLignesFactureFormEnLignes = (
  lignes: LigneFactureFormState[]
) =>
  lignes
    .map((ligne) => {
      const description = ligne.description.trim();
      const quantite = convertirNombre(ligne.quantite);
      const prixUnitaireHt = convertirNombre(ligne.prixUnitaireHt);
      const tvaTaux = convertirNombre(ligne.tvaTaux);

      if (!description || quantite <= 0 || prixUnitaireHt < 0 || tvaTaux < 0) {
        return null;
      }

      return calculerLigneFacture({
        id: ligne.id || genererIdLigneFacture(),
        description,
        quantite,
        unite: ligne.unite.trim() || "forfait",
        prixUnitaireHt,
        tvaTaux,
      });
    })
    .filter(Boolean) as LigneFacture[];

export const getTauxTvaFallbackFacture = (
  facture?: Partial<Facture> | null,
  tauxEntreprise?: number
) => {
  if (typeof facture?.tvaTaux === "number" && Number.isFinite(facture.tvaTaux)) {
    return facture.tvaTaux;
  }

  if (typeof tauxEntreprise === "number" && Number.isFinite(tauxEntreprise)) {
    return tauxEntreprise;
  }

  return 21;
};

export const normaliserLignesFacture = (
  facture: Partial<Facture> | null | undefined,
  tauxEntreprise?: number
) => {
  const tauxFallback = getTauxTvaFallbackFacture(facture, tauxEntreprise);

  if (Array.isArray(facture?.lignes) && facture.lignes.length > 0) {
    return facture.lignes.map((ligne) =>
      calculerLigneFacture({
        id: ligne.id || genererIdLigneFacture(),
        description:
          typeof ligne.description === "string" && ligne.description.trim()
            ? ligne.description.trim()
            : "Ligne facture",
        quantite: convertirNombre(ligne.quantite),
        unite:
          typeof ligne.unite === "string" && ligne.unite.trim()
            ? ligne.unite.trim()
            : "forfait",
        prixUnitaireHt: convertirNombre(ligne.prixUnitaireHt),
        tvaTaux:
          typeof ligne.tvaTaux === "number" && Number.isFinite(ligne.tvaTaux)
            ? ligne.tvaTaux
            : tauxFallback,
      })
    );
  }

  const montantHt = convertirNombre(facture?.montantHt);

  if (montantHt <= 0) {
    return [];
  }

  return [
    calculerLigneFacture({
      id: genererIdLigneFacture(),
      description:
        typeof facture?.objet === "string" && facture.objet.trim()
          ? facture.objet.trim()
          : "Montant facture",
      quantite: 1,
      unite: "forfait",
      prixUnitaireHt: montantHt,
      tvaTaux: tauxFallback,
    }),
  ];
};

export const calculerTotauxFacture = (
  lignes: LigneFacture[],
  acompteDeduit = 0
) => {
  const montantHt = arrondirMontant(
    lignes.reduce((total, ligne) => total + ligne.totalHt, 0)
  );
  const totalTva = arrondirMontant(
    lignes.reduce((total, ligne) => total + ligne.montantTva, 0)
  );
  const totalTtc = arrondirMontant(
    lignes.reduce((total, ligne) => total + ligne.totalTtc, 0)
  );
  const netAPayer = arrondirMontant(totalTtc - acompteDeduit);

  const groupes = new Map<
    string,
    { taux: number; montantHt: number; montantTva: number; totalTtc: number }
  >();

  lignes.forEach((ligne) => {
    const cle = String(ligne.tvaTaux);
    const precedent = groupes.get(cle) ?? {
      taux: ligne.tvaTaux,
      montantHt: 0,
      montantTva: 0,
      totalTtc: 0,
    };

    groupes.set(cle, {
      taux: ligne.tvaTaux,
      montantHt: arrondirMontant(precedent.montantHt + ligne.totalHt),
      montantTva: arrondirMontant(precedent.montantTva + ligne.montantTva),
      totalTtc: arrondirMontant(precedent.totalTtc + ligne.totalTtc),
    });
  });

  const detailTva = Array.from(groupes.values()).sort(
    (a, b) => a.taux - b.taux
  );

  return {
    montantHt,
    totalTva,
    totalTtc,
    netAPayer,
    detailTva,
  };
};

export const calculerTotauxDepuisFacture = (
  facture: Partial<Facture>,
  tauxEntreprise?: number
) =>
  calculerTotauxFacture(
    normaliserLignesFacture(facture, tauxEntreprise),
    convertirNombre(facture.acompteDeduit)
  );

export const formatterDetailTva = (facture: Partial<Facture>) =>
  calculerTotauxDepuisFacture(facture).detailTva
    .map((ligne) => `TVA ${ligne.taux}% : ${formatMontant(ligne.montantTva)}`)
    .join("\n");

export const getInvoiceNumberSettings = (
  settings?: InvoiceNumberSettings | null
) => ({
  invoiceNumberPrefix:
    typeof settings?.invoiceNumberPrefix === "string" &&
    settings.invoiceNumberPrefix.trim()
      ? settings.invoiceNumberPrefix.trim()
      : "FA",
  invoiceNumberPadding:
    typeof settings?.invoiceNumberPadding === "number" &&
    Number.isFinite(settings.invoiceNumberPadding) &&
    settings.invoiceNumberPadding > 0
      ? Math.floor(settings.invoiceNumberPadding)
      : 4,
  invoiceNextNumber:
    typeof settings?.invoiceNextNumber === "number" &&
    Number.isFinite(settings.invoiceNextNumber) &&
    settings.invoiceNextNumber > 0
      ? Math.floor(settings.invoiceNextNumber)
      : 1,
  invoiceNumberFormat:
    typeof settings?.invoiceNumberFormat === "string" &&
    settings.invoiceNumberFormat.trim()
      ? settings.invoiceNumberFormat.trim()
      : "{prefix}-{year}-{number}",
  invoiceResetYearly: settings?.invoiceResetYearly === true,
  invoiceLastYear:
    typeof settings?.invoiceLastYear === "number" &&
    Number.isFinite(settings.invoiceLastYear)
      ? Math.floor(settings.invoiceLastYear)
      : undefined,
});

export const genererReferenceFactureDepuisConfig = (
  settings?: InvoiceNumberSettings | null,
  date = new Date()
) => {
  const config = getInvoiceNumberSettings(settings);
  const annee = date.getFullYear();
  const numero =
    config.invoiceResetYearly && config.invoiceLastYear !== annee
      ? 1
      : config.invoiceNextNumber;
  const numeroFormate = String(numero).padStart(config.invoiceNumberPadding, "0");

  return config.invoiceNumberFormat
    .replaceAll("{prefix}", config.invoiceNumberPrefix)
    .replaceAll("{year}", String(annee))
    .replaceAll("{number}", numeroFormate)
    .replaceAll("{rawNumber}", String(numero))
    .replaceAll(/\s+/g, "")
    .replaceAll("--", "-");
};
