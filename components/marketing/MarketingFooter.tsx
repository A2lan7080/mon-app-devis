import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/exemple-devis", label: "Exemple de devis" },
  { href: "/tarifs", label: "Tarifs" },
];

const companyLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Connexion" },
];

const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/conditions-utilisation", label: "Conditions d’utilisation" },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 md:grid-cols-[1.15fr_1fr_1fr_1fr] lg:px-8">
        <div>
          <Image
            src="/logo-batiflow.png"
            alt="Logo BatiFlow"
            width={96}
            height={96}
            className="h-10 w-10 rounded-md bg-white p-1"
          />
          <p className="mt-3 max-w-md text-sm leading-6 text-slate-300">
            Devis, factures, clients et chantiers dans un outil simple pour les
            artisans et petites entreprises.
          </p>
        </div>

        <nav aria-label="Navigation produit">
          <h2 className="text-sm font-bold text-white">Produit</h2>
          <div className="mt-2 grid gap-1.5 text-sm font-semibold text-slate-300">
            {productLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-fit transition hover:text-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Navigation entreprise">
          <h2 className="text-sm font-bold text-white">BatiFlow</h2>
          <div className="mt-2 grid gap-1.5 text-sm font-semibold text-slate-300">
            {companyLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-fit transition hover:text-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>

        <nav aria-label="Navigation légale">
          <h2 className="text-sm font-bold text-white">Légal</h2>
          <div className="mt-2 grid gap-1.5 text-sm font-semibold text-slate-300">
            {legalLinks.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="w-fit transition hover:text-[#F97316] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                {item.label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-3 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BatiFlow. Tous droits réservés.
      </div>
    </footer>
  );
}
