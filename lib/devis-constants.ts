import type { Entreprise, NouvelleLigneState, StatutDevis } from "../types/devis";

export const STATUTS_DEVIS: StatutDevis[] = [
  "Brouillon",
  "Envoyé",
  "Accepté",
  "Refusé",
];

export const TVA_PAR_DEFAUT = 21;

export const UNITE_PAR_DEFAUT = "pièce";

export const entreprise: Entreprise = {
  nom: "",
  adresse: "",
  email: "",
  telephone: "",
  tva: "",
};

export const creerLigneVide = (): NouvelleLigneState => ({
  designation: "",
  quantite: "1",
  unite: UNITE_PAR_DEFAUT,
  prixUnitaire: "",
});