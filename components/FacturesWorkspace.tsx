"use client";

import { useMemo, useState } from "react";
import { deleteDoc, doc, setDoc, updateDoc } from "firebase/firestore";
import { useEntrepriseChantiers } from "../hooks/useEntrepriseChantiers";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import { useEntrepriseFactures } from "../hooks/useEntrepriseFactures";
import { db } from "../lib/firebase";
import { formatMontant } from "../lib/devis-helpers";
import type { Facture, StatutFacture } from "../types/factures";

type FiltreArchivage = "actifs" | "archives" | "tous";
type FiltreStatut = "Tous" | StatutFacture;

type Props = {
  entrepriseId?: string;
  createdByUid?: string;
};

type FactureFormState = {
  objet: string;
  clientId: string;
  chantierId: string;
  dateEmission: string;
  dateEcheance: string;
  datePaiement: string;
  statut: StatutFacture;
  montantHt: string;
  tvaTaux: string;
  acompteDeduit: string;
  notes: string;
};

const STATUTS_FACTURE: StatutFacture[] = [
  "Brouillon",
  "Envoyée",
  "Payée",
  "En retard",
  "Annulée",
];

const creerFormulaireVide = (): FactureFormState => ({
  objet: "",
  clientId: "",
  chantierId: "",
  dateEmission: "",
  dateEcheance: "",
  datePaiement: "",
  statut: "Brouillon",
  montantHt: "0",
  tvaTaux: "21",
  acompteDeduit: "0",
  notes: "",
});

