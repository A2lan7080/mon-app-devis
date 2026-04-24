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

  if (!nettoyee) {
    return defaut;
  }

  return echapperHtml(nettoyee).replaceAll("\n", "<br />");
}

function getCodePostalVille(entreprise: EntrepriseSettings) {
  return [entreprise.codePostal, entreprise.ville].filter(Boolean).join(" · ");
}

function getBlocLogo(entreprise: EntrepriseSettings) {
  if (!entreprise.logoUrl?.trim()) return "";

  const logoUrl = entreprise.logoUrl.trim();

  if (!logoUrl.startsWith("https://") && !logoUrl.startsWith("http://")) {
    return "";
  }

  return `
    <div class="logo-wrapper">
      <img
        src="${echapperHtml(logoUrl)}"
        alt="Logo entreprise"
        class="logo-entreprise"
      />
    </div>
  `;
}

function getBlocEntreprise(entreprise: EntrepriseSettings) {
  const blocLogo = getBlocLogo(entreprise);
  const afficherNom =
    !blocLogo || entreprise.logoRemplaceNomEntreprise !== true;

  return `
    <div class="bloc entreprise-bloc">
      ${blocLogo}

      ${
        afficherNom
          ? `<h1 class="title entreprise-title">${texteOuDefaut(
              entreprise.nom,
              "BatiFlow"
            )}</h1>`
          : ""
      }

      <div class="entreprise-details">
        <p><strong>Adresse :</strong> ${texteOuDefaut(
          entreprise.adresse,
          "Adresse non renseignée"
        )}</p>
        <p><strong>Code postal / Ville :</strong> ${texteOuDefaut(
          getCodePostalVille(entreprise),
          "Coordonnées non renseignées"
        )}</p>
        <p><strong>Email :</strong> ${texteOuDefaut(
          entreprise.email,
          "Email non renseigné"
        )}</p>
        <p><strong>Téléphone :</strong> ${texteOuDefaut(
          entreprise.telephone,
          "Téléphone non renseigné"
        )}</p>
        <p><strong>TVA :</strong> ${texteOuDefaut(
          entreprise.tva,
          "Non renseignée"
        )}</p>
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
        }, 350);
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
          if (restantes <= 0) {
            lancerImpression();
          }
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

  const blocEntreprise = getBlocEntreprise(entreprise);

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
            font-family: Arial, sans-serif;
            margin: 0;
            color: #0f172a;
            background: #ffffff;
          }

          .page {
            max-width: 980px;
            margin: 0 auto;
            padding: 36px;
          }

          .topbar {
            display: grid;
            grid-template-columns: minmax(0, 1.1fr) minmax(260px, 0.9fr);
            gap: 28px;
            margin-bottom: 28px;
            align-items: start;
          }

          .bloc {
            min-width: 0;
          }

          .document-header {
            text-align: right;
          }

          .logo-wrapper {
            margin-bottom: 14px;
          }

          .logo-entreprise {
            display: block;
            max-width: 320px;
            max-height: 125px;
            width: auto;
            height: auto;
            object-fit: contain;
          }

          .title {
            font-size: 30px;
            line-height: 1.15;
            font-weight: 700;
            margin: 0 0 8px;
            color: #0f172a;
            word-break: break-word;
          }

          .entreprise-title {
            font-size: 28px;
          }

          .doc-title {
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 13px;
            color: #64748b;
            margin: 0 0 8px;
            font-weight: 700;
          }

          .doc-number {
            font-size: 30px;
            line-height: 1.15;
            margin: 0 0 12px;
            font-weight: 700;
            color: #0f172a;
            word-break: break-word;
          }

          .subtitle,
          .entreprise-details p {
            font-size: 14px;
            color: #475569;
            margin: 0 0 5px;
            line-height: 1.45;
            word-break: break-word;
          }

          .card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }

          .grid-2x2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 16px;
          }

          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.06em;
            color: #64748b;
            margin-bottom: 6px;
            font-weight: 700;
          }

          .value {
            font-size: 16px;
            font-weight: 600;
            line-height: 1.5;
            word-break: break-word;
          }

          .small-value {
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
            word-break: break-word;
          }

          .total-box {
            margin-top: 16px;
            margin-left: auto;
            width: 390px;
            max-width: 100%;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 18px;
            margin-bottom: 10px;
            font-size: 15px;
          }

          .total-row span:last-child {
            font-weight: 700;
            text-align: right;
            white-space: nowrap;
          }

          .total-row.final {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid #e2e8f0;
            font-size: 22px;
            font-weight: 700;
          }

          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-top: 24px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .signature-box {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            min-height: 130px;
          }

          .footer {
            margin-top: 28px;
            font-size: 12px;
            line-height: 1.6;
            color: #64748b;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .page {
              max-width: none;
              padding: 24mm 18mm;
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
            ${blocEntreprise}

            <div class="bloc document-header">
              <p class="doc-title">Facture</p>
              <h2 class="doc-number">N° ${echapperHtml(
                factureSelectionnee.reference
              )}</h2>
              <p class="subtitle"><strong>Objet :</strong> ${texteOuDefaut(
                factureSelectionnee.objet
              )}</p>
              <p class="subtitle"><strong>Devis lié :</strong> ${texteOuDefaut(
                factureSelectionnee.devisReference,
                "Aucun devis lié"
              )}</p>
              <p class="subtitle"><strong>Date émission :</strong> ${texteOuDefaut(
                factureSelectionnee.dateEmission
              )}</p>
              <p class="subtitle"><strong>Date échéance :</strong> ${texteOuDefaut(
                factureSelectionnee.dateEcheance
              )}</p>
              <p class="subtitle"><strong>Statut :</strong> ${texteOuDefaut(
                factureSelectionnee.statut
              )}</p>
            </div>
          </div>

          <div class="card">
            <div class="label">Client</div>
            <div class="value">${texteOuDefaut(
              factureSelectionnee.clientNom
            )}</div>

            <div class="grid-2x2">
              <div>
                <div class="label">Adresse</div>
                <div class="small-value">${texteOuDefaut(
                  factureSelectionnee.clientAdresse,
                  "Adresse non renseignée"
                )}</div>
              </div>

              <div>
                <div class="label">Code postal / Ville</div>
                <div class="small-value">
                  ${texteOuDefaut(
                    [
                      factureSelectionnee.clientCodePostal,
                      factureSelectionnee.clientVille,
                    ]
                      .filter(Boolean)
                      .join(" · "),
                    "Coordonnées non renseignées"
                  )}
                </div>
              </div>

              <div>
                <div class="label">Email</div>
                <div class="small-value">${texteOuDefaut(
                  factureSelectionnee.clientEmail,
                  "Email non renseigné"
                )}</div>
              </div>

              <div>
                <div class="label">Téléphone</div>
                <div class="small-value">${texteOuDefaut(
                  factureSelectionnee.clientTelephone,
                  "Téléphone non renseigné"
                )}</div>
              </div>
            </div>

            <div style="height:16px;"></div>

            <div class="grid">
              <div>
                <div class="label">Chantier lié</div>
                <div class="small-value">${texteOuDefaut(
                  factureSelectionnee.chantierTitre,
                  "Aucun chantier lié"
                )}</div>
              </div>

              <div>
                <div class="label">Date paiement</div>
                <div class="small-value">${texteOuDefaut(
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
                <span>${formatMontant(
                  factureSelectionnee.acompteDeduit
                )}</span>
              </div>

              <div class="total-row final">
                <span>Net à payer</span>
                <span>${formatMontant(netAPayer)}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="label">Notes</div>
            <div class="small-value">
              ${texteMultiligneOuDefaut(
                factureSelectionnee.notes,
                "Aucune note pour cette facture."
              )}
            </div>
          </div>

          <div class="signature-grid">
            <div class="signature-box">
              <div class="label">Pour le client</div>
              <div class="small-value">
                Bon pour accord, date, nom et signature.
              </div>
            </div>

            <div class="signature-box">
              <div class="label">Pour l’entreprise</div>
              <div class="small-value">
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