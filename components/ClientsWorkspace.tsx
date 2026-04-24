"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import MobileFullscreenModal from "./MobileFullscreenModal";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import { db } from "../lib/firebase";
import type { Client, TypeClient } from "../types/clients";

type FiltreArchivage = "actifs" | "archives" | "tous";

type Props = {
  entrepriseId?: string;
  createdByUid?: string;
};

type ClientFormState = {
  nom: string;
  typeClient: TypeClient;
  societe: string;
  email: string;
  telephone: string;
  adresse: string;
  codePostal: string;
  ville: string;
  pays: string;
  tva: string;
  notes: string;
};

const creerFormulaireVide = (): ClientFormState => ({
  nom: "",
  typeClient: "Particulier",
  societe: "",
  email: "",
  telephone: "",
  adresse: "",
  codePostal: "",
  ville: "",
  pays: "Belgique",
  tva: "",
  notes: "",
});

const TYPES_CLIENT: TypeClient[] = ["Particulier", "Professionnel"];

const champFormulaireClasses =
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

function genererReferenceClient(clients: Client[]) {
  const plusGrandNumero = clients.reduce((max, client) => {
    const match = client.reference?.match(/CLI-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `CLI-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

export default function ClientsWorkspace({
  entrepriseId,
  createdByUid,
}: Props) {
  const [recherche, setRecherche] = useState("");
  const [filtreArchivage, setFiltreArchivage] =
    useState<FiltreArchivage>("actifs");
  const [clientSelectionneId, setClientSelectionneId] = useState<string | null>(
    null
  );
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [formulaire, setFormulaire] = useState<ClientFormState>(
    creerFormulaireVide()
  );

  const { clients, chargement } = useEntrepriseClients({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const clientsFiltres = useMemo(() => {
    const valeur = recherche.trim().toLowerCase();

    return clients.filter((client) => {
      const texte = [
        client.reference ?? "",
        client.nom ?? "",
        client.societe ?? "",
        client.email ?? "",
        client.telephone ?? "",
        client.ville ?? "",
        client.typeClient ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchRecherche = !valeur || texte.includes(valeur);

      const estArchive = client.archive === true;
      const matchArchivage =
        filtreArchivage === "tous"
          ? true
          : filtreArchivage === "archives"
          ? estArchive
          : !estArchive;

      return matchRecherche && matchArchivage;
    });
  }, [clients, recherche, filtreArchivage]);

  const clientSelectionne = useMemo(() => {
    if (!clientSelectionneId) {
      return null;
    }

    return (
      clientsFiltres.find((client) => client.id === clientSelectionneId) ?? null
    );
  }, [clientsFiltres, clientSelectionneId]);

  const totalClients = useMemo(
    () => clients.filter((client) => !client.archive).length,
    [clients]
  );

  const totalClientsArchives = useMemo(
    () => clients.filter((client) => client.archive).length,
    [clients]
  );

  const totalPros = useMemo(
    () =>
      clients.filter(
        (client) => client.typeClient === "Professionnel" && !client.archive
      ).length,
    [clients]
  );

  const totalParticuliers = useMemo(
    () =>
      clients.filter(
        (client) => client.typeClient === "Particulier" && !client.archive
      ).length,
    [clients]
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
    setClientSelectionneId(null);
    setModeEdition(false);
  };

  const ouvrirEdition = () => {
    if (!clientSelectionne) return;

    setFormulaire({
      nom: clientSelectionne.nom,
      typeClient: clientSelectionne.typeClient,
      societe: clientSelectionne.societe,
      email: clientSelectionne.email,
      telephone: clientSelectionne.telephone,
      adresse: clientSelectionne.adresse,
      codePostal: clientSelectionne.codePostal,
      ville: clientSelectionne.ville,
      pays: clientSelectionne.pays,
      tva: clientSelectionne.tva,
      notes: clientSelectionne.notes,
    });

    setModeEdition(true);
    setAfficherFormulaire(false);
  };

  useEffect(() => {
    const handleNouveauClient = () => {
      ouvrirCreation();
    };

    window.addEventListener("batiflow:nouveau-client", handleNouveauClient);

    return () => {
      window.removeEventListener("batiflow:nouveau-client", handleNouveauClient);
    };
  }, []);

  const enregistrerClient = async () => {
    if (!entrepriseId || !createdByUid) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return;
    }

    if (!formulaire.nom.trim()) {
      alert("Le nom du client est obligatoire.");
      return;
    }

    const maintenant = Date.now();

    try {
      setSauvegardeEnCours(true);

      if (modeEdition && clientSelectionne) {
        await updateDoc(doc(db, "clients", clientSelectionne.id), {
          ...clientSelectionne,
          nom: formulaire.nom.trim(),
          typeClient: formulaire.typeClient,
          societe: formulaire.societe.trim(),
          email: formulaire.email.trim(),
          telephone: formulaire.telephone.trim(),
          adresse: formulaire.adresse.trim(),
          codePostal: formulaire.codePostal.trim(),
          ville: formulaire.ville.trim(),
          pays: formulaire.pays.trim(),
          tva: formulaire.tva.trim(),
          notes: formulaire.notes.trim(),
          updatedAt: maintenant,
        });

        setModeEdition(false);
        resetFormulaire();
        return;
      }

      const nouvelId = `${entrepriseId}-cli-${maintenant}`;
      const reference = genererReferenceClient(clients);

      const nouveauClient: Client = {
        id: nouvelId,
        reference,
        nom: formulaire.nom.trim(),
        typeClient: formulaire.typeClient,
        societe: formulaire.societe.trim(),
        email: formulaire.email.trim(),
        telephone: formulaire.telephone.trim(),
        adresse: formulaire.adresse.trim(),
        codePostal: formulaire.codePostal.trim(),
        ville: formulaire.ville.trim(),
        pays: formulaire.pays.trim(),
        tva: formulaire.tva.trim(),
        notes: formulaire.notes.trim(),
        entrepriseId,
        createdByUid,
        archive: false,
        createdAt: maintenant,
        updatedAt: maintenant,
      };

      await setDoc(doc(db, "clients", nouvelId), nouveauClient);

      setClientSelectionneId(nouvelId);
      setAfficherFormulaire(false);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur enregistrement client :", error);
      alert("Impossible d’enregistrer le client.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverClient = async () => {
    if (!clientSelectionne) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "clients", clientSelectionne.id), {
        ...clientSelectionne,
        archive: true,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur archivage client :", error);
      alert("Impossible d’archiver le client.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const restaurerClient = async () => {
    if (!clientSelectionne) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "clients", clientSelectionne.id), {
        ...clientSelectionne,
        archive: false,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur restauration client :", error);
      alert("Impossible de restaurer le client.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimerClient = async () => {
    if (!clientSelectionne) return;

    const confirmation = window.confirm(
      `Supprimer définitivement le client ${clientSelectionne.nom} ?`
    );

    if (!confirmation) return;

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(doc(db, "clients", clientSelectionne.id));
      setClientSelectionneId(null);
      setModeEdition(false);
      setAfficherFormulaire(false);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur suppression client :", error);
      alert("Impossible de supprimer le client.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const afficherFormulaireClient = afficherFormulaire || modeEdition;

  const titreMobile = afficherFormulaireClient
    ? modeEdition && clientSelectionne
      ? clientSelectionne.reference
      : "Nouveau client"
    : clientSelectionne
    ? clientSelectionne.nom
    : "Client";

  const renderFormulaireOuDetail = () => {
    if (chargement) {
      return (
        <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
          Chargement des clients...
        </div>
      );
    }

    if (afficherFormulaireClient) {
      return (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-sm text-slate-500">
                {modeEdition ? "Édition client" : "Nouveau client"}
              </p>
              <h3 className="mt-1 text-xl font-bold sm:text-2xl">
                {modeEdition && clientSelectionne
                  ? clientSelectionne.reference
                  : "Créer une fiche client"}
              </h3>
            </div>

            <button
              onClick={fermerFormulaire}
              className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 sm:w-auto"
            >
              Fermer
            </button>
          </div>

          <div className="mt-6 grid min-w-0 max-w-full gap-4 md:grid-cols-2">
            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Nom du client
              </label>
              <input
                type="text"
                value={formulaire.nom}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    nom: e.target.value,
                  }))
                }
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Type
              </label>
              <select
                value={formulaire.typeClient}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    typeClient: e.target.value as TypeClient,
                  }))
                }
                className={champFormulaireClasses}
              >
                {TYPES_CLIENT.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Société
              </label>
              <input
                type="text"
                value={formulaire.societe}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    societe: e.target.value,
                  }))
                }
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                TVA
              </label>
              <input
                type="text"
                value={formulaire.tva}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    tva: e.target.value,
                  }))
                }
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Email
              </label>
              <input
                type="email"
                value={formulaire.email}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    email: e.target.value,
                  }))
                }
                className={champFormulaireClasses}
              />
            </div>

            <div className="min-w-0 overflow-hidden">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Téléphone
              </label>
              <input
                type="text"
                value={formulaire.telephone}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    telephone: e.target.value,
                  }))
                }
                className={champFormulaireClasses}
              />
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

            <div className="min-w-0 overflow-hidden md:col-span-2 lg:max-w-xs">
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Pays
              </label>
              <input
                type="text"
                value={formulaire.pays}
                onChange={(e) =>
                  setFormulaire((prev) => ({
                    ...prev,
                    pays: e.target.value,
                  }))
                }
                className={champFormulaireClasses}
              />
            </div>
          </div>

          <div className="mt-4 min-w-0 overflow-hidden">
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
              rows={5}
              className={champFormulaireClasses}
            />
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={enregistrerClient}
              disabled={sauvegardeEnCours}
              className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {sauvegardeEnCours
                ? "Enregistrement..."
                : modeEdition
                ? "Enregistrer les modifications"
                : "Créer le client"}
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

    if (clientSelectionne) {
      return (
        <>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-sm text-slate-500">Fiche client</p>
                <h3 className="mt-1 break-words text-xl font-bold sm:text-2xl">
                  {clientSelectionne.nom}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  {clientSelectionne.reference}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                    clientSelectionne.archive
                      ? "bg-amber-100 text-amber-800"
                      : "bg-emerald-100 text-emerald-700"
                  }`}
                >
                  {clientSelectionne.archive ? "Archivé" : "Actif"}
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

              {!clientSelectionne.archive ? (
                <button
                  onClick={archiverClient}
                  className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                >
                  Archiver
                </button>
              ) : (
                <button
                  onClick={restaurerClient}
                  className="w-full rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                >
                  Restaurer
                </button>
              )}

              <button
                onClick={supprimerClient}
                className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:col-span-2 xl:col-span-1"
              >
                Supprimer
              </button>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Type</p>
              <p className="mt-1 text-lg font-semibold">
                {clientSelectionne.typeClient}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Société</p>
                <p className="mt-1 break-words font-semibold">
                  {clientSelectionne.societe || "Non renseignée"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">TVA</p>
                <p className="mt-1 break-words font-semibold">
                  {clientSelectionne.tva || "Non renseignée"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 break-all font-semibold">
                  {clientSelectionne.email || "Non renseigné"}
                </p>
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="mt-1 break-words font-semibold">
                  {clientSelectionne.telephone || "Non renseigné"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Adresse</p>
              <p className="mt-1 break-words font-semibold">
                {clientSelectionne.adresse || "Non renseignée"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                {[
                  clientSelectionne.codePostal,
                  clientSelectionne.ville,
                  clientSelectionne.pays,
                ]
                  .filter(Boolean)
                  .join(" · ") || "Coordonnées non renseignées"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Notes</p>
              <p className="mt-2 whitespace-pre-line break-words text-sm leading-6 text-slate-700">
                {clientSelectionne.notes || "Aucune note pour ce client."}
              </p>
            </div>
          </div>
        </>
      );
    }

    return (
      <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
        Sélectionne un client pour voir sa fiche.
      </div>
    );
  };

  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Clients actifs
              </p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {totalClients}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
              👥
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Base client exploitable
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Professionnels
              </p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {totalPros}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg">
              🏢
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Entreprises et indépendants
          </p>
        </div>

        <div className="overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Particuliers
              </p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {totalParticuliers}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-lg">
              🏠
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Clients résidentiels
          </p>
        </div>

        <div className="col-span-2 overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-500 sm:text-sm">
                Archivés
              </p>
              <p className="mt-2 text-2xl font-bold sm:text-3xl">
                {totalClientsArchives}
              </p>
            </div>

            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-lg">
              📦
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            Clients conservés hors liste active
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
              placeholder="Rechercher un client, email, société..."
              className={champFormulaireClasses}
            />

            <select
              value={filtreArchivage}
              onChange={(e) =>
                setFiltreArchivage(e.target.value as FiltreArchivage)
              }
              className={champFormulaireClasses}
            >
              <option value="actifs">Clients actifs</option>
              <option value="archives">Clients archivés</option>
              <option value="tous">Tous les clients</option>
            </select>
          </div>

          <div className="mt-6 space-y-2 overflow-hidden">
            {clientsFiltres.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Aucun client trouvé.
              </div>
            ) : (
              clientsFiltres.map((client) => {
                const estSelectionne = client.id === clientSelectionneId;

                return (
                  <button
                    key={client.id}
                    onClick={() => {
                      setModeEdition(false);
                      setAfficherFormulaire(false);
                      setClientSelectionneId(estSelectionne ? null : client.id);
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
                            {client.reference}
                          </p>

                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                              client.archive
                                ? "bg-amber-100 text-amber-800"
                                : "bg-emerald-100 text-emerald-700"
                            }`}
                          >
                            {client.archive ? "Archivé" : "Actif"}
                          </span>
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
                          {client.nom}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-400">
                          {client.societe || client.typeClient}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-500">
                          {client.ville || "Ville"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {client.telephone || "Téléphone"}
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
        open={afficherFormulaireClient}
        title={titreMobile}
        onClose={fermerFormulaire}
      >
        <div className="max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          {renderFormulaireOuDetail()}
        </div>
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={!afficherFormulaireClient && clientSelectionne !== null}
        title={titreMobile}
        onClose={fermerDetail}
      >
        <div className="max-w-full overflow-hidden rounded-2xl bg-white p-4 shadow-sm sm:p-5 md:p-6">
          {renderFormulaireOuDetail()}
        </div>
      </MobileFullscreenModal>
    </>
  );
}