import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Tarifs BatiFlow | Devis, factures et chantiers",
  description:
    "Testez BatiFlow gratuitement pour gérer devis, factures, clients et chantiers avec un logiciel simple pour artisans et petites entreprises.",
  alternates: {
    canonical: "/tarifs",
  },
  openGraph: {
    title: "Tarifs BatiFlow | Devis, factures et chantiers",
    description:
      "Un essai gratuit pour tester un outil simple de devis, factures, clients et chantiers.",
    url: "/tarifs",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Tarifs BatiFlow",
    description:
      "Essai gratuit pour gérer devis, factures, clients et chantiers avec BatiFlow.",
  },
};

const included = [
  "Devis et factures professionnels",
  "TVA, IBAN et mentions utiles",
  "Clients et chantiers centralisés",
  "PDF propres et prêts à envoyer",
  "Suivi clair de l’activité",
  "Accès mobile et ordinateur",
];

export default function TarifsPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Tarifs simples
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl">
              Un outil clair, sans surprise
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              BatiFlow accompagne les artisans et petites entreprises pour
              gérer devis, factures, clients et chantiers simplement.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-2">
            <article className="rounded-lg border-2 border-[#F97316] bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.12)]">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-[#1E3A8A]">
                    Offre
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold text-[#0F172A]">
                    Essai gratuit
                  </h2>
                </div>
                <span className="rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F97316]">
                  Disponible
                </span>
              </div>
              <p className="mt-6 text-5xl font-extrabold text-[#1E3A8A]">
                Gratuit
              </p>
              <p className="mt-4 text-sm leading-6 text-slate-600">
                Testez BatiFlow sur vos vrais besoins : devis, factures,
                clients, documents et chantiers.
              </p>
              <ul className="mt-5 grid gap-3 text-sm font-semibold text-slate-700">
                <li className="rounded-lg border border-slate-200 bg-[#F1F5F9] px-4 py-3">
                  Sans carte bancaire
                </li>
                <li className="rounded-lg border border-slate-200 bg-[#F1F5F9] px-4 py-3">
                  Accès complet pendant la phase de test
                </li>
              </ul>
              <Link
                href="/signup"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
              >
                Essayer gratuitement
              </Link>
            </article>

            <article className="rounded-lg border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    À venir
                  </p>
                  <h2 className="mt-3 text-3xl font-extrabold text-slate-500">
                    Offre Pro
                  </h2>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-bold text-slate-500">
                  Bientôt
                </span>
              </div>
              <p className="mt-6 text-sm leading-6 text-slate-600">
                Une formule payante pourra être proposée plus tard aux
                professionnels qui veulent aller plus loin. Elle n’est pas
                active aujourd’hui.
              </p>
              <div className="mt-6 rounded-lg border border-dashed border-slate-300 bg-white px-4 py-5 text-sm font-semibold text-slate-500">
                Priorité actuelle : valider BatiFlow avec de vrais usages
                terrain avant d’ouvrir une offre commerciale.
              </div>
            </article>
          </div>

          <section className="mx-auto mt-6 max-w-6xl bg-[#0F172A] px-6 py-8 text-white">
            <div className="mx-auto max-w-5xl">
              <h2 className="text-2xl font-extrabold">Inclus</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Les bases utiles pour créer des documents professionnels et
                garder une gestion d’activité simple.
              </p>
              <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
          </section>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
