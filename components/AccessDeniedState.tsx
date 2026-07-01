"use client";

import Button from "./ui/Button";
import Card from "./ui/Card";
import FeedbackMessage from "./ui/FeedbackMessage";

type Props = {
  erreurAcces: string | null;
  onDeconnexion: () => void;
  onRetourLogin: () => void;
};

export default function AccessDeniedState({
  erreurAcces,
  onDeconnexion,
  onRetourLogin,
}: Props) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-red-50/40 p-4 sm:p-6">
      <Card
        padding="lg"
        className="w-full max-w-xl shadow-[0_18px_45px_rgba(15,23,42,0.08)]"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-xl font-black text-red-700 ring-1 ring-red-100">
          !
        </div>
        <p className="mt-5 text-xs font-bold uppercase tracking-[0.12em] text-red-600">
          Accès sécurisé
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">
          Accès impossible
        </h1>
        <FeedbackMessage tone="error" className="mt-4">
          {erreurAcces ?? "Le profil utilisateur est introuvable ou incomplet."}
        </FeedbackMessage>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={onDeconnexion}
            className="w-full sm:w-auto"
          >
            Se déconnecter
          </Button>
          <Button
            variant="secondary"
            onClick={onRetourLogin}
            className="w-full sm:w-auto"
          >
            Retour à la connexion
          </Button>
        </div>
      </Card>
    </main>
  );
}
