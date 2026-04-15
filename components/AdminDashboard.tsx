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
      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Valeur totale active</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMontant(valeurBusinessTotale)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">CA signé</p>
          <p className="mt-2 text-2xl font-bold">{formatMontant(caSigne)}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Envoyés</p>
          <p className="mt-2 text-2xl font-bold">{totalEnvoyes}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pipe envoyé</p>
          <p className="mt-2 text-2xl font-bold">{formatMontant(pipeEnvoye)}</p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Brouillons</p>
          <p className="mt-2 text-2xl font-bold">
            {formatMontant(pipeBrouillon)}
          </p>
        </div>

        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Conversion</p>
          <p className="mt-2 text-2xl font-bold">{tauxConversion}%</p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Devis actifs</p>
          <p className="mt-2 text-3xl font-bold">{totalDevis}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Ticket moyen signé</p>
          <p className="mt-2 text-3xl font-bold">{formatMontant(ticketMoyen)}</p>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-slate-500">Archivés</p>
          <p className="mt-2 text-3xl font-bold">{totalArchives}</p>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Répartition statuts</h3>

          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Brouillons</span>
              <span className="font-semibold">{totalBrouillons}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Envoyés</span>
              <span className="font-semibold">{totalEnvoyes}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Acceptés</span>
              <span className="font-semibold">{totalAcceptes}</span>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
              <span>Refusés</span>
              <span className="font-semibold">{totalRefuses}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h3 className="text-xl font-semibold">Lecture business rapide</h3>

          <div className="mt-6 space-y-4 text-sm text-slate-600">
            <div className="rounded-xl bg-slate-50 p-4">
              Le chiffre le plus important ici, c’est le{" "}
              <span className="font-semibold text-slate-900">CA signé</span>. C’est
              ton revenu déjà gagné.
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
              Le{" "}
              <span className="font-semibold text-slate-900">pipe envoyé</span>{" "}
              montre ce qui peut se transformer rapidement.
            </div>

            <div className="rounded-xl bg-slate-50 p-4">
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