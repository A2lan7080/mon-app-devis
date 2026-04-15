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
    <div className="mb-6 flex flex-col gap-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h3 className="text-2xl font-semibold">Liste des devis</h3>

        <input
          type="text"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          placeholder="Rechercher un devis, un client, un statut ou un montant"
          className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400 lg:max-w-md"
        />
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltreStatut("Tous")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filtreStatut === "Tous"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tous
          </button>

          {statuts.map((statut) => (
            <button
              key={statut}
              onClick={() => setFiltreStatut(statut)}
              className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                filtreStatut === statut
                  ? "bg-slate-900 text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {statut}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setFiltreArchivage("actifs")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filtreArchivage === "actifs"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Actifs
          </button>

          <button
            onClick={() => setFiltreArchivage("archives")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filtreArchivage === "archives"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Archives
          </button>

          <button
            onClick={() => setFiltreArchivage("tous")}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
              filtreArchivage === "tous"
                ? "bg-slate-900 text-white"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            }`}
          >
            Tout voir
          </button>
        </div>
      </div>
    </div>
  );
}