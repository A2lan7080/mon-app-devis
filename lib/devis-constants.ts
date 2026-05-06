import type { Entreprise, NouvelleLigneState, StatutDevis } from "../types/devis";

export const STATUTS_DEVIS: StatutDevis[] = [
  "Brouillon",
  "Envoyé",
  "Accepté",
  "Refusé",
];

export const TVA_PAR_DEFAUT = 21;
export const TAUX_TVA_AUTORISES = [0, 6, 12, 21];

export function obtenirOptionsTvaAvecValeur(valeur: string | number) {
  const taux = Number(valeur);

  if (!Number.isFinite(taux) || TAUX_TVA_AUTORISES.includes(taux)) {
    return TAUX_TVA_AUTORISES;
  }

  return [...TAUX_TVA_AUTORISES, taux].sort((a, b) => a - b);
}

export const UNITE_PAR_DEFAUT = "pièce";

export const entreprise: Entreprise = {
  nom: "",
  adresse: "",
  email: "",
  telephone: "",
  tva: "",
  iban: "",
  mentionsLegalesFacture: "",
};

export const creerLigneVide = (): NouvelleLigneState => ({
  designation: "",
  quantite: "1",
  unite: UNITE_PAR_DEFAUT,
  prixUnitaire: "",
  tvaTaux: String(TVA_PAR_DEFAUT),
});
