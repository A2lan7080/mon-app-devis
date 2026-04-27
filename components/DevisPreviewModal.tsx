"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  eyebrow?: string;
  actions?: ReactNode;
  onClose: () => void;
  children: ReactNode;
};

export default function DevisPreviewModal({
  open,
  title,
  eyebrow = "Devis",
  actions,
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

      <div className="relative mx-auto flex h-[calc(100vh-1.5rem)] w-full max-w-[96rem] min-w-0 flex-col overflow-hidden rounded-2xl bg-white shadow-2xl lg:h-[calc(100vh-2.5rem)]">
        <div className="flex min-w-0 items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4 lg:px-6">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {eyebrow}
            </p>
            <h2 className="mt-1 truncate text-xl font-bold text-slate-900">
              {title}
            </h2>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {actions}

            <button
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              Fermer
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto bg-slate-50 p-4 lg:p-6">
          <div className="mx-auto w-full max-w-[90rem]">{children}</div>
        </div>
      </div>
    </div>
  );
}
