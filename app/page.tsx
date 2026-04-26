"use client";

import { useState } from "react";
import { doc, updateDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import AccessDeniedState from "../components/AccessDeniedState";
import AdminShell from "../components/AdminShell";
import AdminWorkspace from "../components/AdminWorkspace";
import ChantiersWorkspace from "../components/ChantiersWorkspace";
import ClientsWorkspace from "../components/ClientsWorkspace";
import DevisWorkspace from "../components/DevisWorkspace";
import EmptyAuthState from "../components/EmptyAuthState";
import FacturesWorkspace from "../components/FacturesWorkspace";
import OuvrierDashboard from "../components/OuvrierDashboard";
import PageLoadingState from "../components/PageLoadingState";
import { useAuthenticatedProfile } from "../hooks/useAuthenticatedProfile";
import { useDevisActions } from "../hooks/useDevisActions";
import { useDevisAnalytics } from "../hooks/useDevisAnalytics";
import { useDevisPageUi } from "../hooks/useDevisPageUi";
import { useEntrepriseDevis } from "../hooks/useEntrepriseDevis";
import { useEntrepriseSettings } from "../hooks/useEntrepriseSettings";
import { useSessionNavigation } from "../hooks/useSessionNavigation";
import { getEntrepriseSettings } from "../lib/get-entreprise-settings";
import { db } from "../lib/firebase";
import type { StatutDevis } from "../types/devis";

type FiltreStatut = "Tous" | StatutDevis;
type FiltreArchivage = "actifs" | "archives" | "tous";
type VuePrincipale =
  | "devis"
  | "clients"
  | "chantiers"
  | "factures"
  | "admin";

export default function Home() {
  const router = useRouter();

  const [recherche, setRecherche] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("Tous");
  const [filtreArchivage, setFiltreArchivage] =
    useState<FiltreArchivage>("actifs");
  const [devisSelectionneId, setDevisSelectionneId] = useState<string | null>(
    null
  );
  const [envoiDevisEnCours, setEnvoiDevisEnCours] = useState(false);

  const { goToLogin, handleDeconnexion } = useSessionNavigation(router);

  const { user, profilUtilisateur, authChargee, erreurAcces } =
    useAuthenticatedProfile(router);

  const estAdmin = profilUtilisateur?.role === "admin";
  const entrepriseIdCourante = profilUtilisateur?.entrepriseId ?? null;

  const { entrepriseSettings } = useEntrepriseSettings({
    entrepriseIdCourante,
    userId: user?.uid ?? null,
    authChargee,
  });

  const { devis, chargement } = useEntrepriseDevis({
    authChargee,
    userId: user?.uid ?? null,
    entrepriseIdCourante,
    estAdmin,
  });

  const {
    devisFiltres,
    devisSelectionne,
    totalDevis,
    totalBrouillons,
    totalAcceptes,
    totalEnvoyes,
    totalRefuses,
    totalArchives,
    caSigne,
    pipeEnvoye,
    pipeBrouillon,
    valeurBusinessTotale,
    tauxConversion,
    ticketMoyen,
  } = useDevisAnalytics({
    devis,
    recherche,
    filtreStatut,
    filtreArchivage,
    devisSelectionneId,
  });

  const getDevisDocRef = (devisId: string) => doc(db, "devis", devisId);

  const {
    modeEdition,
    setModeEdition,
    sauvegardeEnCours,
    editForm,
    setEditForm,
    editLignes,
    handleChangerStatut,
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
  } = useDevisActions({
    devis,
    devisSelectionne,
    user,
    entrepriseIdCourante,
    estAdmin,
    setDevisSelectionneId,
    setFiltreArchivage,
  });

  const {
    vuePrincipale,
    afficherFormulaire,
    ouvrirVueDevis,
    ouvrirVueClients,
    ouvrirVueChantiers,
    ouvrirVueFactures,
    ouvrirVueAdmin,
    toggleFormulaireDevis,
    fermerFormulaireDevis,
    handleDevisCree,
  } = useDevisPageUi({
    setModeEdition,
    setDevisSelectionneId,
    setRecherche,
    setFiltreStatut,
    setFiltreArchivage,
  });

  const handleEnvoyerDevisParMail = async () => {
    if (!devisSelectionne) return;

    if (devisSelectionne.statut === "Refusé") {
      alert("Ce devis est refusé et ne peut plus être renvoyé.");
      return;
    }

    const emailClient = devisSelectionne.email?.trim();

    if (!emailClient) {
      alert("Ce client n’a pas d’adresse email renseignée.");
      return;
    }

    if (!entrepriseIdCourante) {
      alert("Impossible d’identifier l’entreprise active.");
      return;
    }

    try {
      setEnvoiDevisEnCours(true);

      const entreprisePourMail = await getEntrepriseSettings(
        entrepriseIdCourante
      );
      const idToken = await user?.getIdToken(true);

      if (!idToken) {
        throw new Error("Authentification requise.");
      }

      const response = await fetch("/api/devis/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          devis: devisSelectionne,
          toEmail: emailClient,
          entreprise: entreprisePourMail,
        }),
      });

      const data = (await response.json()) as {
        success?: boolean;
        error?: string;
      };

      if (!response.ok || !data.success) {
        throw new Error(data.error || "Impossible d’envoyer le devis.");
      }

      if (
        devisSelectionne.statut !== "Envoyé" &&
        devisSelectionne.statut !== "Accepté"
      ) {
        await updateDoc(getDevisDocRef(devisSelectionne.id), {
          statut: "Envoyé",
        });
      }

      alert(`Devis envoyé à ${emailClient}.`);
    } catch (error) {
      console.error("Erreur envoi devis :", error);
      alert(
        error instanceof Error
          ? error.message
          : "Impossible d’envoyer le devis."
      );
    } finally {
      setEnvoiDevisEnCours(false);
    }
  };

  const vueAffichee: VuePrincipale = estAdmin ? vuePrincipale : "devis";

  if (!authChargee || chargement) {
    return <PageLoadingState />;
  }

  if (!user) {
    return <EmptyAuthState />;
  }

  if (erreurAcces || !profilUtilisateur) {
    return (
      <AccessDeniedState
        erreurAcces={erreurAcces}
        onDeconnexion={handleDeconnexion}
        onRetourLogin={goToLogin}
      />
    );
  }

  if (!estAdmin) {
    return (
      <OuvrierDashboard
        displayName={profilUtilisateur.displayName}
        entrepriseId={profilUtilisateur.entrepriseId}
        role={profilUtilisateur.role}
        onDeconnexion={handleDeconnexion}
      />
    );
  }

  return (
    <AdminShell
      email={user.email ?? ""}
      entrepriseNom={entrepriseSettings.nom}
      vueAffichee={vueAffichee}
      displayName={profilUtilisateur.displayName}
      entrepriseId={profilUtilisateur.entrepriseId}
      role={profilUtilisateur.role}
      sauvegardeEnCours={sauvegardeEnCours}
      afficherFormulaire={afficherFormulaire}
      onOuvrirVueDevis={ouvrirVueDevis}
      onOuvrirVueClients={ouvrirVueClients}
      onOuvrirVueChantiers={ouvrirVueChantiers}
      onOuvrirVueFactures={ouvrirVueFactures}
      onOuvrirVueAdmin={ouvrirVueAdmin}
      onToggleFormulaireDevis={toggleFormulaireDevis}
      onDeconnexion={handleDeconnexion}
    >

      {vueAffichee === "admin" ? (
        <AdminWorkspace
          valeurBusinessTotale={valeurBusinessTotale}
          caSigne={caSigne}
          totalEnvoyes={totalEnvoyes}
          pipeEnvoye={pipeEnvoye}
          pipeBrouillon={pipeBrouillon}
          tauxConversion={tauxConversion}
          totalDevis={totalDevis}
          ticketMoyen={ticketMoyen}
          totalArchives={totalArchives}
          totalBrouillons={totalBrouillons}
          totalAcceptes={totalAcceptes}
          totalRefuses={totalRefuses}
          entrepriseId={entrepriseIdCourante ?? undefined}
          createdByUid={user?.uid}
          authChargee={authChargee}
        />
      ) : vueAffichee === "clients" ? (
        <ClientsWorkspace
          entrepriseId={entrepriseIdCourante ?? undefined}
          createdByUid={user?.uid}
        />
      ) : vueAffichee === "chantiers" ? (
        <ChantiersWorkspace
          entrepriseId={entrepriseIdCourante ?? undefined}
          createdByUid={user?.uid}
        />
      ) : vueAffichee === "factures" ? (
        <FacturesWorkspace
          entrepriseId={entrepriseIdCourante ?? undefined}
          createdByUid={user?.uid}
        />
      ) : (
        <DevisWorkspace
          devis={devis}
          devisFiltres={devisFiltres}
          devisSelectionne={devisSelectionne}
          entrepriseId={entrepriseIdCourante ?? undefined}
          createdByUid={user?.uid}
          afficherFormulaire={afficherFormulaire}
          recherche={recherche}
          setRecherche={setRecherche}
          filtreStatut={filtreStatut}
          setFiltreStatut={setFiltreStatut}
          filtreArchivage={filtreArchivage}
          setFiltreArchivage={setFiltreArchivage}
          devisSelectionneId={devisSelectionneId}
          setDevisSelectionneId={setDevisSelectionneId}
          totalDevis={totalDevis}
          totalBrouillons={totalBrouillons}
          totalAcceptes={totalAcceptes}
          caSigne={caSigne}
          modeEdition={modeEdition}
          setModeEdition={setModeEdition}
          editForm={editForm}
          setEditForm={setEditForm}
          editLignes={editLignes}
          ouvrirEdition={ouvrirEdition}
          annulerEdition={annulerEdition}
          ajouterLigneEdition={ajouterLigneEdition}
          ajouterPrestationEdition={ajouterPrestationEdition}
          supprimerLigneEdition={supprimerLigneEdition}
          mettreAJourLigneEdition={mettreAJourLigneEdition}
          enregistrerEdition={() => enregistrerEdition(getDevisDocRef)}
          dupliquerDevis={() => dupliquerDevis(getDevisDocRef)}
          supprimerDevis={() => supprimerDevis(getDevisDocRef)}
          archiverDevis={() => archiverDevis(getDevisDocRef)}
          restaurerDevis={() => restaurerDevis(getDevisDocRef)}
          handleExporterPdf={handleExporterPdf}
          handleEnvoyerParMail={handleEnvoyerDevisParMail}
          envoiEnCours={envoiDevisEnCours}
          handleChangerStatut={(statut) =>
            handleChangerStatut(statut, getDevisDocRef)
          }
          onDevisCree={handleDevisCree}
          onCloseFormulaire={fermerFormulaireDevis}
        />
      )}
    </AdminShell>
  );
}
