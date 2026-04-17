"use client";

import { useMemo } from "react";
import { calculerTotalTvac, formatMontant } from "../lib/devis-helpers";
import type { DevisBusiness } from "./useDevisActions";
import type { StatutDevis } from "../types/devis";

type FiltreStatut = "Tous" | StatutDevis;
type FiltreArchivage = "actifs" | "archives" | "tous";

type Params = {
  devis: DevisBusiness[];
  recherche: string;
  filtreStatut: FiltreStatut;
  filtreArchivage: FiltreArchivage;
  devisSelectionneId: string | null;
};

export function useDevisAnalytics({
  devis,
  recherche,
  filtreStatut,
  filtreArchivage,
  devisSelectionneId,
}: Params) {
  const devisFiltres = useMemo(() => {
    const valeur = recherche.trim().toLowerCase();

    return devis.filter((item) => {
      const total = calculerTotalTvac(item);

      const champsRecherche = [
        item.id ?? "",
        item.client ?? "",
        item.statut ?? "",
        item.adresse ?? "",
        item.email ?? "",
        item.telephone ?? "",
        formatMontant(total),
      ]
        .join(" ")
        .toLowerCase();

      const matchRecherche = !valeur || champsRecherche.includes(valeur);

      const matchStatut =
        filtreStatut === "Tous" ? true : item.statut === filtreStatut;

      const estArchive = item.archive === true;

      const matchArchivage =
        filtreArchivage === "tous"
          ? true
          : filtreArchivage === "archives"
          ? estArchive
          : !estArchive;

      return matchRecherche && matchStatut && matchArchivage;
    });
  }, [recherche, devis, filtreStatut, filtreArchivage]);

  const devisSelectionne = useMemo(() => {
    if (devisFiltres.length === 0) return null;

    if (!devisSelectionneId) {
      return devisFiltres[0];
    }

    return devisFiltres.find((item) => item.id === devisSelectionneId) ?? null;
  }, [devisFiltres, devisSelectionneId]);

  const totalDevis = useMemo(
    () => devis.filter((item) => !item.archive).length,
    [devis]
  );

  const totalBrouillons = useMemo(
    () =>
      devis.filter((item) => item.statut === "Brouillon" && !item.archive)
        .length,
    [devis]
  );

  const totalAcceptes = useMemo(
    () =>
      devis.filter((item) => item.statut === "Accepté" && !item.archive).length,
    [devis]
  );

  const totalEnvoyes = useMemo(
    () =>
      devis.filter((item) => item.statut === "Envoyé" && !item.archive).length,
    [devis]
  );

  const totalRefuses = useMemo(
    () =>
      devis.filter((item) => item.statut === "Refusé" && !item.archive).length,
    [devis]
  );

  const totalArchives = useMemo(
    () => devis.filter((item) => item.archive).length,
    [devis]
  );

  const caSigne = useMemo(
    () =>
      devis
        .filter((item) => item.statut === "Accepté" && !item.archive)
        .reduce((total, item) => total + calculerTotalTvac(item), 0),
    [devis]
  );

  const pipeEnvoye = useMemo(
    () =>
      devis
        .filter((item) => item.statut === "Envoyé" && !item.archive)
        .reduce((total, item) => total + calculerTotalTvac(item), 0),
    [devis]
  );

  const pipeBrouillon = useMemo(
    () =>
      devis
        .filter((item) => item.statut === "Brouillon" && !item.archive)
        .reduce((total, item) => total + calculerTotalTvac(item), 0),
    [devis]
  );

  const valeurBusinessTotale = useMemo(
    () =>
      devis
        .filter((item) => item.statut !== "Refusé" && !item.archive)
        .reduce((total, item) => total + calculerTotalTvac(item), 0),
    [devis]
  );

  const tauxConversion = useMemo(
    () => (totalDevis > 0 ? Math.round((totalAcceptes / totalDevis) * 100) : 0),
    [totalDevis, totalAcceptes]
  );

  const ticketMoyen = useMemo(
    () => (totalAcceptes > 0 ? Math.round(caSigne / totalAcceptes) : 0),
    [totalAcceptes, caSigne]
  );

  return {
    devisFiltres,
    devisSelectionne,
    totalDevis,
    totalBrouillons,
    totalAcceptes,
    totalEnvoyes,
    totalRefuses,
    totalArchives,
    caSigne,
    pipeEnvoye,
    pipeBrouillon,
    valeurBusinessTotale,
    tauxConversion,
    ticketMoyen,
  };
}