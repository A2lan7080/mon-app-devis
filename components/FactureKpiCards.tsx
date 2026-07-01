"use client";

import { formatMontant } from "../lib/devis-helpers";
import Card from "./ui/Card";

type Props = {
  totalFactures: number;
  totalPayees: number;
  totalRetard: number;
  totalNetFacture: number;
};

type FactureKpiIcon = "alert" | "check" | "invoice" | "revenue";

function KpiIcon({ name }: { name: FactureKpiIcon }) {
  const paths: Record<FactureKpiIcon, React.ReactNode> = {
    alert: (
      <>
        <path d="M10.3 3.5 2.7 17a2 2 0 0 0 1.8 3h15a2 2 0 0 0 1.8-3L13.7 3.5a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    invoice: (
      <>
        <path d="M6 2h12v20l-3-2-3 2-3-2-3 2Z" />
        <path d="M9 7h6M9 11h6M9 15h4" />
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
  icon: FactureKpiIcon;
  iconClasses: string;
  accentClasses: string;
  delay: string;
  featured?: boolean;
  danger?: boolean;
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
  danger = false,
}: KpiCardProps) {
  return (
    <Card
      variant={featured ? "accent" : "default"}
      className={`facture-kpi-card group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)] motion-reduce:transform-none ${
        danger && value !== "0" ? "border-red-200" : "hover:border-slate-300"
      }`}
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
              featured
                ? "text-orange-700"
                : danger && value !== "0"
                  ? "text-red-700"
                  : "text-slate-500"
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

export default function FactureKpiCards({
  totalFactures,
  totalPayees,
  totalRetard,
  totalNetFacture,
}: Props) {
  return (
    <>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:mb-6 sm:gap-4 xl:grid-cols-4">
        <KpiCard
          label="Factures actives"
          value={String(totalFactures)}
          description="Documents actuellement en suivi."
          icon="invoice"
          iconClasses="bg-sky-50 text-sky-700"
          accentClasses="bg-gradient-to-r from-sky-400 to-sky-600"
          delay="40ms"
        />
        <KpiCard
          label="Payées"
          value={String(totalPayees)}
          description="Paiements déjà confirmés."
          icon="check"
          iconClasses="bg-emerald-50 text-emerald-700"
          accentClasses="bg-gradient-to-r from-emerald-400 to-emerald-600"
          delay="90ms"
        />
        <KpiCard
          label="En retard"
          value={String(totalRetard)}
          description="Factures à surveiller ou relancer."
          icon="alert"
          iconClasses="bg-red-50 text-red-700"
          accentClasses="bg-gradient-to-r from-red-400 to-red-600"
          delay="140ms"
          danger
        />
        <KpiCard
          label="Net facturé"
          value={formatMontant(totalNetFacture)}
          description="Total hors factures annulées."
          icon="revenue"
          iconClasses="bg-white text-orange-700 shadow-sm"
          accentClasses="bg-gradient-to-r from-orange-400 to-orange-600"
          delay="190ms"
          featured
        />
      </div>

      <style jsx>{`
        @keyframes facture-kpi-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.facture-kpi-card) {
          animation: facture-kpi-in 360ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.facture-kpi-card) {
            animation: none;
          }
        }
      `}</style>
    </>
  );
}
