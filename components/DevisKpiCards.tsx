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
    <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Total devis</p>
        <p className="mt-2 text-3xl font-bold">{totalDevis}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Brouillons</p>
        <p className="mt-2 text-3xl font-bold">{totalBrouillons}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">Acceptés</p>
        <p className="mt-2 text-3xl font-bold">{totalAcceptes}</p>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm">
        <p className="text-sm text-slate-500">CA signé</p>
        <p className="mt-2 text-3xl font-bold">{formatMontant(caSigne)}</p>
      </div>
    </div>
  );
}