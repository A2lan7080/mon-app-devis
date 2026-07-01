"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import ChantiersKpiCards from "./ChantiersKpiCards";
import MobileFullscreenModal from "./MobileFullscreenModal";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import EmptyState from "./ui/EmptyState";
import SectionHeader from "./ui/SectionHeader";
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

const champFormulaireClasses =
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const champDateMobileClasses =
  "block w-full min-w-0 max-w-full appearance-none rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition duration-200 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const filtreChantierClasses =
  "block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-900/[0.02] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

const styleDateMobile = {
  width: "100%",
  maxWidth: "100%",
  minWidth: 0,
  boxSizing: "border-box",
  WebkitAppearance: "none",
  appearance: "none",
} as const;

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

  useEffect(() => {
    const handleNouveauChantier = () => {
      ouvrirCreation();
    };

    window.addEventListener(
      "batiflow:nouveau-chantier",
      handleNouveauChantier
    );

    return () => {
      window.removeEventListener(
        "batiflow:nouveau-chantier",
        handleNouveauChantier
      );
    };
  }, []);

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
          <SectionHeader
            eyebrow={modeEdition ? "Édition chantier" : "Nouveau chantier"}
            title={
              modeEdition && chantierSelectionne
                ? chantierSelectionne.reference
                : "Créer un chantier"
            }
            description="Regroupe le client, le lieu, le planning et les informations terrain."
            headingLevel={3}
            actions={
              <Button variant="secondary" onClick={fermerFormulaire}>
                Fermer
              </Button>
            }
          />

          <div className="mt-7 grid min-w-0 max-w-full gap-5 md:grid-cols-2">
            <div className="min-w-0 overflow-hidden md:col-span-2">
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
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Client associé
              </label>
              <select
                value={formulaire.clientId}
                onChange={(e) => handleSelectionClient(e.target.value)}
                className={champFormulaireClasses}
              >
                <option value="">Aucun client associé</option>
                {clientsActifs.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.nom}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 overflow-hidden">
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
                className={champFormulaireClasses}
              >
                {STATUTS_CHANTIER.map((statut) => (
                  <option key={statut} value={statut}>
                    {statut}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 overflow-hidden md:col-span-2">
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
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
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
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
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
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
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
                className={champDateMobileClasses}
                style={styleDateMobile}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
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
                className={champDateMobileClasses}
                style={styleDateMobile}
              />
            </div>
          </div>

          <div className="mt-5 min-w-0 overflow-hidden">
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
              className={champFormulaireClasses}
            />
          </div>

          <div className="mt-5 min-w-0 overflow-hidden">
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
              className={champFormulaireClasses}
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <Button
              onClick={enregistrerChantier}
              disabled={sauvegardeEnCours}
              loading={sauvegardeEnCours}
              loadingLabel="Enregistrement..."
              variant="accent"
              className="w-full sm:w-auto"
            >
              {modeEdition
                ? "Enregistrer les modifications"
                : "Créer le chantier"}
            </Button>

            <Button
              onClick={fermerFormulaire}
              disabled={sauvegardeEnCours}
              variant="secondary"
              className="w-full sm:w-auto"
            >
              Annuler
            </Button>
          </div>
        </>
      );
    }

    if (chantierSelectionne) {
      return (
        <>
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-orange-200 bg-gradient-to-br from-white via-white to-orange-50 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
              <span
                aria-hidden="true"
                className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/14 blur-3xl"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-sky-500/12 blur-3xl"
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
                    Fiche chantier
                  </p>
                  <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">
                    {chantierSelectionne.titre}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {chantierSelectionne.reference}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Badge status={chantierSelectionne.statut} dot>
                    {chantierSelectionne.statut}
                  </Badge>
                  <Badge
                    tone={chantierSelectionne.archive ? "warning" : "success"}
                    dot
                  >
                    {chantierSelectionne.archive ? "Archivé" : "Actif"}
                  </Badge>
                </div>
              </div>

              <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                    Client
                  </p>
                  <p className="mt-2 break-words text-sm font-bold text-slate-950">
                    {chantierSelectionne.clientNom || "Aucun client associé"}
                  </p>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-orange-700">
                    Démarrage
                  </p>
                  <p className="mt-2 text-sm font-bold text-slate-950">
                    {chantierSelectionne.dateDebut || "Date non renseignée"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              <Button
                onClick={ouvrirEdition}
                variant="secondary"
                fullWidth
              >
                Modifier
              </Button>

              {!chantierSelectionne.archive ? (
                <Button
                  onClick={archiverChantier}
                  variant="warning"
                  fullWidth
                >
                  Archiver
                </Button>
              ) : (
                <Button
                  onClick={restaurerChantier}
                  variant="success"
                  fullWidth
                >
                  Restaurer
                </Button>
              )}

              <Button
                onClick={supprimerChantier}
                variant="danger"
                fullWidth
                className="sm:col-span-2 xl:col-span-1"
              >
                Supprimer
              </Button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white to-sky-50 p-4 shadow-sm transition duration-200 hover:shadow-md">
              <p className="text-sm text-slate-500">Client associé</p>
              <p className="mt-1 break-words text-lg font-semibold">
                {chantierSelectionne.clientNom || "Aucun client associé"}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <p className="text-sm text-slate-500">Adresse</p>
                <p className="mt-1 break-words font-semibold">
                  {chantierSelectionne.adresse || "Non renseignée"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {[chantierSelectionne.codePostal, chantierSelectionne.ville]
                    .filter(Boolean)
                    .join(" · ") || "Coordonnées non renseignées"}
                </p>
              </div>

              <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm transition duration-200 hover:shadow-md">
                <p className="text-sm text-slate-500">Planning</p>
                <p className="mt-1 font-semibold">
                  {chantierSelectionne.dateDebut || "Début non renseigné"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  {chantierSelectionne.dateFin || "Fin non renseignée"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
              <p className="text-sm text-slate-500">Description</p>
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                {chantierSelectionne.description ||
                  "Aucune description pour ce chantier."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
              <p className="text-sm text-slate-500">Notes</p>
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                {chantierSelectionne.notes || "Aucune note pour ce chantier."}
              </p>
            </div>
          </div>
        </>
      );
    }

    return (
      <EmptyState
        className="flex min-h-80 flex-col justify-center"
        icon={<span aria-hidden="true">⌂</span>}
        title="Sélectionne un chantier"
        description="Son planning, son client et ses informations terrain apparaîtront ici."
      />
    );
  };

  return (
    <>
      <ChantiersKpiCards
        totalChantiers={totalChantiers}
        totalPlanifies={totalPlanifies}
        totalEnCours={totalEnCours}
        totalArchives={totalArchives}
      />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card
          className="min-w-0 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-6"
          padding="md"
        >
          <SectionHeader
            eyebrow="Suivi terrain"
            title="Portefeuille chantiers"
            description="Retrouve rapidement le client, le statut et les prochaines dates."
            headingLevel={3}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <input
              aria-label="Rechercher un chantier"
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un chantier, client, ville..."
              className={filtreChantierClasses}
            />

            <select
              aria-label="Filtrer les chantiers par statut"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              className={filtreChantierClasses}
            >
              <option value="Tous">Tous les statuts</option>
              {STATUTS_CHANTIER.map((statut) => (
                <option key={statut} value={statut}>
                  {statut}
                </option>
              ))}
            </select>

            <select
              aria-label="Filtrer les chantiers par archivage"
              value={filtreArchivage}
              onChange={(e) =>
                setFiltreArchivage(e.target.value as FiltreArchivage)
              }
              className={filtreChantierClasses}
            >
              <option value="actifs">Chantiers actifs</option>
              <option value="archives">Chantiers archivés</option>
              <option value="tous">Tous les chantiers</option>
            </select>
          </div>

          <div className="mt-5 space-y-2 overflow-hidden">
            {chantiersFiltres.length === 0 ? (
              <EmptyState
                icon={<span aria-hidden="true">⌂</span>}
                title="Aucun chantier trouvé"
                description="Ajuste les filtres ou crée un nouveau chantier."
                action={
                  <Button variant="accent" onClick={ouvrirCreation}>
                    Nouveau chantier
                  </Button>
                }
              />
            ) : (
              chantiersFiltres.map((chantier) => {
                const estSelectionne = chantier.id === chantierSelectionneId;

                return (
                  <button
                    key={chantier.id}
                    onClick={() => {
                      setModeEdition(false);
                      setAfficherFormulaire(false);
                      setChantierSelectionneId(
                        estSelectionne ? null : chantier.id
                      );
                    }}
                    className={`group block w-full min-w-0 overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${
                      estSelectionne
                        ? "border-orange-300 bg-gradient-to-br from-orange-50 to-white ring-2 ring-orange-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-orange-50/30"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {chantier.reference}
                          </p>

                          <Badge
                            tone={chantier.archive ? "warning" : "success"}
                            dot
                          >
                            {chantier.archive ? "Archivé" : "Actif"}
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
                          {chantier.titre}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {chantier.clientNom || "Sans client"}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <Badge status={chantier.statut} dot>
                          {chantier.statut}
                        </Badge>

                        <p className="mt-2 text-xs text-slate-500">
                          {chantier.ville || "Ville"}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          {chantier.dateDebut || "Sans date"}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <Card
          className="hidden min-w-0 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)] xl:block"
          padding="lg"
        >
          {renderFormulaireOuDetail()}
        </Card>
      </div>

      <MobileFullscreenModal
        open={afficherFormulaireChantier}
        title={titreMobile}
        onClose={fermerFormulaire}
        premium
      >
        {renderFormulaireOuDetail()}
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={!afficherFormulaireChantier && chantierSelectionne !== null}
        title={titreMobile}
        onClose={fermerDetail}
        premium
      >
        {renderFormulaireOuDetail()}
      </MobileFullscreenModal>
    </>
  );
}
