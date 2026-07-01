"use client";

import LoadingState from "./ui/LoadingState";

export default function PageLoadingState() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-orange-50/40 p-4">
      <div className="w-full max-w-md rounded-[1.75rem] border border-slate-200 bg-white shadow-[0_18px_45px_rgba(15,23,42,0.08)]">
        <LoadingState
          label="Préparation de ton espace…"
          description="BatiFlow charge les informations de ton entreprise en toute sécurité."
        />
      </div>
    </main>
  );
}
