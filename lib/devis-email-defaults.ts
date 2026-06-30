export function buildDevisEmailSubject(
  numeroDevis: string,
  nomEntreprise: string
) {
  const numero = numeroDevis.trim() || "DEVIS";
  const entreprise = nomEntreprise.trim() || "Votre entreprise";

  return `Votre devis ${numero} - ${entreprise}`;
}

export function buildDevisEmailMessage(nomEntreprise: string) {
  const entreprise = nomEntreprise.trim() || "Votre entreprise";

  return `Bonjour,

Suite à notre rendez-vous, vous trouverez ci-joint votre devis.

Vous pouvez également le consulter en ligne et l'accepter directement.

Je reste à votre disposition.

Bien cordialement,

${entreprise}`;
}
