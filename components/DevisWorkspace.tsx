"use client";

import type { Dispatch, SetStateAction } from "react";
import type { DevisBusiness, EditFormState } from "../hooks/useDevisActions";
import type { NouvelleLigneState, StatutDevis } from "../types/devis";

type FiltreStatut = "Tous" | StatutDevis;
type FiltreArchivage = "actifs" | "archives" | "tous";

type Props = {
  devis: DevisBusiness[];
  devisFiltres: DevisBusiness[];
  devisSelectionne: DevisBusiness | null;
  entrepriseId?: string;
  createdByUid?: string;
  afficherFormulaire: boolean;
  recherche: string;
  setRecherche: Dispatch<SetStateAction<string>>;
  filtreStatut: FiltreStatut;
  setFiltreStatut: Dispatch<SetStateAction<FiltreStatut>>;
  filtreArchivage: FiltreArchivage;
  setFiltreArchivage: Dispatch<SetStateAction<FiltreArchivage>>;
  devisSelectionneId: string | null;
  setDevisSelectionneId: Dispatch<SetStateAction<string | null>>;
  totalDevis: number;
  totalBrouillons: number;
  totalAcceptes: number;
  caSigne: number;
  modeEdition: boolean;
  setModeEdition: Dispatch<SetStateAction<boolean>>;
  editForm: EditFormState;
  setEditForm: Dispatch<SetStateAction<EditFormState>>;
  editLignes: NouvelleLigneState[];
  ouvrirEdition: () => void;
  annulerEdition: () => void;
  ajouterLigneEdition: () => void;
  supprimerLigneEdition: (index: number) => void;
  mettreAJourLigneEdition: (
    index: number,
    champ: keyof NouvelleLigneState,
    valeur: string
  ) => void;
  enregistrerEdition: () => void;
  dupliquerDevis: () => void;
  supprimerDevis: () => void;
  archiverDevis: () => void;
  restaurerDevis: () => void;
  handleExporterPdf: () => void;
  handleChangerStatut: (statut: StatutDevis) => void;
  onDevisCree: (id: string) => void;
  onCloseFormulaire: () => void;
};

export default function DevisWorkspace(_: Props) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <p className="text-lg font-semibold">Test mobile shell</p>
      <p className="mt-2 text-sm text-slate-500">
        Si le zoom est normal ici, alors le problème vient d’un composant du
        module Devis.
      </p>
    </div>
  );
}