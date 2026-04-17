"use client";

import { useState, type Dispatch, type SetStateAction } from "react";
import type { StatutDevis } from "../types/devis";

type VuePrincipale =
  | "devis"
  | "clients"
  | "chantiers"
  | "factures"
  | "admin";
type FiltreStatut = "Tous" | StatutDevis;
type FiltreArchivage = "actifs" | "archives" | "tous";

type Params = {
  setModeEdition: Dispatch<SetStateAction<boolean>>;
  setDevisSelectionneId: Dispatch<SetStateAction<string | null>>;
  setRecherche: Dispatch<SetStateAction<string>>;
  setFiltreStatut: Dispatch<SetStateAction<FiltreStatut>>;
  setFiltreArchivage: Dispatch<SetStateAction<FiltreArchivage>>;
};

export function useDevisPageUi({
  setModeEdition,
  setDevisSelectionneId,
  setRecherche,
  setFiltreStatut,
  setFiltreArchivage,
}: Params) {
  const [vuePrincipale, setVuePrincipale] = useState<VuePrincipale>("devis");
  const [afficherFormulaire, setAfficherFormulaire] = useState(false);

  const ouvrirVueDevis = () => {
    setVuePrincipale("devis");
  };

  const ouvrirVueClients = () => {
    setVuePrincipale("clients");
  };

  const ouvrirVueChantiers = () => {
    setVuePrincipale("chantiers");
  };

  const ouvrirVueFactures = () => {
    setVuePrincipale("factures");
  };

  const ouvrirVueAdmin = () => {
    setVuePrincipale("admin");
  };

  const toggleFormulaireDevis = () => {
    setAfficherFormulaire((prev) => !prev);
    setModeEdition(false);
  };

  const fermerFormulaireDevis = () => {
    setAfficherFormulaire(false);
  };

  const handleDevisCree = (id: string) => {
    setDevisSelectionneId(id);
    setAfficherFormulaire(false);
    setRecherche("");
    setFiltreStatut("Tous");
    setFiltreArchivage("actifs");
  };

  return {
    vuePrincipale,
    setVuePrincipale,
    afficherFormulaire,
    ouvrirVueDevis,
    ouvrirVueClients,
    ouvrirVueChantiers,
    ouvrirVueFactures,
    ouvrirVueAdmin,
    toggleFormulaireDevis,
    fermerFormulaireDevis,
    handleDevisCree,
  };
}