"use client";

import type { Dispatch, SetStateAction } from "react";
import { STATUTS_DEVIS } from "../lib/devis-constants";
import {
  calculerMontantTva,
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
} from "../lib/devis-helpers";
import type { Devis, NouvelleLigneState, StatutDevis } from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type EditFormState = {
  client: string;
  statut: StatutDevis;
  date: string;
  adresse: string;
  email: string;
  telephone: string;
  tvaTaux: string;
  acomptePourcentage: string;
  validiteJours: string;
  conditions: string;
};

type Props = {
  devisSelectionne: DevisBusiness | null;
  modeEdition: boolean;
  editForm: EditFormState;
  setEditForm: Dispatch<SetStateAction<EditFormState>>;
  editLignes: NouvelleLigneState[];
  setModeEdition: Dispatch<SetStateAction<boolean>>;
  ouvrirEdition: () => void;
  annulerEdition: () => void;
  ajouterLigneEdition: () => void;
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
  handleChangerStatut: (statut: StatutDevis) => void;
};

export default function DevisDetailPanel({
  devisSelectionne,
  modeEdition,
  editForm,
  setEditForm,
  editLignes,
  ouvrirEdition,
  annulerEdition,
  ajouterLigneEdition,
  supprimerLigneEdition,
  mettreAJourLigneEdition,
  enregistrerEdition,
  dupliquerDevis,
  supprimerDevis,
  archiverDevis,
  restaurerDevis,
  handleExporterPdf,
  handleChangerStatut,
}: Props) {
  const getStatutClasses = (statut: StatutDevis) => {
    switch (statut) {
      case "Brouillon":
        return "bg-slate-200 text-slate-700";
      case "Envoyé":
        return "bg-blue-100 text-blue-700";
      case "Accepté":
        return "bg-emerald-100 text-emerald-700";
      case "Refusé":
        return "bg-red-100 text-red-700";
      default:
        return "bg-slate-200 text-slate-700";
    }
  };

  if (!devisSelectionne) {
    return (
      <div className="flex min-h-80 items-center justify-center text-center text-sm text-slate-500">
        Aucun devis pour cette entreprise.
      </div>
    );
  }

  const totalHtSelectionne = calculerTotalHt(devisSelectionne);
  const totalTvaSelectionne = calculerMontantTva(devisSelectionne);
  const totalTvacSelectionne = calculerTotalTvac(devisSelectionne);
  const acompteSelectionne =
    totalTvacSelectionne * (devisSelectionne.acomptePourcentage / 100);

  if (!modeEdition) {
    return (
      <>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Fiche devis</p>
            <h3 className="mt-1 text-2xl font-bold">{devisSelectionne.id}</h3>
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                devisSelectionne.statut
              )}`}
            >
              {devisSelectionne.statut}
            </span>

            <button
              onClick={ouvrirEdition}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Modifier
            </button>
            <button
              onClick={dupliquerDevis}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Dupliquer
            </button>
            {!devisSelectionne.archive ? (
              <button
                onClick={archiverDevis}
                className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
              >
                Archiver
              </button>
            ) : (
              <button
                onClick={restaurerDevis}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-800 transition hover:bg-emerald-100"
              >
                Restaurer
              </button>
            )}
            <button
              onClick={supprimerDevis}
              className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-700 transition hover:bg-red-100"
            >
              Supprimer
            </button>
            <button
              onClick={handleExporterPdf}
              className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
            >
              Export PDF
            </button>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Client</p>
            <p className="mt-1 text-lg font-semibold">{devisSelectionne.client}</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Adresse</p>
              <p className="mt-1 font-semibold">
                {devisSelectionne.adresse || "Non renseignée"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Contact</p>
              <p className="mt-1 font-semibold">
                {devisSelectionne.email || "Non renseigné"}
              </p>
              <p className="mt-1 font-semibold">
                {devisSelectionne.telephone || "Non renseigné"}
              </p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Date</p>
              <p className="mt-1 font-semibold">{devisSelectionne.date}</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">TVA</p>
              <p className="mt-1 font-semibold">{devisSelectionne.tvaTaux}%</p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Validité</p>
              <p className="mt-1 font-semibold">
                {devisSelectionne.validiteJours} jours
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm text-slate-500">Prestations</p>
              <p className="text-sm font-semibold text-slate-700">
                {devisSelectionne.lignes.length} ligne
                {devisSelectionne.lignes.length > 1 ? "s" : ""}
              </p>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs text-slate-500">
                    <th className="px-3 py-3 font-medium">Désignation</th>
                    <th className="px-3 py-3 font-medium">Qté</th>
                    <th className="px-3 py-3 font-medium">Unité</th>
                    <th className="px-3 py-3 font-medium">PU</th>
                    <th className="px-3 py-3 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {devisSelectionne.lignes.map((ligne) => {
                    const totalLigne = ligne.quantite * ligne.prixUnitaire;

                    return (
                      <tr
                        key={ligne.id}
                        className="border-b border-slate-200 last:border-b-0"
                      >
                        <td className="px-3 py-3 text-sm font-medium">
                          {ligne.designation}
                        </td>
                        <td className="px-3 py-3 text-sm">{ligne.quantite}</td>
                        <td className="px-3 py-3 text-sm">{ligne.unite}</td>
                        <td className="px-3 py-3 text-sm whitespace-nowrap">
                          {formatMontant(ligne.prixUnitaire)}
                        </td>
                        <td className="px-3 py-3 text-sm font-semibold whitespace-nowrap">
                          {formatMontant(totalLigne)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total HT</p>
              <p className="mt-1 font-semibold">
                {formatMontant(totalHtSelectionne)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">
                TVA ({devisSelectionne.tvaTaux}%)
              </p>
              <p className="mt-1 font-semibold">
                {formatMontant(totalTvaSelectionne)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Total TVAC</p>
              <p className="mt-1 font-semibold">
                {formatMontant(totalTvacSelectionne)}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-sm text-slate-500">Acompte</p>
              <p className="mt-1 font-semibold">
                {formatMontant(acompteSelectionne)}
              </p>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Conditions</p>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-slate-700">
              {devisSelectionne.conditions || "Aucune condition particulière."}
            </p>
          </div>

          <div className="rounded-2xl bg-slate-50 p-4">
            <p className="text-sm text-slate-500">Actions rapides</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => handleChangerStatut("Brouillon")}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
              >
                Mettre en brouillon
              </button>
              <button
                onClick={() => handleChangerStatut("Envoyé")}
                className="rounded-xl border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100"
              >
                Marquer envoyé
              </button>
              <button
                onClick={() => handleChangerStatut("Accepté")}
                className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 transition hover:bg-emerald-100"
              >
                Marquer accepté
              </button>
              <button
                onClick={() => handleChangerStatut("Refusé")}
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
              >
                Marquer refusé
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-slate-500">Édition devis</p>
          <h3 className="mt-1 text-2xl font-bold">{devisSelectionne.id}</h3>
        </div>

        <button
          onClick={annulerEdition}
          className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
        >
          Fermer
        </button>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Client
          </label>
          <input
            type="text"
            value={editForm.client}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                client: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Date
          </label>
          <input
            type="date"
            value={editForm.date}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                date: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Adresse
          </label>
          <input
            type="text"
            value={editForm.adresse}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                adresse: e.target.value,
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
            value={editForm.statut}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                statut: e.target.value as StatutDevis,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
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
            Email
          </label>
          <input
            type="email"
            value={editForm.email}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                email: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Téléphone
          </label>
          <input
            type="text"
            value={editForm.telephone}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                telephone: e.target.value,
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
            value={editForm.tvaTaux}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                tvaTaux: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Acompte (%)
          </label>
          <input
            type="number"
            value={editForm.acomptePourcentage}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                acomptePourcentage: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Validité (jours)
          </label>
          <input
            type="number"
            value={editForm.validiteJours}
            onChange={(e) =>
              setEditForm((prev) => ({
                ...prev,
                validiteJours: e.target.value,
              }))
            }
            className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
          />
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-2 block text-sm font-medium text-slate-700">
          Conditions
        </label>
        <textarea
          value={editForm.conditions}
          onChange={(e) =>
            setEditForm((prev) => ({
              ...prev,
              conditions: e.target.value,
            }))
          }
          rows={4}
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        />
      </div>

      <div className="mt-8 rounded-2xl bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h4 className="text-lg font-semibold">Lignes de prestation</h4>
          <button
            onClick={ajouterLigneEdition}
            className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Ajouter une ligne
          </button>
        </div>

        <div className="mt-4 space-y-4">
          {editLignes.map((ligne, index) => (
            <div
              key={`edition-${index}`}
              className="rounded-2xl border border-slate-200 bg-white p-4"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">
                  Ligne {index + 1}
                </p>
                <button
                  onClick={() => supprimerLigneEdition(index)}
                  className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100"
                >
                  Supprimer
                </button>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div className="xl:col-span-2">
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Désignation
                  </label>
                  <input
                    type="text"
                    value={ligne.designation}
                    onChange={(e) =>
                      mettreAJourLigneEdition(
                        index,
                        "designation",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Quantité
                  </label>
                  <input
                    type="number"
                    value={ligne.quantite}
                    onChange={(e) =>
                      mettreAJourLigneEdition(index, "quantite", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Unité
                  </label>
                  <input
                    type="text"
                    value={ligne.unite}
                    onChange={(e) =>
                      mettreAJourLigneEdition(index, "unite", e.target.value)
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-700">
                    Prix unitaire
                  </label>
                  <input
                    type="number"
                    value={ligne.prixUnitaire}
                    onChange={(e) =>
                      mettreAJourLigneEdition(
                        index,
                        "prixUnitaire",
                        e.target.value
                      )
                    }
                    className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
                  />
                </div>

                <div className="xl:col-span-4 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  Total ligne :{" "}
                  <span className="font-semibold text-slate-900">
                    {formatMontant(
                      (Number(ligne.quantite) || 0) *
                        (Number(ligne.prixUnitaire) || 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={enregistrerEdition}
          className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
        >
          Enregistrer les modifications
        </button>

        <button
          onClick={annulerEdition}
          className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
        >
          Annuler
        </button>
      </div>
    </>
  );
}