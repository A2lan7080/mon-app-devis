"use client";

import type { StatutDevis } from "../types/devis";

type FiltreStatut = "Tous" | StatutDevis;
type FiltreArchivage = "actifs" | "archives" | "tous";

type DevisSearchProps = {
  recherche: string;
  setRecherche: (value: string) => void;
  filtreStatut: FiltreStatut;
  setFiltreStatut: (value: FiltreStatut) => void;
  filtreArchivage: FiltreArchivage;
  setFiltreArchivage: (value: FiltreArchivage) => void;
  statuts: readonly StatutDevis[];
};

function getButtonClasses(estActif: boolean) {
  return estActif
    ? "bg-slate-900 text-white border-slate-900"
    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50";
}

export default function DevisSearch({
  recherche,
  setRecherche,
  filtreStatut,
  setFiltreStatut,
  filtreArchivage,
  setFiltreArchivage,
  statuts,
}: DevisSearchProps) {
  return (
    <div className="mb-5 space-y-4 sm:mb-6">
      <div className="space-y-3">
        <div>
          <h3 className="text-xl font-semibold sm:text-2xl">Liste des devis</h3>
          <p className="mt-1 text-sm text-slate-500">
            Recherche, filtre et ouvre rapidement un devis.
          </p>
        </div>

        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un devis, client, statut ou montant"
          className="block w-full min-w-0 rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400"
        />
      </div>

      <div className="space-y-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Statut
          </p>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
            <button
              onClick={() => setFiltreStatut("Tous")}
              className={`w-full rounded-xl px-3 py-3 text-center text-sm font-medium transition ${getButtonClasses(
                filtreStatut === "Tous"
              )}`}
            >
              Tous
            </button>

            {statuts.map((statut) => (
              <button
                key={statut}
                onClick={() => setFiltreStatut(statut)}
                className={`w-full rounded-xl px-3 py-3 text-center text-sm font-medium transition ${getButtonClasses(
                  filtreStatut === statut
                )}`}
              >
                {statut}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
            Archivage
          </p>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            <button
              onClick={() => setFiltreArchivage("actifs")}
              className={`w-full rounded-xl px-3 py-3 text-center text-sm font-medium transition ${getButtonClasses(
                filtreArchivage === "actifs"
              )}`}
            >
              Actifs
            </button>

            <button
              onClick={() => setFiltreArchivage("archives")}
              className={`w-full rounded-xl px-3 py-3 text-center text-sm font-medium transition ${getButtonClasses(
                filtreArchivage === "archives"
              )}`}
            >
              Archives
            </button>

            <button
              onClick={() => setFiltreArchivage("tous")}
              className={`w-full rounded-xl px-3 py-3 text-center text-sm font-medium transition ${getButtonClasses(
                filtreArchivage === "tous"
              )}`}
            >
              Tout voir
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}