"use client";

import { formatMontant } from "../lib/devis-helpers";
import Card from "./ui/Card";

type Props = {
  totalDevis: number;
  totalBrouillons: number;
  totalAcceptes: number;
  caSigne: number;
};

type KpiIconName = "check" | "document" | "draft" | "revenue";

function KpiIcon({ name }: { name: KpiIconName }) {
  const paths: Record<KpiIconName, React.ReactNode> = {
    check: <path d="m5 12 4 4L19 6" />,
    document: (
      <>
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
        <path d="M14 2v6h6M8 13h8M8 17h5" />
      </>
    ),
    draft: (
      <>
        <path d="M12 20h9" />
        <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z" />
      </>
    ),
    revenue: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M15.5 8.5c-.7-.7-1.7-1-3-1-1.7 0-3 .8-3 2s1.1 1.8 3 2 3 .8 3 2-1.3 2-3 2c-1.3 0-2.4-.4-3-1.1M12 5.5v13" />
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
  value: string;
  description: string;
  icon: KpiIconName;
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
      className="devis-kpi-card group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)] motion-reduce:transform-none"
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
          <p
            className={`mt-2 font-bold tracking-tight text-slate-950 ${
              featured
                ? "whitespace-nowrap text-xl sm:text-2xl"
                : "break-words text-2xl sm:text-3xl"
            }`}
          >
            {value}
          </p>
        </div>

        <span
          className={`h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-105 motion-reduce:transform-none ${
            featured ? "hidden sm:flex" : "flex"
          } ${iconClasses}`}
        >
          <KpiIcon name={icon} />
        </span>
      </div>

      <p className="mt-3 text-xs leading-5 text-slate-500">{description}</p>
    </Card>
  );
}

export default function DevisKpiCards({
  totalDevis,
  totalBrouillons,
  totalAcceptes,
  caSigne,
}: Props) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Total devis"
          value={String(totalDevis)}
          description="Tous les devis actuellement enregistrés."
          icon="document"
          iconClasses="bg-sky-50 text-sky-700"
          accentClasses="bg-gradient-to-r from-sky-400 to-sky-600"
          delay="40ms"
        />
        <KpiCard
          label="Brouillons"
          value={String(totalBrouillons)}
          description="À finaliser avant de les envoyer aux clients."
          icon="draft"
          iconClasses="bg-slate-100 text-slate-700"
          accentClasses="bg-gradient-to-r from-slate-300 to-slate-500"
          delay="90ms"
        />
        <KpiCard
          label="Acceptés"
          value={String(totalAcceptes)}
          description="Propositions déjà validées par les clients."
          icon="check"
          iconClasses="bg-emerald-50 text-emerald-700"
          accentClasses="bg-gradient-to-r from-emerald-400 to-emerald-600"
          delay="140ms"
        />
        <KpiCard
          label="CA signé"
          value={formatMontant(caSigne)}
          description="Montant confirmé par les devis acceptés."
          icon="revenue"
          iconClasses="bg-white text-orange-700 shadow-sm"
          accentClasses="bg-gradient-to-r from-orange-400 to-orange-600"
          delay="190ms"
          featured
        />
      </div>

      <style jsx>{`
        @keyframes devis-kpi-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.devis-kpi-card) {
          animation: devis-kpi-in 360ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.devis-kpi-card) {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
