"use client";

import { useMemo, useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { useEntrepriseClients } from "../hooks/useEntrepriseClients";
import {
  creerLigneVide,
  STATUTS_DEVIS,
  TVA_PAR_DEFAUT,
} from "../lib/devis-constants";
import {
  convertirLignesFormStateEnLignesMetier,
  formatMontant,
  formaterDate,
  genererNumeroDevis,
} from "../lib/devis-helpers";
import { auth, db } from "../lib/firebase";
import type { Client } from "../types/clients";
import type {
  Devis,
  NouvelleLigneState,
  NouveauDevisState,
  StatutDevis,
} from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type DevisFormProps = {
  devis: DevisBusiness[];
  entrepriseId?: string;
  createdByUid?: string;
  onDevisCree: (id: string) => void;
  onClose: () => void;
};

const UNITES_PREDEFINIES = ["pièce", "forfait", "m²", "ml", "heure", "jour"];

function genererReferenceClient(clients: Client[]) {
  const plusGrandNumero = clients.reduce((max, client) => {
    const match = client.reference?.match(/CLI-(\d+)/);
    if (!match) return max;
    const numero = Number(match[1]);
    return Number.isNaN(numero) ? max : Math.max(max, numero);
  }, 0);

  return `CLI-${String(plusGrandNumero + 1).padStart(4, "0")}`;
}

function creerLigneVideAvecUnite(): NouvelleLigneState {
  return {
    ...creerLigneVide(),
    unite: "forfait",
  };
}

export default function DevisForm({
  devis,
  entrepriseId,
  createdByUid,
  onDevisCree,
  onClose,
}: DevisFormProps) {
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);
  const [clientSelectionneId, setClientSelectionneId] = useState("");

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

  const [nouveauDevis, setNouveauDevis] = useState<
    NouveauDevisState & {
      acomptePourcentage: string;
      validiteJours: string;
      conditions: string;
    }
  >({
    client: "",
    statut: "Brouillon",
    date: "",
    adresse: "",
    email: "",
    telephone: "",
    tvaTaux: String(TVA_PAR_DEFAUT),
    acomptePourcentage: "30",
    validiteJours: "30",
    conditions:
      "Un acompte est demandé avant lancement. Toute modification complémentaire pourra faire l’objet d’un ajustement de prix.",
  });

  const [lignes, setLignes] = useState<NouvelleLigneState[]>([
    creerLigneVideAvecUnite(),
  ]);

  const reinitialiserFormulaire = () => {
    setClientSelectionneId("");
    setNouveauDevis({
      client: "",
      statut: "Brouillon",
      date: "",
      adresse: "",
      email: "",
      telephone: "",
      tvaTaux: String(TVA_PAR_DEFAUT),
      acomptePourcentage: "30",
      validiteJours: "30",
      conditions:
        "Un acompte est demandé avant lancement. Toute modification complémentaire pourra faire l’objet d’un ajustement de prix.",
    });
    setLignes([creerLigneVideAvecUnite()]);
  };

  const ajouterLigne = () => {
    setLignes((prev) => [...prev, creerLigneVideAvecUnite()]);
  };

  const supprimerLigne = (index: number) => {
    setLignes((prev) => {
      if (prev.length === 1) return prev;
      return prev.filter((_, i) => i !== index);
    });
  };

  const mettreAJourLigne = (
    index: number,
    champ: keyof NouvelleLigneState,
    valeur: string
  ) => {
    setLignes((prev) =>
      prev.map((ligne, i) =>
        i === index ? { ...ligne, [champ]: valeur } : ligne
      )
    );
  };

  const handleSelectionClient = (clientId: string) => {
    setClientSelectionneId(clientId);

    if (!clientId) {
      return;
    }

    const client = clientsActifs.find((item) => item.id === clientId);
    if (!client) return;

    setNouveauDevis((prev) => ({
      ...prev,
      client: client.nom ?? "",
      adresse: client.adresse ?? "",
      email: client.email ?? "",
      telephone: client.telephone ?? "",
    }));
  };

  const handleCreerDevis = async () => {
    const currentUser = auth.currentUser;

    if (!currentUser) {
      alert("Utilisateur non connecté.");
      return;
    }

    if (!entrepriseId || typeof entrepriseId !== "string") {
      alert("Aucune entreprise active pour ce compte.");
      return;
    }

    const uidCreateur = createdByUid ?? currentUser.uid;

    if (!uidCreateur) {
      alert("Impossible d’identifier le créateur du devis.");
      return;
    }

    if (!nouveauDevis.client.trim() || !nouveauDevis.date) {
      alert("Remplis au minimum le client et la date.");
      return;
    }

    const lignesValides = convertirLignesFormStateEnLignesMetier(lignes);

    if (lignesValides.length === 0) {
      alert("Ajoute au moins une ligne de prestation valide.");
      return;
    }

    const tvaTaux = Number(nouveauDevis.tvaTaux);
    const acomptePourcentage = Number(nouveauDevis.acomptePourcentage);
    const validiteJours = Number(nouveauDevis.validiteJours);

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

    const numeroBase = genererNumeroDevis(devis);
    const nouveauId = `${entrepriseId}-${numeroBase}`;
    const maintenant = Date.now();

    try {
      setSauvegardeEnCours(true);

      if (!clientSelectionneId) {
        const referenceClient = genererReferenceClient(clients);

        const nouveauClient: Client = {
          id: `${entrepriseId}-cli-${maintenant}`,
          reference: referenceClient,
          nom: nouveauDevis.client.trim(),
          typeClient: "Particulier",
          societe: "",
          email: nouveauDevis.email.trim(),
          telephone: nouveauDevis.telephone.trim(),
          adresse: nouveauDevis.adresse.trim(),
          codePostal: "",
          ville: "",
          pays: "Belgique",
          tva: "",
          notes: "",
          entrepriseId,
          createdByUid: uidCreateur,
          archive: false,
          createdAt: maintenant,
          updatedAt: maintenant,
        };

        await setDoc(doc(db, "clients", nouveauClient.id), nouveauClient);
      }

      const devisCree: DevisBusiness = {
        id: nouveauId,
        entrepriseId,
        createdByUid: uidCreateur,
        client: nouveauDevis.client.trim(),
        statut: nouveauDevis.statut,
        date: formaterDate(nouveauDevis.date),
        adresse: nouveauDevis.adresse.trim(),
        email: nouveauDevis.email.trim(),
        telephone: nouveauDevis.telephone.trim(),
        tvaTaux,
        lignes: lignesValides,
        acomptePourcentage,
        validiteJours,
        conditions: nouveauDevis.conditions.trim(),
        archive: false,
        createdAt: maintenant,
      };

      await setDoc(doc(db, "devis", devisCree.id), devisCree);
      onDevisCree(devisCree.id);
      reinitialiserFormulaire();
      onClose();
    } catch (error: unknown) {
      console.error("Erreur création devis :", error);

      if (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        "message" in error
      ) {
        const firebaseError = error as { code?: string; message?: string };
        alert(
          `Erreur création devis : ${firebaseError.code ?? "unknown"} - ${
            firebaseError.message ?? "Erreur inconnue"
          }`
        );
        return;
      }

      if (error instanceof Error) {
        alert(`Erreur création devis : ${error.message}`);
        return;
      }

      alert("Erreur lors de la création du devis.");
    } finally {
      setSauvegardeEnCours(false);
    }
  };

  return (
    <div className="mb-6 rounded-2xl bg-white p-4 shadow-sm sm:p-6">
      <h3 className="text-xl font-semibold sm:text-2xl">Créer un devis</h3>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Client existant
          </label>
          <select
            value={clientSelectionneId}
            onChange={(e) => handleSelectionClient(e.target.value)}
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          >
            <option value="">Créer un nouveau client depuis ce devis</option>
            {clientsActifs.map((client) => (
              <option key={client.id} value={client.id}>
                {client.nom}
                {client.societe ? ` — ${client.societe}` : ""}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-slate-400">
            Si aucun client n’est sélectionné, un nouveau client sera créé
            automatiquement à l’enregistrement du devis.
          </p>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Client
          </label>
          <input
            type="text"
            value={nouveauDevis.client}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                client: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            value={nouveauDevis.date}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Statut
          </label>
          <select
            value={nouveauDevis.statut}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                statut: e.target.value as StatutDevis,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          >
            {STATUTS_DEVIS.map((statut) => (
              <option key={statut} value={statut}>
                {statut}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            TVA (%)
          </label>
          <input
            type="number"
            value={nouveauDevis.tvaTaux}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                tvaTaux: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Adresse
          </label>
          <input
            type="text"
            value={nouveauDevis.adresse}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                adresse: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            type="email"
            value={nouveauDevis.email}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <input
            type="text"
            value={nouveauDevis.telephone}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                telephone: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Acompte (%)
          </label>
          <input
            type="number"
            value={nouveauDevis.acomptePourcentage}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                acomptePourcentage: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Validité (jours)
          </label>
          <input
            type="number"
            value={nouveauDevis.validiteJours}
            onChange={(e) =>
              setNouveauDevis((prev) => ({
                ...prev,
                validiteJours: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Conditions
        </label>
        <textarea
          value={nouveauDevis.conditions}
          onChange={(e) =>
            setNouveauDevis((prev) => ({
              ...prev,
              conditions: e.target.value,
            }))
          }
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-slate-400"
        />
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-lg font-semibold">Prestations</h4>
          <button
            type="button"
            onClick={ajouterLigne}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:w-auto"
          >
            Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {lignes.map((ligne, index) => (
            <div
              key={index}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <input
                  type="text"
                  placeholder="Désignation"
                  value={ligne.designation}
                  onChange={(e) =>
                    mettreAJourLigne(index, "designation", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />

                <input
                  type="number"
                  placeholder="Quantité"
                  value={ligne.quantite}
                  onChange={(e) =>
                    mettreAJourLigne(index, "quantite", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />

                <select
                  value={ligne.unite}
                  onChange={(e) =>
                    mettreAJourLigne(index, "unite", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                >
                  {UNITES_PREDEFINIES.map((unite) => (
                    <option key={unite} value={unite}>
                      {unite}
                    </option>
                  ))}
                </select>

                <input
                  type="number"
                  placeholder="Prix unitaire"
                  value={ligne.prixUnitaire}
                  onChange={(e) =>
                    mettreAJourLigne(index, "prixUnitaire", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
              </div>

              <div className="mt-3 text-sm text-slate-600">
                Total ligne :{" "}
                <span className="font-semibold text-slate-900">
                  {formatMontant(
                    (Number(ligne.quantite) || 0) *
                      (Number(ligne.prixUnitaire) || 0)
                  )}
                </span>
              </div>

              <button
                type="button"
                onClick={() => supprimerLigne(index)}
                className="mt-3 w-full rounded-xl border border-red-200 bg-red-50 px-3 py-3 text-sm text-red-700 hover:bg-red-100 sm:w-auto"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={handleCreerDevis}
          disabled={sauvegardeEnCours}
          className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {sauvegardeEnCours ? "Enregistrement..." : "Enregistrer le devis"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={sauvegardeEnCours}
          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}