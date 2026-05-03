import type { Metadata } from "next";
import Link from "next/link";
import MarketingFooter from "@/components/marketing/MarketingFooter";
import MarketingHeader from "@/components/marketing/MarketingHeader";

const pdfHref = "/documents/exemple-devis-batiflow.pdf";

export const metadata: Metadata = {
  title: "Exemple de devis professionnel | BatiFlow",
  description:
    "Découvrez un exemple de devis professionnel généré avec BatiFlow, le logiciel simple pour créer, envoyer et suivre vos devis, factures et chantiers.",
  alternates: {
    canonical: "/exemple-devis",
  },
  openGraph: {
    title: "Exemple de devis professionnel | BatiFlow",
    description:
      "Découvrez le rendu PDF d'un devis professionnel généré avec BatiFlow.",
    url: "/exemple-devis",
    siteName: "BatiFlow",
    locale: "fr_BE",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Exemple de devis professionnel | BatiFlow",
    description:
      "Visualisez un exemple de devis PDF clair, prêt à envoyer à un client.",
  },
};

const estimateLines = [
  ["Démontage ancienne cuisine", "1 forfait", "250,00 €", "250,00 €"],
  ["Trajet", "1 forfait", "75,00 €", "75,00 €"],
  ["Pose nouvelle cuisine", "27 heures", "45,00 €", "1 215,00 €"],
];

const proofItems = [
  "Exemple devis artisan clair et lisible",
  "Structure adaptée au devis bâtiment",
  "Totaux et TVA présentés proprement",
  "Rendu devis PDF professionnel",
];

