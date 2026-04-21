"use client";

import { formatMontant } from "../lib/devis-helpers";

type AdminDashboardProps = {
  valeurBusinessTotale: number;
  caSigne: number;
  totalEnvoyes: number;
  pipeEnvoye: number;
  pipeBrouillon: number;
  tauxConversion: number;
  totalDevis: number;
  ticketMoyen: number;
  totalArchives: number;
  totalBrouillons: number;
  totalAcceptes: number;
  totalRefuses: number;
};

export default function AdminDashboard({
  valeurBusinessTotale,
  caSigne,
  totalEnvoyes,
  pipeEnvoye,
  pipeBrouillon,
  tauxConversion,
  totalDevis,
  ticketMoyen,
  totalArchives,
  totalBrouillons,
  totalAcceptes,
  totalRefuses,
}: AdminDashboardProps) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-6">
        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Valeur totale active</p>
          <p className="mt-2 wrap-break-word text-2xl font-bold sm:text-2xl">
            {formatMontant(valeurBusinessTotale)}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">CA signé</p>
          <p className="mt-2 wrap-break-word text-2xl font-bold sm:text-2xl">
            {formatMontant(caSigne)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Envoyés</p>
          <p className="mt-2 text-2xl font-bold sm:text-2xl">{totalEnvoyes}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Conversion</p>
          <p className="mt-2 text-2xl font-bold sm:text-2xl">
            {tauxConversion}%
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Pipe envoyé</p>
          <p className="mt-2 wrap-break-word text-2xl font-bold sm:text-2xl">
            {formatMontant(pipeEnvoye)}
          </p>
        </div>

        <div className="col-span-2 rounded-2xl bg-white p-4 shadow-sm sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Brouillons</p>
          <p className="mt-2 wrap-break-word text-2xl font-bold sm:text-2xl">
            {formatMontant(pipeBrouillon)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Devis actifs</p>
          <p className="mt-2 text-3xl font-bold">{totalDevis}</p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Ticket moyen signé</p>
          <p className="mt-2 wrap-break-word text-3xl font-bold">
            {formatMontant(ticketMoyen)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <p className="text-sm text-slate-500">Archivés</p>
          <p className="mt-2 text-3xl font-bold">{totalArchives}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">Répartition statuts</h3>

          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Brouillons</span>
              <span className="font-semibold">{totalBrouillons}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Envoyés</span>
              <span className="font-semibold">{totalEnvoyes}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Acceptés</span>
              <span className="font-semibold">{totalAcceptes}</span>
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3">
              <span className="text-sm sm:text-base">Refusés</span>
              <span className="font-semibold">{totalRefuses}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-4 shadow-sm sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">
            Lecture business rapide
          </h3>

          <div className="mt-5 space-y-3 text-sm text-slate-600 sm:mt-6 sm:space-y-4">
            <div className="rounded-xl bg-slate-50 p-4 leading-6">
              Le chiffre le plus important ici, c’est le{" "}
              <span className="font-semibold text-slate-900">CA signé</span>. C’est
              ton revenu déjà gagné.
            </div>

            <div className="rounded-xl bg-slate-50 p-4 leading-6">
              Le{" "}
              <span className="font-semibold text-slate-900">pipe envoyé</span>{" "}
              montre ce qui peut se transformer rapidement.
            </div>

            <div className="rounded-xl bg-slate-50 p-4 leading-6">
              Les{" "}
              <span className="font-semibold text-slate-900">brouillons</span>{" "}
              représentent ton potentiel encore non envoyé.
            </div>
          </div>
        </div>
      </div>
    </>
  );
}