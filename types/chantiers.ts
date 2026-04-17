export type StatutChantier =
  | "À planifier"
  | "Planifié"
  | "En cours"
  | "Terminé"
  | "Suspendu";

export type Chantier = {
  id: string;
  reference: string;
  titre: string;
  clientId: string;
  clientNom: string;
  adresse: string;
  codePostal: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutChantier;
  description: string;
  notes: string;
  entrepriseId: string;
  createdByUid: string;
  archive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};