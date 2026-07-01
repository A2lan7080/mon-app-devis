"use client";

import type { ReactNode } from "react";
import Card from "./ui/Card";

type Props = {
  totalClients: number;
  totalPros: number;
  totalParticuliers: number;
  totalArchives: number;
};

type IconName = "archive" | "building" | "home" | "users";

function KpiIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    archive: (
      <>
        <path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6" />
      </>
    ),
    building: (
      <>
        <path d="M4 21V3h11v18M15 9h5v12M8 7h3M8 11h3M8 15h3M8 19h3M18 13h.01M18 17h.01" />
      </>
    ),
    home: (
      <>
        <path d="m3 11 9-8 9 8" />
        <path d="M5 10v11h14V10M9 21v-6h6v6" />
      </>
    ),
    users: (
      <>
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
    >
      {paths[name]}
    </svg>
  );
}

type KpiCardProps = {
  label: string;
  value: number;
  description: string;
  icon: IconName;
  iconClasses: string;
  accentClasses: string;
  delay: string;
  featured?: boolean;
};

function KpiCard({
  label,
  value,
  description,
  icon,
  iconClasses,
  accentClasses,
  delay,
  featured = false,
}: KpiCardProps) {
  return (
    <Card
      variant={featured ? "info" : "default"}
      className="client-kpi-card group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)] motion-reduce:transform-none"
      style={{ animationDelay: delay }}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 ${accentClasses}`}
      />
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`text-xs font-bold uppercase tracking-[0.08em] ${
              featured ? "text-sky-700" : "text-slate-500"
            }`}
          >
            {label}
          </p>
          <p className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {value}
          </p>
        </div>

        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-105 motion-reduce:transform-none ${iconClasses}`}
        >
          <KpiIcon name={icon} />
        </span>
      </div>
      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </Card>
  );
}

export default function ClientsKpiCards({
  totalClients,
  totalPros,
  totalParticuliers,
  totalArchives,
}: Props) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Clients actifs"
          value={totalClients}
          description="Base client disponible."
          icon="users"
          iconClasses="bg-sky-100 text-sky-700"
          accentClasses="bg-gradient-to-r from-sky-400 to-sky-600"
          delay="40ms"
          featured
        />
        <KpiCard
          label="Professionnels"
          value={totalPros}
          description="Entreprises et indépendants."
          icon="building"
          iconClasses="bg-emerald-50 text-emerald-700"
          accentClasses="bg-gradient-to-r from-emerald-400 to-emerald-600"
          delay="90ms"
        />
        <KpiCard
          label="Particuliers"
          value={totalParticuliers}
          description="Clients résidentiels."
          icon="home"
          iconClasses="bg-orange-50 text-orange-700"
          accentClasses="bg-gradient-to-r from-orange-400 to-orange-600"
          delay="140ms"
        />
        <KpiCard
          label="Archivés"
          value={totalArchives}
          description="Conservés hors liste active."
          icon="archive"
          iconClasses="bg-slate-100 text-slate-700"
          accentClasses="bg-gradient-to-r from-slate-300 to-slate-500"
          delay="190ms"
        />
      </div>

      <style jsx>{`
        @keyframes client-kpi-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.client-kpi-card) {
          animation: client-kpi-in 360ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.client-kpi-card) {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
