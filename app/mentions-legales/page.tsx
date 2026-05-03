import type { Metadata } from "next";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

const ogImage = "/opengraph-image";

export const metadata: Metadata = {
  title: "Mentions légales | BatiFlow",
  description:
    "Consultez les mentions légales du site BatiFlow, logiciel de devis et factures pour artisans du bâtiment.",
  alternates: {
    canonical: "/mentions-legales",
  },
  openGraph: {
    title: "Mentions légales | BatiFlow",
    description: "Mentions légales du site BatiFlow.",
    url: "/mentions-legales",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
    images: [
      {
        url: ogImage,
        width: 1200,
        height: 630,
        alt: "BatiFlow - Devis & factures pour artisans",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mentions légales | BatiFlow",
    description: "Mentions légales du site BatiFlow.",
    images: [ogImage],
  },
};

const sections = [
  {
    title: "Éditeur du site",
    text: "BatiFlow est un service SaaS en phase bêta destiné aux artisans du bâtiment. Les informations administratives complètes de l’éditeur seront précisées avant exploitation commerciale définitive.",
  },
  {
    title: "Hébergement",
    text: "Le site et l’application sont hébergés via des prestataires cloud adaptés aux applications web modernes. Les informations détaillées pourront être communiquées sur demande.",
  },
  {
    title: "Propriété intellectuelle",
    text: "Les textes, interfaces, visuels, logos et éléments de marque présents sur BatiFlow sont protégés. Toute reproduction non autorisée est interdite.",
  },
  {
    title: "Responsabilité",
    text: "BatiFlow fournit un outil d’aide à la gestion administrative. L’utilisateur reste responsable de la vérification de ses devis, factures, montants, mentions et obligations légales.",
  },
];

export default function MentionsLegalesPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Informations légales
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-[#0F172A] sm:text-5xl">
              Mentions légales
            </h1>
          </div>
        </section>
        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-4xl gap-5">
            {sections.map((section) => (
              <article
                key={section.title}
                className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
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
      </main>
      <MarketingFooter />
    </>
  );
}
