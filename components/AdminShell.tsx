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
  onClick: () => void;
  variante?: "standard" | "admin";
};

function getNavButtonClasses(
  estActif: boolean,
  variante: "standard" | "admin" = "standard"
) {
  if (estActif && variante === "admin") {
    return "border-amber-200 bg-amber-50 text-amber-800 shadow-sm";
  }

  if (estActif) {
    return "border-slate-900 bg-slate-900 text-white shadow-sm";
  }

  return "border-transparent text-slate-600 hover:border-slate-200 hover:bg-slate-50 hover:text-slate-900";
}

function getPageAccent(vue: VuePrincipale) {
  switch (vue) {
    case "devis":
      return {
        badge: "bg-blue-50 text-blue-700 border-blue-100",
        dot: "bg-blue-500",
        subtitle: "Crée, suis et envoie tes devis clients.",
      };
    case "clients":
      return {
        badge: "bg-emerald-50 text-emerald-700 border-emerald-100",
        dot: "bg-emerald-500",
        subtitle: "Centralise les coordonnées et informations clients.",
      };
    case "chantiers":
      return {
        badge: "bg-orange-50 text-orange-700 border-orange-100",
        dot: "bg-orange-500",
        subtitle: "Suis les chantiers, statuts, dates et notes.",
      };
    case "factures":
      return {
        badge: "bg-violet-50 text-violet-700 border-violet-100",
        dot: "bg-violet-500",
        subtitle: "Gère les factures, paiements et relances.",
      };
    case "admin":
      return {
        badge: "bg-amber-50 text-amber-800 border-amber-100",
        dot: "bg-amber-500",
        subtitle: "Pilote les réglages, la bibliothèque et la valeur business.",
      };
    default:
      return {
        badge: "bg-slate-50 text-slate-700 border-slate-100",
        dot: "bg-slate-500",
        subtitle: "Tableau de bord BatiFlow.",
      };
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

  const navDesktop: NavItem[] = [
    {
      id: "devis",
      label: "Devis",
      icon: "📄",
      accent: "bg-blue-50 text-blue-700",
      onClick: onOuvrirVueDevis,
    },
    {
      id: "clients",
      label: "Clients",
      icon: "👤",
      accent: "bg-emerald-50 text-emerald-700",
      onClick: onOuvrirVueClients,
    },
    {
      id: "chantiers",
      label: "Chantiers",
      icon: "🏗️",
      accent: "bg-orange-50 text-orange-700",
      onClick: onOuvrirVueChantiers,
    },
    {
      id: "factures",
      label: "Factures",
      icon: "🧾",
      accent: "bg-violet-50 text-violet-700",
      onClick: onOuvrirVueFactures,
    },
    {
      id: "admin",
      label: "Admin",
      icon: "⚙️",
      accent: "bg-amber-50 text-amber-800",
      onClick: onOuvrirVueAdmin,
      variante: "admin",
    },
  ];

  const navMobile: NavItem[] = [
    {
      id: "devis",
      label: "Devis",
      icon: "📄",
      accent: "bg-blue-50 text-blue-700",
      onClick: ouvrirVueDevisMobile,
    },
    {
      id: "clients",
      label: "Clients",
      icon: "👤",
      accent: "bg-emerald-50 text-emerald-700",
      onClick: ouvrirVueClientsMobile,
    },
    {
      id: "chantiers",
      label: "Chantiers",
      icon: "🏗️",
      accent: "bg-orange-50 text-orange-700",
      onClick: ouvrirVueChantiersMobile,
    },
    {
      id: "factures",
      label: "Factures",
      icon: "🧾",
      accent: "bg-violet-50 text-violet-700",
      onClick: ouvrirVueFacturesMobile,
    },
    {
      id: "admin",
      label: "Admin",
      icon: "⚙️",
      accent: "bg-amber-50 text-amber-800",
      onClick: ouvrirVueAdminMobile,
      variante: "admin",
    },
  ];

  const renderNav = (items: NavItem[]) => (
    <nav className="mt-8 space-y-2">
      {items.map((item) => {
        const estActif = vueAffichee === item.id;

        return (
          <button
            key={item.id}
            onClick={item.onClick}
            className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left text-sm font-medium transition ${getNavButtonClasses(
              estActif,
              item.variante ?? "standard"
            )}`}
          >
            <span
              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-base ${
                estActif ? "bg-white/15 text-white" : item.accent
              }`}
            >
              {item.icon}
            </span>

            <span className="min-w-0 flex-1 truncate">{item.label}</span>

            {estActif && (
              <span className="h-2 w-2 shrink-0 rounded-full bg-current opacity-80" />
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
                <div>
                  <h1 className="text-2xl font-bold leading-tight">
                    Batiflow
                  </h1>
                  <p className="text-xs text-slate-400">
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
                      <span
                        className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold ${accentPage.badge}`}
                      >
                        <span
                          className={`h-2 w-2 rounded-full ${accentPage.dot}`}
                        />
                        Espace {titre}
                      </span>

                      {sauvegardeEnCours && (
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
                          Synchronisation...
                        </span>
                      )}
                    </div>

                    <h2 className="text-2xl font-bold md:text-3xl">{titre}</h2>
                    <p className="mt-2 text-sm text-slate-500">
                      {accentPage.subtitle}
                    </p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                    {vueAffichee === "devis" && (
                      <button
                        onClick={onToggleFormulaireDevis}
                        className="w-full rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90 sm:w-auto"
                      >
                        {afficherFormulaire ? "Fermer" : "Nouveau devis"}
                      </button>
                    )}
                  </div>
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

          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-900 text-base font-black text-white">
                    B
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-2xl font-bold">Batiflow</h2>
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

            {renderNav(navMobile)}

            <div className="mt-auto pt-6">
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