function genererReferenceFacture(factures: Facture[]) {
  const plusGrandNumero = factures.reduce((max, facture) => {
    const match = facture.reference?.match(/FA-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `FA-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

function convertirNombre(valeur: string) {
  const normalisee = valeur.replace(",", ".");
  const nombre = Number(normalisee);

  if (!Number.isFinite(nombre)) {
    return 0;
  }

  return nombre;
}

function calculerMontantTva(facture: {
  montantHt: number;
  tvaTaux: number;
}) {
  return facture.montantHt * (facture.tvaTaux / 100);
}

function calculerTotalTtc(facture: {
  montantHt: number;
  tvaTaux: number;
}) {
  return facture.montantHt + calculerMontantTva(facture);
}

function calculerNetAPayer(facture: {
  montantHt: number;
  tvaTaux: number;
  acompteDeduit: number;
}) {
  return calculerTotalTtc(facture) - facture.acompteDeduit;
}

function getStatutClasses(statut: StatutFacture) {
  switch (statut) {
    case "Brouillon":
      return "bg-slate-100 text-slate-700";
    case "Envoyée":
      return "bg-blue-100 text-blue-700";
    case "Payée":
      return "bg-emerald-100 text-emerald-700";
    case "En retard":
      return "bg-red-100 text-red-700";
    case "Annulée":
      return "bg-amber-100 text-amber-800";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function FacturesWorkspace({
  entrepriseId,
  createdByUid,
}: Props) {
  const [recherche, setRecherche] = useState("");
  const [filtreArchivage, setFiltreArchivage] =
    useState<FiltreArchivage>("actifs");
  const [filtreStatut, setFiltreStatut] = useState<FiltreStatut>("Tous");
  const [factureSelectionneeId, setFactureSelectionneeId] = useState<
    string | null
  >(null);
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);
  const [modeEdition, setModeEdition] = useState(false);
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [formulaire, setFormulaire] = useState<FactureFormState>(
    creerFormulaireVide()
  );

  const { factures, chargement } = useEntrepriseFactures({
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

  const { chantiers } = useEntrepriseChantiers({
    authChargee: true,
    userId: createdByUid ?? null,
    entrepriseIdCourante: entrepriseId ?? null,
    estAdmin: true,
  });

  const facturesFiltrees = useMemo(() => {
    const valeur = recherche.trim().toLowerCase();

    return factures.filter((facture) => {
      const texte = [
        facture.reference ?? "",
        facture.objet ?? "",
        facture.clientNom ?? "",
        facture.chantierTitre ?? "",
        facture.statut ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchRecherche = !valeur || texte.includes(valeur);
      const matchStatut =
        filtreStatut === "Tous" ? true : facture.statut === filtreStatut;

      const estArchive = facture.archive === true;
      const matchArchivage =
        filtreArchivage === "tous"
          ? true
          : filtreArchivage === "archives"
          ? estArchive
          : !estArchive;

      return matchRecherche && matchStatut && matchArchivage;
    });
  }, [factures, recherche, filtreStatut, filtreArchivage]);

  const factureSelectionnee = useMemo(() => {
    if (facturesFiltrees.length === 0) return null;

    if (!factureSelectionneeId) {
      return facturesFiltrees[0];
    }

    return (
      facturesFiltrees.find(
        (facture) => facture.id === factureSelectionneeId
      ) ?? null
    );
  }, [facturesFiltrees, factureSelectionneeId]);

  const totalFactures = useMemo(
    () => factures.filter((facture) => !facture.archive).length,
    [factures]
  );

  const totalPayees = useMemo(
    () =>
      factures.filter(
        (facture) => facture.statut === "Payée" && !facture.archive
      ).length,
    [factures]
  );

  const totalRetard = useMemo(
    () =>
      factures.filter(
        (facture) => facture.statut === "En retard" && !facture.archive
      ).length,
    [factures]
  );

  const totalNetFacture = useMemo(
    () =>
      factures
        .filter((facture) => !facture.archive && facture.statut !== "Annulée")
        .reduce((total, facture) => total + calculerNetAPayer(facture), 0),
    [factures]
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

  const ouvrirEdition = () => {
    if (!factureSelectionnee) return;

    setFormulaire({
      objet: factureSelectionnee.objet,
      clientId: factureSelectionnee.clientId,
      chantierId: factureSelectionnee.chantierId,
      dateEmission: factureSelectionnee.dateEmission,
      dateEcheance: factureSelectionnee.dateEcheance,
      datePaiement: factureSelectionnee.datePaiement,
      statut: factureSelectionnee.statut,
      montantHt: String(factureSelectionnee.montantHt),
      tvaTaux: String(factureSelectionnee.tvaTaux),
      acompteDeduit: String(factureSelectionnee.acompteDeduit),
      notes: factureSelectionnee.notes,
    });

    setModeEdition(true);
    setAfficherFormulaire(false);
  };

  const enregistrerFacture = async () => {
    if (!entrepriseId || !createdByUid) {
      alert("Impossible d’identifier l’entreprise ou l’utilisateur.");
      return;
    }

    if (!formulaire.objet.trim()) {
      alert("L’objet de la facture est obligatoire.");
      return;
    }

    if (!formulaire.clientId) {
      alert("Sélectionne un client.");
      return;
    }

    if (!formulaire.dateEmission) {
      alert("La date d’émission est obligatoire.");
      return;
    }

    const clientAssocie =
      clients.find((client) => client.id === formulaire.clientId) ?? null;

    if (!clientAssocie) {
      alert("Le client sélectionné est introuvable.");
      return;
    }

    const chantierAssocie =
      chantiers.find((chantier) => chantier.id === formulaire.chantierId) ??
      null;

    const montantHt = convertirNombre(formulaire.montantHt);
    const tvaTaux = convertirNombre(formulaire.tvaTaux);
    const acompteDeduit = convertirNombre(formulaire.acompteDeduit);

    if (montantHt < 0 || tvaTaux < 0 || acompteDeduit < 0) {
      alert("Les montants doivent être valides.");
      return;
    }

    const maintenant = Date.now();

    try {
      setSauvegardeEnCours(true);

      if (modeEdition && factureSelectionnee) {
        await updateDoc(doc(db, "factures", factureSelectionnee.id), {
          ...factureSelectionnee,
          objet: formulaire.objet.trim(),
          clientId: clientAssocie.id,
          clientNom: clientAssocie.nom,
          chantierId: chantierAssocie?.id ?? "",
          chantierTitre: chantierAssocie?.titre ?? "",
          dateEmission: formulaire.dateEmission,
          dateEcheance: formulaire.dateEcheance,
          datePaiement: formulaire.datePaiement,
          statut: formulaire.statut,
          montantHt,
          tvaTaux,
          acompteDeduit,
          notes: formulaire.notes.trim(),
          updatedAt: maintenant,
        });

        setModeEdition(false);
        resetFormulaire();
        return;
      }

      const nouvelId = `${entrepriseId}-fa-${maintenant}`;
      const reference = genererReferenceFacture(factures);

      const nouvelleFacture: Facture = {
        id: nouvelId,
        reference,
        objet: formulaire.objet.trim(),
        clientId: clientAssocie.id,
        clientNom: clientAssocie.nom,
        chantierId: chantierAssocie?.id ?? "",
        chantierTitre: chantierAssocie?.titre ?? "",
        dateEmission: formulaire.dateEmission,
        dateEcheance: formulaire.dateEcheance,
        datePaiement: formulaire.datePaiement,
        statut: formulaire.statut,
        montantHt,
        tvaTaux,
        acompteDeduit,
        notes: formulaire.notes.trim(),
        entrepriseId,
        createdByUid,
        archive: false,
        createdAt: maintenant,
        updatedAt: maintenant,
      };

      await setDoc(doc(db, "factures", nouvelId), nouvelleFacture);

      setFactureSelectionneeId(nouvelId);
      setAfficherFormulaire(false);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur enregistrement facture :", error);
      alert("Impossible d’enregistrer la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const archiverFacture = async () => {
    if (!factureSelectionnee) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "factures", factureSelectionnee.id), {
        ...factureSelectionnee,
        archive: true,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur archivage facture :", error);
      alert("Impossible d’archiver la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const restaurerFacture = async () => {
    if (!factureSelectionnee) return;

    try {
      setSauvegardeEnCours(true);
      await updateDoc(doc(db, "factures", factureSelectionnee.id), {
        ...factureSelectionnee,
        archive: false,
        updatedAt: Date.now(),
      });
    } catch (error) {
      console.error("Erreur restauration facture :", error);
      alert("Impossible de restaurer la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const supprimerFacture = async () => {
    if (!factureSelectionnee) return;

    const confirmation = window.confirm(
      `Supprimer définitivement la facture ${factureSelectionnee.reference} ?`
    );

    if (!confirmation) return;

    try {
      setSauvegardeEnCours(true);
      await deleteDoc(doc(db, "factures", factureSelectionnee.id));
      setFactureSelectionneeId(null);
      setModeEdition(false);
      setAfficherFormulaire(false);
      resetFormulaire();
    } catch (error) {
      console.error("Erreur suppression facture :", error);
      alert("Impossible de supprimer la facture.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  const afficherFormulaireFacture = afficherFormulaire || modeEdition;

  const totalTvaSelectionnee = factureSelectionnee
    ? calculerMontantTva(factureSelectionnee)
    : 0;
  const totalTtcSelectionnee = factureSelectionnee
    ? calculerTotalTtc(factureSelectionnee)
    : 0;
  const netAPayerSelectionnee = factureSelectionnee
    ? calculerNetAPayer(factureSelectionnee)
    : 0;

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm text-slate-500">
            Gère les factures de ton entreprise.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            {chargement
              ? "Chargement des factures..."
              : `${factures.length} facture${factures.length > 1 ? "s" : ""} chargée${
                  factures.length > 1 ? "s" : ""
                }`}
          </p>
        </div>

        <button
          onClick={afficherFormulaireFacture ? fermerFormulaire : ouvrirCreation}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          {afficherFormulaireFacture ? "Fermer" : "Nouvelle facture"}
        </button>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Factures actives</p>
          <p className="mt-2 text-3xl font-bold">{totalFactures}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Payées</p>
          <p className="mt-2 text-3xl font-bold">{totalPayees}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">En retard</p>
          <p className="mt-2 text-3xl font-bold">{totalRetard}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Net facturé</p>
          <p className="mt-2 text-3xl font-bold">
            {formatMontant(totalNetFacture)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(420px,1fr)]">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_220px]">
            <input
              type="text"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              placeholder="Rechercher une facture, client, chantier..."
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            />

            <select
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="Tous">Tous les statuts</option>
              {STATUTS_FACTURE.map((statut) => (
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
              className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
            >
              <option value="actifs">Factures actives</option>
              <option value="archives">Factures archivées</option>
              <option value="tous">Toutes les factures</option>
            </select>
          </div>

          <div className="mt-6 space-y-3">
            {facturesFiltrees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                Aucune facture trouvée.
              </div>
            ) : (
              facturesFiltrees.map((facture) => (
                <button
                  key={facture.id}
                  onClick={() => {
                    setFactureSelectionneeId(facture.id);
                    setModeEdition(false);
                    setAfficherFormulaire(false);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition ${
                    factureSelectionnee?.id === facture.id
                      ? "border-slate-900 bg-slate-50"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm text-slate-500">{facture.reference}</p>
                      <h3 className="mt-1 text-base font-semibold text-slate-900">
                        {facture.objet}
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        {facture.clientNom}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                          facture.statut
                        )}`}
                      >
                        {facture.statut}
                      </span>

                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ${
                          facture.archive
                            ? "bg-amber-100 text-amber-800"
                            : "bg-emerald-100 text-emerald-700"
                        }`}
                      >
                        {facture.archive ? "Archivée" : "Active"}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 space-y-1 text-sm text-slate-600">
                    <p>{facture.chantierTitre || "Sans chantier associé"}</p>
                    <p>
                      Émission : {facture.dateEmission || "Non renseignée"}
                    </p>
                    <p className="font-semibold text-slate-900">
                      {formatMontant(calculerNetAPayer(facture))}
                    </p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          {chargement ? (
            <div className="flex min-h-80 items-center justify-center text-sm text-slate-500">
              Chargement des factures...
            </div>
          ) : afficherFormulaireFacture ? (
            <>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-500">
                    {modeEdition ? "Édition facture" : "Nouvelle facture"}
                  </p>
                  <h3 className="mt-1 text-2xl font-bold">
                    {modeEdition && factureSelectionnee
                      ? factureSelectionnee.reference
                      : "Créer une facture"}
                  </h3>
                </div>

                <button
                  onClick={fermerFormulaire}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Fermer
                </button>
              </div>

              <div className="mt-6 grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Objet
                  </label>
                  <input
                    type="text"
                    value={formulaire.objet}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        objet: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Client
                  </label>
                  <select
                    value={formulaire.clientId}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        clientId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="">Sélectionner un client</option>
                    {clients
                      .filter((client) => !client.archive)
                      .map((client) => (
                        <option key={client.id} value={client.id}>
                          {client.nom}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Chantier lié
                  </label>
                  <select
                    value={formulaire.chantierId}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        chantierId: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    <option value="">Aucun chantier lié</option>
                    {chantiers
                      .filter((chantier) => !chantier.archive)
                      .map((chantier) => (
                        <option key={chantier.id} value={chantier.id}>
                          {chantier.titre}
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date émission
                  </label>
                  <input
                    type="date"
                    value={formulaire.dateEmission}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        dateEmission: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date échéance
                  </label>
                  <input
                    type="date"
                    value={formulaire.dateEcheance}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        dateEcheance: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Date paiement
                  </label>
                  <input
                    type="date"
                    value={formulaire.datePaiement}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        datePaiement: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
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
                        statut: e.target.value as StatutFacture,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  >
                    {STATUTS_FACTURE.map((statut) => (
                      <option key={statut} value={statut}>
                        {statut}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Montant HT
                  </label>
                  <input
                    type="number"
                    value={formulaire.montantHt}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        montantHt: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    TVA (%)
                  </label>
                  <input
                    type="number"
                    value={formulaire.tvaTaux}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        tvaTaux: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Acompte déduit
                  </label>
                  <input
                    type="number"
                    value={formulaire.acompteDeduit}
                    onChange={(e) =>
                      setFormulaire((prev) => ({
                        ...prev,
                        acompteDeduit: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>
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
                  rows={5}
                  className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                />
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={enregistrerFacture}
                  disabled={sauvegardeEnCours}
                  className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {sauvegardeEnCours
                    ? "Enregistrement..."
                    : modeEdition
                    ? "Enregistrer les modifications"
                    : "Créer la facture"}
                </button>

                <button
                  onClick={fermerFormulaire}
                  disabled={sauvegardeEnCours}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Annuler
                </button>
              </div>
            </>
          ) : factureSelectionnee ? (
            <>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm text-slate-500">Fiche facture</p>
                  <h3 className="mt-1 text-2xl font-bold">
                    {factureSelectionnee.reference}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {factureSelectionnee.objet}
                  </p>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                      factureSelectionnee.statut
                    )}`}
                  >
                    {factureSelectionnee.statut}
                  </span>

                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                      factureSelectionnee.archive
                        ? "bg-amber-100 text-amber-800"
                        : "bg-emerald-100 text-emerald-700"
                    }`}
                  >
                    {factureSelectionnee.archive ? "Archivée" : "Active"}
                  </span>

                  <button
                    onClick={ouvrirEdition}
                    className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    Modifier
                  </button>

                  {!factureSelectionnee.archive ? (
                    <button
                      onClick={archiverFacture}
                      className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
                    >
                      Archiver
                    </button>
                  ) : (
                    <button
                      onClick={restaurerFacture}
                      className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
                    >
                      Restaurer
                    </button>
                  )}

                  <button
                    onClick={supprimerFacture}
                    className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
                  >
                    Supprimer
                  </button>
                </div>
              </div>

              <div className="mt-6 space-y-4">
                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="mt-1 text-lg font-semibold">
                    {factureSelectionnee.clientNom}
                  </p>
                  <p className="mt-2 text-sm text-slate-600">
                    {factureSelectionnee.chantierTitre || "Sans chantier lié"}
                  </p>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Émission</p>
                    <p className="mt-1 font-semibold">
                      {factureSelectionnee.dateEmission || "Non renseignée"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Échéance</p>
                    <p className="mt-1 font-semibold">
                      {factureSelectionnee.dateEcheance || "Non renseignée"}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Paiement</p>
                    <p className="mt-1 font-semibold">
                      {factureSelectionnee.datePaiement || "Non renseignée"}
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Montant HT</p>
                    <p className="mt-1 font-semibold">
                      {formatMontant(factureSelectionnee.montantHt)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">
                      TVA ({factureSelectionnee.tvaTaux}%)
                    </p>
                    <p className="mt-1 font-semibold">
                      {formatMontant(totalTvaSelectionnee)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Total TTC</p>
                    <p className="mt-1 font-semibold">
                      {formatMontant(totalTtcSelectionnee)}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-sm text-slate-500">Net à payer</p>
                    <p className="mt-1 font-semibold">
                      {formatMontant(netAPayerSelectionnee)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Acompte déduit</p>
                  <p className="mt-1 font-semibold">
                    {formatMontant(factureSelectionnee.acompteDeduit)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-50 p-4">
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
                    {factureSelectionnee.notes ||
                      "Aucune note pour cette facture."}
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
              Aucune facture pour cette entreprise.
            </div>
          )}
        </div>
      </div>
    </>
  );
}