"use client";

import type { ReactNode } from "react";
import Card from "./ui/Card";

type Props = {
  totalChantiers: number;
  totalPlanifies: number;
  totalEnCours: number;
  totalArchives: number;
};

type IconName = "archive" | "calendar" | "construction" | "tool";

function KpiIcon({ name }: { name: IconName }) {
  const paths: Record<IconName, ReactNode> = {
    archive: (
      <>
        <path d="M4 7h16v13H4zM3 3h18v4H3zM9 11h6" />
      </>
    ),
    calendar: (
      <>
        <rect x="3" y="5" width="18" height="16" rx="2" />
        <path d="M16 3v4M8 3v4M3 10h18M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01" />
      </>
    ),
    construction: (
      <>
        <path d="M4 21h16M6 21V9h12v12M9 9V5h6v4M9 13h2M13 13h2M9 17h2M13 17h2" />
        <path d="m3 9 9-6 9 6" />
      </>
    ),
    tool: (
      <>
        <path d="M14.7 6.3a4 4 0 0 0-5-5L12 3.6 9.6 6 7.3 3.7a4 4 0 0 0 5 5L20 16.4a2.1 2.1 0 0 1-3 3l-7.7-7.7" />
        <path d="m5 13-3 3 6 6 3-3" />
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
      variant={featured ? "accent" : "default"}
      className="chantier-kpi-card group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)] motion-reduce:transform-none"
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
              featured ? "text-orange-700" : "text-slate-500"
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

export default function ChantiersKpiCards({
  totalChantiers,
  totalPlanifies,
  totalEnCours,
  totalArchives,
}: Props) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Chantiers actifs"
          value={totalChantiers}
          description="Travaux actuellement suivis."
          icon="construction"
          iconClasses="bg-white text-orange-700 shadow-sm"
          accentClasses="bg-gradient-to-r from-orange-400 to-orange-600"
          delay="40ms"
          featured
        />
        <KpiCard
          label="Planifiés"
          value={totalPlanifies}
          description="Prêts à démarrer."
          icon="calendar"
          iconClasses="bg-sky-50 text-sky-700"
          accentClasses="bg-gradient-to-r from-sky-400 to-sky-600"
          delay="90ms"
        />
        <KpiCard
          label="En cours"
          value={totalEnCours}
          description="Interventions en activité."
          icon="tool"
          iconClasses="bg-emerald-50 text-emerald-700"
          accentClasses="bg-gradient-to-r from-emerald-400 to-emerald-600"
          delay="140ms"
        />
        <KpiCard
          label="Archivés"
          value={totalArchives}
          description="Conservés hors suivi actif."
          icon="archive"
          iconClasses="bg-slate-100 text-slate-700"
          accentClasses="bg-gradient-to-r from-slate-300 to-slate-500"
          delay="190ms"
        />
      </div>

      <style jsx>{`
        @keyframes chantier-kpi-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.chantier-kpi-card) {
          animation: chantier-kpi-in 360ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.chantier-kpi-card) {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
