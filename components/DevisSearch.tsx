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
  "block w-full min-w-0 max-w-full rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition focus:border-slate-400";

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
    <div className="grid gap-4">
      <input
        type="text"
        value={recherche}
        onChange={(e) => setRecherche(e.target.value)}
        placeholder="Rechercher un devis, client, statut ou montant..."
        className={champFormulaireClasses}
      />

      <select
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