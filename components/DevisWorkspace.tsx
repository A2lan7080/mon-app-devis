"use client";

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import DevisDetailPanel from "./DevisDetailPanel";
import DevisForm from "./DevisForm";
import DevisKpiCards from "./DevisKpiCards";
import DevisList from "./DevisList";
import DevisSearch from "./DevisSearch";
import MobileFullscreenModal from "./MobileFullscreenModal";
import { STATUTS_DEVIS } from "../lib/devis-constants";
import { formatNumeroDevisPourAffichage } from "../lib/format-numero-devis";
import type {
  DevisBusiness,
  EditFormState,
  PrestationEdition,
} from "../hooks/useDevisActions";
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
  ajouterPrestationEdition: (prestation: PrestationEdition) => void;
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
  handleEnvoyerParMail: () => void;
  envoiEnCours: boolean;
  handleChangerStatut: (statut: StatutDevis) => void;
  onDevisCree: (id: string) => void;
  onCloseFormulaire: () => void;
};

export default function DevisWorkspace({
  devis,
  devisFiltres,
  devisSelectionne,
  entrepriseId,
  createdByUid,
  afficherFormulaire,
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
  modeEdition,
  setModeEdition,
  editForm,
  setEditForm,
  editLignes,
  ouvrirEdition,
  annulerEdition,
  ajouterLigneEdition,
  ajouterPrestationEdition,
  supprimerLigneEdition,
  mettreAJourLigneEdition,
  enregistrerEdition,
  dupliquerDevis,
  supprimerDevis,
  archiverDevis,
  restaurerDevis,
  handleExporterPdf,
  handleEnvoyerParMail,
  envoiEnCours,
  handleChangerStatut,
  onDevisCree,
  onCloseFormulaire,
}: Props) {
  const titreMobile = useMemo(() => {
    if (afficherFormulaire) return "Nouveau devis";
    if (!devisSelectionne) return "Détail devis";
    const numeroDevisAffiche = formatNumeroDevisPourAffichage(
      devisSelectionne.id
    );
    return modeEdition ? `Édition ${numeroDevisAffiche}` : numeroDevisAffiche;
  }, [afficherFormulaire, devisSelectionne, modeEdition]);

  const fermerDetailMobile = () => {
    setModeEdition(false);
    setDevisSelectionneId(null);
  };

  return (
    <>
      <DevisKpiCards
        totalDevis={totalDevis}
        totalBrouillons={totalBrouillons}
        totalAcceptes={totalAcceptes}
        caSigne={caSigne}
      />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
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

        <div className="hidden min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6 xl:block">
          {afficherFormulaire ? (
            <DevisForm
              devis={devis}
              entrepriseId={entrepriseId}
              createdByUid={createdByUid}
              onDevisCree={onDevisCree}
              onClose={onCloseFormulaire}
            />
          ) : (
            <DevisDetailPanel
              devisSelectionne={devisSelectionne}
              modeEdition={modeEdition}
              editForm={editForm}
              setEditForm={setEditForm}
              editLignes={editLignes}
              entrepriseId={entrepriseId}
              createdByUid={createdByUid}
              setModeEdition={setModeEdition}
              ouvrirEdition={ouvrirEdition}
              annulerEdition={annulerEdition}
              ajouterLigneEdition={ajouterLigneEdition}
              ajouterPrestationEdition={ajouterPrestationEdition}
              supprimerLigneEdition={supprimerLigneEdition}
              mettreAJourLigneEdition={mettreAJourLigneEdition}
              enregistrerEdition={enregistrerEdition}
              dupliquerDevis={dupliquerDevis}
              supprimerDevis={supprimerDevis}
              archiverDevis={archiverDevis}
              restaurerDevis={restaurerDevis}
              handleExporterPdf={handleExporterPdf}
              handleEnvoyerParMail={handleEnvoyerParMail}
              envoiEnCours={envoiEnCours}
              handleChangerStatut={handleChangerStatut}
            />
          )}
        </div>
      </div>

      <MobileFullscreenModal
        open={afficherFormulaire}
        title={titreMobile}
        onClose={onCloseFormulaire}
      >
        <DevisForm
          devis={devis}
          entrepriseId={entrepriseId}
          createdByUid={createdByUid}
          onDevisCree={onDevisCree}
          onClose={onCloseFormulaire}
        />
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={!afficherFormulaire && devisSelectionne !== null}
        title={titreMobile}
        onClose={fermerDetailMobile}
      >
        <DevisDetailPanel
          devisSelectionne={devisSelectionne}
          modeEdition={modeEdition}
          editForm={editForm}
          setEditForm={setEditForm}
          editLignes={editLignes}
          entrepriseId={entrepriseId}
          createdByUid={createdByUid}
          setModeEdition={setModeEdition}
          ouvrirEdition={ouvrirEdition}
          annulerEdition={annulerEdition}
          ajouterLigneEdition={ajouterLigneEdition}
          ajouterPrestationEdition={ajouterPrestationEdition}
          supprimerLigneEdition={supprimerLigneEdition}
          mettreAJourLigneEdition={mettreAJourLigneEdition}
          enregistrerEdition={enregistrerEdition}
          dupliquerDevis={dupliquerDevis}
          supprimerDevis={supprimerDevis}
          archiverDevis={archiverDevis}
          restaurerDevis={restaurerDevis}
          handleExporterPdf={handleExporterPdf}
          handleEnvoyerParMail={handleEnvoyerParMail}
          envoiEnCours={envoiEnCours}
          handleChangerStatut={handleChangerStatut}
        />
      </MobileFullscreenModal>
    </>
  );
}
