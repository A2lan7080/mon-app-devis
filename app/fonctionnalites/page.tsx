import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Fonctionnalités BatiFlow | Devis, factures, clients et chantiers",
  description:
    "Découvrez les fonctionnalités BatiFlow : devis, factures, PDF, clients, chantiers et suivi d’activité pour artisans du bâtiment.",
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
    title: "Devis rapides",
    text: "Préparez un devis facture artisan avec des lignes lisibles, TVA et totaux automatiques.",
    label: "01",
  },
  {
    title: "Factures conformes",
    text: "Générez vos factures avec IBAN, TVA, mentions légales et informations entreprise.",
    label: "02",
  },
  {
    title: "Clients & chantiers",
    text: "Centralisez les coordonnées, adresses, documents et informations de chantier.",
    label: "03",
  },
  {
    title: "PDF professionnels",
    text: "Envoyez des documents propres, cohérents et prêts à partager avec vos clients.",
    label: "04",
  },
  {
    title: "Bibliothèque de prestations",
    text: "Réutilisez vos prestations habituelles, utile pour un logiciel menuisier ou bâtiment.",
    label: "05",
  },
  {
    title: "Suivi d’activité",
    text: "Gardez une vision claire des devis envoyés, acceptés et du chiffre d’affaires signé.",
    label: "06",
  },
];

export default function FonctionnalitesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Fonctionnalités
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl">
              Les outils essentiels pour vos devis, factures et chantiers
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              BatiFlow réunit un logiciel devis bâtiment, un logiciel facture
              artisan et une gestion chantier artisan simple dans un même
              espace.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-2 lg:grid-cols-3">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 text-sm font-extrabold text-[#1E3A8A]">
                  {section.label}
                </div>
                <h2 className="mt-5 text-xl font-extrabold text-[#1E3A8A]">
                  {section.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {section.text}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="bg-[#1E3A8A] px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6 text-center">
            <h2 className="text-3xl font-extrabold">
              Simple sur chantier, clair au bureau
            </h2>
            <p className="mx-auto max-w-3xl text-base leading-7 text-blue-50">
              Accédez à vos documents sur mobile et ordinateur. BatiFlow reste
              lisible pour créer, envoyer et suivre vos devis et factures sans
              complexité.
            </p>
            <Link
              href="/signup"
              className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#1E3A8A] sm:w-auto"
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
