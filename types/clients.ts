export type TypeClient = "Particulier" | "Professionnel";

export type Client = {
  id: string;
  reference: string;
  nom: string;
  typeClient: TypeClient;
  societe: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  tva: string;
  notes: string;
  entrepriseId: string;
  createdByUid: string;
  archive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};