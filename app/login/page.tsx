"use client";

import Image from "next/image";
import { useState } from "react";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebase";

function LogoBatiflow({ grand = false }: { grand?: boolean }) {
  return (
    <div
      className={`relative shrink-0 overflow-hidden rounded-3xl bg-white ring-1 ring-slate-200 ${
        grand ? "h-28 w-28" : "h-20 w-20"
      }`}
    >
      <Image
        src="/logo-batiflow.png"
        alt="Logo BatiFlow"
        fill
        className="object-contain p-2"
        sizes={grand ? "112px" : "80px"}
        priority
      />
    </div>
  );
}

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [messageSucces, setMessageSucces] = useState("");
  const [chargement, setChargement] = useState(false);
  const [resetEnCours, setResetEnCours] = useState(false);

  const emailNettoye = email.trim();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setErreur("");
    setMessageSucces("");
    setChargement(true);

    try {
      await signInWithEmailAndPassword(auth, emailNettoye, password);
      router.push("/");
    } catch {
      setErreur("Email ou mot de passe incorrect.");
    } finally {
      setChargement(false);
    }
  };

  const handleResetPassword = async () => {
    setErreur("");
    setMessageSucces("");

    if (!emailNettoye) {
      setErreur(
        "Renseigne ton adresse email avant de demander la réinitialisation du mot de passe."
      );
      return;
    }

    try {
      setResetEnCours(true);
      await sendPasswordResetEmail(auth, emailNettoye);
      setMessageSucces(
        "Un email de réinitialisation du mot de passe vient d’être envoyé. Pense aussi à vérifier les spams."
      );
    } catch {
      setErreur(
        "Impossible d’envoyer l’email de réinitialisation. Vérifie l’adresse email."
      );
    } finally {
      setResetEnCours(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-900">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <section className="relative hidden flex-1 overflow-hidden bg-slate-950 p-10 text-white lg:flex lg:flex-col lg:justify-between">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.35),_transparent_34%),radial-gradient(circle_at_bottom_right,_rgba(16,185,129,0.22),_transparent_32%)]" />

          <div className="relative z-10">
            <LogoBatiflow grand />
          </div>

          <div className="relative z-10 max-w-xl">
            <p className="mb-4 inline-flex rounded-full border border-white/10 bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 backdrop-blur">
              Devis · Factures · Clients · Chantiers
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Pilote ton activité avec une interface claire, rapide et
              professionnelle.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Connecte-toi à ton espace sécurisé pour gérer tes devis, factures,
              clients, chantiers et informations d’entreprise.
            </p>

            <div className="mt-8 grid max-w-lg grid-cols-3 gap-3">
              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">PDF</p>
                <p className="mt-1 text-xs text-slate-300">exports propres</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">Mail</p>
                <p className="mt-1 text-xs text-slate-300">envoi client</p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">Mobile</p>
                <p className="mt-1 text-xs text-slate-300">prêt terrain</p>
              </div>
            </div>
          </div>

          <div className="relative z-10 text-xs text-slate-400">
            Accès réservé aux utilisateurs autorisés.
          </div>
        </section>

        <section className="flex min-h-screen flex-1 items-center justify-center bg-slate-100 px-4 py-8 sm:px-6 lg:px-10">
          <div className="w-full max-w-md">
            <div className="mb-6 flex justify-center lg:hidden">
              <LogoBatiflow grand />
            </div>

            <div className="rounded-[28px] bg-white p-5 shadow-sm ring-1 ring-slate-200 sm:p-8">
              <div className="text-center">
                <p className="text-sm font-medium text-slate-500">
                  Espace sécurisé
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Connexion
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Accède à ton tableau de bord pour gérer ton activité.
                </p>
              </div>

              <form onSubmit={handleLogin} className="mt-7 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Adresse email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="exemple@email.com"
                    autoComplete="email"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label className="block text-sm font-semibold text-slate-700">
                      Mot de passe
                    </label>

                    <button
                      type="button"
                      onClick={handleResetPassword}
                      disabled={resetEnCours || chargement}
                      className="text-xs font-semibold text-slate-600 underline-offset-4 transition hover:text-slate-900 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {resetEnCours ? "Envoi..." : "Mot de passe oublié ?"}
                    </button>
                  </div>

                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ton mot de passe"
                    autoComplete="current-password"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                {erreur && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {erreur}
                  </div>
                )}

                {messageSucces && (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                    {messageSucces}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={chargement || resetEnCours}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chargement ? "Connexion..." : "Se connecter"}
                </button>
              </form>

              <div className="mt-6 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Sécurité
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Chaque utilisateur se connecte avec son propre compte. En cas
                  de besoin, il peut réinitialiser lui-même son mot de passe par
                  email.
                </p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Version démo privée
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}