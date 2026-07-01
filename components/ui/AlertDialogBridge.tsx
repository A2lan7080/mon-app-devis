"use client";

import { useEffect, useState } from "react";
import Button from "./Button";

type AlertTone = "success" | "error" | "warning" | "info";

function getAlertPresentation(message: string): {
  tone: AlertTone;
  title: string;
} {
  const normalized = message.trim().toLocaleLowerCase("fr");

  if (
    normalized.includes("impossible") ||
    normalized.includes("erreur") ||
    normalized.includes("introuvable") ||
    normalized.includes("incorrect")
  ) {
    return { tone: "error", title: "Action impossible" };
  }

  if (
    normalized.includes("obligatoire") ||
    normalized.includes("doit être") ||
    normalized.includes("doit contenir") ||
    normalized.includes("sélectionne") ||
    normalized.includes("ajoute au moins") ||
    normalized.includes("finalisé")
  ) {
    return { tone: "warning", title: "À vérifier" };
  }

  if (
    normalized.includes("enregistr") ||
    normalized.includes("envoy") ||
    normalized.includes("créé") ||
    normalized.includes("chargé")
  ) {
    return { tone: "success", title: "C’est fait" };
  }

  return { tone: "info", title: "Information" };
}

const toneClasses: Record<AlertTone, string> = {
  success: "bg-emerald-500/15 text-emerald-200 ring-emerald-300/20",
  error: "bg-red-500/15 text-red-200 ring-red-300/20",
  warning: "bg-orange-500/15 text-orange-200 ring-orange-300/20",
  info: "bg-sky-500/15 text-sky-200 ring-sky-300/20",
};

const toneGlowClasses: Record<AlertTone, string> = {
  success: "bg-emerald-500/25",
  error: "bg-red-500/25",
  warning: "bg-orange-500/25",
  info: "bg-sky-500/25",
};

const toneIcons: Record<AlertTone, string> = {
  success: "✓",
  error: "!",
  warning: "!",
  info: "i",
};

export default function AlertDialogBridge() {
  const [message, setMessage] = useState("");

  useEffect(() => {
    const nativeAlert = window.alert;

    window.alert = (value?: unknown) => {
      setMessage(String(value ?? ""));
    };

    return () => {
      window.alert = nativeAlert;
    };
  }, []);

  useEffect(() => {
    if (!message) return;

    const originalOverflow = document.body.style.overflow;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMessage("");
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [message]);

  if (!message) return null;

  const presentation = getAlertPresentation(message);

  return (
    <div className="fixed inset-0 z-[110] flex items-end justify-center p-0 sm:items-center sm:p-6">
      <button
        type="button"
        aria-label="Fermer le message"
        className="absolute inset-0 bg-slate-950/65 backdrop-blur-[2px]"
        onClick={() => setMessage("")}
      />
      <section
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
        className="relative w-full max-w-md animate-[bf-dialog-in_180ms_ease-out] overflow-hidden rounded-t-[1.75rem] border border-slate-200 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.30)] motion-reduce:animate-none sm:rounded-[1.75rem]"
      >
        <div className="relative overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-6">
          <span
            aria-hidden="true"
            className={`absolute -right-8 -top-10 h-32 w-32 rounded-full blur-3xl ${toneGlowClasses[presentation.tone]}`}
          />
          <div
            className={`relative mb-4 flex h-11 w-11 items-center justify-center rounded-2xl text-xl font-black ring-1 ${toneClasses[presentation.tone]}`}
          >
            {toneIcons[presentation.tone]}
          </div>
          <h2
            id="alert-dialog-title"
            className="relative text-xl font-bold tracking-tight"
          >
            {presentation.title}
          </h2>
          <p
            id="alert-dialog-description"
            className="relative mt-2 whitespace-pre-line text-sm leading-6 text-slate-300"
          >
            {message}
          </p>
        </div>
        <div className="flex justify-end bg-slate-50 p-4 sm:p-5">
          <Button
            variant={presentation.tone === "success" ? "success" : "primary"}
            onClick={() => setMessage("")}
            className="w-full sm:w-auto"
            autoFocus
          >
            Compris
          </Button>
        </div>
      </section>
    </div>
  );
}
