import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";
import ProductVisual from "@/components/marketing/ProductVisuals";

export const metadata: Metadata = {
  title: "Exemple de devis professionnel | BatiFlow",
  description:
    "Découvrez un exemple de devis professionnel créé avec BatiFlow : lignes claires, TVA, total, mentions utiles et CTA pour tester gratuitement.",
  alternates: {
    canonical: "/exemple-devis",
  },
  openGraph: {
    title: "Exemple de devis professionnel BatiFlow",
    description:
      "Un exemple concret de devis clair, professionnel et prêt à envoyer.",
    url: "/exemple-devis",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Exemple de devis professionnel BatiFlow",
    description:
      "Visualisez un exemple de devis clair avec TVA, total et mentions utiles.",
  },
};

const lines = [
  ["Dépose ancienne cuisine", "1", "250,00 EUR", "250,00 EUR"],
  ["Pose meubles bas et hauts", "1", "1 450,00 EUR", "1 450,00 EUR"],
  ["Finitions et réglages", "1", "320,00 EUR", "320,00 EUR"],
];

export default function ExempleDevisPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Exemple concret
              </p>
              <h1 className="mt-3 text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl">
                Un devis professionnel clair, prêt à envoyer
              </h1>
              <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-700">
                BatiFlow aide les artisans et petites entreprises à produire
                des devis lisibles, avec TVA, totaux automatiques, IBAN et
                mentions utiles.
              </p>
              <Link
                href="/signup"
                className="mt-7 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 sm:w-auto"
              >
                Essayer gratuitement
              </Link>
            </div>

            <ProductVisual kind="devis" priority />
          </div>
        </section>

        <section className="px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <article className="mx-auto max-w-5xl rounded-lg border border-slate-200 bg-white p-4 shadow-[0_18px_55px_rgba(15,23,42,0.10)] sm:p-6">
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-bold text-[#1E3A8A]">BatiFlow</p>
                <h2 className="mt-2 text-2xl font-extrabold text-[#0F172A]">
                  Devis DEV-2026-014
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Rénovation cuisine - client exemple
                </p>
              </div>
              <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F97316]">
                Brouillon prêt
              </span>
            </div>

            <div className="mt-5 overflow-x-auto">
              <div className="min-w-[640px] overflow-hidden rounded-lg border border-slate-200">
                <div className="grid grid-cols-[1fr_52px_120px_120px] gap-3 bg-[#0F172A] px-4 py-3 text-xs font-bold uppercase text-white">
                  <span>Prestation</span>
                  <span>Qté</span>
                  <span>Prix</span>
                  <span>Total</span>
                </div>
                {lines.map(([label, qty, price, total]) => (
                  <div
                    key={label}
                    className="grid grid-cols-[1fr_52px_120px_120px] gap-3 border-t border-slate-200 px-4 py-3 text-sm"
                  >
                    <span className="font-semibold text-slate-800">
                      {label}
                    </span>
                    <span className="text-slate-600">{qty}</span>
                    <span className="text-slate-600">{price}</span>
                    <span className="font-bold text-slate-900">{total}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-lg bg-[#F1F5F9] p-4 text-sm leading-6 text-slate-700">
                <p className="font-bold text-[#0F172A]">Mentions incluses</p>
                <p className="mt-1">
                  TVA, IBAN, coordonnées entreprise et validité du devis.
                </p>
              </div>
              <div className="rounded-lg bg-[#1E3A8A] p-4 text-white">
                <p className="text-sm font-semibold text-blue-100">
                  Total TTC
                </p>
                <p className="mt-1 text-2xl font-extrabold">2 444,20 EUR</p>
              </div>
            </div>
          </article>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
