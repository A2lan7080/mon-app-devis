"use client";

import { formatMontant } from "../lib/devis-helpers";

type Props = {
  totalDevis: number;
  totalBrouillons: number;
  totalAcceptes: number;
  caSigne: number;
};

export default function DevisKpiCards({
  totalDevis,
  totalBrouillons,
  totalAcceptes,
  caSigne,
}: Props) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
      <div className="bf-card overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Total devis
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {totalDevis}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-lg">
            📄
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Tous les devis actuellement enregistrés.
        </p>
      </div>

      <div className="bf-card overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Brouillons
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {totalBrouillons}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-lg">
            📝
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Devis encore en préparation ou à finaliser.
        </p>
      </div>

      <div className="bf-card overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              Acceptés
            </p>
            <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {totalAcceptes}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-lg">
            ✅
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Devis validés par les clients.
        </p>
      </div>

      <div className="bf-card overflow-hidden p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium text-slate-500 sm:text-sm">
              CA signé
            </p>
            <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              {formatMontant(caSigne)}
            </p>
          </div>

          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-50 text-lg">
            💶
          </div>
        </div>

        <p className="mt-3 text-xs leading-5 text-slate-500">
          Montant total confirmé via les devis acceptés.
        </p>
      </div>
    </div>
  );
}
