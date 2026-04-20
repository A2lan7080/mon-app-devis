"use client";

import AdminDashboard from "./AdminDashboard";
import { useEntrepriseSettings } from "../hooks/useEntrepriseSettings";

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
  entrepriseId?: string;
  createdByUid?: string;
  authChargee?: boolean;
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
  entrepriseId,
  createdByUid,
  authChargee = true,
}: Props) {
  const {
    entrepriseSettings,
    setEntrepriseSettings,
    chargementEntreprise,
    sauvegardeEntrepriseEnCours,
    enregistrerEntreprise,
  } = useEntrepriseSettings({
    entrepriseIdCourante: entrepriseId ?? null,
    userId: createdByUid ?? null,
    authChargee,
  });

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
      entreprise={entrepriseSettings}
      setEntreprise={setEntrepriseSettings}
      chargementEntreprise={chargementEntreprise}
      sauvegardeEntrepriseEnCours={sauvegardeEntrepriseEnCours}
      enregistrerEntreprise={enregistrerEntreprise}
    />
  );
}