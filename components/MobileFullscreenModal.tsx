"use client";

import type { ReactNode } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
};

export default function MobileFullscreenModal({
  open,
  title,
  onClose,
  children,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-80 w-screen max-w-[100vw] overflow-hidden md:hidden">
      <button
        aria-label="Fermer"
        className="absolute inset-0 bg-slate-900/40"
        onClick={onClose}
      />

      <div className="absolute inset-x-0 bottom-0 top-10 flex w-screen max-w-[100vw] min-w-0 flex-col overflow-hidden rounded-t-[28px] bg-slate-100 shadow-2xl">
        <div className="sticky top-0 z-10 flex min-w-0 items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-4">
          <div className="min-w-0 flex-1 overflow-hidden">
            <p className="truncate text-xs font-medium uppercase tracking-wide text-slate-400">
              Batiflow
            </p>
            <h2 className="truncate text-lg font-bold text-slate-900">
              {title}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="shrink-0 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700"
          >
            Fermer
          </button>
        </div>

        <div className="min-h-0 w-full max-w-[100vw] min-w-0 flex-1 overflow-x-hidden overflow-y-auto p-4">
          <div className="w-full max-w-full min-w-0 overflow-x-hidden">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}