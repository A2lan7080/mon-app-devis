import type { Metadata } from "next";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Politique de confidentialité | BatiFlow",
  description:
    "Découvrez comment BatiFlow aborde la confidentialité des données pour son logiciel de devis, factures, clients et chantiers.",
  alternates: {
    canonical: "/confidentialite",
  },
  openGraph: {
    title: "Politique de confidentialité | BatiFlow",
    description: "Politique de confidentialité BatiFlow.",
    url: "/confidentialite",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Politique de confidentialité | BatiFlow",
    description: "Politique de confidentialité BatiFlow.",
  },
};

const sections = [
  {
    title: "Données collectées",
    text: "BatiFlow peut traiter des informations de compte, d’entreprise, de clients, de chantiers, de devis et de factures nécessaires au fonctionnement du service.",
  },
  {
    title: "Utilisation des données",
    text: "Les données sont utilisées pour fournir les fonctionnalités du logiciel, sécuriser l’accès, générer les documents et améliorer l’expérience utilisateur.",
  },
  {
    title: "Sécurité",
    text: "BatiFlow s’appuie sur des outils cloud et des pratiques de sécurité adaptées pour limiter les accès non autorisés et protéger les données de travail.",
  },
  {
    title: "Droits des utilisateurs",
    text: "Les utilisateurs peuvent demander l’accès, la correction ou la suppression de leurs données lorsque la loi applicable le permet.",
  },
];

export default function ConfidentialitePage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Données personnelles
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-[#0F172A] sm:text-5xl">
              Politique de confidentialité
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
