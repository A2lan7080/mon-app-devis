"use client";

import type { Dispatch, SetStateAction } from "react";
import DevisKpiCards from "./DevisKpiCards";
import DevisList from "./DevisList";
import DevisSearch from "./DevisSearch";
import { STATUTS_DEVIS } from "../lib/devis-constants";
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

export default function DevisWorkspace({
  devisFiltres,
  recherche,
  setRecherche,
  filtreStatut,
  setFiltreStatut,
  filtreArchivage,
  setFiltreArchivage,
  devisSelectionneId,
  setDevisSelectionneId,
  totalDevis,
  totalBrouillons,
  totalAcceptes,
  caSigne,
  setModeEdition,
}: Props) {
  return (
    <>
      <DevisKpiCards
        totalDevis={totalDevis}
        totalBrouillons={totalBrouillons}
        totalAcceptes={totalAcceptes}
        caSigne={caSigne}
      />

      <div className="grid gap-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <DevisSearch
            recherche={recherche}
            setRecherche={setRecherche}
            filtreStatut={filtreStatut}
            setFiltreStatut={setFiltreStatut}
            filtreArchivage={filtreArchivage}
            setFiltreArchivage={setFiltreArchivage}
            statuts={STATUTS_DEVIS}
          />

          <DevisList
            devis={devisFiltres}
            devisSelectionneId={devisSelectionneId}
            setDevisSelectionneId={setDevisSelectionneId}
            setModeEdition={setModeEdition}
          />
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-lg font-semibold">Test sans détail devis</p>
          <p className="mt-2 text-sm text-slate-500">
            Si le zoom reste normal ici, alors le problème vient bien de
            DevisDetailPanel.
          </p>
        </div>
      </div>
    </>
  );
}