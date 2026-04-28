"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { User } from "firebase/auth";
import {
  deleteDoc,
  getDoc,
  setDoc,
  updateDoc,
  type DocumentReference,
} from "firebase/firestore";
import { TVA_PAR_DEFAUT } from "../lib/devis-constants";
import { exporterDevisPdf } from "../lib/export-devis-pdf";
import {
  convertirDateVersInput,
  convertirLignesFormStateEnLignesMetier,
  formaterDate,
  genererNumeroDevis,
} from "../lib/devis-helpers";
import type { Devis, NouvelleLigneState, StatutDevis } from "../types/devis";

export type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

export type EditFormState = {
  client: string;
  statut: StatutDevis;
  date: string;
  adresse: string;
  codePostal: string;
  ville: string;
  email: string;
  telephone: string;
  typeClient: "Particulier" | "Professionnel";
  societe: string;
  tvaClient: string;
  chantierId: string;
  chantierTitre: string;
  tvaTaux: string;
  acomptePourcentage: string;
  validiteJours: string;
  conditions: string;
};

export type PrestationEdition = {
  designation: string;
  unite: string;
  prixUnitaire: number | string;
};

type UseDevisActionsParams = {
  devis: DevisBusiness[];
  devisSelectionne: DevisBusiness | null;
  user: User | null;
  entrepriseIdCourante: string | null;
  estAdmin: boolean;
  setDevisSelectionneId: Dispatch<SetStateAction<string | null>>;
  setFiltreArchivage: Dispatch<SetStateAction<"actifs" | "archives" | "tous">>;
};

const STATUTS_DEVIS_VERROUILLES: StatutDevis[] = ["Accepté", "Refusé"];

const devisEstStatutVerrouille = (statut?: StatutDevis | null) =>
  statut ? STATUTS_DEVIS_VERROUILLES.includes(statut) : false;

