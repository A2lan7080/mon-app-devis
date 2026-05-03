import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/", label: "Accueil" },
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/exemple-devis", label: "Exemple" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/contact", label: "Contact" },
];

export default function MarketingHeader() {
  return (
    <header className="overflow-x-hidden border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="mx-auto max-w-7xl px-4 py-2 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-md focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            aria-label="Accueil BatiFlow"
          >
            <Image
              src="/logo-batiflow.png"
              alt="BatiFlow"
              width={96}
              height={96}
              priority
              className="h-16 w-16 sm:h-20 sm:w-20"
            />
          </Link>

          <Link
            href="/signup"
            className="inline-flex min-h-9 max-w-[12rem] shrink-0 items-center justify-center rounded-lg bg-[#F97316] px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2 sm:hidden"
          >
            Essayer gratuitement
          </Link>

          <nav
            aria-label="Navigation principale"
            className="hidden min-w-0 flex-wrap items-center justify-end gap-x-4 gap-y-2 text-sm font-semibold text-slate-700 sm:flex"
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

        <nav
          aria-label="Navigation mobile"
          className="mt-2 grid min-w-0 grid-cols-2 gap-1.5 text-xs font-semibold text-slate-700 sm:hidden"
        >
          {[...navigation, { href: "/login", label: "Connexion" }].map(
            (item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex min-h-9 min-w-0 items-center justify-center rounded-lg border border-slate-200 bg-white px-2 py-2 text-center leading-tight transition hover:border-[#1E3A8A] hover:bg-blue-50 hover:text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
              >
                {item.label}
              </Link>
            ),
          )}
        </nav>
      </div>
    </header>
  );
}
