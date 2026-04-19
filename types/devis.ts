export type StatutDevis = "Brouillon" | "Envoyé" | "Accepté" | "Refusé";

export type LigneDevis = {
  id: string;
  designation: string;
  quantite: number;
  unite: string;
  prixUnitaire: number;
};

export type Devis = {
  id: string;
  client: string;
  statut: StatutDevis;
  date: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  typeClient: "Particulier" | "Professionnel";
  societe: string;
  tvaClient: string;
  tvaTaux: number;
  lignes: LigneDevis[];
};

export type NouveauDevisState = {
  client: string;
  statut: StatutDevis;
  date: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  typeClient: "Particulier" | "Professionnel";
  societe: string;
  tvaClient: string;
  tvaTaux: string;
};

export type NouvelleLigneState = {
  designation: string;
  quantite: string;
  unite: string;
  prixUnitaire: string;
};

export type Entreprise = {
  nom: string;
  adresse: string;
  email: string;
  telephone: string;
  tva: string;
};