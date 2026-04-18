"use client";

import { calculerTotalTvac, formatMontant } from "../lib/devis-helpers";
import type { Devis, StatutDevis } from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
};

type DevisListProps = {
  devis: DevisBusiness[];
  devisSelectionneId: string | null;
  setDevisSelectionneId: (id: string) => void;
  setModeEdition: (value: boolean) => void;
};

function getStatutClasses(statut: StatutDevis) {
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
}

export default function DevisList({
  devis,
  devisSelectionneId,
  setDevisSelectionneId,
  setModeEdition,
}: DevisListProps) {
  return (
    <div className="space-y-3">
      {devis.map((item) => {
        const estSelectionne = item.id === devisSelectionneId;

        return (
          <button
            key={item.id}
            onClick={() => {
              setDevisSelectionneId(item.id);
              setModeEdition(false);
            }}
            className={`w-full rounded-2xl border p-4 text-left transition ${
              estSelectionne
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            } ${item.archive ? "opacity-70" : ""}`}
          >
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="break-all text-sm font-semibold text-slate-900 sm:text-base">
                      {item.id}
                    </p>

                    {item.archive && (
                      <span className="rounded-full bg-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-700">
                        Archivé
                      </span>
                    )}
                  </div>

                  <p className="mt-1 break-words text-sm font-medium text-slate-700 sm:text-base">
                    {item.client}
                  </p>

                  {item.adresse && (
                    <p className="mt-1 break-words text-xs text-slate-400 sm:text-sm">
                      {item.adresse}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
                  <span
                    className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatutClasses(
                      item.statut
                    )}`}
                  >
                    {item.statut}
                  </span>
                </div>
              </div>

              <div className="grid gap-2 rounded-xl bg-slate-50 p-3 sm:grid-cols-2">
                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Montant
                  </p>
                  <p className="mt-1 text-sm font-semibold text-slate-900 sm:text-base">
                    {formatMontant(calculerTotalTvac(item))}
                  </p>
                </div>

                <div>
                  <p className="text-[11px] uppercase tracking-wide text-slate-400">
                    Date
                  </p>
                  <p className="mt-1 text-sm font-medium text-slate-700 sm:text-base">
                    {item.date}
                  </p>
                </div>
              </div>
            </div>
          </button>
        );
      })}

      {devis.length === 0 && (
        <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
          Aucun devis trouvé pour ces filtres.
        </div>
      )}
    </div>
  );
}