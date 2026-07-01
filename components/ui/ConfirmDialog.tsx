"use client";

import { useEffect } from "react";
import Button from "./Button";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  cancelLabel?: string;
  loading?: boolean;
  tone?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  cancelLabel = "Annuler",
  loading = false,
  tone = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  useEffect(() => {
    if (!open) return;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !loading) onCancel();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [loading, onCancel, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer la confirmation"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]"
        onClick={loading ? undefined : onCancel}
      />
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
        className="relative w-full max-w-md animate-[bf-dialog-in_180ms_ease-out] overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.30)] motion-reduce:animate-none sm:rounded-[1.75rem]"
      >
        <div className="relative overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-6">
          <span
            aria-hidden="true"
            className={`absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl ${
              tone === "danger" ? "bg-red-500/25" : "bg-orange-500/25"
            }`}
          />
          <div
            className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-black ${
              tone === "danger"
                ? "bg-red-500/15 text-red-200 ring-1 ring-red-300/20"
                : "bg-orange-500/15 text-orange-200 ring-1 ring-orange-300/20"
            }`}
          >
            !
          </div>
          <h2
            id="confirm-dialog-title"
            className="relative text-xl font-bold tracking-tight"
          >
            {title}
          </h2>
          <p
            id="confirm-dialog-description"
            className="relative mt-2 text-sm leading-6 text-slate-300"
          >
            {description}
          </p>
        </div>
        <div className="flex flex-col-reverse gap-3 bg-slate-50 p-4 sm:flex-row sm:justify-end sm:p-5">
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
            className="w-full sm:w-auto"
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === "danger" ? "danger" : "warning"}
            onClick={onConfirm}
            loading={loading}
            loadingLabel="Traitement en cours…"
            className="w-full sm:w-auto"
          >
            {confirmLabel}
          </Button>
        </div>
      </section>
    </div>
  );
}
