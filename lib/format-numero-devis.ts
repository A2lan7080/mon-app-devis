export function formatNumeroDevisPourAffichage(numero: string): string {
  const numeroNettoye = numero.trim();
  const numeroDevis = numeroNettoye.match(/(?:^|-)(DEV-\d{4}-\d+)$/);

  if (!numeroDevis) {
    return numero;
  }

  return numeroDevis[1];
}
