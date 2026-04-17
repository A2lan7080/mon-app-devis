"use client";

import type { ReactNode } from "react";

type VuePrincipale =
  | "devis"
  | "clients"
  | "chantiers"
  | "factures"
  | "admin";

type Props = {
  vueAffichee: VuePrincipale;
  displayName: string;
  entrepriseId: string;
  role: string;
  sauvegardeEnCours: boolean;
  afficherFormulaire: boolean;
  onOuvrirVueDevis: () => void;
  onOuvrirVueClients: () => void;
  onOuvrirVueChantiers: () => void;
  onOuvrirVueFactures: () => void;
  onOuvrirVueAdmin: () => void;
  onToggleFormulaireDevis: () => void;
  onDeconnexion: () => void;
  children: ReactNode;
};

export default function AdminShell({
  vueAffichee,
  displayName,
  entrepriseId,
  role,
  sauvegardeEnCours,
  afficherFormulaire,
  onOuvrirVueDevis,
  onOuvrirVueClients,
  onOuvrirVueChantiers,
  onOuvrirVueFactures,
  onOuvrirVueAdmin,
  onToggleFormulaireDevis,
  onDeconnexion,
  children,
}: Props) {
  const titre =
    vueAffichee === "devis"
      ? "Devis"
      : vueAffichee === "clients"
      ? "Clients"
      : vueAffichee === "chantiers"
      ? "Chantiers"
      : vueAffichee === "factures"
      ? "Factures"
      : "Espace admin";

  const description =
    vueAffichee === "devis"
      ? "Gère tes devis, leur statut et leur suivi."
      : vueAffichee === "clients"
      ? "Centralise les fiches clients de ton entreprise."
      : vueAffichee === "chantiers"
      ? "Pilote les chantiers en préparation, en cours ou terminés."
      : vueAffichee === "factures"
      ? "Gère l’émission et le suivi des factures."
      : "Pilote la valeur business, le pipe et la conversion.";

  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 md:flex">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestion devis & pilotage
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {displayName} · {entrepriseId}
            </p>
          </div>

          <nav className="mt-10 space-y-2">
            <button
              onClick={onOuvrirVueDevis}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vueAffichee === "devis"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Devis
            </button>

            <button
              onClick={onOuvrirVueClients}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vueAffichee === "clients"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Clients
            </button>

            <button
              onClick={onOuvrirVueChantiers}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vueAffichee === "chantiers"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Chantiers
            </button>

            <button
              onClick={onOuvrirVueFactures}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vueAffichee === "factures"
                  ? "bg-slate-900 text-white"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Factures
            </button>

            <button
              onClick={onOuvrirVueAdmin}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${
                vueAffichee === "admin"
                  ? "bg-amber-100 text-amber-800"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              Admin
            </button>
          </nav>
        </aside>

        <section className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-7xl">
            <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">{titre}</h2>
                <p className="mt-2 text-slate-500">{description}</p>
                <p className="mt-2 text-xs text-slate-400">
                  Entreprise : {entrepriseId} · Rôle : {role}
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {sauvegardeEnCours && (
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                    Synchronisation...
                  </div>
                )}

                <button
                  onClick={onDeconnexion}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  Déconnexion
                </button>

                {vueAffichee === "devis" && (
                  <button
                    onClick={onToggleFormulaireDevis}
                    className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
                  >
                    {afficherFormulaire ? "Fermer" : "Nouveau devis"}
                  </button>
                )}
              </div>
            </header>

            {children}
          </div>
        </section>
      </div>
    </main>
  );
}