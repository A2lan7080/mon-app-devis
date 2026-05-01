"use client";

import Link from "next/link";
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
      <div className="bf-card mb-4 border-blue-200 bg-blue-50 p-4 sm:mb-6 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-blue-950">Retour bêta</p>
            <p className="mt-1 text-sm leading-6 text-blue-800">
              Donner votre avis sur BatiFlow
            </p>
          </div>

          <Link href="/beta-test" className="bf-button-primary text-center">
            Retour bêta
          </Link>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-6">
        <div className="bf-card col-span-2 p-4 sm:p-5 xl:col-span-1">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">Valeur totale active</p>
          <p className="mt-1 wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {formatMontant(valeurBusinessTotale)}
          </p>
        </div>

        <div className="bf-card col-span-2 p-4 sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">CA signé</p>
          <p className="mt-1 wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {formatMontant(caSigne)}
          </p>
        </div>

        <div className="bf-card p-4 sm:p-5">
          <p className="text-xs text-slate-500 sm:text-sm">Envoyés</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-2xl">{totalEnvoyes}</p>
        </div>

        <div className="bf-card p-4 sm:p-5">
          <p className="text-xs font-medium text-slate-500 sm:text-sm">Conversion</p>
          <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {tauxConversion}%
          </p>
        </div>

        <div className="bf-card col-span-2 p-4 sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Pipe envoyé</p>
          <p className="mt-1 wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {formatMontant(pipeEnvoye)}
          </p>
        </div>

        <div className="bf-card col-span-2 p-4 sm:p-5 xl:col-span-1">
          <p className="text-xs text-slate-500 sm:text-sm">Brouillons</p>
          <p className="mt-1 wrap-break-word text-2xl font-bold tracking-tight text-slate-950 sm:text-2xl">
            {formatMontant(pipeBrouillon)}
          </p>
        </div>
      </div>

      <div className="grid gap-4 sm:gap-6 xl:grid-cols-3">
        <div className="bf-card p-4 sm:p-6">
          <p className="text-sm font-medium text-slate-500">Devis actifs</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{totalDevis}</p>
        </div>

        <div className="bf-card p-4 sm:p-6">
          <p className="text-sm text-slate-500">Ticket moyen signé</p>
          <p className="mt-1 wrap-break-word text-3xl font-bold tracking-tight text-slate-950">
            {formatMontant(ticketMoyen)}
          </p>
        </div>

        <div className="bf-card p-4 sm:p-6">
          <p className="text-sm text-slate-500">Archivés</p>
          <p className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{totalArchives}</p>
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:mt-6 sm:gap-6 xl:grid-cols-2">
        <div className="bf-card p-4 sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">Répartition statuts</h3>

          <div className="mt-5 space-y-3 sm:mt-6 sm:space-y-4">
            <div className="bf-card-soft flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm sm:text-base">Brouillons</span>
              <span className="font-semibold">{totalBrouillons}</span>
            </div>

            <div className="bf-card-soft flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm sm:text-base">Envoyés</span>
              <span className="font-semibold">{totalEnvoyes}</span>
            </div>

            <div className="bf-card-soft flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm sm:text-base">Acceptés</span>
              <span className="font-semibold">{totalAcceptes}</span>
            </div>

            <div className="bf-card-soft flex items-center justify-between gap-3 px-4 py-3">
              <span className="text-sm sm:text-base">Refusés</span>
              <span className="font-semibold">{totalRefuses}</span>
            </div>
          </div>
        </div>

        <div className="bf-card p-4 sm:p-6">
          <h3 className="text-lg font-semibold sm:text-xl">
            Lecture business rapide
          </h3>

          <div className="mt-5 space-y-3 text-sm text-slate-600 sm:mt-6 sm:space-y-4">
            <div className="bf-card-soft p-4 leading-6">
              Le chiffre le plus important ici, c’est le{" "}
              <span className="font-semibold text-slate-900">CA signé</span>. C’est
              ton revenu déjà gagné.
            </div>

            <div className="bf-card-soft p-4 leading-6">
              Le{" "}
              <span className="font-semibold text-slate-900">pipe envoyé</span>{" "}
              montre ce qui peut se transformer rapidement.
            </div>

            <div className="bf-card-soft p-4 leading-6">
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
