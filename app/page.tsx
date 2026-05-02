import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import SeoJsonLd from "@/components/marketing/SeoJsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://batiflow.be";

export const metadata: Metadata = {
  title: "BatiFlow | Logiciel de devis et factures pour artisans du bâtiment",
  description:
    "Créez, envoyez et suivez vos devis et factures avec BatiFlow, le logiciel simple pensé pour les artisans du bâtiment.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BatiFlow | Logiciel de devis et factures pour artisans du bâtiment",
    description:
      "Logiciel devis bâtiment, facture artisan et gestion chantier artisan pour travailler plus simplement.",
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
    title: "BatiFlow | Logiciel de devis et factures pour artisans du bâtiment",
    description:
      "Un logiciel devis facture Belgique simple pour les artisans du bâtiment.",
    images: ["/logo-batiflow.png"],
  },
};

const trustItems = [
  "✔ Conforme Belgique",
  "✔ TVA, IBAN et mentions légales inclus",
  "✔ Données sécurisées",
  "✔ Sans carte bancaire",
  "✔ Prêt en 2 minutes",
];

const features = [
  {
    title: "Devis rapides",
    text: "Créez vos devis en quelques clics avec des lignes claires, TVA et totaux automatiques.",
    label: "01",
  },
  {
    title: "Factures conformes",
    text: "Générez des factures professionnelles avec IBAN, TVA et mentions légales intégrées.",
    label: "02",
  },
  {
    title: "Clients & chantiers centralisés",
    text: "Retrouvez facilement vos clients, chantiers et documents dans un seul espace.",
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
      "Logiciel devis bâtiment, logiciel facture artisan et gestion chantier artisan pour créer, envoyer et suivre ses documents.",
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
          <div className="mx-auto grid max-w-7xl gap-8 px-4 py-9 sm:px-6 md:py-14 lg:grid-cols-[1.02fr_0.88fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Logiciel devis facture Belgique
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
                Gagnez du temps sur vos devis et factures
                <span className="block">sans logiciel compliqué</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                BatiFlow est le logiciel de devis et factures pensé pour les
                artisans du bâtiment. Créez, envoyez et suivez vos documents
                simplement, sans perdre de temps.
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
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
                  Voir un exemple de devis
                </Link>
              </div>
              <ul className="mt-6 grid gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
                {trustItems.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-sm"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div
              id="exemple-devis"
              className="rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-4"
            >
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
                <div className="flex items-center gap-1.5 border-b border-slate-200 bg-white px-4 py-3">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
                </div>
                <div className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Exemple de devis
                    </p>
                    <p className="text-lg font-extrabold text-[#1E3A8A]">
                      Devis DEV-2026-014
                    </p>
                  </div>
                  <span className="rounded-full bg-[#F97316] px-3 py-1.5 text-xs font-bold text-white">
                    Prêt à envoyer
                  </span>
                </div>
                <div className="space-y-3 p-4">
                  {[
                    ["Menuiserie Dupont", "Rénovation cuisine"],
                    ["Pose meubles", "1 450 EUR HT"],
                    ["TVA 21%", "304,50 EUR"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-4 rounded-lg border border-slate-100 bg-white px-4 py-3 text-sm"
                    >
                      <span className="font-semibold text-slate-700">
                        {label}
                      </span>
                      <span className="font-bold text-[#0F172A]">{value}</span>
                    </div>
                  ))}
                  <div className="rounded-lg bg-[#1E3A8A] px-4 py-4 text-white">
                    <p className="text-sm font-semibold text-blue-100">
                      Total TTC
                    </p>
                    <p className="mt-1 text-2xl font-extrabold">
                      1 754,50 EUR
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-5 md:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
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

        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Gestion simple
            </p>
            <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              Tout pour gérer vos documents sans complexité
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-700">
              BatiFlow rassemble les outils indispensables aux artisans du
              bâtiment : logiciel devis artisan, logiciel facture bâtiment et
              gestion simple des chantiers.
            </p>
          </div>
        </section>

        <section className="bg-[#1E3A8A] px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-7 lg:grid-cols-[0.85fr_1fr] lg:items-start">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-200">
                Terrain
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Conçu pour les artisans, par un artisan
              </h2>
            </div>
            <div className="max-w-2xl space-y-4 text-base leading-8 text-blue-50">
              <p>
                BatiFlow a été pensé sur le terrain pour aller à
                l&apos;essentiel : créer, envoyer et suivre vos devis et
                factures sans complexité.
              </p>
              <p>
                Pas de fonctionnalités inutiles. Pas d&apos;interface
                compliquée. Juste ce dont vous avez besoin pour travailler
                efficacement.
              </p>
            </div>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <h2 className="text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              Utilisable sur mobile et ordinateur
            </h2>
            <p className="text-base leading-8 text-slate-700">
              Accédez à vos devis, factures et chantiers partout. Que vous
              soyez sur chantier ou au bureau, tout reste simple et accessible.
            </p>
          </div>
        </section>

        <section className="bg-[#0F172A] px-4 py-12 text-white sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
            <h2 className="text-3xl font-extrabold">
              Prêt à gagner du temps sur vos devis et factures ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Essayez BatiFlow gratuitement et simplifiez votre gestion dès
              aujourd&apos;hui.
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
