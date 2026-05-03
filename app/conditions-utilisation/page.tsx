import type { Metadata } from "next";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

const ogImage = "/opengraph-image";

export const metadata: Metadata = {
  title: "Conditions d’utilisation | BatiFlow",
  description:
    "Consultez les conditions d’utilisation simples de BatiFlow, logiciel de devis et factures pour artisans du bâtiment.",
  alternates: {
    canonical: "/conditions-utilisation",
  },
  openGraph: {
    title: "Conditions d’utilisation | BatiFlow",
    description: "Conditions d’utilisation du service BatiFlow.",
    url: "/conditions-utilisation",
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
    title: "Conditions d’utilisation | BatiFlow",
    description: "Conditions d’utilisation du service BatiFlow.",
    images: [ogImage],
  },
};

const sections = [
  {
    title: "Accès au service",
    text: "BatiFlow est proposé comme outil web destiné à aider les artisans à gérer devis, factures, clients et chantiers. L’accès peut évoluer pendant la phase bêta.",
  },
  {
    title: "Utilisation correcte",
    text: "L’utilisateur s’engage à fournir des informations exactes, à protéger ses accès et à utiliser le service conformément aux lois applicables.",
  },
  {
    title: "Documents générés",
    text: "Les documents générés par BatiFlow doivent être relus et validés par l’utilisateur avant envoi à un client ou usage comptable.",
  },
  {
    title: "Évolutions du service",
    text: "Les fonctionnalités, tarifs et conditions peuvent évoluer afin d’améliorer le produit et de préparer son exploitation commerciale.",
  },
];

export default function ConditionsUtilisationPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Conditions
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-[#0F172A] sm:text-5xl">
              Conditions d’utilisation
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