function PdfPreviewCard() {
  return (
    <article className="w-full max-w-full min-w-0 overflow-hidden rounded-lg border border-slate-200 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.14)] sm:p-6">
      <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-extrabold text-[#1E3A8A]">BatiFlow</p>
          <h2 className="mt-2 text-2xl font-extrabold text-[#0F172A] break-words">
            Devis N° DEV-2026-001
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Pose de cuisine - Jean Dupont
          </p>
        </div>
        <span className="w-fit rounded-full bg-orange-50 px-3 py-1 text-xs font-bold text-[#F97316]">
          Envoyé
        </span>
      </div>

      <div className="mt-5 grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 rounded-lg bg-[#F1F5F9] p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1E3A8A]">
            Client
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Jean Dupont
            <br />
            Rue du combattant
            <br />
            7080 Frameries
            <br />
            Particulier
          </p>
        </div>
        <div className="min-w-0 rounded-lg bg-[#F1F5F9] p-4">
          <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#1E3A8A]">
            Devis
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-700">
            Date : 02/05/2026
            <br />
            Valable jusqu&apos;au 01/06/2026
            <br />
            Chantier lié : Pose de cuisine
            <br />
            TVA : BE0 456 547 896
          </p>
        </div>
      </div>

      <div className="mt-5 max-w-full overflow-hidden">
        <div className="overflow-hidden rounded-lg border border-slate-200">
          <div className="grid grid-cols-[minmax(0,1fr)_2.25rem_4.5rem_4.8rem] gap-2 bg-[#0F172A] px-3 py-3 text-[0.65rem] font-bold uppercase text-white sm:grid-cols-[1fr_52px_120px_120px] sm:gap-3 sm:px-4 sm:text-xs">
            <span>Prestation</span>
            <span>Qté</span>
            <span>Prix</span>
            <span>Total</span>
          </div>
          {estimateLines.map(([label, qty, price, total]) => (
            <div
              key={label}
              className="grid grid-cols-[minmax(0,1fr)_2.25rem_4.5rem_4.8rem] gap-2 border-t border-slate-200 px-3 py-3 text-[0.68rem] sm:grid-cols-[1fr_52px_120px_120px] sm:gap-3 sm:px-4 sm:text-sm"
            >
              <span className="min-w-0 break-words font-semibold text-slate-800">
                {label}
              </span>
              <span className="text-slate-600">{qty}</span>
              <span className="break-words text-slate-600">{price}</span>
              <span className="break-words font-bold text-slate-900">
                {total}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-5 grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-700">
          <h3 className="font-extrabold text-[#0F172A]">Mentions incluses</h3>
          <p className="mt-1">
            Un acompte est demandé avant lancement. Toute modification
            complémentaire pourra faire l&apos;objet d&apos;un ajustement de prix.
          </p>
        </div>
        <div className="min-w-0 rounded-lg bg-[#1E3A8A] p-4 text-white">
          <p className="text-sm font-semibold text-blue-100">Total TVAC</p>
          <p className="mt-1 break-words text-2xl font-extrabold">
            1 863,40 €
          </p>
          <p className="mt-2 text-sm font-semibold text-blue-100">
            Acompte 30% : 559,02 €
          </p>
        </div>
      </div>
    </article>
  );
}

export default function ExempleDevisPage() {
  return (
    <>
      <MarketingHeader />
      <main className="overflow-x-hidden bg-white text-slate-900">
        <section className="overflow-x-hidden bg-[#F1F5F9] px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid w-full max-w-7xl min-w-0 gap-8 lg:grid-cols-[minmax(0,0.86fr)_minmax(0,1.14fr)] lg:items-center">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Exemple concret
              </p>
              <h1 className="mt-3 max-w-full break-words text-3xl font-extrabold leading-tight text-[#0F172A] min-[390px]:text-4xl sm:text-5xl">
                Exemple de devis professionnel BatiFlow
              </h1>
              <p className="mt-4 max-w-2xl break-words text-base leading-7 text-slate-700 sm:text-lg sm:leading-8">
                Consultez un vrai exemple de devis PDF généré avec BatiFlow :
                un rendu clair, professionnel et prêt à être envoyé au client.
              </p>
              <div className="mt-7 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap">
                <a
                  href={pdfHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg bg-[#F97316] px-5 py-3 text-center text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 sm:w-auto"
                >
                  Voir le devis PDF
                </a>
                <a
                  href={pdfHref}
                  download
                  className="inline-flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 py-3 text-center text-base font-bold text-[#1E3A8A] transition hover:border-[#1E3A8A] hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] focus:ring-offset-2 sm:w-auto"
                >
                  Télécharger l&apos;exemple
                </a>
              </div>
              <ul className="mt-6 grid min-w-0 gap-2 text-sm font-semibold text-slate-700 sm:grid-cols-2">
                {proofItems.map((item) => (
                  <li
                    key={item}
                    className="flex min-w-0 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[#F97316]" />
                    <span className="min-w-0 break-words">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <PdfPreviewCard />
          </div>
        </section>

        <section className="overflow-x-hidden px-4 py-10 sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto grid w-full max-w-6xl min-w-0 gap-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)] lg:items-start">
            <div className="min-w-0">
              <p className="text-sm font-bold uppercase tracking-wide text-[#F97316]">
                Devis professionnel
              </p>
              <h2 className="mt-3 break-words text-2xl font-extrabold text-[#0F172A] sm:text-4xl">
                Un exemple rassurant avant de créer vos propres documents
              </h2>
            </div>
            <div className="grid min-w-0 gap-4 text-base leading-8 text-slate-700">
              <p>
                Cet exemple devis bâtiment montre la structure attendue par un
                client : informations entreprise, lignes de prestations, TVA,
                total TTC et mentions utiles.
              </p>
              <p>
                BatiFlow sert de logiciel devis facture simple pour générer des
                documents cohérents, suivre leur statut et garder une gestion
                claire de vos devis, factures et chantiers.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#0F172A] px-4 py-10 text-white sm:px-6 lg:px-8 lg:py-12">
          <div className="mx-auto flex w-full max-w-4xl min-w-0 flex-col items-center text-center">
            <h2 className="break-words text-2xl font-extrabold sm:text-3xl">
              Créez un devis clair en quelques minutes
            </h2>
            <p className="mx-auto mt-4 max-w-2xl break-words text-base leading-7 text-slate-300">
              Testez BatiFlow gratuitement et préparez vos premiers documents
              professionnels sans complexité.
            </p>
            <Link
              href="/signup"
              className="mt-7 inline-flex min-h-12 w-full min-w-0 items-center justify-center rounded-lg bg-[#F97316] px-5 py-3 text-center text-base font-bold text-white transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 focus:ring-offset-[#0F172A] sm:w-auto"
            >
              Créer mon premier devis gratuitement
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter />
    </>
  );
}
