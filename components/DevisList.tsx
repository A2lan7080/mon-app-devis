"use client";

import type { Dispatch, SetStateAction } from "react";
import { calculerTotalTvac, formatMontant } from "../lib/devis-helpers";
import { formatNumeroDevisPourAffichage } from "../lib/format-numero-devis";
import type { DevisBusiness } from "../hooks/useDevisActions";

type Props = {
  devis: DevisBusiness[];
  totalDevis: number;
  devisSelectionneId: string | null;
  setDevisSelectionneId: Dispatch<SetStateAction<string | null>>;
  setModeEdition: Dispatch<SetStateAction<boolean>>;
};

function getStatutClasses(statut: string) {
  switch (statut) {
    case "Brouillon":
      return "bg-slate-100 text-slate-700";
    case "Envoyé":
      return "bg-blue-100 text-blue-700";
    case "Accepté":
      return "bg-emerald-100 text-emerald-700";
    case "Refusé":
      return "bg-red-100 text-red-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
}

export default function DevisList({
  devis,
  totalDevis,
  devisSelectionneId,
  setDevisSelectionneId,
  setModeEdition,
}: Props) {
  const messageVide =
    totalDevis === 0
      ? "Aucun devis pour le moment."
      : "Aucun devis ne correspond à cette recherche.";

  const selectionnerDevis = (id: string, estSelectionne: boolean) => {
    setModeEdition(false);
    setDevisSelectionneId(estSelectionne ? null : id);
  };

  return (
    <div className="mt-4 overflow-hidden sm:mt-6">
      {devis.length === 0 ? (
        <div className="bf-empty-state">
          <p className="text-sm font-semibold text-slate-700">{messageVide}</p>
          <p className="mt-1 text-xs text-slate-500">
            Ajuste les filtres ou crée un nouveau devis depuis l’action
            principale.
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-2 md:hidden">
            {devis.map((item) => {
              const estSelectionne = item.id === devisSelectionneId;
              const totalTvac = calculerTotalTvac(item);

              return (
                <button
                  key={item.id}
                  data-testid="devis-list-item-mobile"
                  onClick={() => selectionnerDevis(item.id, estSelectionne)}
                  className={`block w-full min-w-0 overflow-hidden rounded-xl border p-3 text-left transition ${
                    estSelectionne
                      ? "border-slate-900 bg-slate-50 shadow-sm"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {formatNumeroDevisPourAffichage(item.id)}
                      </p>

                      <p className="mt-1 truncate text-sm text-slate-700">
                        {item.client}
                      </p>

                      <p className="mt-1 truncate text-xs text-slate-500">
                        {item.chantierTitre || "Sans chantier lié"}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      <span
                        className={`bf-status-pill ${getStatutClasses(
                          item.statut
                        )}`}
                      >
                        {item.statut}
                      </span>

                      <p className="mt-3 text-sm font-semibold text-slate-900">
                        {formatMontant(totalTvac)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        {item.date || "Sans date"}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden overflow-hidden rounded-xl border border-slate-200 md:block">
            <div className="bf-table-header grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_8rem_8rem] gap-3 px-4 py-3">
              <span>Devis</span>
              <span>Client / chantier</span>
              <span>Statut</span>
              <span className="text-right">Montant</span>
            </div>

            {devis.map((item) => {
              const estSelectionne = item.id === devisSelectionneId;
              const totalTvac = calculerTotalTvac(item);

              return (
                <button
                  key={item.id}
                  data-testid="devis-list-item"
                  onClick={() => selectionnerDevis(item.id, estSelectionne)}
                  className={`bf-table-row grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_8rem_8rem] items-center gap-3 px-4 py-3 text-left ${
                    estSelectionne ? "bf-table-row-selected" : ""
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {formatNumeroDevisPourAffichage(item.id)}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {item.date || "Sans date"}
                    </p>
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800">
                      {item.client}
                    </p>
                    <p className="mt-1 truncate text-xs text-slate-500">
                      {item.chantierTitre || "Sans chantier lié"}
                    </p>
                  </div>

                  <span
                    className={`bf-status-pill justify-self-start ${getStatutClasses(
                      item.statut
                    )}`}
                  >
                    {item.statut}
                  </span>

                  <p className="truncate text-right text-sm font-semibold text-slate-950">
                    {formatMontant(totalTvac)}
                  </p>
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
