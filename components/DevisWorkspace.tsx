"use client";

import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import DevisDetailPanel from "./DevisDetailPanel";
import DevisForm from "./DevisForm";
import DevisKpiCards from "./DevisKpiCards";
import DevisList from "./DevisList";
import DevisPreviewModal from "./DevisPreviewModal";
import DevisSearch from "./DevisSearch";
import DevisSendModal, { type DevisSendValues } from "./DevisSendModal";
import MobileFullscreenModal from "./MobileFullscreenModal";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SectionHeader from "./ui/SectionHeader";
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
  entrepriseNom: string;
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
  handleEnvoyerParMail: (values: DevisSendValues) => Promise<boolean>;
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
  entrepriseNom,
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
  const [fenetreEnvoiOuverte, setFenetreEnvoiOuverte] = useState(false);
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
  const ouvrirFenetreEnvoi = () => setFenetreEnvoiOuverte(true);
  const actionsCreationDesktop = (
    <Button
      type="submit"
      form={creationFormDesktopId}
      variant="accent"
    >
      Enregistrer
    </Button>
  );
  const actionsDetailDesktop = modeEdition ? (
    <>
      <Button variant="accent" onClick={enregistrerEdition}>
        Enregistrer
      </Button>
      <Button variant="secondary" onClick={annulerEdition}>
        Annuler
      </Button>
    </>
  ) : (
    <>
      {!devisEstVerrouille && (
        <Button
          variant="accent"
          onClick={ouvrirFenetreEnvoi}
          loading={envoiEnCours}
          loadingLabel="Envoi..."
        >
          {libelleEnvoiDevis}
        </Button>
      )}
      <Button variant="secondary" onClick={handleExporterPdf}>
        PDF
      </Button>
      <Button variant="secondary" onClick={dupliquerDevis}>
        Dupliquer
      </Button>
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

      {devis.length === 0 && !afficherFormulaire && (
        <Card variant="info" className="mb-4 shadow-sm" padding="lg">
          <SectionHeader
            headingLevel={3}
            title="Bienvenue sur BatiFlow"
            description="Créez votre premier devis en quelques secondes"
            actions={
              <Button onClick={onCreateFirstDevis} fullWidth>
                Créer mon premier devis
              </Button>
            }
          />
        </Card>
      )}

      <div className="grid gap-4 lg:gap-6">
        <Card className="min-w-0 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-6" padding="md">
          <SectionHeader
            headingLevel={3}
            eyebrow="Portefeuille devis"
            title="Suivi des propositions"
            description="Retrouve rapidement un devis, son statut et son montant."
          />

          <div className="mt-5">
          <DevisSearch
            recherche={recherche}
            setRecherche={setRecherche}
            filtreStatut={filtreStatut}
            setFiltreStatut={setFiltreStatut}
            filtreArchivage={filtreArchivage}
            setFiltreArchivage={setFiltreArchivage}
            statuts={STATUTS_DEVIS}
          />
          </div>

          <DevisList
            devis={devisFiltres}
            totalDevis={devis.length}
            devisSelectionneId={devisSelectionneId}
            setDevisSelectionneId={setDevisSelectionneId}
            setModeEdition={setModeEdition}
            onCreateFirstDevis={onCreateFirstDevis}
          />
        </Card>

      </div>

      <MobileFullscreenModal
        open={afficherFormulaire}
        title={titreMobile}
        onClose={onCloseFormulaire}
        premium
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
        premium
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
          handleEnvoyerParMail={ouvrirFenetreEnvoi}
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
        premium
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
        premium
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
          handleEnvoyerParMail={ouvrirFenetreEnvoi}
          envoiEnCours={envoiEnCours}
          handleChangerStatut={handleChangerStatut}
          onClose={fermerDetail}
        />
      </DevisPreviewModal>

      {fenetreEnvoiOuverte && devisSelectionne && (
        <DevisSendModal
          open
          numeroDevis={formatNumeroDevisPourAffichage(devisSelectionne.id)}
          nomEntreprise={entrepriseNom}
          emailInitial={devisSelectionne.email}
          envoiEnCours={envoiEnCours}
          onClose={() => setFenetreEnvoiOuverte(false)}
          onSubmit={handleEnvoyerParMail}
        />
      )}
    </>
  );
}
