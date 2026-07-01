"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";
import Badge from "./ui/Badge";
import Button from "./ui/Button";
import FeedbackMessage from "./ui/FeedbackMessage";

type Props = {
  mode?: "card" | "menu";
  displayName: string;
  email: string;
  role: string;
  entrepriseId: string;
  entrepriseNom?: string;
  onDeconnexion: () => void;
  onCloseMenu?: () => void;
};

export default function AccountPanel({
  mode = "card",
  displayName,
  email,
  role,
  entrepriseId,
  entrepriseNom,
  onDeconnexion,
  onCloseMenu,
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [chargementReset, setChargementReset] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

  const initiale = displayName?.slice(0, 1) || email?.slice(0, 1) || "U";
  const nomCourt =
    displayName?.trim().split(/\s+/)[0] || email?.split("@")[0] || "Utilisateur";

  const handleResetPassword = async () => {
    setMessage("");
    setErreur("");

    if (!email) {
      setErreur("Aucune adresse email n’est associée à ce compte.");
      return;
    }

    try {
      setChargementReset(true);
      await sendPasswordResetEmail(auth, email);
      setMessage(
        "Email de réinitialisation envoyé. Pense à vérifier les spams."
      );
    } catch {
      setErreur("Impossible d’envoyer l’email de réinitialisation.");
    } finally {
      setChargementReset(false);
    }
  };

  const handleDeconnexion = () => {
    onCloseMenu?.();
    onDeconnexion();
  };

  if (mode === "menu") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-2">
        <button
          type="button"
          onClick={() => setOuvert((prev) => !prev)}
          className="flex w-full items-center gap-2 rounded-xl px-2 py-2 text-left transition duration-150 hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 motion-reduce:transition-none"
          aria-expanded={ouvert}
        >
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-900 text-sm font-bold uppercase text-white">
            {initiale}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900">
              {nomCourt}
            </p>
          </div>

          <span
            className={`shrink-0 text-xs font-semibold text-slate-500 transition duration-200 motion-reduce:transition-none ${
              ouvert ? "rotate-180" : ""
            }`}
            aria-hidden="true"
          >
            v
          </span>
        </button>

        {ouvert && (
          <div className="mt-2 animate-[bf-dialog-in_180ms_ease-out] border-t border-slate-200 pt-3 motion-reduce:animate-none">
            <div className="px-2">
              <p className="truncate text-xs text-slate-500">
                {email || "Email non renseigné"}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-white px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Rôle
                </p>
                <p className="mt-0.5 truncate font-semibold text-slate-800">
                  {role}
                </p>
              </div>

              <div className="rounded-xl bg-white px-3 py-2">
                <p className="text-[10px] font-medium uppercase tracking-wide text-slate-400">
                  Entreprise
                </p>
                <p className="mt-0.5 truncate font-semibold text-slate-800">
                  {entrepriseNom || entrepriseId}
                </p>
              </div>
            </div>

            {(message || erreur) && (
              <div className="mt-3 space-y-2">
                {message && (
                  <FeedbackMessage tone="success" className="rounded-xl px-3 py-2 text-xs">
                    {message}
                  </FeedbackMessage>
                )}

                {erreur && (
                  <FeedbackMessage tone="error" className="rounded-xl px-3 py-2 text-xs">
                    {erreur}
                  </FeedbackMessage>
                )}
              </div>
            )}

            <div className="mt-3 space-y-2">
              <Button
                size="sm"
                variant="soft"
                onClick={handleResetPassword}
                disabled={chargementReset}
                loading={chargementReset}
                loadingLabel="Envoi en cours…"
                className="w-full"
              >
                Changer mon mot de passe
              </Button>

              <Button
                size="sm"
                variant="danger"
                onClick={handleDeconnexion}
                className="w-full"
              >
                Se déconnecter
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm sm:mb-6">
      <button
        type="button"
        onClick={() => setOuvert((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 rounded-2xl px-4 py-4 text-left transition duration-150 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400 focus-visible:ring-offset-2 sm:px-5 motion-reduce:transition-none"
        aria-expanded={ouvert}
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold uppercase text-white">
            {initiale}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {displayName || "Utilisateur"}
            </p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <Badge tone="success" dot className="hidden sm:inline-flex">
            Compte actif
          </Badge>

          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {ouvert ? "Masquer" : "Mon compte"}
          </span>
        </div>
      </button>

      {ouvert && (
        <div className="animate-[bf-dialog-in_180ms_ease-out] border-t border-slate-100 px-4 pb-4 motion-reduce:animate-none sm:px-5 sm:pb-5">
          <div className="grid gap-3 pt-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Nom
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {displayName || "Non renseigné"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Rôle
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {role}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Entreprise
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {entrepriseNom || entrepriseId}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Identifiant
              </p>
              <p className="mt-1 truncate text-sm font-semibold text-slate-800">
                {entrepriseId}
              </p>
            </div>
          </div>

          {(message || erreur) && (
            <div className="mt-4">
              {message && (
                <FeedbackMessage tone="success">
                  {message}
                </FeedbackMessage>
              )}

              {erreur && (
                <FeedbackMessage tone="error">
                  {erreur}
                </FeedbackMessage>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              variant="soft"
              onClick={handleResetPassword}
              disabled={chargementReset}
              loading={chargementReset}
              loadingLabel="Envoi en cours…"
              className="w-full sm:w-auto"
            >
              Changer mon mot de passe
            </Button>

            <Button
              variant="danger"
              onClick={handleDeconnexion}
              className="w-full sm:w-auto"
            >
              Se déconnecter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
