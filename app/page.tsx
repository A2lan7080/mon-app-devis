import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import SeoJsonLd from "@/components/marketing/SeoJsonLd";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://batiflow.be";

export const metadata: Metadata = {
  title: "BatiFlow | Logiciel de devis et factures pour artisans du bâtiment",
  description:
    "Créez vos devis, factures, clients et chantiers avec BatiFlow, le logiciel simple pensé pour les artisans du bâtiment.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "BatiFlow | Logiciel de devis et factures pour artisans du bâtiment",
    description:
      "Créez vos devis, factures, clients et chantiers avec BatiFlow, le logiciel simple pensé pour les artisans du bâtiment.",
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

const benefits = [
  "Sans carte bancaire",
  "Pret en 2 minutes",
  "Donnees securisees",
];

const features = [
  {
    title: "Devis rapides",
    text: "Creez un devis facture artisan avec lignes, TVA et totaux lisibles sans vous perdre dans des menus.",
  },
  {
    title: "Factures conformes",
    text: "Ajoutez TVA, IBAN, mentions legales et informations entreprise pour des documents professionnels.",
  },
  {
    title: "Clients & chantiers centralises",
    text: "Retrouvez vos clients, adresses, chantiers et documents dans un espace de gestion chantier artisan.",
  },
  {
    title: "PDF professionnels",
    text: "Exportez des devis et factures propres, coherents avec votre activite et faciles a envoyer.",
  },
  {
    title: "Suivi clair de l'activite",
    text: "Gardez une vue simple sur vos brouillons, devis envoyes, acceptes et montants signes.",
  },
  {
    title: "Pense batiment",
    text: "Un logiciel devis batiment adapte aux artisans, menuisiers, renovateurs et petites entreprises.",
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
    "Logiciel devis bâtiment et logiciel facture artisan pour créer devis, factures, clients et chantiers.",
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
          <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:py-20 lg:grid-cols-[1fr_0.95fr] lg:items-center lg:px-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Logiciel devis facture Belgique
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl lg:text-6xl">
                Gérer vos devis et factures sans prise de tête
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-700">
                BatiFlow aide les artisans du bâtiment à gagner du temps et à
                se concentrer sur l&apos;essentiel : leurs chantiers.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  href="/signup"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
                >
                  Essayer gratuitement
                </Link>
                <Link
                  href="/tarifs"
                  className="inline-flex min-h-12 items-center justify-center rounded-lg border border-[#1E3A8A] bg-white px-6 py-3 text-base font-bold text-[#1E3A8A] transition hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2"
                >
                  Voir les tarifs
                </Link>
              </div>
              <ul className="mt-8 grid gap-3 text-sm font-semibold text-slate-700 sm:grid-cols-3">
                {benefits.map((benefit) => (
                  <li
                    key={benefit}
                    className="rounded-lg border border-slate-200 bg-white px-4 py-3"
                  >
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xl shadow-slate-300/50">
              <div className="rounded-lg border border-slate-200 bg-slate-50">
                <div className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
                  <div>
                    <p className="text-xs font-bold uppercase text-slate-500">
                      Tableau de bord
                    </p>
                    <p className="text-lg font-extrabold text-[#1E3A8A]">
                      Avril 2026
                    </p>
                  </div>
                  <span className="rounded-lg bg-[#F97316] px-3 py-2 text-xs font-bold text-white">
                    Nouveau devis
                  </span>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {[
                    ["Devis envoyes", "12"],
                    ["Acceptes", "8"],
                    ["CA signe", "24 850 EUR"],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg bg-white p-4">
                      <p className="text-xs font-semibold text-slate-500">
                        {label}
                      </p>
                      <p className="mt-2 text-xl font-extrabold text-[#0F172A]">
                        {value}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3 px-4 pb-4">
                  {[
                    ["Menuiserie Dupont", "Devis cuisine", "Envoye"],
                    ["Renovation Martin", "Facture acompte", "Payee"],
                    ["Chantier Lambert", "Devis isolation", "Accepte"],
                  ].map(([client, label, status]) => (
                    <div
                      key={client}
                      className="grid gap-3 rounded-lg bg-white p-4 sm:grid-cols-[1fr_auto]"
                    >
                      <div>
                        <p className="font-bold text-slate-900">{client}</p>
                        <p className="text-sm text-slate-500">{label}</p>
                      </div>
                      <span className="self-start rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-[#1E3A8A]">
                        {status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Fonctionnalites essentielles
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
                Tout pour gerer vos documents sans complexite
              </h2>
              <p className="mt-4 text-base leading-7 text-slate-600">
                BatiFlow rassemble les outils indispensables aux artisans du
                batiment, du logiciel menuisier au suivi simple des chantiers.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
                >
                  <h3 className="text-lg font-extrabold text-[#1E3A8A]">
                    {feature.title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {feature.text}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#1E3A8A] px-4 py-14 text-white sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-orange-200">
                Concu pour les artisans, par un artisan
              </p>
              <h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">
                Un outil qui respecte votre temps
              </h2>
            </div>
            <p className="text-base leading-8 text-blue-50">
              BatiFlow va droit au but : creer, envoyer, suivre. L&apos;objectif est
              de simplifier les taches administratives sans imposer une grosse
              usine a gaz a une petite entreprise du batiment.
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl rounded-xl bg-[#0F172A] px-6 py-10 text-center text-white sm:px-10">
            <h2 className="text-3xl font-extrabold">
              Pret a gagner du temps sur vos devis et factures ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Essayez BatiFlow gratuitement et structurez vos clients,
              chantiers, devis et factures dans un espace simple.
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex min-h-12 items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#0F172A]"
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
