"use client";

import { formatMontant } from "../lib/devis-helpers";

type Props = {
  totalDevis: number;
  totalBrouillons: number;
  totalAcceptes: number;
  caSigne: number;
};

type KpiCardProps = {
  titre: string;
  valeur: string | number;
  icone: string;
  accentClasses: string;
  badgeClasses: string;
  description: string;
  large?: boolean;
};

function KpiCard({
  titre,
  valeur,
  icone,
  accentClasses,
  badgeClasses,
  description,
  large = false,
}: KpiCardProps) {
  return (
    <div
      className={`group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5 ${
        large ? "col-span-2 xl:col-span-1" : ""
      }`}
    >
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 ${accentClasses}`}
      />

      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">
            {titre}
          </p>

          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {valeur}
          </p>
        </div>

        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-lg ${badgeClasses}`}
        >
          {icone}
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 sm:text-sm">{description}</p>
    </div>
  );
}

export default function DevisKpiCards({
  totalDevis,
  totalBrouillons,
  totalAcceptes,
  caSigne,
}: Props) {
  return (
    <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
      <KpiCard
        titre="Total devis"
        valeur={totalDevis}
        icone="📄"
        accentClasses="bg-blue-500"
        badgeClasses="bg-blue-50 text-blue-700"
        description="Tous les devis actuellement enregistrés."
      />

      <KpiCard
        titre="Brouillons"
        valeur={totalBrouillons}
        icone="📝"
        accentClasses="bg-slate-500"
        badgeClasses="bg-slate-100 text-slate-700"
        description="Devis encore en préparation ou à finaliser."
      />

      <KpiCard
        titre="Acceptés"
        valeur={totalAcceptes}
        icone="✅"
        accentClasses="bg-emerald-500"
        badgeClasses="bg-emerald-50 text-emerald-700"
        description="Devis validés par les clients."
      />

      <KpiCard
        titre="CA signé"
        valeur={formatMontant(caSigne)}
        icone="💶"
        accentClasses="bg-violet-500"
        badgeClasses="bg-violet-50 text-violet-700"
        description="Montant total confirmé via les devis acceptés."
        large
      />
    </div>
  );
}