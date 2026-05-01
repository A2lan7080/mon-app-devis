import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
  { href: "/login", label: "Connexion" },
];

export default function MarketingFooter() {
  return (
    <footer className="bg-[#0F172A] text-white">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr] lg:px-8">
        <div>
          <Image
            src="/logo-batiflow.png"
            alt="BatiFlow"
            width={154}
            height={46}
            className="h-11 w-auto rounded bg-white px-2 py-1"
          />
          <p className="mt-5 max-w-xl text-sm leading-6 text-slate-300">
            BatiFlow aide les artisans du bâtiment à créer des devis, factures,
            clients et chantiers dans un outil clair, rapide et pensé pour le
            terrain.
          </p>
        </div>

        <nav
          aria-label="Navigation secondaire"
          className="grid gap-3 text-sm font-semibold text-slate-200 sm:grid-cols-2"
        >
          {footerLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="transition hover:text-[#F97316]"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
      <div className="border-t border-white/10 px-4 py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} BatiFlow. Tous droits réservés.
      </div>
    </footer>
  );
}
