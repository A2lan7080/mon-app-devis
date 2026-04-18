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
      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-slate-500 sm:text-sm">Total devis</p>
        <p className="mt-2 text-2xl font-bold sm:text-3xl">{totalDevis}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-slate-500 sm:text-sm">Brouillons</p>
        <p className="mt-2 text-2xl font-bold sm:text-3xl">{totalBrouillons}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
        <p className="text-xs text-slate-500 sm:text-sm">Acceptés</p>
        <p className="mt-2 text-2xl font-bold sm:text-3xl">{totalAcceptes}</p>
      </div>

      <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5 col-span-2 xl:col-span-1">
        <p className="text-xs text-slate-500 sm:text-sm">CA signé</p>
        <p className="mt-2 break-words text-2xl font-bold sm:text-3xl">
          {formatMontant(caSigne)}
        </p>
      </div>
    </div>
  );
}