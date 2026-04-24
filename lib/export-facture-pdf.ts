import {
  getEntrepriseSettings,
  type EntrepriseSettings,
} from "./get-entreprise-settings";
import { formatMontant } from "./devis-helpers";
import type { Facture } from "../types/factures";

function calculerMontantTva(facture: Facture) {
  return facture.montantHt * (facture.tvaTaux / 100);
}

function calculerTotalTtc(facture: Facture) {
  return facture.montantHt + calculerMontantTva(facture);
}

function calculerNetAPayer(facture: Facture) {
  return calculerTotalTtc(facture) - facture.acompteDeduit;
}

function echapperHtml(valeur: string) {
  return valeur
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function texteOuDefaut(valeur?: string, defaut = "-") {
  const nettoyee = typeof valeur === "string" ? valeur.trim() : "";
  return nettoyee ? echapperHtml(nettoyee) : defaut;
}

function texteMultiligneOuDefaut(valeur?: string, defaut = "Aucune note.") {
  const nettoyee = typeof valeur === "string" ? valeur.trim() : "";

  if (!nettoyee) return defaut;

  return echapperHtml(nettoyee).replaceAll("\n", "<br />");
}

function codePostalVille(codePostal?: string, ville?: string) {
  return [codePostal, ville].filter(Boolean).join(" · ");
}

function getLogoHtml(entreprise: EntrepriseSettings) {
  const logoUrl = entreprise.logoUrl?.trim();

  if (!logoUrl) return "";
  if (!logoUrl.startsWith("https://") && !logoUrl.startsWith("http://")) {
    return "";
  }

  return `
    <div class="logo-wrapper">
      <img src="${echapperHtml(logoUrl)}" alt="Logo entreprise" class="logo-entreprise" />
    </div>
  `;
}

function getBlocEntreprise(entreprise: EntrepriseSettings) {
  const logoHtml = getLogoHtml(entreprise);
  const afficherNom =
    !logoHtml || entreprise.logoRemplaceNomEntreprise !== true;

  return `
    <div class="card card-compact entreprise-card">
      ${logoHtml}

      <div class="label">Entreprise</div>

      ${
        afficherNom
          ? `<div class="main-name">${texteOuDefaut(
              entreprise.nom,
              "BatiFlow"
            )}</div>`
          : ""
      }

      <div class="info-grid entreprise-info">
        <div>
          <div class="info-label">Adresse</div>
          <div class="info-value">${texteOuDefaut(
            entreprise.adresse,
            "Adresse non renseignée"
          )}</div>
        </div>

        <div>
          <div class="info-label">Code postal / Ville</div>
          <div class="info-value">${texteOuDefaut(
            codePostalVille(entreprise.codePostal, entreprise.ville),
            "Coordonnées non renseignées"
          )}</div>
        </div>

        <div>
          <div class="info-label">Email</div>
          <div class="info-value">${texteOuDefaut(
            entreprise.email,
            "Email non renseigné"
          )}</div>
        </div>

        <div>
          <div class="info-label">Téléphone</div>
          <div class="info-value">${texteOuDefaut(
            entreprise.telephone,
            "Téléphone non renseigné"
          )}</div>
        </div>

        <div>
          <div class="info-label">TVA</div>
          <div class="info-value">${texteOuDefaut(
            entreprise.tva,
            "Non renseignée"
          )}</div>
        </div>
      </div>
    </div>
  `;
}

function getPrintScript() {
  return `
    <script>
      function lancerImpression() {
        setTimeout(function () {
          window.print();
        }, 250);
      }

      window.addEventListener("load", function () {
        var images = Array.from(document.images || []);

        if (images.length === 0) {
          lancerImpression();
          return;
        }

        var restantes = images.length;

        function imageTerminee() {
          restantes = restantes - 1;
          if (restantes <= 0) lancerImpression();
        }

        images.forEach(function (img) {
          if (img.complete) {
            imageTerminee();
          } else {
            img.addEventListener("load", imageTerminee);
            img.addEventListener("error", imageTerminee);
          }
        });
      });
    </script>
  `;
}

export async function exporterFacturePdf(factureSelectionnee: Facture) {
  const montantTva = calculerMontantTva(factureSelectionnee);
  const totalTtc = calculerTotalTtc(factureSelectionnee);
  const netAPayer = calculerNetAPayer(factureSelectionnee);

  const fenetre = window.open("", "_blank", "width=1100,height=900");

  if (!fenetre) {
    alert("Impossible d’ouvrir la fenêtre d’export PDF.");
    return;
  }

  const entreprise = await getEntrepriseSettings(
    factureSelectionnee.entrepriseId ?? null
  );

  fenetre.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${echapperHtml(factureSelectionnee.reference)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, sans-serif;
            font-size: 12px;
          }

          .page {
            max-width: 960px;
            margin: 0 auto;
            padding: 28px 34px;
          }

          .topbar {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(250px, 0.9fr);
            gap: 22px;
            align-items: start;
            margin-bottom: 16px;
          }

          .document-header {
            text-align: right;
            padding-top: 4px;
          }

          .doc-title {
            margin: 0 0 8px;
            font-size: 28px;
            line-height: 1.1;
            font-weight: 800;
          }

          .doc-line {
            margin: 0 0 3px;
            color: #334155;
            font-size: 12px;
            line-height: 1.35;
          }

          .card {
            border: 1px solid #dbe4ef;
            border-radius: 14px;
            padding: 16px;
            margin-bottom: 14px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .card-compact {
            padding: 14px 16px;
          }

          .label {
            margin-bottom: 8px;
            color: #64748b;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .main-name {
            margin-bottom: 10px;
            font-size: 22px;
            line-height: 1.15;
            font-weight: 800;
            word-break: break-word;
          }

          .logo-wrapper {
            margin-bottom: 10px;
          }

          .logo-entreprise {
            display: block;
            max-width: 230px;
            max-height: 86px;
            width: auto;
            height: auto;
            object-fit: contain;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px 18px;
          }

          .entreprise-info {
            grid-template-columns: 1fr 1fr;
          }

          .info-label {
            margin-bottom: 3px;
            color: #64748b;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .info-value {
            color: #0f172a;
            font-size: 12px;
            font-weight: 700;
            line-height: 1.35;
            word-break: break-word;
          }

          .info-value.light {
            font-weight: 500;
            color: #334155;
          }

          .total-box {
            width: 320px;
            max-width: 100%;
            margin-top: 10px;
            margin-left: auto;
            border: 1px solid #dbe4ef;
            border-radius: 14px;
            padding: 14px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 7px;
            font-size: 12px;
          }

          .total-row span:last-child {
            font-weight: 800;
            white-space: nowrap;
            text-align: right;
          }

          .total-row.final {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #dbe4ef;
            font-size: 18px;
            font-weight: 900;
          }

          .conditions-text {
            color: #334155;
            font-size: 12px;
            line-height: 1.45;
          }

          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 14px;
            margin-top: 14px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .signature-box {
            min-height: 92px;
            border: 1px solid #dbe4ef;
            border-radius: 14px;
            padding: 14px;
          }

          .footer {
            margin-top: 14px;
            color: #64748b;
            font-size: 10px;
            line-height: 1.4;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .page {
              max-width: none;
              padding: 14mm 14mm;
            }

            @page {
              size: A4;
              margin: 0;
            }
          }
        </style>
      </head>

      <body>
        <div class="page">
          <div class="topbar">
            ${getBlocEntreprise(entreprise)}

            <div class="document-header">
              <h1 class="doc-title">Facture</h1>
              <p class="doc-line"><strong>N°</strong> ${echapperHtml(
                factureSelectionnee.reference
              )}</p>
              <p class="doc-line"><strong>Objet :</strong> ${texteOuDefaut(
                factureSelectionnee.objet
              )}</p>
              <p class="doc-line"><strong>Devis lié :</strong> ${texteOuDefaut(
                factureSelectionnee.devisReference,
                "Aucun devis lié"
              )}</p>
              <p class="doc-line"><strong>Date émission :</strong> ${texteOuDefaut(
                factureSelectionnee.dateEmission
              )}</p>
              <p class="doc-line"><strong>Date échéance :</strong> ${texteOuDefaut(
                factureSelectionnee.dateEcheance
              )}</p>
              <p class="doc-line"><strong>Statut :</strong> ${texteOuDefaut(
                factureSelectionnee.statut
              )}</p>
            </div>
          </div>

          <div class="card">
            <div class="label">Client</div>
            <div class="main-name">${texteOuDefaut(
              factureSelectionnee.clientNom
            )}</div>

            <div class="info-grid">
              <div>
                <div class="info-label">Adresse</div>
                <div class="info-value light">${texteOuDefaut(
                  factureSelectionnee.clientAdresse,
                  "Adresse non renseignée"
                )}</div>
              </div>

              <div>
                <div class="info-label">Code postal / Ville</div>
                <div class="info-value light">${texteOuDefaut(
                  codePostalVille(
                    factureSelectionnee.clientCodePostal,
                    factureSelectionnee.clientVille
                  ),
                  "Coordonnées non renseignées"
                )}</div>
              </div>

              <div>
                <div class="info-label">Email</div>
                <div class="info-value light">${texteOuDefaut(
                  factureSelectionnee.clientEmail,
                  "Email non renseigné"
                )}</div>
              </div>

              <div>
                <div class="info-label">Téléphone</div>
                <div class="info-value light">${texteOuDefaut(
                  factureSelectionnee.clientTelephone,
                  "Téléphone non renseigné"
                )}</div>
              </div>

              <div>
                <div class="info-label">Chantier lié</div>
                <div class="info-value">${texteOuDefaut(
                  factureSelectionnee.chantierTitre,
                  "Aucun chantier lié"
                )}</div>
              </div>

              <div>
                <div class="info-label">Date paiement</div>
                <div class="info-value">${texteOuDefaut(
                  factureSelectionnee.datePaiement,
                  "Non renseigné"
                )}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="label">Récapitulatif financier</div>

            <div class="total-box">
              <div class="total-row">
                <span>Montant HT</span>
                <span>${formatMontant(factureSelectionnee.montantHt)}</span>
              </div>

              <div class="total-row">
                <span>TVA (${factureSelectionnee.tvaTaux}%)</span>
                <span>${formatMontant(montantTva)}</span>
              </div>

              <div class="total-row">
                <span>Total TTC</span>
                <span>${formatMontant(totalTtc)}</span>
              </div>

              <div class="total-row">
                <span>Acompte déduit</span>
                <span>${formatMontant(factureSelectionnee.acompteDeduit)}</span>
              </div>

              <div class="total-row final">
                <span>Net à payer</span>
                <span>${formatMontant(netAPayer)}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="label">Notes</div>
            <div class="conditions-text">
              ${texteMultiligneOuDefaut(
                factureSelectionnee.notes,
                "Aucune note pour cette facture."
              )}
            </div>
          </div>

          <div class="signature-grid">
            <div class="signature-box">
              <div class="label">Pour le client</div>
              <div class="conditions-text">
                Bon pour accord, date, nom et signature.
              </div>
            </div>

            <div class="signature-box">
              <div class="label">Pour l’entreprise</div>
              <div class="conditions-text">
                ${texteOuDefaut(entreprise.nom, "BatiFlow")}
              </div>
            </div>
          </div>

          <div class="footer">
            Merci pour votre confiance.
          </div>
        </div>

        ${getPrintScript()}
      </body>
    </html>
  `);

  fenetre.document.close();
}