import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import ProductVisual from "@/components/marketing/ProductVisuals";
import SeoJsonLd from "@/components/marketing/SeoJsonLd";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://mon-app-devis-sepia.vercel.app";

export const metadata: Metadata = {
  title: "BatiFlow | Logiciel simple pour devis, factures et chantiers",
  description:
    "Créez, envoyez et suivez vos devis, factures, clients et chantiers avec BatiFlow, le logiciel simple pour artisans et petites entreprises.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BatiFlow | Logiciel simple pour devis, factures et chantiers",
    description:
      "Un outil clair pour gérer devis, factures, clients et chantiers sans logiciel compliqué.",
    url: "/",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
    images: [
      {
        url: "/logo-batiflow.png",
        width: 1200,
        height: 630,
        alt: "BatiFlow",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "BatiFlow | Logiciel simple pour devis, factures et chantiers",
    description:
      "Gagnez du temps sur vos devis, factures et chantiers avec un outil simple pour artisans et petites entreprises.",
    images: ["/logo-batiflow.png"],
  },
};

const trustItems = [
  "Documents professionnels",
  "TVA et IBAN intégrables",
  "Données sécurisées",
  "Accès mobile et ordinateur",
  "Sans carte bancaire",
];

const features = [
  {
    title: "Devis rapides",
    text: "Créez des devis lisibles avec lignes, TVA, remises et totaux automatiques.",
    label: "01",
  },
  {
    title: "Factures propres",
    text: "Générez des factures professionnelles avec coordonnées, IBAN et mentions utiles.",
    label: "02",
  },
  {
    title: "Chantiers centralisés",
    text: "Gardez clients, documents, statuts et suivi d’activité dans un espace clair.",
    label: "03",
  },
];

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "BatiFlow",
    url: siteUrl,
    logo: `${siteUrl}/logo-batiflow.png`,
  },
  {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "BatiFlow",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: siteUrl,
    description:
      "Logiciel simple pour créer, envoyer et suivre devis, factures, clients et chantiers.",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "EUR",
      availability: "https://schema.org/InStock",
    },
  },
];

export default function HomePage() {
  return (
    <>
      <SeoJsonLd data={jsonLd} />
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="overflow-hidden bg-[#F1F5F9]">
          <div className="mx-auto grid max-w-7xl gap-7 px-4 py-7 sm:px-6 sm:py-10 lg:grid-cols-[0.82fr_1.18fr] lg:items-center lg:px-8 lg:py-12">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Pour artisans et petites entreprises
              </p>
              <h1 className="mt-3 max-w-4xl text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
                Le logiciel simple pour vos devis, factures et chantiers
              </h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                BatiFlow vous aide à créer, envoyer et suivre vos documents
                sans logiciel compliqué. Tout reste clair, du premier devis au
                suivi de vos chantiers.
              </p>
              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 sm:w-auto"
                >
                  Essayer gratuitement
                </Link>
                <Link
                  href="/exemple-devis"
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-6 py-3 text-base font-bold text-[#1E3A8A] transition hover:border-[#1E3A8A] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2 sm:w-auto"
                >
                  Voir un exemple
                </Link>
              </div>
              <ul className="mt-5 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2 lg:max-w-xl">
                {trustItems.slice(0, 4).map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <ProductVisual kind="dashboard" priority variant="hero" />
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-sm font-extrabold text-[#1E3A8A]">
                    {feature.label}
                  </div>
                  <h2 className="mt-5 text-xl font-extrabold text-[#1E3A8A]">
                    {feature.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#F1F5F9] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Produit
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
                Une vue claire de votre activité
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-700">
                Suivez vos documents, vos clients et vos chantiers depuis des
                vues pensées pour aller vite, avec les informations importantes
                au bon endroit.
              </p>
            </div>
            <div className="mt-7 grid gap-5 lg:grid-cols-3">
              <ProductVisual
                kind="dashboard"
                eyebrow="Pilotage"
                title="Tableau de bord"
              />
              <ProductVisual kind="devis" eyebrow="Vente" title="Devis" />
              <ProductVisual
                kind="facture"
                eyebrow="Documents"
                title="Factures"
              />
            </div>
          </div>
        </section>

        <section className="bg-[#1E3A8A] px-4 py-10 text-white sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[0.85fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-200">
                Terrain
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Pensé pour travailler vite, sans vous enfermer
              </h2>
            </div>
            <div className="max-w-2xl space-y-4 text-base leading-8 text-blue-50">
              <p>
                BatiFlow va à l’essentiel : créer un devis, le transformer en
                facture, retrouver un client et garder le fil d’un chantier.
              </p>
              <p>
                L’interface reste simple pour les professionnels qui veulent un
                outil utile au bureau comme sur mobile.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.68fr_1.32fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Confiance
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
                Les bases importantes sont là
              </h2>
            </div>
            <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5">
              {trustItems.map((item) => (
                <li
                  key={item}
                  className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-3 text-sm font-bold text-slate-700 shadow-sm"
                >
                  <span className="h-2 w-2 rounded-full bg-[#F97316]" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="bg-[#0F172A] px-4 py-10 text-white sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h2 className="text-3xl font-extrabold">
              Prêt à gagner du temps sur vos devis et factures ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Essayez BatiFlow gratuitement et simplifiez votre gestion dès
              aujourd’hui.
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