export function useDevisActions({
  devis,
  devisSelectionne,
  user,
  entrepriseIdCourante,
  estAdmin,
  setDevisSelectionneId,
  setFiltreArchivage,
}: UseDevisActionsParams) {
  const [modeEdition, setModeEdition] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

  const [editForm, setEditForm] = useState<EditFormState>({
    client: "",
    statut: "Brouillon",
    date: "",
    adresse: "",
    codePostal: "",
    ville: "",
    email: "",
    telephone: "",
    typeClient: "Particulier",
    societe: "",
    tvaClient: "",
    chantierId: "",
    chantierTitre: "",
    tvaTaux: String(TVA_PAR_DEFAUT),
    acomptePourcentage: "30",
    validiteJours: "30",
    conditions: "",
  });

  const [editLignes, setEditLignes] = useState<NouvelleLigneState[]>([]);

  const getDevisDocRef = (devisId: string) =>
    ({
      devisId,
    } as unknown as DocumentReference);

  const withRef = (
    devisId: string,
    resolver: (devisId: string) => DocumentReference
  ) => resolver(devisId);

  const afficherMessageDevisVerrouille = (statut = devisSelectionne?.statut) => {
    alert(
      statut === "Refusé"
        ? "Ce devis est refusé et ne peut plus être modifié."
        : "Ce devis est accepté et ne peut plus être modifié."
    );
  };

  const devisEstVerrouille = () =>
    devisEstStatutVerrouille(devisSelectionne?.statut);

  const handleChangerStatut = async (
    nouveauStatut: StatutDevis,
    resolver: (devisId: string) => DocumentReference
  ) => {
    if (!devisSelectionne || !estAdmin) return;

    if (devisEstVerrouille()) {
      afficherMessageDevisVerrouille();
      return;
    }

    try {
      setSauvegardeEnCours(true);
      await updateDoc(withRef(devisSelectionne.id, resolver), {
        ...devisSelectionne,
        statut: nouveauStatut,
      });
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const ouvrirEdition = () => {
    if (!devisSelectionne || !estAdmin) return;

    if (devisEstVerrouille()) {
      afficherMessageDevisVerrouille();
      return;
    }

    setEditForm({
      client: devisSelectionne.client,
      statut: devisSelectionne.statut,
      date: convertirDateVersInput(devisSelectionne.date),
      adresse: devisSelectionne.adresse,
      codePostal: devisSelectionne.codePostal,
      ville: devisSelectionne.ville,
      email: devisSelectionne.email,
      telephone: devisSelectionne.telephone,
      typeClient: devisSelectionne.typeClient,
      societe: devisSelectionne.societe,
      tvaClient: devisSelectionne.tvaClient,
      chantierId: devisSelectionne.chantierId,
      chantierTitre: devisSelectionne.chantierTitre,
      tvaTaux: String(devisSelectionne.tvaTaux),
      acomptePourcentage: String(devisSelectionne.acomptePourcentage),
      validiteJours: String(devisSelectionne.validiteJours),
      conditions: devisSelectionne.conditions,
    });

    setEditLignes(
      devisSelectionne.lignes.map((ligne) => ({
        designation: ligne.designation,
        quantite: String(ligne.quantite),
        unite: ligne.unite,
        prixUnitaire: String(ligne.prixUnitaire),
      }))
    );

    setModeEdition(true);
  };

  const annulerEdition = () => {
    setModeEdition(false);
    setEditLignes([]);
  };

  const ajouterLigneEdition = () => {
    setEditLignes((prev) => [
      ...prev,
      {
        designation: "",
        quantite: "1",
        unite: "forfait",
        prixUnitaire: "0",
      },
    ]);
  };

  const ajouterPrestationEdition = (prestation: PrestationEdition) => {
    setEditLignes((prev) => [
      ...prev,
      {
        designation: prestation.designation,
        quantite: "1",
        unite: prestation.unite,
        prixUnitaire: String(prestation.prixUnitaire),
      },
    ]);
  };

  const supprimerLigneEdition = (index: number) => {
    setEditLignes((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const mettreAJourLigneEdition = (
    index: number,
    champ: keyof NouvelleLigneState,
    valeur: string
  ) => {
    setEditLignes((prev) =>
      prev.map((ligne, i) =>
        i === index ? { ...ligne, [champ]: valeur } : ligne
      )
    );
  };

  const enregistrerEdition = async (
    resolver: (devisId: string) => DocumentReference
  ) => {
    if (!devisSelectionne || !estAdmin) return;

    if (devisEstVerrouille()) {
      afficherMessageDevisVerrouille();
      return;
    }

    if (!editForm.client.trim() || !editForm.date) {
      alert("Le client et la date sont obligatoires.");
      return;
    }

    const tvaTaux = Number(editForm.tvaTaux);
    const acomptePourcentage = Number(editForm.acomptePourcentage);
    const validiteJours = Number(editForm.validiteJours);

    if (Number.isNaN(tvaTaux) || tvaTaux < 0) {
      alert("Le taux de TVA doit être valide.");
      return;
    }

    if (Number.isNaN(acomptePourcentage) || acomptePourcentage < 0) {
      alert("Le pourcentage d’acompte doit être valide.");
      return;
    }

    if (Number.isNaN(validiteJours) || validiteJours <= 0) {
      alert("La durée de validité doit être valide.");
      return;
    }

    const lignesValides = convertirLignesFormStateEnLignesMetier(editLignes);

    if (lignesValides.length === 0) {
      alert("Garde au moins une ligne valide.");
      return;
    }

    try {
      setSauvegardeEnCours(true);
      await updateDoc(withRef(devisSelectionne.id, resolver), {
        ...devisSelectionne,
        client: editForm.client.trim(),
        statut: editForm.statut,
        date: formaterDate(editForm.date),
        adresse: editForm.adresse.trim(),
        codePostal: editForm.codePostal.trim(),
        ville: editForm.ville.trim(),
        email: editForm.email.trim(),
        telephone: editForm.telephone.trim(),
        typeClient: editForm.typeClient,
        societe: editForm.societe.trim(),
        tvaClient: editForm.tvaClient.trim(),
        chantierId: editForm.chantierId.trim(),
        chantierTitre: editForm.chantierTitre.trim(),
        tvaTaux,
        lignes: lignesValides,
        acomptePourcentage,
        validiteJours,
        conditions: editForm.conditions.trim(),
      });
      setModeEdition(false);
      setEditLignes([]);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const dupliquerDevis = async (
    resolver: (devisId: string) => DocumentReference
  ) => {
    if (!devisSelectionne || !user || !entrepriseIdCourante || !estAdmin)
      return;

    let numeroBase = genererNumeroDevis(devis);
    let nouveauId = `${entrepriseIdCourante}-${numeroBase}`;
    let tentative = 0;

    while (devis.some((item) => item.id === nouveauId)) {
      tentative += 1;
      numeroBase = genererNumeroDevis([
        ...devis,
        {
          ...devisSelectionne,
          id: `${entrepriseIdCourante}-DEV-2026-${String(
            devis.length + tentative
          ).padStart(3, "0")}`,
        },
      ]);
      nouveauId = `${entrepriseIdCourante}-${numeroBase}`;
    }

    const copie: DevisBusiness = {
      id: nouveauId,
      client: devisSelectionne.client,
      statut: "Brouillon",
      date: devisSelectionne.date,
      adresse: devisSelectionne.adresse,
      codePostal: devisSelectionne.codePostal,
      ville: devisSelectionne.ville,
      email: devisSelectionne.email,
      telephone: devisSelectionne.telephone,
      typeClient: devisSelectionne.typeClient,
      societe: devisSelectionne.societe,
      tvaClient: devisSelectionne.tvaClient,
      chantierId: devisSelectionne.chantierId,
      chantierTitre: devisSelectionne.chantierTitre,
      tvaTaux: devisSelectionne.tvaTaux,
      acomptePourcentage: devisSelectionne.acomptePourcentage,
      validiteJours: devisSelectionne.validiteJours,
      conditions: devisSelectionne.conditions,
      archive: false,
      createdAt: Date.now(),
      createdByUid: user.uid,
      entrepriseId: entrepriseIdCourante,
      lignes: devisSelectionne.lignes.map((ligne, index) => ({
        ...ligne,
        id: `${nouveauId}-L-${index + 1}`,
      })),
    };

    try {
      setSauvegardeEnCours(true);
      await setDoc(withRef(copie.id, resolver), copie);
      setDevisSelectionneId(copie.id);
      setFiltreArchivage("actifs");
      setModeEdition(false);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimerDevis = async (
    resolver: (devisId: string) => DocumentReference
  ) => {
    if (!devisSelectionne || !estAdmin) return;

    const devisIdCible = devisSelectionne.id;
    const statutSelectionne = devisSelectionne.statut;

    if (devisEstStatutVerrouille(statutSelectionne)) {
      afficherMessageDevisVerrouille(statutSelectionne);
      return;
    }

    const confirmation = window.confirm("Êtes-vous sûr ?");

    if (!confirmation) return;

    try {
      setSauvegardeEnCours(true);

      const devisRef = withRef(devisIdCible, resolver);
      const devisCibleSnap = await getDoc(devisRef);
      const devisCible = devisCibleSnap.data() as
        | Partial<DevisBusiness>
        | undefined;
      const statutCible = devisCible?.statut ?? statutSelectionne;

      if (devisEstStatutVerrouille(statutCible)) {
        afficherMessageDevisVerrouille(statutCible);
        return;
      }

      await deleteDoc(devisRef);
      setModeEdition(false);
      setDevisSelectionneId(null);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverDevis = async (
    resolver: (devisId: string) => DocumentReference
  ) => {
    if (!devisSelectionne || !estAdmin) return;

    if (devisEstVerrouille()) {
      afficherMessageDevisVerrouille();
      return;
    }

    try {
      setSauvegardeEnCours(true);
      await updateDoc(withRef(devisSelectionne.id, resolver), {
        ...devisSelectionne,
        archive: true,
      });
      setFiltreArchivage("actifs");
      setModeEdition(false);
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const restaurerDevis = async (
    resolver: (devisId: string) => DocumentReference
  ) => {
    if (!devisSelectionne || !estAdmin) return;

    if (devisEstVerrouille()) {
      afficherMessageDevisVerrouille();
      return;
    }

    try {
      setSauvegardeEnCours(true);
      await updateDoc(withRef(devisSelectionne.id, resolver), {
        ...devisSelectionne,
        archive: false,
      });
      setFiltreArchivage("actifs");
    } catch (error) {
      console.error(error);
      alert(String(error));
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const handleExporterPdf = () => {
    if (!devisSelectionne) return;
    exporterDevisPdf(devisSelectionne);
  };

  return {
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
    getDevisDocRef,
  };
}
