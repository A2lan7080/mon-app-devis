"use client";

import { useEffect, useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import ClientsKpiCards from "./ClientsKpiCards";
import MobileFullscreenModal from "./MobileFullscreenModal";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import Card from "./ui/Card";
import ConfirmDialog from "./ui/ConfirmDialog";
import EmptyState from "./ui/EmptyState";
import SectionHeader from "./ui/SectionHeader";
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
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition duration-200 hover:border-slate-300 focus:border-orange-400 focus:ring-4 focus:ring-orange-100";

const filtreClientClasses =
  "block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-900/[0.02] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

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
  const [confirmationSuppressionOuverte, setConfirmationSuppressionOuverte] =
    useState(false);
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

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(doc(db, "clients", clientSelectionne.id));
      setClientSelectionneId(null);
      setModeEdition(false);
      setAfficherFormulaire(false);
      setConfirmationSuppressionOuverte(false);
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
          <SectionHeader
            eyebrow={modeEdition ? "Édition client" : "Nouveau client"}
            title={
              modeEdition && clientSelectionne
                ? clientSelectionne.reference
                : "Créer une fiche client"
            }
            description="Renseigne les coordonnées utiles aux devis, factures et chantiers."
            headingLevel={3}
            actions={
              <Button variant="secondary" onClick={fermerFormulaire}>
                Fermer
              </Button>
            }
          />

          <div className="mt-7 grid min-w-0 max-w-full gap-5 md:grid-cols-2">
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
              rows={5}
              className={champFormulaireClasses}
            />
          </div>

          <div className="mt-7 flex flex-col gap-3 border-t border-slate-100 pt-5 sm:flex-row">
            <Button
              onClick={enregistrerClient}
              disabled={sauvegardeEnCours}
              loading={sauvegardeEnCours}
              loadingLabel="Enregistrement..."
              variant="accent"
              className="w-full sm:w-auto"
            >
              {modeEdition
                ? "Enregistrer les modifications"
                : "Créer le client"}
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

    if (clientSelectionne) {
      return (
        <>
          <div className="flex flex-col gap-4">
            <div className="relative overflow-hidden rounded-[1.5rem] border border-sky-200 bg-gradient-to-br from-white via-white to-sky-50 p-5 shadow-[0_18px_44px_rgba(15,23,42,0.10)]">
              <span
                aria-hidden="true"
                className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/12 blur-3xl"
              />
              <span
                aria-hidden="true"
                className="absolute -bottom-20 left-1/3 h-36 w-36 rounded-full bg-sky-500/12 blur-3xl"
              />

              <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.12em] text-orange-600">
                    Fiche client
                  </p>
                  <h3 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">
                    {clientSelectionne.nom}
                  </h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {clientSelectionne.reference} · {clientSelectionne.typeClient}
                  </p>
                </div>

                <Badge
                  tone={clientSelectionne.archive ? "warning" : "success"}
                  dot
                >
                  {clientSelectionne.archive ? "Archivé" : "Actif"}
                </Badge>
              </div>

              <div className="relative mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-sky-200 bg-white/80 p-4 shadow-sm">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-slate-500">
                    Contact
                  </p>
                  <p className="mt-2 break-all text-sm font-bold text-slate-950">
                    {clientSelectionne.email || "Email non renseigné"}
                  </p>
                </div>
                <div className="rounded-2xl border border-orange-200 bg-orange-50/70 p-4 shadow-sm">
                  <p className="text-[0.68rem] font-bold uppercase tracking-[0.1em] text-orange-700">
                    Localisation
                  </p>
                  <p className="mt-2 break-words text-sm font-bold text-slate-950">
                    {clientSelectionne.ville || "Ville non renseignée"}
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

              {!clientSelectionne.archive ? (
                <Button
                  onClick={archiverClient}
                  variant="warning"
                  fullWidth
                >
                  Archiver
                </Button>
              ) : (
                <Button
                  onClick={restaurerClient}
                  variant="success"
                  fullWidth
                >
                  Restaurer
                </Button>
              )}

              <Button
                onClick={() => setConfirmationSuppressionOuverte(true)}
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
              <p className="text-sm text-slate-500">Type</p>
              <p className="mt-1 text-lg font-semibold">
                {clientSelectionne.typeClient}
              </p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <p className="text-sm text-slate-500">Société</p>
                <p className="mt-1 break-words font-semibold">
                  {clientSelectionne.societe || "Non renseignée"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <p className="text-sm text-slate-500">TVA</p>
                <p className="mt-1 break-words font-semibold">
                  {clientSelectionne.tva || "Non renseignée"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <p className="text-sm text-slate-500">Email</p>
                <p className="mt-1 break-all font-semibold">
                  {clientSelectionne.email || "Non renseigné"}
                </p>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition duration-200 hover:border-slate-300 hover:shadow-md">
                <p className="text-sm text-slate-500">Téléphone</p>
                <p className="mt-1 break-words font-semibold">
                  {clientSelectionne.telephone || "Non renseigné"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-orange-200 bg-orange-50/50 p-4 shadow-sm">
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

            <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-4">
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
      <EmptyState
        className="flex min-h-80 flex-col justify-center"
        icon={<span aria-hidden="true">👤</span>}
        title="Sélectionne un client"
        description="Sa fiche, ses coordonnées et ses actions apparaîtront ici."
      />
    );
  };

  return (
    <>
      <ClientsKpiCards
        totalClients={totalClients}
        totalPros={totalPros}
        totalParticuliers={totalParticuliers}
        totalArchives={totalClientsArchives}
      />

      <div className="grid gap-4 lg:gap-6 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.05fr)]">
        <Card
          className="min-w-0 overflow-hidden shadow-[0_12px_30px_rgba(15,23,42,0.06)] md:p-6"
          padding="md"
        >
          <SectionHeader
            eyebrow="Carnet clients"
            title="Répertoire clients"
            description="Retrouve rapidement les coordonnées utiles à tes documents et chantiers."
            headingLevel={3}
          />

          <div className="mt-5 grid gap-3 sm:grid-cols-[minmax(0,1.4fr)_minmax(0,0.8fr)]">
            <input
              aria-label="Rechercher un client"
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher un client, email, société..."
              className={filtreClientClasses}
            />

            <select
              aria-label="Filtrer les clients par archivage"
              value={filtreArchivage}
              onChange={(e) =>
                setFiltreArchivage(e.target.value as FiltreArchivage)
              }
              className={filtreClientClasses}
            >
              <option value="actifs">Clients actifs</option>
              <option value="archives">Clients archivés</option>
              <option value="tous">Tous les clients</option>
            </select>
          </div>

          <div className="mt-5 space-y-2 overflow-hidden">
            {clientsFiltres.length === 0 ? (
              <EmptyState
                icon={<span aria-hidden="true">👤</span>}
                title={
                  clients.length === 0
                    ? "Aucun client pour le moment"
                    : "Aucun client trouvé"
                }
                description={
                  clients.length === 0
                    ? "Ajoute ton premier client pour réutiliser ses coordonnées dans les devis et factures."
                    : "Ajuste les filtres ou lance une nouvelle fiche client."
                }
                action={
                  <Button variant="accent" onClick={ouvrirCreation}>
                    {clients.length === 0 ? "Ajouter un client" : "Nouveau client"}
                  </Button>
                }
              />
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
                    className={`group block w-full min-w-0 overflow-hidden rounded-2xl border px-4 py-3.5 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${
                      estSelectionne
                        ? "border-sky-300 bg-gradient-to-br from-sky-50 to-white ring-2 ring-sky-100"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-sky-50/40"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex min-w-0 flex-wrap items-center gap-2">
                          <p className="truncate text-sm font-semibold text-slate-900">
                            {client.reference}
                          </p>

                          <Badge
                            tone={client.archive ? "warning" : "success"}
                            dot
                          >
                            {client.archive ? "Archivé" : "Actif"}
                          </Badge>
                        </div>

                        <p className="mt-1 truncate text-sm font-medium text-slate-700">
                          {client.nom}
                        </p>

                        <p className="mt-1 truncate text-xs text-slate-500">
                          {client.societe || client.typeClient}
                        </p>
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-xs text-slate-500">
                          {client.ville || "Ville"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {client.telephone || "Téléphone"}
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
        open={afficherFormulaireClient}
        title={titreMobile}
        onClose={fermerFormulaire}
        premium
      >
        {renderFormulaireOuDetail()}
      </MobileFullscreenModal>

      <MobileFullscreenModal
        open={!afficherFormulaireClient && clientSelectionne !== null}
        title={titreMobile}
        onClose={fermerDetail}
        premium
      >
        {renderFormulaireOuDetail()}
      </MobileFullscreenModal>

      <ConfirmDialog
        open={confirmationSuppressionOuverte}
        title="Supprimer ce client ?"
        description={`Le client « ${clientSelectionne?.nom ?? ""} » sera supprimé définitivement. Cette action est irréversible.`}
        confirmLabel="Supprimer définitivement"
        loading={sauvegardeEnCours}
        onCancel={() => setConfirmationSuppressionOuverte(false)}
        onConfirm={() => void supprimerClient()}
      />
    </>
  );
}
