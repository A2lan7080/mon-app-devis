"use client";

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
    <main className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
      <div className="w-full max-w-xl rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-slate-900">Accès impossible</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          {erreurAcces ?? "Le profil utilisateur est introuvable ou incomplet."}
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            onClick={onDeconnexion}
            className="rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Se déconnecter
          </button>
          <button
            onClick={onRetourLogin}
            className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700"
          >
            Retour login
          </button>
        </div>
      </div>
    </main>
  );
}