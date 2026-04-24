"use client";

import { useEffect, useState, type ReactNode } from "react";
import AccountPanel from "./AccountPanel";

type VuePrincipale =
  | "devis"
  | "clients"
  | "chantiers"
  | "factures"
  | "admin";

type Props = {
  vueAffichee: VuePrincipale;
  displayName: string;
  email: string;
  entrepriseId: string;
  entrepriseNom?: string;
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

type NavItem = {
  id: VuePrincipale;
  label: string;
  icon: string;
  accent: string;
  activeButton: string;
  activeDot: string;
  onClick: () => void;
};

function getPageAccent(vue: VuePrincipale) {
  switch (vue) {
    case "devis":
      return {
        dot: "bg-blue-500",
        subtitle: "Crée, suis et envoie tes devis clients.",
      };
    case "clients":
      return {
        dot: "bg-emerald-500",
        subtitle: "Centralise les coordonnées et informations clients.",
      };
    case "chantiers":
      return {
        dot: "bg-orange-500",
        subtitle: "Suis les chantiers, statuts, dates et notes.",
      };
    case "factures":
      return {
        dot: "bg-violet-500",
        subtitle: "Gère les factures, paiements et relances.",
      };
    case "admin":
      return {
        dot: "bg-amber-500",
        subtitle: "Pilote les réglages, la bibliothèque et la valeur business.",
      };
    default:
      return {
        dot: "bg-slate-500",
        subtitle: "Tableau de bord BatiFlow.",
      };
  }
}

function getActionPrincipale(vue: VuePrincipale, afficherFormulaire: boolean) {
  switch (vue) {
    case "devis":
      return afficherFormulaire ? "Fermer" : "Nouveau devis";
    case "clients":
      return "Nouveau client";
    case "chantiers":
      return "Nouveau chantier";
    case "factures":
      return "Nouvelle facture";
    case "admin":
      return "";
    default:
      return "";
  }
}

export default function AdminShell({
  vueAffichee,
  displayName,
  email,
  entrepriseId,
  entrepriseNom,
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
      : "Admin";

  const accentPage = getPageAccent(vueAffichee);
  const actionPrincipale = getActionPrincipale(vueAffichee, afficherFormulaire);

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

  const handleActionPrincipale = () => {
    if (vueAffichee === "devis") {
      onToggleFormulaireDevis();
      return;
    }

    if (vueAffichee === "clients") {
      window.dispatchEvent(new CustomEvent("batiflow:nouveau-client"));
      return;
    }

    if (vueAffichee === "chantiers") {
      window.dispatchEvent(new CustomEvent("batiflow:nouveau-chantier"));
      return;
    }

    if (vueAffichee === "factures") {
      window.dispatchEvent(new CustomEvent("batiflow:nouvelle-facture"));
    }
  };

  const navDesktop: NavItem[] = [
    {
      id: "devis",
      label: "Devis",
      icon: "📄",
      accent: "bg-blue-50 text-blue-700",
      activeButton: "border-blue-200 bg-blue-50 text-blue-800 shadow-sm",
      activeDot: "bg-blue-500",
      onClick: onOuvrirVueDevis,
    },
    {
      id: "clients",
      label: "Clients",
      icon: "👤",
      accent: "bg-emerald-50 text-emerald-700",
      activeButton:
        "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm",
      activeDot: "bg-emerald-500",
      onClick: onOuvrirVueClients,
    },
    {
      id: "chantiers",
      label: "Chantiers",
      icon: "🏗️",
      accent: "bg-orange-50 text-orange-700",
      activeButton: "border-orange-200 bg-orange-50 text-orange-800 shadow-sm",
      activeDot: "bg-orange-500",
      onClick: onOuvrirVueChantiers,
    },
    {
      id: "factures",
      label: "Factures",
      icon: "🧾",
      accent: "bg-violet-50 text-violet-700",
      activeButton: "border-violet-200 bg-violet-50 text-violet-800 shadow-sm",
      activeDot: "bg-violet-500",
      onClick: onOuvrirVueFactures,
    },
    {
      id: "admin",
      label: "Admin",
      icon: "⚙️",
      accent: "bg-amber-50 text-amber-800",
      activeButton: "border-amber-200 bg-amber-50 text-amber-800 shadow-sm",
      activeDot: "bg-amber-500",
      onClick: onOuvrirVueAdmin,
    },
  ];

  const navMobile: NavItem[] = [
    {
      id: "devis",
      label: "Devis",
      icon: "📄",
      accent: "bg-blue-50 text-blue-700",
      activeButton: "border-blue-200 bg-blue-50 text-blue-800 shadow-sm",
      activeDot: "bg-blue-500",
      onClick: ouvrirVueDevisMobile,
    },
    {
      id: "clients",
      label: "Clients",
      icon: "👤",
      accent: "bg-emerald-50 text-emerald-700",
      activeButton:
        "border-emerald-200 bg-emerald-50 text-emerald-800 shadow-sm",
      activeDot: "bg-emerald-500",
      onClick: ouvrirVueClientsMobile,
    },
    {
      id: "chantiers",
      label: "Chantiers",
      icon: "🏗️",
      accent: "bg-orange-50 text-orange-700",
      activeButton: "border-orange-200 bg-orange-50 text-orange-800 shadow-sm",
      activeDot: "bg-orange-500",
      onClick: ouvrirVueChantiersMobile,
    },
    {
      id: "factures",
      label: "Factures",
      icon: "🧾",
      accent: "bg-violet-50 text-violet-700",
      activeButton: "border-violet-200 bg-violet-50 text-violet-800 shadow-sm",
      activeDot: "bg-violet-500",
      onClick: ouvrirVueFacturesMobile,
    },
    {
      id: "admin",
      label: "Admin",
      icon: "⚙️",
      accent: "bg-amber-50 text-amber-800",
      activeButton: "border-amber-200 bg-amber-50 text-amber-800 shadow-sm",
      activeDot: "bg-amber-500",
      onClick: ouvrirVueAdminMobile,
    },
  ];

  const renderNav = (items: NavItem[], compact = false) => (
    <nav className={compact ? "mt-5 space-y-1.5" : "mt-8 space-y-2"}>
      {items.map((item) => {
        const estActif = vueAffichee === item.id;

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex w-full items-center gap-3 rounded-xl border text-left font-medium transition ${
              compact ? "px-3 py-2.5 text-sm" : "px-3 py-3 text-sm"
            } ${
              estActif
                ? item.activeButton
                : "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900"
            }`}
          >
            <span
              className={`flex shrink-0 items-center justify-center rounded-xl text-base ${
                compact ? "h-8 w-8" : "h-9 w-9"
              } ${item.accent}`}
            >
              {item.icon}
            </span>

            <span className="min-w-0 flex-1 truncate">{item.label}</span>

            {estActif && (
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${item.activeDot}`}
              />
            )}
          </button>
        );
      })}
    </nav>
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white p-6 md:flex">
          <div>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-base font-black text-white">
                B
              </div>

              <div className="min-w-0">
                <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
                <p className="mt-0.5 truncate text-xs text-slate-400">
                  {entrepriseNom || entrepriseId}
                </p>
              </div>
            </div>
          </div>

          {renderNav(navDesktop)}

          <div className="mt-auto pt-6">
            <AccountPanel
              mode="menu"
              displayName={displayName}
              email={email}
              role={role}
              entrepriseId={entrepriseId}
              entrepriseNom={entrepriseNom}
              onDeconnexion={onDeconnexion}
            />
          </div>
        </aside>

        <section className="min-w-0 flex-1 p-4 pb-28 md:p-8 md:pb-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-3 rounded-2xl bg-white p-4 shadow-sm md:hidden">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
                  B
                </div>

                <div className="min-w-0">
                  <h1 className="text-2xl font-bold leading-tight">
                    Batiflow
                  </h1>
                  <p className="truncate text-xs text-slate-400">
                    {entrepriseNom || entrepriseId}
                  </p>
                </div>
              </div>
            </div>

            <header className="mb-4 overflow-hidden rounded-2xl bg-white shadow-sm md:mb-8">
              <div className="border-b border-slate-100 bg-gradient-to-r from-white via-slate-50 to-white p-4 md:p-6">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <div className="mb-3 flex flex-wrap items-center gap-2">
                      {sauvegardeEnCours && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Synchronisation...
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`h-3 w-3 shrink-0 rounded-full ${accentPage.dot}`}
                      />
                      <h2 className="text-2xl font-bold md:text-3xl">
                        {titre}
                      </h2>
                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {accentPage.subtitle}
                    </p>
                  </div>

                  {actionPrincipale && (
                    <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                      <button
                        onClick={handleActionPrincipale}
                        className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                      >
                        {actionPrincipale}
                      </button>
                    </div>
                  )}
                </div>
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

          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <div className="shrink-0 border-b border-slate-100 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-black text-white">
                      B
                    </div>

                    <div className="min-w-0">
                      <h2 className="text-xl font-bold">Batiflow</h2>
                      <p className="mt-0.5 truncate text-xs text-slate-400">
                        {entrepriseNom || entrepriseId}
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setMenuMobileOuvert(false)}
                  className="shrink-0 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700"
                >
                  Fermer
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">
              {renderNav(navMobile, true)}
            </div>

            <div className="shrink-0 border-t border-slate-100 bg-white p-4">
              <AccountPanel
                mode="menu"
                displayName={displayName}
                email={email}
                role={role}
                entrepriseId={entrepriseId}
                entrepriseNom={entrepriseNom}
                onDeconnexion={onDeconnexion}
                onCloseMenu={() => setMenuMobileOuvert(false)}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}