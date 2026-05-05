export type StatutFacture =
  | "Brouillon"
  | "Envoyée"
  | "Payée"
  | "En retard"
  | "Annulée";

export type TypeFacture = "depuis_devis" | "libre";

export type LigneFacture = {
  id: string;
  description: string;
  quantite: number;
  unite: string;
  prixUnitaireHt: number;
  tvaTaux: number;
  totalHt: number;
  montantTva: number;
  totalTtc: number;
};

export type DetailTvaFacture = {
  taux: number;
  montantHt: number;
  montantTva: number;
  totalTtc: number;
};

export type Facture = {
  id: string;
  reference: string;
  objet: string;
  clientId: string;
  clientNom: string;
  clientAdresse: string;
  clientCodePostal: string;
  clientVille: string;
  clientEmail: string;
  clientTelephone: string;
  chantierId: string;
  chantierTitre: string;
  devisId: string;
  devisReference: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string;
  statut: StatutFacture;
  montantHt: number;
  tvaTaux: number;
  lignes?: LigneFacture[];
  detailTva?: DetailTvaFacture[];
  totalTva?: number;
  totalTtc?: number;
  typeFacture?: TypeFacture;
  acompteDeduit: number;
  notes: string;
  entrepriseId: string;
  createdByUid: string;
  archive?: boolean;
  createdAt?: number;
  updatedAt?: number;
};
