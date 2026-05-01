import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Fonctionnalités BatiFlow | Devis, factures, clients et chantiers",
  description:
    "Explorez les fonctionnalités BatiFlow : devis, factures, PDF, clients, chantiers et suivi d'activité pour artisans du bâtiment.",
  alternates: {
    canonical: "/fonctionnalites",
  },
  openGraph: {
    title: "Fonctionnalités BatiFlow",
    description:
      "Un logiciel devis bâtiment pour centraliser devis, factures, clients et chantiers.",
    url: "/fonctionnalites",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Fonctionnalités BatiFlow",
    description:
      "Devis, factures, PDF, clients et gestion chantier artisan dans un espace simple.",
  },
};

const sections = [
  {
    title: "Devis facture artisan",
    text: "Creez des documents clairs avec lignes detaillees, TVA, statut et export PDF.",
  },
  {
    title: "Facturation conforme",
    text: "Integrez les informations entreprise, l'IBAN, les mentions legales et les totaux utiles.",
  },
  {
    title: "Gestion chantier artisan",
    text: "Reliez clients, chantiers et documents pour garder une vision propre du travail en cours.",
  },
  {
    title: "Bibliotheque de prestations",
    text: "Gagnez du temps avec des prestations reutilisables adaptees aux metiers du batiment.",
  },
  {
    title: "Suivi d'activite",
    text: "Visualisez vos devis brouillons, envoyes, acceptes et votre chiffre d'affaires signe.",
  },
  {
    title: "Experience terrain",
    text: "Utilisez BatiFlow sur mobile ou desktop avec une interface lisible et directe.",
  },
];

export default function FonctionnalitesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Fonctionnalités
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold text-[#0F172A] sm:text-5xl">
              Les outils essentiels pour vos devis, factures et chantiers
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              BatiFlow est un logiciel devis bâtiment conçu pour simplifier le
              quotidien administratif des artisans, du premier contact client au
              PDF final.
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-extrabold text-[#1E3A8A]">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {section.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#1E3A8A] px-4 py-14 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col gap-6 text-center">
            <h2 className="text-3xl font-extrabold">
              Un logiciel menuisier et batiment qui reste simple
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-7 text-blue-50">
              Pas besoin d&apos;une suite complexe pour produire des devis et
              factures propres. BatiFlow va a l&apos;essentiel pour les petites
              entreprises du batiment.
            </p>
            <Link
              href="/signup"
              className="mx-auto inline-flex min-h-12 items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#1E3A8A]"
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
