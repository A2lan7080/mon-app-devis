/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

require.extensions[".ts"] = (module, filename) => {
  const source = fs.readFileSync(filename, "utf8");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
    fileName: filename,
  });

  module._compile(outputText, filename);
};

const { renderDevisEmailHtml } = require("../lib/render-devis-email.ts");

const logoPath = path.join(process.cwd(), "public", "logo-batiflow.png");
const logoDataUrl = `data:image/png;base64,${fs
  .readFileSync(logoPath)
  .toString("base64")}`;

const entreprise = {
  nom: "Atelier Horizon",
  adresse: "18 avenue des Artisans",
  codePostal: "1050",
  ville: "Bruxelles",
  email: "bonjour@atelier-horizon.be",
  telephone: "+32 2 555 24 80",
  tva: "BE 0765.432.109",
  iban: "BE68 5390 0754 7034",
  mentionsLegalesFacture: "Atelier Horizon SRL",
  logoUrl: logoDataUrl,
  logoRemplaceNomEntreprise: false,
};

const devisBase = {
  id: "entreprise-demo-DEV-2026-014",
  client: "Sophie Lambert",
  statut: "Envoyé",
  date: "30/06/2026",
  adresse: "24 avenue Louise",
  codePostal: "1050",
  ville: "Bruxelles",
  email: "sophie.lambert@example.com",
  telephone: "+32 470 12 34 56",
  typeClient: "Particulier",
  societe: "",
  tvaClient: "",
  chantierId: "chantier-demo",
  chantierTitre: "Rénovation intérieure",
  tvaTaux: 21,
  acomptePourcentage: 30,
  validiteJours: 30,
  conditions:
    "Offre valable 30 jours. Un acompte de 30% est demandé à la commande. Le solde est payable à la réception des travaux.",
  lignes: [
    {
      id: "ligne-1",
      designation: "Préparation et protection du chantier",
      quantite: 1,
      unite: "forfait",
      prixUnitaire: 680,
      tvaTaux: 21,
    },
    {
      id: "ligne-2",
      designation: "Rénovation complète du séjour",
      quantite: 42,
      unite: "m²",
      prixUnitaire: 92,
      tvaTaux: 21,
    },
    {
      id: "ligne-3",
      designation: "Finitions et nettoyage de livraison",
      quantite: 1,
      unite: "forfait",
      prixUnitaire: 420,
      tvaTaux: 21,
    },
  ],
};

const message = `Bonjour Sophie,

Suite à notre rendez-vous, vous trouverez ci-joint votre devis.

Vous pouvez également le consulter en ligne et l'accepter directement.

Je reste à votre disposition.

Bien cordialement,

Atelier Horizon`;

const acceptanceUrl =
  "https://app.batiflow.be/accepter-devis/lien-securise-de-demonstration";
const outputDir = path.join(process.cwd(), "artifacts", "email-previews");

fs.mkdirSync(outputDir, { recursive: true });

const previews = [
  {
    filename: "devis-email-premium.html",
    devis: devisBase,
  },
  {
    filename: "devis-email-expire.html",
    devis: {
      ...devisBase,
      date: "15/04/2026",
      validiteJours: 30,
    },
  },
  {
    filename: "devis-email-accepte.html",
    devis: {
      ...devisBase,
      statut: "Accepté",
    },
  },
  {
    filename: "devis-email-refuse.html",
    devis: {
      ...devisBase,
      statut: "Refusé",
    },
  },
];

for (const preview of previews) {
  const html = renderDevisEmailHtml(
    preview.devis,
    entreprise,
    acceptanceUrl,
    message
  );
  const fragmentsAttendus = [
    "Pourquoi ce lien ?",
    "Consulter le devis",
    "Accepter ou refuser",
    "BE68 5390 0754 7034",
    "Offre valable 30 jours.",
    "Atelier Horizon SRL",
  ];

  for (const fragment of fragmentsAttendus) {
    if (!html.includes(fragment)) {
      throw new Error(
        `Le rendu ${preview.filename} ne contient pas : ${fragment}`
      );
    }
  }

  const bandeauAttendu =
    preview.devis.statut === "Accepté"
      ? "Devis accepté"
      : preview.devis.statut === "Refusé"
        ? "Devis refusé"
        : preview.filename.includes("expire")
          ? "Devis expiré"
          : null;

  if (bandeauAttendu && !html.includes(bandeauAttendu)) {
    throw new Error(
      `Le rendu ${preview.filename} ne contient pas le bandeau : ${bandeauAttendu}`
    );
  }

  fs.writeFileSync(path.join(outputDir, preview.filename), html, "utf8");
}

console.log(`Aperçus générés dans ${outputDir}`);
