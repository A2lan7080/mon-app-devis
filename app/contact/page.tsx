import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

export const metadata: Metadata = {
  title: "Contact BatiFlow | Demander une démo",
  description:
    "Contactez BatiFlow pour demander une démo, poser une question ou échanger sur la gestion de vos devis, factures et chantiers.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact BatiFlow",
    description:
      "Demandez une démo ou posez une question sur BatiFlow, logiciel de devis, factures et chantiers.",
    url: "/contact",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Contact BatiFlow",
    description: "Demandez une démo BatiFlow ou posez votre question.",
  },
};

export default function ContactPage() {
  return (
    <>
      <MarketingHeader />
      <main className="bg-white text-slate-900">
        <section className="bg-[#F1F5F9] px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl text-center">
            <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
              Contact
            </p>
            <h1 className="mt-4 text-4xl font-extrabold leading-tight text-[#0F172A] sm:text-5xl">
              Une question ou envie de voir BatiFlow en action ?
            </h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-700">
              Dites-nous comment vous travaillez aujourd’hui avec vos devis,
              factures et chantiers. Nous vous répondrons simplement.
            </p>
          </div>
        </section>

        <section className="px-4 py-12 sm:px-6 lg:px-8">
          <div className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-extrabold text-[#0F172A]">
                Demander une démo
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Pour la phase bêta, le contact se fait volontairement de façon
                simple. Préparez votre activité, votre besoin principal et les
                documents que vous souhaitez tester.
              </p>
              <Link
                href="/signup"
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-lg bg-[#F97316] px-6 py-3 text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 sm:w-auto"
              >
                Créer un compte gratuit
              </Link>
            </div>

            <div className="rounded-lg bg-[#0F172A] p-6 text-white">
              <h2 className="text-2xl font-extrabold">
                Ce que l’on peut voir ensemble
              </h2>
              <ul className="mt-5 grid gap-3 text-sm font-semibold text-slate-200">
                <li className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  Créer un devis professionnel avec TVA et mentions utiles
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  Organiser clients, chantiers et documents
                </li>
                <li className="rounded-lg border border-white/10 bg-white/5 px-4 py-3">
                  Comprendre si BatiFlow correspond à votre activité
                </li>
              </ul>
            </div>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
