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

Veuillez trouver ci-joint votre devis.

Vous pouvez également le consulter en ligne avant de l'accepter ou de le refuser.

Le PDF est joint à cet email.

Bien cordialement,

${entreprise}`;
}
