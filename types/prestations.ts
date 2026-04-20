export type UnitePrestation =
  | "pièce"
  | "forfait"
  | "m²"
  | "ml"
  | "heure"
  | "jour";

export type PrestationBibliotheque = {
  id: string;
  reference: string;
  designation: string;
  unite: UnitePrestation;
  prixUnitaire: number;
  description: string;
  entrepriseId: string;
  createdByUid: string;
  archive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};