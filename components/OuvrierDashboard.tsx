type OuvrierDashboardProps = {
  displayName: string;
  entrepriseId: string;
  role: string;
  onDeconnexion: () => void;
};

export default function OuvrierDashboard({
  displayName,
  entrepriseId,
  role,
  onDeconnexion,
}: OuvrierDashboardProps) {
  return (
    <main className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 flex-col border-r border-slate-200 bg-white p-6 md:flex">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Batiflow</h1>
            <p className="mt-1 text-sm text-slate-500">Espace ouvrier</p>
            <p className="mt-3 text-xs text-slate-400">
              {displayName} · {entrepriseId}
            </p>
          </div>
        </aside>

        <section className="flex-1 p-6 md:p-8">
          <div className="mx-auto max-w-4xl">
            <header className="mb-8 flex flex-col gap-4 rounded-2xl bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-3xl font-bold">Espace ouvrier</h2>
                <p className="mt-2 text-slate-500">
                  Le module devis est réservé aux administrateurs.
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  Entreprise : {entrepriseId} · Rôle : {role}
                </p>
              </div>

              <button
                onClick={onDeconnexion}
                className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Déconnexion
              </button>
            </header>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h3 className="text-xl font-semibold text-slate-900">
                Module en préparation
              </h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Cet espace servira plus tard au suivi des chantiers, aux tâches,
                aux heures prestées, aux notes terrain et aux photos.
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}