"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FirebaseError } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import AuthFeatureCards from "@/components/AuthFeatureCards";
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

function messageErreurAuth(error: unknown) {
  if (error instanceof FirebaseError) {
    if (error.code === "auth/email-already-in-use") {
      return "Cette adresse email est déjà utilisée. Connecte-toi ou réinitialise ton mot de passe.";
    }

    if (error.code === "auth/weak-password") {
      return "Le mot de passe est trop faible. Utilise au moins 6 caractères.";
    }

    if (error.code === "auth/invalid-email") {
      return "L'adresse email n'est pas valide.";
    }

    if (error.code === "auth/network-request-failed") {
      return "Erreur réseau. Vérifie ta connexion puis réessaie.";
    }

    if (error.code === "auth/operation-not-allowed") {
      return "La création de compte par email/mot de passe n'est pas activée dans Firebase Auth.";
    }
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "Impossible de créer le compte pour le moment.";
}

async function initialiserCompte({
  user,
  displayName,
  entrepriseNom,
}: {
  user: User;
  displayName: string;
  entrepriseNom: string;
}) {
  const idToken = await user.getIdToken(true);
  const response = await fetch("/api/auth/onboard", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      displayName,
      entrepriseNom,
    }),
  });
  const data = (await response.json().catch(() => ({}))) as {
    success?: boolean;
    error?: string;
  };

  if (!response.ok || !data.success) {
    throw new Error(
      data.error ??
        "Le compte Auth est créé, mais l'initialisation Firestore a échoué. Réessaie dans quelques secondes."
    );
  }
}

export default function SignupPage() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [entrepriseNom, setEntrepriseNom] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [erreur, setErreur] = useState("");
  const [chargement, setChargement] = useState(false);

  const displayNameNettoye = displayName.trim();
  const entrepriseNomNettoye = entrepriseNom.trim();
  const emailNettoye = email.trim().toLowerCase();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    setErreur("");

    if (!displayNameNettoye || !entrepriseNomNettoye || !emailNettoye) {
      setErreur("Tous les champs sont obligatoires.");
      return;
    }

    if (password.length < 6) {
      setErreur("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    try {
      setChargement(true);

      let user = auth.currentUser;

      if (!user) {
        const credential = await createUserWithEmailAndPassword(
          auth,
          emailNettoye,
          password
        );
        user = credential.user;
      } else if (user.email?.toLowerCase() !== emailNettoye) {
        throw new Error(
          "Un autre compte est déjà connecté dans ce navigateur. Déconnecte-le avant de créer ce compte."
        );
      }

      if (user.displayName !== displayNameNettoye) {
        await updateProfile(user, { displayName: displayNameNettoye });
      }

      await initialiserCompte({
        user,
        displayName: displayNameNettoye,
        entrepriseNom: entrepriseNomNettoye,
      });

      router.push("/");
      router.refresh();
    } catch (error) {
      setErreur(messageErreurAuth(error));
    } finally {
      setChargement(false);
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
              Inscription artisan
            </p>

            <h1 className="text-5xl font-bold leading-tight tracking-tight">
              Crée ton espace BatiFlow avec une entreprise isolée dès le départ.
            </h1>

            <p className="mt-6 max-w-lg text-base leading-7 text-slate-300">
              Ton compte admin, ton entreprise et tes paramètres sont initialisés
              ensemble pour garder devis, factures, clients et chantiers séparés.
            </p>

            <AuthFeatureCards />
          </div>

          <div className="relative z-10 text-xs text-slate-400">
            Chaque nouvelle inscription crée sa propre entreprise.
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
                  Nouvel espace
                </p>
                <h2 className="mt-2 text-2xl font-bold text-slate-900">
                  Création de compte
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Renseigne tes informations pour démarrer avec une entreprise
                  dédiée.
                </p>
              </div>

              <form onSubmit={handleSignup} className="mt-7 space-y-4">
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom affiché
                  </label>
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Jean Dupont"
                    autoComplete="name"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Nom de l&apos;entreprise
                  </label>
                  <input
                    type="text"
                    required
                    value={entrepriseNom}
                    onChange={(e) => setEntrepriseNom(e.target.value)}
                    placeholder="Bati Dupont"
                    autoComplete="organization"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

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
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Au moins 6 caractères"
                    autoComplete="new-password"
                    className="block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-slate-400"
                  />
                </div>

                {erreur && (
                  <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {erreur}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={chargement}
                  className="w-full rounded-xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {chargement ? "Création..." : "Créer mon compte"}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-slate-500">
                Déjà inscrit ?{" "}
                <Link
                  href="/login"
                  className="font-semibold text-slate-800 underline-offset-4 transition hover:text-slate-950 hover:underline"
                >
                  Se connecter
                </Link>
              </p>
            </div>

            <p className="mt-6 text-center text-xs text-slate-400">
              Entreprise isolée automatiquement
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
