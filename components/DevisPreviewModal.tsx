"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  premium?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function DevisPreviewModal({
  open,
  title,
  eyebrow = "Devis",
  actions,
  premium = false,
  onClose,
  children,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-70 hidden bg-slate-900/55 p-3 md:flex lg:p-5">
      <button
        aria-label="Fermer le devis"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="relative mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-[96rem] min-w-0 flex-col overflow-hidden rounded-[1.75rem] border border-white/60 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.30)] lg:h-[calc(100vh-2.5rem)]">
        <div
          className={`relative flex min-w-0 items-center justify-between gap-4 overflow-hidden px-5 py-4 lg:px-6 ${
            premium
              ? "border-b border-white/10 bg-slate-950 text-white"
              : "border-b border-slate-200 bg-white"
          }`}
        >
          {premium && (
            <span
              aria-hidden="true"
              className="absolute -right-12 -top-16 h-40 w-40 rounded-full bg-orange-500/20 blur-3xl"
            />
          )}
          <div className="min-w-0">
            <p
              className={`text-xs font-bold uppercase tracking-[0.12em] ${
                premium ? "text-orange-300" : "text-slate-400"
              }`}
            >
              {eyebrow}
            </p>
            <h2
              className={`mt-1 truncate text-xl font-bold ${
                premium ? "text-white" : "text-slate-900"
              }`}
            >
              {title}
            </h2>
          </div>

          <div className="relative flex shrink-0 items-center gap-2">
            {actions}

            <button
              onClick={onClose}
              className={`rounded-xl border px-4 py-2 text-sm font-semibold transition duration-200 ${
                premium
                  ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              Fermer
            </button>
          </div>
        </div>

        <div
          className={`min-h-0 flex-1 overflow-y-auto p-4 lg:p-6 ${
            premium
              ? "bg-gradient-to-br from-slate-50 via-white to-sky-50/50"
              : "bg-slate-50"
          }`}
        >
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}
