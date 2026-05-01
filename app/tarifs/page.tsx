import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Tarifs BatiFlow | Logiciel devis facture artisan",
  description:
    "Découvrez les tarifs BatiFlow pour gérer vos devis, factures, clients et chantiers avec un logiciel simple pour artisans du bâtiment.",
  alternates: {
    canonical: "/tarifs",
  },
  openGraph: {
    title: "Tarifs BatiFlow | Logiciel devis facture artisan",
    description:
      "Un tarif clair pour un logiciel devis facture Belgique pensé pour les artisans.",
    url: "/tarifs",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tarifs BatiFlow",
    description:
      "Gerez devis, factures, clients et chantiers avec un outil simple pour artisans.",
  },
};

const included = [
  "Devis et factures professionnels",
  "Clients et chantiers centralises",
  "TVA, IBAN et mentions legales",
  "PDF propres et faciles a envoyer",
  "Suivi clair de l'activite",
  "Acces web mobile et desktop",
];

export default function TarifsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Tarifs simples
            </p>
            <h1 className="mt-4 text-4xl font-extrabold text-[#0F172A] sm:text-5xl">
              Un logiciel devis facture artisan sans surprise
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              BatiFlow accompagne les artisans du bâtiment qui veulent gagner du
              temps sur les devis, factures, clients et chantiers, sans outil
              lourd à configurer.
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <article className="rounded-xl border-2 border-[#F97316] bg-white p-6 shadow-lg">
              <p className="text-sm font-bold uppercase tracking-wide text-[#1E3A8A]">
                Offre de lancement
              </p>
              <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A]">
                Essai gratuit
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Testez BatiFlow pour valider vos usages reels : logiciel devis
                batiment, logiciel facture artisan, PDF et suivi de chantier.
              </p>
              <div className="mt-6 rounded-lg bg-[#F1F5F9] p-5">
                <p className="text-sm font-semibold text-slate-600">
                  Demarrage
                </p>
                <p className="mt-2 text-4xl font-extrabold text-[#1E3A8A]">
                  Gratuit
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Sans carte bancaire.
                </p>
              </div>
              <Link
                href="/signup"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
              >
                Essayer gratuitement
              </Link>
            </article>

            <div className="rounded-xl bg-[#0F172A] p-6 text-white">
              <h2 className="text-2xl font-extrabold">
                Inclus pour gerer votre activite
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Une base claire pour les artisans, menuisiers et entreprises du
                batiment qui veulent centraliser leur administratif.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {included.map((item) => (
                  <li
                    key={item}
                    className="rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
