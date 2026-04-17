"use client";

import { useState } from "react";
import { doc, setDoc } from "firebase/firestore";
import { creerLigneVide, STATUTS_DEVIS, TVA_PAR_DEFAUT } from "../lib/devis-constants";
import {
  convertirLignesFormStateEnLignesMetier,
  formatMontant,
  formaterDate,
  genererNumeroDevis,
} from "../lib/devis-helpers";
import { auth, db } from "../lib/firebase";
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

export default function DevisForm({
  devis,
  entrepriseId,
  createdByUid,
  onDevisCree,
  onClose,
}: DevisFormProps) {
  const [sauvegardeEnCours, setSauvegardeEnCours] = useState(false);

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
    creerLigneVide(),
  ]);

  const reinitialiserFormulaire = () => {
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
    setLignes([creerLigneVide()]);
  };

  const ajouterLigne = () => {
    setLignes((prev) => [...prev, creerLigneVide()]);
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
      createdAt: Date.now(),
    };

    try {
      setSauvegardeEnCours(true);
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
    <div className="mb-6 rounded-2xl bg-white p-6 shadow-sm">
      <h3 className="text-2xl font-semibold">Créer un devis</h3>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
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

      <div className="mt-8 rounded-2xl bg-slate-50 p-5">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Prestations</h4>
          <button
            type="button"
            onClick={ajouterLigne}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
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
                <input
                  type="text"
                  placeholder="Unité"
                  value={ligne.unite}
                  onChange={(e) =>
                    mettreAJourLigne(index, "unite", e.target.value)
                  }
                  className="rounded-xl border border-slate-200 px-4 py-3 text-sm"
                />
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
                className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 hover:bg-red-100"
              >
                Supprimer
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={handleCreerDevis}
          disabled={sauvegardeEnCours}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sauvegardeEnCours ? "Enregistrement..." : "Enregistrer le devis"}
        </button>

        <button
          type="button"
          onClick={onClose}
          disabled={sauvegardeEnCours}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          Annuler
        </button>
      </div>
    </div>
  );
}