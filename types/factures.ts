export type StatutFacture =
  | "Brouillon"
  | "Envoyée"
  | "Payée"
  | "En retard"
  | "Annulée";

export type Facture = {
  id: string;
  reference: string;
  objet: string;
  clientId: string;
  clientNom: string;
  chantierId: string;
  chantierTitre: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string;
  statut: StatutFacture;
  montantHt: number;
  tvaTaux: number;
  acompteDeduit: number;
  notes: string;
  entrepriseId: string;
  createdByUid: string;
  archive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};