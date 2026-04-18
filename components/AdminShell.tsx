"use client";

import { useEffect, useState, type ReactNode } from "react";

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

function getNavButtonClasses(
  estActif: boolean,
  variante: "standard" | "admin" = "standard"
) {
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
  const [mobileMenuOuvert, setMobileMenuOuvert] = useState(false);

  useEffect(() => {
    if (!mobileMenuOuvert) return;

    const precedentOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = precedentOverflow;
    };
  }, [mobileMenuOuvert]);

  const fermerMenuMobile = () => setMobileMenuOuvert(false);

  const ouvrirVueEtFermerMenu = (callback: () => void) => {
    callback();
    fermerMenuMobile();
  };

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
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
                  <p className="mt-1 text-sm text-slate-500">
                    Gestion devis & pilotage
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {displayName} · {entrepriseId}
                  </p>
                </div>

                <button
                  onClick={() => setMobileMenuOuvert(true)}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                  aria-label="Ouvrir le menu"
                >
                  <span className="text-xl leading-none">☰</span>
                </button>
              </div>
            </div>

            {mobileMenuOuvert && (
              <div className="fixed inset-0 z-50 md:hidden">
                <button
                  onClick={fermerMenuMobile}
                  className="absolute inset-0 bg-slate-900/30"
                  aria-label="Fermer le menu"
                />

                <div className="absolute right-0 top-0 flex h-full w-[86%] max-w-sm flex-col bg-white p-5 shadow-2xl">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="text-2xl font-bold">Batiflow</h2>
                      <p className="mt-1 text-sm text-slate-500">
                        Gestion devis & pilotage
                      </p>
                      <p className="mt-3 text-xs text-slate-400">
                        {displayName} · {entrepriseId}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        Rôle : {role}
                      </p>
                    </div>

                    <button
                      onClick={fermerMenuMobile}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                      aria-label="Fermer le menu"
                    >
                      <span className="text-xl leading-none">×</span>
                    </button>
                  </div>

                  <nav className="mt-8 space-y-3">
                    <button
                      onClick={() => ouvrirVueEtFermerMenu(onOuvrirVueDevis)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "devis"
                      )}`}
                    >
                      Devis
                    </button>

                    <button
                      onClick={() => ouvrirVueEtFermerMenu(onOuvrirVueClients)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "clients"
                      )}`}
                    >
                      Clients
                    </button>

                    <button
                      onClick={() => ouvrirVueEtFermerMenu(onOuvrirVueChantiers)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "chantiers"
                      )}`}
                    >
                      Chantiers
                    </button>

                    <button
                      onClick={() => ouvrirVueEtFermerMenu(onOuvrirVueFactures)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "factures"
                      )}`}
                    >
                      Factures
                    </button>

                    <button
                      onClick={() => ouvrirVueEtFermerMenu(onOuvrirVueAdmin)}
                      className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
                        vueAffichee === "admin",
                        "admin"
                      )}`}
                    >
                      Admin
                    </button>
                  </nav>

                  <div className="mt-auto pt-6">
                    <button
                      onClick={() => {
                        fermerMenuMobile();
                        onDeconnexion();
                      }}
                      className="w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
                    >
                      Déconnexion
                    </button>
                  </div>
                </div>
              </div>
            )}

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
                  className="hidden rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 md:inline-flex"
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