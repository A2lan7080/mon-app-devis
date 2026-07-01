"use client";

import Link from "next/link";
import { formatMontant } from "../lib/devis-helpers";
import Badge, { type BadgeTone } from "./ui/Badge";
import Card from "./ui/Card";
import SectionHeader from "./ui/SectionHeader";

type AdminDashboardProps = {
  valeurBusinessTotale: number;
  caSigne: number;
  totalEnvoyes: number;
  pipeEnvoye: number;
  pipeBrouillon: number;
  tauxConversion: number;
  totalDevis: number;
  ticketMoyen: number;
  totalArchives: number;
  totalBrouillons: number;
  totalAcceptes: number;
  totalRefuses: number;
};

type DashboardIconName =
  | "activity"
  | "archive"
  | "arrow"
  | "check"
  | "document"
  | "draft"
  | "send"
  | "sparkles"
  | "target"
  | "ticket";

function DashboardIcon({ name }: { name: DashboardIconName }) {
  const paths: Record<DashboardIconName, React.ReactNode> = {
    activity: (
      <>
        <path d="M3 12h4l2.5-7 5 14 2.5-7h4" />
      </>
    ),
    archive: (
      <>
        <path d="M4 7h16v13H4z" />
        <path d="M3 3h18v4H3zM9 11h6" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14" />
        <path d="m13 6 6 6-6 6" />
      </>
    ),
    check: (
      <>
        <path d="m5 12 4 4L19 6" />
      </>
    ),
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
    send: (
      <>
        <path d="m22 2-7 20-4-9-9-4Z" />
        <path d="M22 2 11 13" />
      </>
    ),
    sparkles: (
      <>
        <path d="m12 3-1.2 3.3L7.5 7.5l3.3 1.2L12 12l1.2-3.3 3.3-1.2-3.3-1.2Z" />
        <path d="m5 14-.8 2.2L2 17l2.2.8L5 20l.8-2.2L8 17l-2.2-.8ZM19 13l-.7 1.8-1.8.7 1.8.7L19 18l.7-1.8 1.8-.7-1.8-.7Z" />
      </>
    ),
    target: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
        <path d="M12 2v2M22 12h-2M12 22v-2M2 12h2" />
      </>
    ),
    ticket: (
      <>
        <path d="M3 7a2 2 0 0 0 2-2h14a2 2 0 0 0 2 2v3a2 2 0 0 0 0 4v3a2 2 0 0 0-2 2H5a2 2 0 0 0-2-2v-3a2 2 0 0 0 0-4Z" />
        <path d="M13 5v2M13 17v2M13 11v2" />
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

type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
  icon: DashboardIconName;
  iconClasses: string;
  accentClasses: string;
  delay: string;
};

function MetricCard({
  label,
  value,
  detail,
  icon,
  iconClasses,
  accentClasses,
  delay,
}: MetricCardProps) {
  return (
    <Card
      className="dashboard-card group relative overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_34px_rgba(15,23,42,0.10)] motion-reduce:transform-none"
      style={{ animationDelay: delay }}
    >
      <span
        aria-hidden="true"
        className={`absolute inset-x-0 top-0 h-0.5 ${accentClasses}`}
      />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
            {label}
          </p>
          <p className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-950">
            {value}
          </p>
        </div>
        <span
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition duration-200 group-hover:scale-105 motion-reduce:transform-none ${iconClasses}`}
        >
          <DashboardIcon name={icon} />
        </span>
      </div>
      <p className="mt-4 text-xs leading-5 text-slate-500">{detail}</p>
    </Card>
  );
}

export default function AdminDashboard({
  valeurBusinessTotale,
  caSigne,
  totalEnvoyes,
  pipeEnvoye,
  pipeBrouillon,
  tauxConversion,
  totalDevis,
  ticketMoyen,
  totalArchives,
  totalBrouillons,
  totalAcceptes,
  totalRefuses,
}: AdminDashboardProps) {
  const statutTotal =
    totalBrouillons + totalEnvoyes + totalAcceptes + totalRefuses;
  const statutItems: Array<{
    label: string;
    value: number;
    tone: BadgeTone;
    barClasses: string;
  }> = [
    {
      label: "Brouillons",
      value: totalBrouillons,
      tone: "neutral",
      barClasses: "bg-slate-400",
    },
    {
      label: "Envoyés",
      value: totalEnvoyes,
      tone: "info",
      barClasses: "bg-sky-500",
    },
    {
      label: "Acceptés",
      value: totalAcceptes,
      tone: "success",
      barClasses: "bg-emerald-500",
    },
    {
      label: "Refusés",
      value: totalRefuses,
      tone: "danger",
      barClasses: "bg-red-500",
    },
  ];

  return (
    <div className="space-y-5 sm:space-y-6">
      <section className="relative isolate overflow-hidden rounded-[1.75rem] border border-slate-800 bg-slate-950 px-5 py-6 text-white shadow-[0_24px_60px_rgba(15,23,42,0.20)] sm:px-7 sm:py-8">
        <div
          aria-hidden="true"
          className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-orange-500/18 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-sky-500/12 blur-3xl"
        />

        <div className="relative">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-2xl">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-slate-200 backdrop-blur">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                Vue d&apos;ensemble
              </div>
              <h2 className="mt-4 text-2xl font-bold tracking-tight sm:text-3xl">
                Ton activité, en un coup d&apos;œil.
              </h2>
              <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">
                Suis ce qui est déjà signé, ce qui peut se transformer et les
                devis qui demandent encore ton attention.
              </p>
            </div>

            <Link
              href="/beta-test"
              className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(249,115,22,0.28)] transition duration-200 hover:-translate-y-0.5 hover:bg-orange-600 hover:shadow-[0_14px_30px_rgba(249,115,22,0.32)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 motion-reduce:transform-none sm:w-auto"
            >
              Donner mon avis
              <DashboardIcon name="arrow" />
            </Link>
          </div>

          <div className="mt-7 grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center gap-2 text-emerald-200">
                <DashboardIcon name="check" />
                <p className="text-xs font-bold uppercase tracking-[0.1em]">
                  CA signé
                </p>
              </div>
              <p className="mt-3 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {formatMontant(caSigne)}
              </p>
              <p className="mt-2 text-xs leading-5 text-emerald-100/75">
                Montant confirmé par les devis acceptés.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm sm:p-5">
              <div className="flex items-center gap-2 text-sky-200">
                <DashboardIcon name="activity" />
                <p className="text-xs font-bold uppercase tracking-[0.1em]">
                  Valeur totale active
                </p>
              </div>
              <p className="mt-3 break-words text-3xl font-bold tracking-tight text-white sm:text-4xl">
                {formatMontant(valeurBusinessTotale)}
              </p>
              <p className="mt-2 text-xs leading-5 text-slate-300">
                Ensemble du potentiel commercial encore actif.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Pipeline commercial"
          title="Les signaux à suivre"
          description="Les indicateurs utiles pour décider quoi relancer ou finaliser."
          actions={
            <Badge tone="info" dot>
              {totalEnvoyes} devis envoyé{totalEnvoyes > 1 ? "s" : ""}
            </Badge>
          }
        />

        <div className="mt-4 grid gap-3 sm:grid-cols-2 sm:gap-4 xl:grid-cols-4">
          <MetricCard
            label="Envoyés"
            value={String(totalEnvoyes)}
            detail="Devis actuellement entre les mains des clients."
            icon="send"
            iconClasses="bg-sky-50 text-sky-700"
            accentClasses="bg-gradient-to-r from-sky-400 to-sky-600"
            delay="40ms"
          />
          <MetricCard
            label="Conversion"
            value={`${tauxConversion}%`}
            detail="Part des devis traités qui ont été acceptés."
            icon="target"
            iconClasses="bg-emerald-50 text-emerald-700"
            accentClasses="bg-gradient-to-r from-emerald-400 to-emerald-600"
            delay="90ms"
          />
          <MetricCard
            label="Pipe envoyé"
            value={formatMontant(pipeEnvoye)}
            detail="Valeur susceptible d'être signée prochainement."
            icon="activity"
            iconClasses="bg-orange-50 text-orange-700"
            accentClasses="bg-gradient-to-r from-orange-400 to-orange-600"
            delay="140ms"
          />
          <MetricCard
            label="Brouillons"
            value={formatMontant(pipeBrouillon)}
            detail="Potentiel encore à finaliser avant envoi."
            icon="draft"
            iconClasses="bg-slate-100 text-slate-700"
            accentClasses="bg-gradient-to-r from-slate-300 to-slate-500"
            delay="190ms"
          />
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-3 sm:gap-4">
        <Card className="dashboard-card group transition duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none">
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700">
              <DashboardIcon name="document" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                Devis actifs
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {totalDevis}
              </p>
            </div>
          </div>
        </Card>

        <Card
          variant="accent"
          className="dashboard-card group shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none"
          style={{ animationDelay: "60ms" }}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-orange-700 shadow-sm">
              <DashboardIcon name="ticket" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-orange-700">
                Ticket moyen signé
              </p>
              <p className="mt-1 break-words text-2xl font-bold tracking-tight text-slate-950">
                {formatMontant(ticketMoyen)}
              </p>
            </div>
          </div>
        </Card>

        <Card
          className="dashboard-card group transition duration-200 hover:-translate-y-0.5 hover:shadow-lg motion-reduce:transform-none"
          style={{ animationDelay: "120ms" }}
        >
          <div className="flex items-center gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <DashboardIcon name="archive" />
            </span>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                Archivés
              </p>
              <p className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
                {totalArchives}
              </p>
            </div>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
        <Card padding="lg" className="dashboard-card">
          <SectionHeader
            headingLevel={3}
            eyebrow="Répartition"
            title="État des devis"
            description="Une lecture rapide du portefeuille actuel."
            actions={
              <Badge tone="neutral">
                {statutTotal} au total
              </Badge>
            }
          />

          <div className="mt-6 space-y-5">
            {statutItems.map((item) => {
              const pourcentage =
                statutTotal > 0
                  ? Math.round((item.value / statutTotal) * 100)
                  : 0;

              return (
                <div key={item.label}>
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <div className="flex min-w-0 items-center gap-2">
                      <p className="truncate text-sm font-semibold text-slate-700">
                        {item.label}
                      </p>
                      <span className="text-xs text-slate-400">
                        {pourcentage}%
                      </span>
                    </div>
                    <Badge tone={item.tone}>{item.value}</Badge>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full transition-[width] duration-500 motion-reduce:transition-none ${item.barClasses}`}
                      style={{ width: `${pourcentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        <Card
          variant="info"
          padding="lg"
          className="dashboard-card relative overflow-hidden"
          style={{ animationDelay: "80ms" }}
        >
          <div
            aria-hidden="true"
            className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-orange-400/10 blur-3xl"
          />
          <div className="relative">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-orange-300 shadow-lg">
              <DashboardIcon name="sparkles" />
            </span>
            <p className="mt-5 text-xs font-bold uppercase tracking-[0.1em] text-sky-700">
              Lecture business rapide
            </p>
            <h3 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
              Commence par ce qui est le plus proche du revenu.
            </h3>

            <div className="mt-5 space-y-3">
              <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm leading-6 text-slate-600">
                  Le <strong className="text-slate-950">CA signé</strong> est ton
                  revenu déjà confirmé.
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm leading-6 text-slate-600">
                  Le <strong className="text-slate-950">pipe envoyé</strong>{" "}
                  indique les devis à suivre en priorité.
                </p>
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/75 p-4 shadow-sm backdrop-blur">
                <p className="text-sm leading-6 text-slate-600">
                  Les <strong className="text-slate-950">brouillons</strong>{" "}
                  représentent le potentiel encore à mettre en mouvement.
                </p>
              </div>
            </div>
          </div>
        </Card>
      </section>

      <style jsx>{`
        @keyframes dashboard-card-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        :global(.dashboard-card) {
          animation: dashboard-card-in 360ms ease-out both;
        }

        @media (prefers-reduced-motion: reduce) {
          :global(.dashboard-card) {
            animation: none;
          }
        }
      `}</style>
    </div>
  );
}
