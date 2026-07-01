"use client";

import type { Dispatch, SetStateAction } from "react";
import type { StatutDevis } from "../types/devis";

type FiltreStatut = "Tous" | StatutDevis;
type FiltreArchivage = "actifs" | "archives" | "tous";

type Props = {
  recherche: string;
  setRecherche: Dispatch<SetStateAction<string>>;
  filtreStatut: FiltreStatut;
  setFiltreStatut: Dispatch<SetStateAction<FiltreStatut>>;
  filtreArchivage: FiltreArchivage;
  setFiltreArchivage: Dispatch<SetStateAction<FiltreArchivage>>;
  statuts: StatutDevis[];
};

const champFormulaireClasses =
  "block min-h-12 w-full min-w-0 max-w-full rounded-xl border border-slate-200 bg-slate-50/70 px-4 py-3 text-sm text-slate-900 shadow-inner shadow-slate-900/[0.02] outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-orange-400 focus:bg-white focus:ring-4 focus:ring-orange-100";

export default function DevisSearch({
  recherche,
  setRecherche,
  filtreStatut,
  setFiltreStatut,
  filtreArchivage,
  setFiltreArchivage,
  statuts,
}: Props) {
  return (
    <div className="grid gap-3 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,0.85fr)_minmax(0,0.85fr)]">
      <input
        aria-label="Rechercher un devis"
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher un devis, client, statut ou montant..."
        className={champFormulaireClasses}
      />

      <select
        aria-label="Filtrer par statut"
        value={filtreStatut}
        onChange={(e) => setFiltreStatut(e.target.value as FiltreStatut)}
        className={champFormulaireClasses}
      >
        <option value="Tous">Tous les statuts</option>
        {statuts.map((statut) => (
          <option key={statut} value={statut}>
            {statut}
          </option>
        ))}
      </select>

      <select
        aria-label="Filtrer par archivage"
        value={filtreArchivage}
        onChange={(e) =>
          setFiltreArchivage(e.target.value as FiltreArchivage)
        }
        className={champFormulaireClasses}
      >
        <option value="actifs">Devis actifs</option>
        <option value="archives">Devis archivés</option>
        <option value="tous">Tous les devis</option>
      </select>
    </div>
  );
}
