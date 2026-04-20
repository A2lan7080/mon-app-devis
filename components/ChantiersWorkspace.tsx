"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import MobileFullscreenModal from "./MobileFullscreenModal";
import { useEntrepriseChantiers } from "../hooks/useEntrepriseChantiers";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import { db } from "../lib/firebase";
import type { StatutChantier, Chantier } from "../types/chantiers";

type FiltreArchivage = "actifs" | "archives" | "tous";
type FiltreStatut = "Tous" | StatutChantier;

type Props = {
  entrepriseId?: string;
  createdByUid?: string;
};

type ChantierFormState = {
  titre: string;
  clientId: string;
  adresse: string;
  codePostal: string;
  ville: string;
  dateDebut: string;
  dateFin: string;
  statut: StatutChantier;
  description: string;
  notes: string;
};

const STATUTS_CHANTIER: StatutChantier[] = [
  "À planifier",
  "Planifié",
  "En cours",
  "Terminé",
  "Suspendu",
];

const creerFormulaireVide = (): ChantierFormState => ({
  titre: "",
  clientId: "",
  adresse: "",
  codePostal: "",
  ville: "",
  dateDebut: "",
  dateFin: "",
  statut: "À planifier",
  description: "",
  notes: "",
});

function genererReferenceChantier(chantiers: Chantier[]) {
  const plusGrandNumero = chantiers.reduce((max, chantier) => {
    const match = chantier.reference?.match(/CH-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `CH-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

function getStatutClasses(statut: StatutChantier) {
  switch (statut) {
    case "À planifier":
      return "bg-slate-100 text-slate-700";
    case "Planifié":
      return "bg-blue-100 text-blue-700";
    case "En cours":
      return "bg-amber-100 text-amber-800";
    case "Terminé":
      return "bg-emerald-100 text-emerald-700";
    case "Suspendu":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function ChantiersWorkspace({
  entrepriseId,
  createdByUid,
}: Props) {
  const [recherche, setRecherche] = useState("");
  const [filtreArchivage, setFiltreArchivage] =
    useState<FiltreArchivage>("actifs");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("Tous");
  const [chantierSelectionneId, setChantierSelectionneId] = useState<
    string | null
  >(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [formulaire, setFormulaire] = useState<ChantierFormState>(
    creerFormulaireVide()
  );

  const { chantiers, chargement } = useEntrepriseChantiers({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const { clients } = useEntrepriseClients({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const clientsActifs = useMemo(
    () => clients.filter((client) => !client.archive),
    [clients]
  );

  const chantiersFiltres = useMemo(() => {
    const valeur = recherche.trim().toLowerCase();

    return chantiers.filter((chantier) => {
      const texte = [
        chantier.reference ?? "",
        chantier.titre ?? "",
        chantier.clientNom ?? "",
        chantier.adresse ?? "",
        chantier.ville ?? "",
        chantier.statut ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchRecherche = !valeur || texte.includes(valeur);
      const matchStatut =
        filtreStatut === "Tous" ? true : chantier.statut === filtreStatut;

      const estArchive = chantier.archive === true;
      const matchArchivage =
        filtreArchivage === "tous"
          ? true
          : filtreArchivage === "archives"
          ? estArchive
          : !estArchive;

      return matchRecherche && matchStatut && matchArchivage;
    });
  }, [chantiers, recherche, filtreArchivage, filtreStatut]);

  const chantierSelectionne = useMemo(() => {
    if (!chantierSelectionneId) {
      return null;
    }

    return (
      chantiersFiltres.find(
        (chantier) => chantier.id === chantierSelectionneId
      ) ?? null
    );
  }, [chantiersFiltres, chantierSelectionneId]);

  const totalChantiers = useMemo(
    () => chantiers.filter((chantier) => !chantier.archive).length,
    [chantiers]
  );

  const totalPlanifies = useMemo(
    () =>
      chantiers.filter(
        (chantier) => chantier.statut === "Planifié" && !chantier.archive
      ).length,
    [chantiers]
  );

  const totalEnCours = useMemo(
    () =>
      chantiers.filter(
        (chantier) => chantier.statut === "En cours" && !chantier.archive
      ).length,
    [chantiers]
  );

  const totalArchives = useMemo(
    () => chantiers.filter((chantier) => chantier.archive).length,
    [chantiers]
  );

  const resetFormulaire = () => {
    setFormulaire(creerFormulaireVide());
  };

  const ouvrirCreation = () => {
    resetFormulaire();
    setAfficherFormulaire(true);
    setModeEdition(false);
  };

  const fermerFormulaire = () => {
    setAfficherFormulaire(false);
    setModeEdition(false);
    resetFormulaire();
  };

  const fermerDetail = () => {
    setChantierSelectionneId(null);
    setModeEdition(false);
  };

  const ouvrirEdition = () => {
    if (!chantierSelectionne) return;

    setFormulaire({
      titre: chantierSelectionne.titre,
      clientId: chantierSelectionne.clientId,
      adresse: chantierSelectionne.adresse,
      codePostal: chantierSelectionne.codePostal,
      ville: chantierSelectionne.ville,
      dateDebut: chantierSelectionne.dateDebut,
      dateFin: chantierSelectionne.dateFin,
      statut: chantierSelectionne.statut,
      description: chantierSelectionne.description,
      notes: chantierSelectionne.notes,
    });

    setModeEdition(true);
    setAfficherFormulaire(false);
  };

  const handleSelectionClient = (clientId: string) => {
    const clientAssocie =
      clientsActifs.find((client) => client.id === clientId) ?? null;

    setFormulaire((prev) => ({
      ...prev,
      clientId,
      adresse: clientAssocie?.adresse ?? prev.adresse,
      codePostal: clientAssocie?.codePostal ?? prev.codePostal,
      ville: clientAssocie?.ville ?? prev.ville,
    }));
  };

  const enregistrerChantier = async () => {
    if (!entrepriseId || !createdByUid) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return;
    }

    if (!formulaire.titre.trim()) {
      alert("Le titre du chantier est obligatoire.");
      return;
    }

    const clientAssocie =
      clients.find((client) => client.id === formulaire.clientId) ?? null;

    const maintenant = Date.now();

    try {
      setSauvegardeEnCours(true);

      if (modeEdition && chantierSelectionne) {
        await updateDoc(doc(db, "chantiers", chantierSelectionne.id), {
          ...chantierSelectionne,
          titre: formulaire.titre.trim(),
          clientId: formulaire.clientId,
          clientNom: clientAssocie?.nom ?? "",
          adresse: formulaire.adresse.trim(),
          codePostal: formulaire.codePostal.trim(),
          ville: formulaire.ville.trim(),
          dateDebut: formulaire.dateDebut,
          dateFin: formulaire.dateFin,
          statut: formulaire.statut,
          description: formulaire.description.trim(),
          notes: formulaire.notes.trim(),
          updatedAt: maintenant,
        });

        setModeEdition(false);
        resetFormulaire();
        return;
      }

      const nouvelId = `${entrepriseId}-ch-${maintenant}`;
      const reference = genererReferenceChantier(chantiers);

      const nouveauChantier: Chantier = {
        id: nouvelId,
        reference,
        titre: formulaire.titre.trim(),
        clientId: formulaire.clientId,
        clientNom: clientAssocie?.nom ?? "",
        adresse: formulaire.adresse.trim(),
        codePostal: formulaire.codePostal.trim(),
        ville: formulaire.ville.trim(),
        dateDebut: formulaire.dateDebut,
        dateFin: formulaire.dateFin,
        statut: formulaire.statut,
        description: formulaire.description.trim(),
        notes: formulaire.notes.trim(),
        entrepriseId,
        createdByUid,
        archive: false,
        createdAt: maintenant,
        updatedAt: maintenant,
      };

      await setDoc(doc(db, "chantiers", nouvelId), nouveauChantier);

      setChantierSelectionneId(nouvelId);
      setAfficherFormulaire(false);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur enregistrement chantier :", error);
      alert("Impossible d’enregistrer le chantier.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverChantier = async () => {
    if (!chantierSelectionne) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "chantiers", chantierSelectionne.id), {
        ...chantierSelectionne,
        archive: true,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur archivage chantier :", error);
      alert("Impossible d’archiver le chantier.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const restaurerChantier = async () => {
    if (!chantierSelectionne) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "chantiers", chantierSelectionne.id), {
        ...chantierSelectionne,
        archive: false,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur restauration chantier :", error);
      alert("Impossible de restaurer le chantier.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimerChantier = async () => {
    if (!chantierSelectionne) return;

    const confirmation = window.confirm(
      `Supprimer définitivement le chantier ${chantierSelectionne.titre} ?`
    );

    if (!confirmation) return;

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(doc(db, "chantiers", chantierSelectionne.id));
      setChantierSelectionneId(null);
      setModeEdition(false);
      setAfficherFormulaire(false);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur suppression chantier :", error);
      alert("Impossible de supprimer le chantier.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const afficherFormulaireChantier = afficherFormulaire || modeEdition;

  const titreMobile = afficherFormulaireChantier
    ? modeEdition && chantierSelectionne
      ? chantierSelectionne.reference
      : "Nouveau chantier"
    : chantierSelectionne
    ? chantierSelectionne.titre
    : "Chantier";

  const renderFormulaireOuDetail = () => {
    if (chargement) {
      return (
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
          Chargement des chantiers...
        </div>
      );
    }

    if (afficherFormulaireChantier) {
      return (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                {modeEdition ? "Édition chantier" : "Nouveau chantier"}
              </p>
              <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                {modeEdition && chantierSelectionne
                  ? chantierSelectionne.reference
                  : "Créer un chantier"}
              </h3>
            </div>

            <button
              onClick={fermerFormulaire}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              Fermer
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Titre du chantier
              </label>
              <input
                type="text"
                value={formulaire.titre}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    titre: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Client associé
              </label>
              <select
                value={formulaire.clientId}
                onChange={(e) => handleSelectionClient(e.target.value)}
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                <option value="">Aucun client associé</option>
                {clientsActifs.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Statut
              </label>
              <select
                value={formulaire.statut}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    statut: e.target.value as StatutChantier,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              >
                {STATUTS_CHANTIER.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Adresse
              </label>
              <input
                type="text"
                value={formulaire.adresse}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    adresse: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Code postal
              </label>
              <input
                type="text"
                value={formulaire.codePostal}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    codePostal: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Ville
              </label>
              <input
                type="text"
                value={formulaire.ville}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    ville: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date début
              </label>
              <input
                type="date"
                value={formulaire.dateDebut}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    dateDebut: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Date fin
              </label>
              <input
                type="date"
                value={formulaire.dateFin}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    dateFin: e.target.value,
                  }))
                }
                className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Description
            </label>
            <textarea
              value={formulaire.description}
              onChange={(e) =>
                setFormulaire((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="mt-4">
            <label className="mb-2 block text-sm font-medium text-slate-700">
              Notes
            </label>
            <textarea
              value={formulaire.notes}
              onChange={(e) =>
                setFormulaire((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
              rows={4}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={enregistrerChantier}
              disabled={sauvegardeEnCours}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sauvegardeEnCours
                ? "Enregistrement..."
                : modeEdition
                ? "Enregistrer les modifications"
                : "Créer le chantier"}
            </button>

            <button
              onClick={fermerFormulaire}
              disabled={sauvegardeEnCours}
              className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              Annuler
            </button>
          </div>
        </>
      );
    }

    if (chantierSelectionne) {
      return (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Fiche chantier</p>
                <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                  {chantierSelectionne.titre}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {chantierSelectionne.reference}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                    chantierSelectionne.statut
                  )}`}
                >
                  {chantierSelectionne.statut}
                </span>

                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    chantierSelectionne.archive
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {chantierSelectionne.archive ? "Archivé" : "Actif"}
                </span>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <button
                onClick={ouvrirEdition}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
              >
                Modifier
              </button>

              {!chantierSelectionne.archive ? (
                <button
                  onClick={archiverChantier}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Archiver
                </button>
              ) : (
                <button
                  onClick={restaurerChantier}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Restaurer
                </button>
              )}

              <button
                onClick={supprimerChantier}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:col-span-2 xl:col-span-1"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Client associé</p>
              <p className="mt-1 text-lg font-semibold">
                {chantierSelectionne.clientNom || "Aucun client associé"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Adresse</p>
                <p className="mt-1 font-semibold">
                  {chantierSelectionne.adresse || "Non renseignée"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {[chantierSelectionne.codePostal, chantierSelectionne.ville]
                    .filter(Boolean)
                    .join(" · ") || "Coordonnées non renseignées"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Planning</p>
                <p className="mt-1 font-semibold">
                  {chantierSelectionne.dateDebut || "Début non renseigné"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {chantierSelectionne.dateFin || "Fin non renseignée"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Description</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {chantierSelectionne.description ||
                  "Aucune description pour ce chantier."}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Notes</p>
              <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                {chantierSelectionne.notes || "Aucune note pour ce chantier."}
              </p>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
        Sélectionne un chantier pour voir sa fiche.
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm sm:mb-6 sm:p-5 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">
            Gère les chantiers de ton entreprise.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {chargement
              ? "Chargement des chantiers..."
              : `${chantiers.length} chantier${chantiers.length > 1 ? "s" : ""} chargé${
                  chantiers.length > 1 ? "s" : ""
                }`}
          </p>
        </div>

        <button
          onClick={afficherFormulaireChantier ? fermerFormulaire : ouvrirCreation}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 md:w-auto"
        >
          {afficherFormulaireChantier ? "Fermer" : "Nouveau chantier"}
        </button>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Chantiers actifs</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">
            {totalChantiers}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Planifiés</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">
            {totalPlanifies}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">En cours</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">{totalEnCours}</p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Archivés</p>
          <p className="mt-2 text-2xl font-bold sm:text-3xl">
            {totalArchives}
          </p>
        </div>
      </div>

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          <div className="grid gap-4">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un chantier, client, ville..."
              className="block w-full min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />

            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              className="block w-full min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="Tous">Tous les statuts</option>
              {STATUTS_CHANTIER.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>

            <select
              value={filtreArchivage}
              onChange={(e) =>
                setFiltreArchivage(e.target.value as FiltreArchivage)
              }
              className="block w-full min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="actifs">Chantiers actifs</option>
              <option value="archives">Chantiers archivés</option>
              <option value="tous">Tous les chantiers</option>
            </select>
          </div>

          <div className="mt-6 space-y-2 overflow-hidden">
            {chantiersFiltres.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Aucun chantier trouvé.
              </div>
            ) : (
              chantiersFiltres.map((chantier) => {
                const estSelectionne = chantier.id === chantierSelectionneId;

                return (
                  <button
                    key={chantier.id}
                    onClick={() => {
                      setModeEdition(false);
                      setAfficherFormulaire(false);
                      setChantierSelectionneId(estSelectionne ? null : chantier.id);
                    }}
                    className={`block w-full min-w-0 overflow-hidden rounded-xl border px-3 py-3 text-left transition ${
                      estSelectionne
                        ? "border-slate-900 bg-slate-50"
                        : "border-slate-200 bg-white hover:bg-slate-50"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {chantier.reference}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              chantier.archive
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {chantier.archive ? "Archivé" : "Actif"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
                          {chantier.titre}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {chantier.clientNom || "Sans client"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatutClasses(
                            chantier.statut
                          )}`}
                        >
                          {chantier.statut}
                        </span>

                        <p className="mt-2 text-xs text-slate-500">
                          {chantier.ville || "Ville"}
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {chantier.dateDebut || "Sans date"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="hidden min-w-0 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6 xl:block">
          {renderFormulaireOuDetail()}
        </div>
      </div>

      <MobileFullscreenModal
        open={afficherFormulaireChantier}
        title={titreMobile}
        onClose={fermerFormulaire}
      >
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          {renderFormulaireOuDetail()}
        </div>
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={!afficherFormulaireChantier && chantierSelectionne !== null}
        title={titreMobile}
        onClose={fermerDetail}
      >
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          {renderFormulaireOuDetail()}
        </div>
      </MobileFullscreenModal>
    </>
  );
}