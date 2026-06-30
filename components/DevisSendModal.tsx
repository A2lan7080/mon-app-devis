"use client";

import { useEffect, useId, useState } from "react";
import {
  buildDevisEmailMessage,
  buildDevisEmailSubject,
} from "../lib/devis-email-defaults";

export type DevisSendValues = {
  toEmail: string;
  subject: string;
  message: string;
};

type Props = {
  open: boolean;
  numeroDevis: string;
  nomEntreprise: string;
  emailInitial: string;
  envoiEnCours: boolean;
  onClose: () => void;
  onSubmit: (values: DevisSendValues) => Promise<boolean>;
};

function CheckIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className="h-5 w-5 shrink-0 fill-current"
    >
      <path
        fillRule="evenodd"
        d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.2 7.26a1 1 0 0 1-1.42.003l-3.3-3.3a1 1 0 1 1 1.414-1.414l2.59 2.59 6.493-6.547a1 1 0 0 1 1.417-.006Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function PaperclipIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      className="h-5 w-5"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="m18.375 12.739-7.693 7.693a5.25 5.25 0 0 1-7.424-7.424l9.9-9.9a3.5 3.5 0 0 1 4.95 4.95l-9.9 9.9a1.75 1.75 0 0 1-2.475-2.475l8.662-8.662"
      />
    </svg>
  );
}

export default function DevisSendModal({
  open,
  numeroDevis,
  nomEntreprise,
  emailInitial,
  envoiEnCours,
  onClose,
  onSubmit,
}: Props) {
  const titleId = useId();
  const [toEmail, setToEmail] = useState(emailInitial);
  const [subject, setSubject] = useState(
    buildDevisEmailSubject(numeroDevis, nomEntreprise)
  );
  const [message, setMessage] = useState(
    buildDevisEmailMessage(nomEntreprise)
  );
  const [erreur, setErreur] = useState("");

  useEffect(() => {
    if (!open) return;

    const gererClavier = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !envoiEnCours) onClose();
    };

    const overflowInitial = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", gererClavier);

    return () => {
      document.body.style.overflow = overflowInitial;
      window.removeEventListener("keydown", gererClavier);
    };
  }, [envoiEnCours, onClose, open]);

  if (!open) return null;

  const envoyer = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErreur("");

    if (!toEmail.trim()) {
      setErreur("L’adresse email du destinataire est obligatoire.");
      return;
    }

    if (!subject.trim()) {
      setErreur("L’objet du message est obligatoire.");
      return;
    }

    const succes = await onSubmit({
      toEmail: toEmail.trim(),
      subject: subject.trim(),
      message: message.trim(),
    });

    if (succes) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-90 flex items-end justify-center bg-slate-950/65 p-0 backdrop-blur-[2px] sm:items-center sm:p-5"
      data-testid="devis-send-modal"
    >
      <button
        type="button"
        aria-label="Fermer la fenêtre d’envoi"
        className="absolute inset-0"
        onClick={() => !envoiEnCours && onClose()}
      />

      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={envoyer}
        className="relative flex max-h-[96dvh] w-full max-w-3xl flex-col overflow-hidden rounded-t-[1.75rem] border border-white/70 bg-white shadow-[0_30px_80px_rgba(15,23,42,0.3)] sm:max-h-[calc(100dvh-2.5rem)] sm:rounded-[1.75rem]"
      >
        <div className="relative overflow-hidden bg-slate-950 px-5 py-5 text-white sm:px-7 sm:py-6">
          <div className="absolute -right-14 -top-16 h-44 w-44 rounded-full bg-orange-500/20 blur-2xl" />
          <div className="relative flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-orange-400" />
                Prêt à être envoyé
              </div>
              <h2
                id={titleId}
                className="text-xl font-bold tracking-tight sm:text-2xl"
              >
                Envoyer le devis {numeroDevis}
              </h2>
              <p className="mt-1.5 text-sm leading-6 text-slate-300">
                Vérifiez le destinataire et personnalisez votre message.
              </p>
            </div>

            <button
              type="button"
              onClick={onClose}
              disabled={envoiEnCours}
              aria-label="Fermer"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/15 bg-white/10 text-xl text-white transition hover:bg-white/20 disabled:opacity-50"
            >
              ×
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-7 sm:py-6">
          <div className="space-y-5">
            <div>
              <label
                htmlFor="devis-send-email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Destinataire
              </label>
              <input
                id="devis-send-email"
                data-testid="devis-send-recipient"
                type="email"
                value={toEmail}
                onChange={(event) => setToEmail(event.target.value)}
                autoComplete="email"
                autoFocus
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition placeholder:text-slate-400 focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <label
                htmlFor="devis-send-subject"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Objet
              </label>
              <input
                id="devis-send-subject"
                data-testid="devis-send-subject"
                type="text"
                maxLength={180}
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
                className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label
                  htmlFor="devis-send-message"
                  className="text-sm font-semibold text-slate-800"
                >
                  Message
                </label>
                <span className="text-xs text-slate-400">
                  Entièrement modifiable
                </span>
              </div>
              <textarea
                id="devis-send-message"
                data-testid="devis-send-message"
                value={message}
                maxLength={4000}
                onChange={(event) => setMessage(event.target.value)}
                rows={9}
                className="block min-h-56 w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-950 shadow-sm outline-none transition focus:border-orange-400 focus:ring-4 focus:ring-orange-100"
              />
            </div>

            <section
              aria-label="Éléments inclus dans l’envoi"
              className="overflow-hidden rounded-2xl border border-emerald-200 bg-emerald-50/60"
            >
              <div className="flex items-center gap-3 border-b border-emerald-200 bg-emerald-100/60 px-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-white text-emerald-700 shadow-sm">
                  <PaperclipIcon />
                </span>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">
                    Pièces jointes et actions
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Tout est prêt pour votre client.
                  </p>
                </div>
              </div>

              <div className="grid gap-3 px-4 py-4 text-sm sm:grid-cols-2">
                {[
                  `PDF du devis ${numeroDevis}`,
                  "Lien sécurisé et personnel",
                  "Bouton Accepter le devis",
                  "Bouton Refuser le devis",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-center gap-2.5 font-medium text-emerald-900"
                  >
                    <span className="text-emerald-600">
                      <CheckIcon />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
            </section>

            {erreur && (
              <div
                role="alert"
                className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700"
              >
                {erreur}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50/95 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:flex-row sm:justify-end sm:px-7 sm:pb-5 sm:pt-5">
          <button
            type="button"
            onClick={onClose}
            disabled={envoiEnCours}
            className="min-h-12 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 sm:min-w-28"
          >
            Annuler
          </button>
          <button
            data-testid="devis-send-submit"
            type="submit"
            disabled={envoiEnCours}
            className="min-h-12 rounded-xl bg-orange-500 px-6 py-3 text-sm font-bold text-white shadow-[0_10px_24px_rgba(249,115,22,0.28)] transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60 sm:min-w-36"
          >
            {envoiEnCours ? "Envoi en cours…" : "Envoyer le devis"}
          </button>
        </div>
      </form>
    </div>
  );
}
