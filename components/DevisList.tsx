"use client";

import type { Dispatch, SetStateAction } from "react";
import { calculerTotalTvac, formatMontant } from "../lib/devis-helpers";
import { formatNumeroDevisPourAffichage } from "../lib/format-numero-devis";
import type { DevisBusiness } from "../hooks/useDevisActions";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import EmptyState from "./ui/EmptyState";

type Props = {
  devis: DevisBusiness[];
  totalDevis: number;
  devisSelectionneId: string | null;
  setDevisSelectionneId: Dispatch<SetStateAction<string | null>>;
  setModeEdition: Dispatch<SetStateAction<boolean>>;
  onCreateFirstDevis: () => void;
};

export default function DevisList({
  devis,
  totalDevis,
  devisSelectionneId,
  setDevisSelectionneId,
  setModeEdition,
  onCreateFirstDevis,
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
        <EmptyState
          icon={<span aria-hidden="true">📄</span>}
          title={messageVide}
          description={
            totalDevis === 0
              ? "Démarre avec un premier devis client, puis envoie-le par email."
              : "Ajuste les filtres ou crée un nouveau devis depuis l'action principale."
          }
          action={
            <Button onClick={onCreateFirstDevis}>
              {totalDevis === 0 ? "Créer mon premier devis" : "Nouveau devis"}
            </Button>
          }
        />
      ) : (
        <>
          <div className="space-y-3 md:hidden">
            {devis.map((item) => {
              const estSelectionne = item.id === devisSelectionneId;
              const totalTvac = calculerTotalTvac(item);

              return (
                <button
                  key={item.id}
                  data-testid="devis-list-item-mobile"
                  onClick={() => selectionnerDevis(item.id, estSelectionne)}
                  className={`group block w-full min-w-0 overflow-hidden rounded-2xl border p-4 text-left shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none ${
                    estSelectionne
                      ? "border-sky-300 bg-gradient-to-br from-sky-50 to-white ring-2 ring-sky-100"
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
                      <Badge status={item.statut} dot>
                        {item.statut}
                      </Badge>

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

          <div className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm md:block">
            <div className="grid grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_8rem_8rem] gap-3 border-b border-slate-200 bg-gradient-to-r from-slate-50 via-white to-sky-50/60 px-4 py-3 text-xs font-bold uppercase tracking-[0.06em] text-slate-500">
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
                  className={`group grid w-full grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_8rem_8rem] items-center gap-3 border-b border-slate-100 px-4 py-3.5 text-left transition duration-200 last:border-b-0 hover:bg-sky-50/40 ${
                    estSelectionne
                      ? "bg-sky-50/70 shadow-[inset_3px_0_0_#0284c7]"
                      : "bg-white"
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

                  <Badge
                    status={item.statut}
                    dot
                    className="justify-self-start"
                  >
                    {item.statut}
                  </Badge>

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
