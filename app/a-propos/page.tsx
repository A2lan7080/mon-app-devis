import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "À propos de BatiFlow | Logiciel pour artisans et petites entreprises",
  description:
    "BatiFlow aide les artisans et petites entreprises à gérer devis, factures, clients et chantiers sans logiciel trop complexe.",
  alternates: {
    canonical: "/a-propos",
  },
  openGraph: {
    title: "À propos de BatiFlow",
    description:
      "Un outil simple pensé sur le terrain pour gagner du temps sur les devis, factures et chantiers.",
    url: "/a-propos",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "À propos de BatiFlow",
    description:
      "BatiFlow aide les artisans et petites entreprises à gérer devis, factures et chantiers.",
  },
};

export default function AProposPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                À propos
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl">
                BatiFlow est pensé pour les artisans et petites entreprises
              </h1>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <p className="text-sm font-bold uppercase tracking-wide text-[#1E3A8A]">
                Mission
              </p>
              <p className="mt-3 text-lg font-semibold leading-8 text-[#0F172A]">
                Vous faire gagner du temps sur l’administratif pour vous
                concentrer sur vos clients et vos chantiers.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl space-y-6 text-lg leading-8 text-slate-700">
            <p>
              Le projet est né d’un besoin simple : gérer ses devis, factures,
              clients et chantiers sans perdre du temps dans un logiciel trop
              complexe.
            </p>
            <p>
              BatiFlow va à l’essentiel pour les professionnels du bâtiment,
              les indépendants et les petites équipes qui veulent garder une
              gestion claire.
            </p>
            <p>
              L’objectif est simple : rendre les tâches administratives plus
              rapides, plus propres et plus faciles à suivre au quotidien.
            </p>
            <p className="rounded-lg border border-slate-200 bg-[#F1F5F9] p-5 text-base leading-7">
              BatiFlow s’adresse aux professionnels qui cherchent une solution
              directe pour leurs devis, factures, clients, prestations et
              chantiers.
            </p>
          </div>
        </section>

        <section className="bg-[#0F172A] px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h2 className="text-3xl font-extrabold">
              Essayez BatiFlow sur vos vrais cas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Testez vos clients, chantiers, devis et factures dans un espace
              simple.
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#0F172A] sm:w-auto"
            >
              Essayer gratuitement
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
