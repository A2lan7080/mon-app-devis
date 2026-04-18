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

  return "text-slate-600 hover:bg-slate-100";
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
  const [menuMobileOuvert, setMenuMobileOuvert] = useState(false);

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

  useEffect(() => {
    if (!menuMobileOuvert) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [menuMobileOuvert]);

  const ouvrirVueDevisMobile = () => {
    setMenuMobileOuvert(false);
    onOuvrirVueDevis();
  };

  const ouvrirVueClientsMobile = () => {
    setMenuMobileOuvert(false);
    onOuvrirVueClients();
  };

  const ouvrirVueChantiersMobile = () => {
    setMenuMobileOuvert(false);
    onOuvrirVueChantiers();
  };

  const ouvrirVueFacturesMobile = () => {
    setMenuMobileOuvert(false);
    onOuvrirVueFactures();
  };

  const ouvrirVueAdminMobile = () => {
    setMenuMobileOuvert(false);
    onOuvrirVueAdmin();
  };

  const deconnexionMobile = () => {
    setMenuMobileOuvert(false);
    onDeconnexion();
  };

  const renderDesktopNav = () => (
    <nav className="mt-8 space-y-2">
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
  );

  const renderMobileNav = () => (
    <nav className="mt-8 space-y-2">
      <button
        onClick={ouvrirVueDevisMobile}
        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
          vueAffichee === "devis"
        )}`}
      >
        Devis
      </button>

      <button
        onClick={ouvrirVueClientsMobile}
        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
          vueAffichee === "clients"
        )}`}
      >
        Clients
      </button>

      <button
        onClick={ouvrirVueChantiersMobile}
        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
          vueAffichee === "chantiers"
        )}`}
      >
        Chantiers
      </button>

      <button
        onClick={ouvrirVueFacturesMobile}
        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
          vueAffichee === "factures"
        )}`}
      >
        Factures
      </button>

      <button
        onClick={ouvrirVueAdminMobile}
        className={`w-full rounded-xl px-4 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
          vueAffichee === "admin",
          "admin"
        )}`}
      >
        Admin
      </button>
    </nav>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-6 md:flex">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
            <p className="mt-1 text-sm text-slate-500">
              Gestion devis & pilotage
            </p>
            <p className="mt-3 text-xs text-slate-400">
              {displayName} · {entrepriseId}
            </p>
          </div>

          {renderDesktopNav()}
        </aside>

        <section className="min-w-0 flex-1 p-4 pb-28 md:p-8 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-4 rounded-2xl bg-white p-4 shadow-sm md:hidden">
              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
                <p className="mt-1 text-sm text-slate-500">
                  Gestion devis & pilotage
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {displayName} · {entrepriseId}
                </p>
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
                  className="hidden w-full rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 sm:w-auto md:inline-flex md:items-center md:justify-center"
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

      <button
        onClick={() => setMenuMobileOuvert(true)}
        className="fixed right-4 top-6 z-40 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-xl md:hidden"
      >
        Menu
      </button>

      {menuMobileOuvert && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            aria-label="Fermer le menu"
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setMenuMobileOuvert(false)}
          />

          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h2 className="text-2xl font-bold">Batiflow</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Gestion devis & pilotage
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {displayName} · {entrepriseId}
                </p>
              </div>

              <button
                onClick={() => setMenuMobileOuvert(false)}
                className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
              >
                Fermer
              </button>
            </div>

            {renderMobileNav()}

            <div className="mt-auto pt-6">
              <button
                onClick={deconnexionMobile}
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700"
              >
                Déconnexion
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}