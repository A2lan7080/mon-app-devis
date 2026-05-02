import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/exemple-devis", label: "Exemple" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-3 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link
          href="/"
          className="flex w-fit items-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          aria-label="Accueil BatiFlow"
        >
          <Image
            src="/logo-batiflow.png"
            alt="BatiFlow"
            width={132}
            height={40}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold text-slate-700"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md py-1.5 transition hover:text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-md py-1.5 text-[#1E3A8A] transition hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-10 items-center justify-center rounded-lg bg-[#F97316] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
          >
            Essayer gratuitement
          </Link>
        </nav>
      </div>
    </header>
  );
}
