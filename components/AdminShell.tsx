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

function getNavButtonClasses(estActif: boolean, variante: "standard" | "admin" = "standard") {
  if (estActif && variante === "admin") {
    return "bg-amber-100 text-amber-800";
  }

  if (estActif) {
    return "bg-slate-900 text-white";
  }

  return "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50";
}

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
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                vueAffichee === "devis"
              )}`}
            >
              Devis
            </button>

            <button
              onClick={onOuvrirVueClients}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                vueAffichee === "clients"
              )}`}
            >
              Clients
            </button>

            <button
              onClick={onOuvrirVueChantiers}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                vueAffichee === "chantiers"
              )}`}
            >
              Chantiers
            </button>

            <button
              onClick={onOuvrirVueFactures}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                vueAffichee === "factures"
              )}`}
            >
              Factures
            </button>

            <button
              onClick={onOuvrirVueAdmin}
              className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                vueAffichee === "admin",
                "admin"
              )}`}
            >
              Admin
            </button>
          </nav>
        </aside>

        <section className="flex-1 p-4 md:p-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm md:hidden">
              <div className="flex flex-col gap-3">
                <div>
                  <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Gestion devis & pilotage
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {displayName} · {entrepriseId}
                  </p>
                </div>

                <div className="-mx-1 overflow-x-auto">
                  <div className="flex min-w-max gap-2 px-1 pb-1">
                    <button
                      onClick={onOuvrirVueDevis}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "devis"
                      )}`}
                    >
                      Devis
                    </button>

                    <button
                      onClick={onOuvrirVueClients}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "clients"
                      )}`}
                    >
                      Clients
                    </button>

                    <button
                      onClick={onOuvrirVueChantiers}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "chantiers"
                      )}`}
                    >
                      Chantiers
                    </button>

                    <button
                      onClick={onOuvrirVueFactures}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "factures"
                      )}`}
                    >
                      Factures
                    </button>

                    <button
                      onClick={onOuvrirVueAdmin}
                      className={`rounded-xl px-4 py-3 text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "admin",
                        "admin"
                      )}`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <header className="mb-6 flex flex-col gap-4 rounded-2xl bg-white p-4 shadow-sm md:mb-8 md:p-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold md:text-3xl">{titre}</h2>
                <p className="mt-2 text-sm text-slate-500 md:text-base">
                  {description}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Entreprise : {entrepriseId} · Rôle : {role}
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                {sauvegardeEnCours && (
                  <div className="rounded-xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-600">
                    Synchronisation...
                  </div>
                )}

                <button
                  onClick={onDeconnexion}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                >
                  Déconnexion
                </button>

                {vueAffichee === "devis" && (
                  <button
                    onClick={onToggleFormulaireDevis}
                    className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
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