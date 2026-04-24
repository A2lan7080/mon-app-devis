"use client";

import { useState } from "react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../lib/firebase";

type Props = {
  displayName: string;
  email: string;
  role: string;
  entrepriseId: string;
  entrepriseNom?: string;
  onDeconnexion: () => void;
};

export default function AccountPanel({
  displayName,
  email,
  role,
  entrepriseId,
  entrepriseNom,
  onDeconnexion,
}: Props) {
  const [ouvert, setOuvert] = useState(false);
  const [chargementReset, setChargementReset] = useState(false);
  const [message, setMessage] = useState("");
  const [erreur, setErreur] = useState("");

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

  return (
    <div className="mb-4 rounded-2xl border border-slate-200 bg-white shadow-sm sm:mb-6">
      <button
        type="button"
        onClick={() => setOuvert((prev) => !prev)}
        className="flex w-full items-center justify-between gap-4 px-4 py-4 text-left sm:px-5"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold uppercase text-white">
            {displayName?.slice(0, 1) || email?.slice(0, 1) || "U"}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">
              {displayName || "Utilisateur"}
            </p>
            <p className="truncate text-xs text-slate-500">{email}</p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <span className="hidden rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700 sm:inline-flex">
            Compte actif
          </span>

          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700">
            {ouvert ? "Masquer" : "Mon compte"}
          </span>
        </div>
      </button>

      {ouvert && (
        <div className="border-t border-slate-100 px-4 pb-4 sm:px-5 sm:pb-5">
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
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                  {message}
                </div>
              )}

              {erreur && (
                <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {erreur}
                </div>
              )}
            </div>
          )}

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleResetPassword}
              disabled={chargementReset}
              className="w-full rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            >
              {chargementReset
                ? "Envoi en cours..."
                : "Changer mon mot de passe"}
            </button>

            <button
              type="button"
              onClick={onDeconnexion}
              className="w-full rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 sm:w-auto"
            >
              Se déconnecter
            </button>
          </div>
        </div>
      )}
    </div>
  );
}