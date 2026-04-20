"use client";

import { useState } from "react";
import AdminDashboard from "./AdminDashboard";
import { entreprise as entrepriseParDefaut } from "../lib/devis-constants";
import type { Entreprise } from "../types/devis";

type Props = {
  valeurBusinessTotale: number;
  caSigne: number;
  totalEnvoyes: number;
  pipeEnvoye: number;
  pipeBrouillon: number;
  tauxConversion: number;
  totalDevis: number;
  ticketMoyen: number;
  totalArchives: number;
  totalBrouillons: number;
  totalAcceptes: number;
  totalRefuses: number;
};

export default function AdminWorkspace({
  valeurBusinessTotale,
  caSigne,
  totalEnvoyes,
  pipeEnvoye,
  pipeBrouillon,
  tauxConversion,
  totalDevis,
  ticketMoyen,
  totalArchives,
  totalBrouillons,
  totalAcceptes,
  totalRefuses,
}: Props) {
  const [entreprise, setEntreprise] = useState<Entreprise>(entrepriseParDefaut);
  const [logoPreviewUrl, setLogoPreviewUrl] = useState<string>("");

  return (
    <AdminDashboard
      valeurBusinessTotale={valeurBusinessTotale}
      caSigne={caSigne}
      totalEnvoyes={totalEnvoyes}
      pipeEnvoye={pipeEnvoye}
      pipeBrouillon={pipeBrouillon}
      tauxConversion={tauxConversion}
      totalDevis={totalDevis}
      ticketMoyen={ticketMoyen}
      totalArchives={totalArchives}
      totalBrouillons={totalBrouillons}
      totalAcceptes={totalAcceptes}
      totalRefuses={totalRefuses}
      entreprise={entreprise}
      setEntreprise={setEntreprise}
      logoPreviewUrl={logoPreviewUrl}
      setLogoPreviewUrl={setLogoPreviewUrl}
    />
  );
}