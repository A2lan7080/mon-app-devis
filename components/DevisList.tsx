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
  setDevisSelectionneId: (id: string | null) => void;
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
    <div className="space-y-2 overflow-hidden">
      {devis.map((item) => {
        const estSelectionne = item.id === devisSelectionneId;

        return (
          <button
            key={item.id}
            onClick={() => {
              setModeEdition(false);
              setDevisSelectionneId(estSelectionne ? null : item.id);
            }}
            className={`block w-full min-w-0 overflow-hidden rounded-xl border px-3 py-3 text-left transition ${
              estSelectionne
                ? "border-slate-900 bg-slate-50"
                : "border-slate-200 bg-white hover:bg-slate-50"
            } ${item.archive ? "opacity-70" : ""}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {item.id}
                  </p>

                  {item.archive && (
                    <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-700">
                      Archivé
                    </span>
                  )}
                </div>

                <p className="mt-1 truncate text-sm font-medium text-slate-700">
                  {item.client}
                </p>

                <p className="mt-1 truncate text-xs text-slate-400">
                  {item.chantierTitre || item.adresse || "Sans chantier lié"}
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

                <p className="mt-2 text-sm font-semibold text-slate-900">
                  {formatMontant(calculerTotalTvac(item))}
                </p>

                <p className="mt-1 text-xs text-slate-500">{item.date}</p>
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