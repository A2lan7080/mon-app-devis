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
  variant?: "default" | "hero";
};

const screenshotByKind: Record<
  ProductVisualKind,
  {
    src: string;
    alt: string;
    width: number;
    height: number;
  }
> = {
  dashboard: {
    src: "/product-screenshots/dashboard.png",
    alt: "Aperçu du tableau de bord BatiFlow",
    width: 1904,
    height: 992,
  },
  devis: {
    src: "/product-screenshots/devis.png",
    alt: "Liste de devis BatiFlow",
    width: 1919,
    height: 991,
  },
  facture: {
    src: "/product-screenshots/facture.png",
    alt: "Suivi des factures BatiFlow",
    width: 1919,
    height: 981,
  },
};

function hasPublicAsset(src: string) {
  return existsSync(path.join(process.cwd(), "public", src.replace(/^\//, "")));
}

function BrowserFrame({
  children,
  className = "",
  variant = "default",
}: {
  children: ReactNode;
  className?: string;
  variant?: "default" | "hero";
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-slate-200/80 bg-white ${
        variant === "hero"
          ? "shadow-[0_34px_95px_rgba(15,23,42,0.24)] ring-1 ring-white/70"
          : "shadow-[0_22px_65px_rgba(15,23,42,0.15)]"
      } ${className}`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <span className="hidden h-2 w-28 rounded-full bg-slate-100 sm:block" />
      </div>
      <div
        className={
          variant === "hero" ? "bg-white p-1.5 sm:p-2" : "bg-white p-1.5"
        }
      >
        {children}
      </div>
    </div>
  );
}

function DashboardFallback() {
  return (
    <div className="grid min-h-[340px] grid-cols-[58px_1fr] bg-[#F1F5F9] sm:min-h-[390px] sm:grid-cols-[86px_1fr]">
      <aside className="border-r border-slate-200 bg-[#0F172A] p-3 text-white sm:p-4">
        <div className="h-7 w-7 rounded-lg bg-white/15" />
        <div className="mt-7 grid gap-3">
          {["bg-white", "bg-white/35", "bg-white/25", "bg-white/25"].map(
            (color, index) => (
              <span
                key={`${color}-${index}`}
                className={`h-2.5 rounded-full ${color}`}
              />
            ),
          )}
        </div>
      </aside>
      <div className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-[#F97316]">
              Tableau de bord
            </p>
            <p className="mt-1 text-xl font-extrabold text-[#0F172A]">
              Activité commerciale
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-3 py-1 text-xs font-bold text-[#1E3A8A] shadow-sm">
            Avril 2026
          </span>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {[
            ["Devis envoyés", "18", "bg-blue-50"],
            ["Acceptés", "12", "bg-orange-50"],
            ["CA signé", "24 860 EUR", "bg-white"],
          ].map(([label, value, bg]) => (
            <div key={label} className={`rounded-lg ${bg} p-3 shadow-sm`}>
              <p className="text-xs font-semibold text-slate-500">{label}</p>
              <p className="mt-2 text-lg font-extrabold text-[#1E3A8A]">
                {value}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_0.72fr]">
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-sm font-bold text-[#0F172A]">
                Documents récents
              </p>
              <span className="text-xs font-bold text-[#F97316]">
                Voir tout
              </span>
            </div>
            {[
              ["DEV-2026-014", "Rénovation cuisine", "Prêt"],
              ["FAC-2026-008", "Acompte chantier", "Payée"],
              ["DEV-2026-013", "Salle de bain", "Accepté"],
            ].map(([number, label, status]) => (
              <div
                key={number}
                className="grid grid-cols-[94px_1fr_auto] gap-3 border-t border-slate-100 py-3 text-sm"
              >
                <span className="font-bold text-[#1E3A8A]">{number}</span>
                <span className="min-w-0 truncate text-slate-700">
                  {label}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
                  {status}
                </span>
              </div>
            ))}
          </div>
          <div className="rounded-lg bg-white p-4 shadow-sm">
            <p className="text-sm font-bold text-[#0F172A]">Suivi mensuel</p>
            <div className="mt-4 flex h-28 items-end gap-2">
              {[44, 68, 52, 84, 72, 92].map((height, index) => (
                <span
                  key={height + index}
                  className="flex-1 rounded-t-md bg-[#1E3A8A]"
                  style={{ height: `${height}%`, opacity: 0.42 + index * 0.08 }}
                />
              ))}
            </div>
          </div>
        </div>
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
          <p className="mt-1 text-sm text-slate-500">Rénovation cuisine</p>
        </div>
        <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F97316]">
          Prêt à envoyer
        </span>
      </div>
      <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
        <div className="grid grid-cols-[1fr_70px_100px] gap-3 bg-[#0F172A] px-4 py-3 text-xs font-bold uppercase text-white">
          <span>Prestation</span>
          <span>Qté</span>
          <span>Total</span>
        </div>
        {[
          ["Dépose ancienne cuisine", "1", "250 EUR"],
          ["Pose meubles bas et hauts", "1", "1 450 EUR"],
          ["Finitions et réglages", "1", "320 EUR"],
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
          TVA, IBAN, coordonnées et mentions utiles intégrées.
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
            Payée
          </span>
        </div>
        <div className="mt-5 grid gap-3 text-sm">
          {[
            ["Client", "Entreprise Martin"],
            ["Objet", "Acompte chantier"],
            ["Échéance", "15/05/2026"],
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
  variant = "default",
}: ProductVisualProps) {
  const screenshot = screenshotByKind[kind];
  const hasScreenshot = hasPublicAsset(screenshot.src);
  return (
    <div className={`relative ${className}`}>
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
      {variant === "hero" && (
        <div className="absolute -right-2 top-9 z-10 hidden rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-[0_18px_45px_rgba(15,23,42,0.18)] sm:block lg:-right-5">
          <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
            Devis acceptés
          </p>
          <p className="mt-1 text-2xl font-extrabold text-[#1E3A8A]">+32%</p>
        </div>
      )}
      <BrowserFrame
        variant={variant}
        className={
          variant === "hero"
            ? ""
            : "shadow-[0_18px_50px_rgba(15,23,42,0.12)]"
        }
      >
        {hasScreenshot ? (
          <div
            className={`overflow-hidden rounded-lg bg-slate-50 ${
              variant === "hero"
                ? "max-h-[330px] sm:max-h-[420px] lg:max-h-none"
                : ""
            }`}
          >
            <Image
              src={screenshot.src}
              alt={screenshot.alt}
              width={screenshot.width}
              height={screenshot.height}
              priority={priority}
              sizes={
                variant === "hero"
                  ? "(min-width: 1024px) 58vw, (min-width: 640px) 92vw, 100vw"
                  : "(min-width: 1024px) 31vw, (min-width: 768px) 50vw, 100vw"
              }
              quality={75}
              className="block h-auto w-full"
            />
          </div>
        ) : (
          <ProductFallback kind={kind} />
        )}
      </BrowserFrame>
    </div>
  );
}
