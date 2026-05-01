import Image from "next/image";
import Link from "next/link";

const navigation = [
  { href: "/fonctionnalites", label: "Fonctionnalités" },
  { href: "/tarifs", label: "Tarifs" },
  { href: "/a-propos", label: "À propos" },
];

export default function MarketingHeader() {
  return (
    <header className="border-b border-slate-200 bg-white/95 text-slate-900 backdrop-blur">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <Link href="/" className="flex w-fit items-center gap-3">
          <Image
            src="/logo-batiflow.png"
            alt="BatiFlow"
            width={148}
            height={44}
            priority
            className="h-10 w-auto"
          />
        </Link>

        <nav
          aria-label="Navigation principale"
          className="flex flex-wrap items-center gap-3 text-sm font-semibold text-slate-700 sm:gap-5"
        >
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-1 py-2 transition hover:text-[#1E3A8A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="rounded-md px-1 py-2 text-[#1E3A8A] transition hover:text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#F97316]"
          >
            Connexion
          </Link>
          <Link
            href="/signup"
            className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#F97316] px-4 py-2 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 focus:outline-none focus:ring-2 focus:ring-[#F97316] focus:ring-offset-2"
          >
            Essayer gratuitement
          </Link>
        </nav>
      </div>
    </header>
  );
}
