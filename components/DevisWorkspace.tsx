"use client";

import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import DevisDetailPanel from "./DevisDetailPanel";
import DevisForm from "./DevisForm";
import DevisKpiCards from "./DevisKpiCards";
import DevisList from "./DevisList";
import DevisPreviewModal from "./DevisPreviewModal";
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

type DevisAvecInfosEnvoi = DevisBusiness & {
  sentAt?: unknown;
  emailSentAt?: unknown;
};

function devisADejaEteEnvoye(devis: DevisAvecInfosEnvoi) {
  const dateEnvoi =
    devis.sentAt ?? devis.emailSentAt ?? devis.acceptanceTokenLastSentAt;

  return (
    (dateEnvoi !== undefined && dateEnvoi !== null && dateEnvoi !== "") ||
    devis.statut === "Envoyé"
  );
}

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
  onCreateFirstDevis: () => void;
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
  onCreateFirstDevis,
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

  const fermerDetail = () => {
    setModeEdition(false);
    setDevisSelectionneId(null);
  };
  const detailOuvert = !afficherFormulaire && devisSelectionne !== null;
  const creationFormDesktopId = "devis-create-form-desktop";
  const devisEstVerrouille =
    devisSelectionne?.statut === "Accepté" ||
    devisSelectionne?.statut === "Refusé";
  const libelleEnvoiDevis =
    devisSelectionne && devisADejaEteEnvoye(devisSelectionne)
      ? "Renvoyer"
      : "Envoyer";
  const actionsCreationDesktop = (
    <button
      type="submit"
      form={creationFormDesktopId}
      className="bf-button-primary"
    >
      Enregistrer
    </button>
  );
  const actionsDetailDesktop = modeEdition ? (
    <>
      <button
        type="button"
        onClick={enregistrerEdition}
        className="bf-button-primary"
      >
        Enregistrer
      </button>
      <button
        type="button"
        onClick={annulerEdition}
        className="bf-button-secondary"
      >
        Annuler
      </button>
    </>
  ) : (
    <>
      {!devisEstVerrouille && (
        <button
          type="button"
          onClick={handleEnvoyerParMail}
          disabled={envoiEnCours}
          className="bf-button-soft disabled:cursor-not-allowed disabled:opacity-60"
        >
          {envoiEnCours ? "Envoi..." : libelleEnvoiDevis}
        </button>
      )}
      <button
        type="button"
        onClick={handleExporterPdf}
        className="bf-button-primary"
      >
        PDF
      </button>
      <button
        type="button"
        onClick={dupliquerDevis}
        className="bf-button-secondary"
      >
        Dupliquer
      </button>
    </>
  );

  return (
    <>
      <DevisKpiCards
        totalDevis={totalDevis}
        totalBrouillons={totalBrouillons}
        totalAcceptes={totalAcceptes}
        caSigne={caSigne}
      />

      <div className="grid gap-4 lg:gap-6">
        <div className="bf-card min-w-0 overflow-hidden p-4 sm:p-5 md:p-6">
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
            totalDevis={devis.length}
            devisSelectionneId={devisSelectionneId}
            setDevisSelectionneId={setDevisSelectionneId}
            setModeEdition={setModeEdition}
            onCreateFirstDevis={onCreateFirstDevis}
          />
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
          formId="devis-create-form-mobile"
          modePanneau
          afficherEntete={false}
          onDevisCree={onDevisCree}
          onClose={onCloseFormulaire}
        />
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={detailOuvert}
        title={titreMobile}
        onClose={fermerDetail}
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
          onClose={fermerDetail}
        />
      </MobileFullscreenModal>

      <DevisPreviewModal
        open={afficherFormulaire}
        title="Nouveau devis"
        eyebrow="Création devis"
        actions={actionsCreationDesktop}
        onClose={onCloseFormulaire}
      >
        <DevisForm
          devis={devis}
          entrepriseId={entrepriseId}
          createdByUid={createdByUid}
          formId={creationFormDesktopId}
          modePanneau
          afficherEntete={false}
          onDevisCree={onDevisCree}
          onClose={onCloseFormulaire}
        />
      </DevisPreviewModal>

      <DevisPreviewModal
        open={detailOuvert}
        title={titreMobile}
        eyebrow={modeEdition ? "Modification devis" : "Consultation devis"}
        actions={actionsDetailDesktop}
        onClose={fermerDetail}
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
          onClose={fermerDetail}
        />
      </DevisPreviewModal>
    </>
  );
}
