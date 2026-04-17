"use client";

import AdminDashboard from "./AdminDashboard";

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
    />
  );
}