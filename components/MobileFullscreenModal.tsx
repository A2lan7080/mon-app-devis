"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  premium?: boolean;
  onClose: () => void;
  children: ReactNode;
};

export default function MobileFullscreenModal({
  open,
  title,
  premium = false,
  onClose,
  children,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-80 w-screen max-w-[100vw] overflow-hidden bg-slate-100 md:hidden">
      <button
        aria-label="Fermer"
        className="absolute inset-0"
        onClick={onClose}
      />

      <div className="absolute inset-0 flex w-screen max-w-[100vw] min-w-0 flex-col overflow-hidden bg-slate-100">
        <div
          className={`sticky top-0 z-10 flex min-w-0 items-center justify-between gap-3 overflow-hidden border-b px-4 py-4 ${
            premium
              ? "border-white/10 bg-slate-950 text-white"
              : "border-slate-200 bg-white"
          }`}
        >
          {premium && (
            <span
              aria-hidden="true"
              className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-orange-500/20 blur-3xl"
            />
          )}
          <div className="min-w-0 flex-1 overflow-hidden">
            <p
              className={`truncate text-xs font-bold uppercase tracking-[0.12em] ${
                premium ? "text-orange-300" : "text-slate-400"
              }`}
            >
              Batiflow
            </p>
            <h2
              className={`truncate text-lg font-bold ${
                premium ? "text-white" : "text-slate-900"
              }`}
            >
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className={`relative shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition duration-200 ${
              premium
                ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
                : "border-slate-200 bg-white text-slate-700"
            }`}
          >
            Fermer
          </button>
        </div>

        <div
          className={`min-h-0 w-full max-w-[100vw] min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4 ${
            premium
              ? "bg-gradient-to-b from-slate-100 to-sky-50/40"
              : ""
          }`}
        >
          <div className="w-full max-w-full min-w-0 overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
