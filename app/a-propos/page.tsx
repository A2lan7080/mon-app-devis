import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "À propos de BatiFlow | Logiciel pour artisans du bâtiment",
  description:
    "BatiFlow est pensé pour aider les artisans du bâtiment à gérer devis, factures, clients et chantiers avec simplicité.",
  alternates: {
    canonical: "/a-propos",
  },
  openGraph: {
    title: "À propos de BatiFlow",
    description:
      "Un outil simple pour aider les artisans à gagner du temps sur leur administratif.",
    url: "/a-propos",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "À propos de BatiFlow",
    description:
      "BatiFlow aide les artisans du bâtiment à gérer devis, factures et chantiers.",
  },
};

export default function AProposPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              À propos
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-extrabold text-[#0F172A] sm:text-5xl">
              BatiFlow est conçu pour les artisans, par un artisan
            </h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Le projet part d&apos;un besoin simple : gerer des devis, factures,
              clients et chantiers sans perdre de temps dans un logiciel trop
              lourd pour le terrain.
            </p>
          </div>
        </section>

        <section className="px-4 py-14 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-3">
            {[
              [
                "Simple",
                "Une interface directe pour creer, envoyer et suivre vos documents.",
              ],
              [
                "Credible",
                "Des PDF professionnels avec les informations utiles a vos clients.",
              ],
              [
                "Terrain",
                "Un outil pense pour les artisans du batiment, pas pour les grandes equipes administratives.",
              ],
            ].map(([title, text]) => (
              <article
                key={title}
                className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
              >
                <h2 className="text-xl font-extrabold text-[#1E3A8A]">
                  {title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mx-auto rounded-xl bg-[#0F172A] px-6 py-10 text-center text-white sm:max-w-4xl sm:px-10">
            <h2 className="text-3xl font-extrabold">
              Essayez BatiFlow sur vos vrais cas
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-slate-300">
              Testez le logiciel devis facture Belgique avec vos clients,
              chantiers et prestations habituelles.
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
