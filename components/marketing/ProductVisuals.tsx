import { existsSync } from "node:fs";
import path from "node:path";
import Image from "next/image";
import type { ReactNode } from "react";

type ProductVisualKind = "dashboard" | "devis" | "facture";

type ProductVisualProps = {
  kind: ProductVisualKind;
  eyebrow?: string;
  title?: string;
  className?: string;
  priority?: boolean;
};

const screenshotByKind: Record<ProductVisualKind, string> = {
  dashboard: "/product-screenshots/dashboard.png",
  devis: "/product-screenshots/devis.png",
  facture: "/product-screenshots/facture.png",
};

function hasPublicAsset(src: string) {
  return existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function BrowserFrame({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-lg border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.16)] ${className}`}
    >
      <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
        <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
      </div>
      {children}
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="bg-[#F1F5F9] p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">
            Tableau de bord
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0F172A]">
            Activite commerciale
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#1E3A8A] px-3 py-1 text-xs font-bold text-white">
          Avril 2026
        </span>
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          ["Devis envoyes", "18"],
          ["Acceptes", "12"],
          ["CA signe", "24 860 EUR"],
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg bg-white p-3 shadow-sm">
            <p className="text-xs font-semibold text-slate-500">{label}</p>
            <p className="mt-2 text-lg font-extrabold text-[#1E3A8A]">
              {value}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm font-bold text-[#0F172A]">Documents recents</p>
          <span className="text-xs font-bold text-[#F97316]">Voir tout</span>
        </div>
        {[
          ["DEV-2026-014", "Renovation cuisine", "Pret a envoyer"],
          ["FAC-2026-008", "Acompte chantier", "Payee"],
          ["DEV-2026-013", "Salle de bain", "Accepte"],
        ].map(([number, label, status]) => (
          <div
            key={number}
            className="grid grid-cols-[104px_1fr_auto] gap-3 border-t border-slate-100 py-3 text-sm"
          >
            <span className="font-bold text-[#1E3A8A]">{number}</span>
            <span className="min-w-0 truncate text-slate-700">{label}</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function DevisFallback() {
  return (
    <div className="bg-white p-4 sm:p-5">
      <div className="flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">
            Devis
          </p>
          <p className="mt-1 text-xl font-extrabold text-[#0F172A]">
            DEV-2026-014
          </p>
          <p className="mt-1 text-sm text-slate-500">Renovation cuisine</p>
        </div>
        <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F97316]">
          Pret a envoyer
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-[1fr_70px_100px] gap-3 bg-[#0F172A] px-4 py-3 text-xs font-bold uppercase text-white">
          <span>Prestation</span>
          <span>Qte</span>
          <span>Total</span>
        </div>
        {[
          ["Depose ancienne cuisine", "1", "250 EUR"],
          ["Pose meubles bas et hauts", "1", "1 450 EUR"],
          ["Finitions et reglages", "1", "320 EUR"],
        ].map(([label, qty, total]) => (
          <div
            key={label}
            className="grid grid-cols-[1fr_70px_100px] gap-3 border-t border-slate-200 px-4 py-3 text-sm"
          >
            <span className="min-w-0 truncate font-semibold text-slate-800">
              {label}
            </span>
            <span className="text-slate-600">{qty}</span>
            <span className="font-bold text-slate-900">{total}</span>
          </div>
        ))}
      </div>
      <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_180px]">
        <div className="rounded-lg bg-[#F1F5F9] p-4 text-sm leading-6 text-slate-700">
          TVA, IBAN, coordonnees et mentions utiles integrees.
        </div>
        <div className="rounded-lg bg-[#1E3A8A] p-4 text-white">
          <p className="text-sm font-semibold text-blue-100">Total TTC</p>
          <p className="mt-1 text-2xl font-extrabold">2 444,20 EUR</p>
        </div>
      </div>
    </div>
  );
}

function FactureFallback() {
  return (
    <div className="bg-[#F8FAFC] p-4 sm:p-5">
      <div className="rounded-lg bg-white p-5 shadow-sm">
        <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <p className="text-sm font-extrabold text-[#1E3A8A]">BatiFlow</p>
            <p className="mt-2 text-2xl font-extrabold text-[#0F172A]">
              Facture FAC-2026-008
            </p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700">
            Payee
          </span>
        </div>
        <div className="mt-5 grid gap-3 text-sm">
          {[
            ["Client", "Entreprise Martin"],
            ["Objet", "Acompte chantier"],
            ["Echeance", "15/05/2026"],
          ].map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4">
              <span className="font-semibold text-slate-500">{label}</span>
              <span className="text-right font-bold text-slate-900">
                {value}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-slate-200 bg-[#F1F5F9] p-4">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-slate-600">Sous-total HT</span>
            <span className="font-bold text-slate-900">4 200,00 EUR</span>
          </div>
          <div className="mt-3 flex justify-between text-sm">
            <span className="font-semibold text-slate-600">TVA</span>
            <span className="font-bold text-slate-900">882,00 EUR</span>
          </div>
          <div className="mt-4 flex justify-between border-t border-slate-300 pt-4">
            <span className="font-extrabold text-[#0F172A]">Total TTC</span>
            <span className="text-xl font-extrabold text-[#1E3A8A]">
              5 082,00 EUR
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

function ProductFallback({ kind }: { kind: ProductVisualKind }) {
  if (kind === "dashboard") {
    return <DashboardFallback />;
  }

  if (kind === "facture") {
    return <FactureFallback />;
  }

  return <DevisFallback />;
}

export default function ProductVisual({
  kind,
  eyebrow,
  title,
  className = "",
  priority = false,
}: ProductVisualProps) {
  const src = screenshotByKind[kind];
  const hasScreenshot = hasPublicAsset(src);
  const fallbackTitle =
    title ??
    (kind === "dashboard"
      ? "Vue d'ensemble BatiFlow"
      : kind === "devis"
        ? "Creation de devis"
        : "Apercu facture");

  return (
    <div className={className}>
      {(eyebrow || title) && (
        <div className="mb-4">
          {eyebrow && (
            <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">
              {eyebrow}
            </p>
          )}
          {title && (
            <h3 className="mt-2 text-xl font-extrabold text-[#0F172A]">
              {title}
            </h3>
          )}
        </div>
      )}
      <BrowserFrame>
        {hasScreenshot ? (
          <Image
            src={src}
            alt={fallbackTitle}
            width={1440}
            height={900}
            priority={priority}
            className="aspect-[16/10] w-full object-cover"
          />
        ) : (
          <ProductFallback kind={kind} />
        )}
      </BrowserFrame>
    </div>
  );
}
