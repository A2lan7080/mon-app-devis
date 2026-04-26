"use client";

import type { Dispatch, SetStateAction } from "react";
import { calculerTotalTvac, formatMontant } from "../lib/devis-helpers";
import { formatNumeroDevisPourAffichage } from "../lib/format-numero-devis";
import type { DevisBusiness } from "../hooks/useDevisActions";

type Props = {
  devis: DevisBusiness[];
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
  devisSelectionneId,
  setDevisSelectionneId,
  setModeEdition,
}: Props) {
  return (
    <div className="mt-4 space-y-2 overflow-hidden sm:mt-6 sm:space-y-3">
      {devis.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
          Aucun devis trouvé.
        </div>
      ) : (
        devis.map((item) => {
          const estSelectionne = item.id === devisSelectionneId;
          const totalTvac = calculerTotalTvac(item);

          return (
            <button
              key={item.id}
              data-testid="devis-list-item"
              onClick={() => {
                setModeEdition(false);
                setDevisSelectionneId(estSelectionne ? null : item.id);
              }}
              className={`block w-full min-w-0 overflow-hidden rounded-xl border p-3 text-left transition sm:rounded-2xl sm:p-4 ${
                estSelectionne
                  ? "border-slate-900 bg-slate-50"
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

                  <p className="mt-1 truncate text-xs text-slate-400">
                    {item.chantierTitre || "Sans chantier lié"}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${getStatutClasses(
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
        })
      )}
    </div>
  );
}
