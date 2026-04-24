import {
  getEntrepriseSettings,
  type EntrepriseSettings,
} from "./get-entreprise-settings";
import {
  calculerMontantTva,
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
} from "./devis-helpers";
import type { Devis } from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

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

function texteMultiligneOuDefaut(
  valeur?: string,
  defaut = "Aucune condition particulière."
) {
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

export async function exporterDevisPdf(devisSelectionne: DevisBusiness) {
  const totalHt = calculerTotalHt(devisSelectionne);
  const montantTva = calculerMontantTva(devisSelectionne);
  const totalTvac = calculerTotalTvac(devisSelectionne);
  const montantAcompte =
    totalTvac * (devisSelectionne.acomptePourcentage / 100);
  const soldeRestant = totalTvac - montantAcompte;

  const fenetre = window.open("", "_blank", "width=1100,height=900");

  if (!fenetre) {
    alert("Impossible d’ouvrir la fenêtre d’export PDF.");
    return;
  }

  const entreprise = await getEntrepriseSettings(
    devisSelectionne.entrepriseId ?? null
  );

  const lignesHtml = devisSelectionne.lignes
    .map((ligne) => {
      const sousTotal = ligne.quantite * ligne.prixUnitaire;

      return `
        <tr>
          <td class="designation-cell">${texteOuDefaut(ligne.designation)}</td>
          <td class="center-cell">${ligne.quantite}</td>
          <td class="center-cell">${texteOuDefaut(ligne.unite)}</td>
          <td class="right-cell nowrap">${formatMontant(ligne.prixUnitaire)}</td>
          <td class="right-cell nowrap strong">${formatMontant(sousTotal)}</td>
        </tr>
      `;
    })
    .join("");

  fenetre.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${echapperHtml(devisSelectionne.id)}</title>
        <style>
          * {
            box-sizing: border-box;
          }

          body {
            margin: 0;
            background: #ffffff;
            color: #0f172a;
            font-family: Arial, sans-serif;
            font-size: 11px;
          }

          .page {
            max-width: 960px;
            margin: 0 auto;
            padding: 22px 30px;
          }

          .topbar {
            display: grid;
            grid-template-columns: minmax(0, 1.08fr) minmax(245px, 0.92fr);
            gap: 18px;
            align-items: start;
            margin-bottom: 12px;
          }

          .document-header {
            text-align: right;
            padding-top: 3px;
          }

          .doc-title {
            margin: 0 0 7px;
            font-size: 27px;
            line-height: 1.1;
            font-weight: 800;
          }

          .doc-line {
            margin: 0 0 2px;
            color: #334155;
            font-size: 11px;
            line-height: 1.3;
          }

          .card {
            border: 1px solid #dbe4ef;
            border-radius: 13px;
            padding: 13px 15px;
            margin-bottom: 10px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .card-compact {
            padding: 12px 14px;
          }

          .prestations-card {
            break-inside: auto;
            page-break-inside: auto;
          }

          .after-table-block {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .label {
            margin-bottom: 6px;
            color: #64748b;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
          }

          .main-name {
            margin-bottom: 8px;
            font-size: 20px;
            line-height: 1.12;
            font-weight: 800;
            word-break: break-word;
          }

          .logo-wrapper {
            margin-bottom: 8px;
          }

          .logo-entreprise {
            display: block;
            max-width: 205px;
            max-height: 72px;
            width: auto;
            height: auto;
            object-fit: contain;
          }

          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px 16px;
          }

          .entreprise-info {
            grid-template-columns: 1fr 1fr;
          }

          .info-label {
            margin-bottom: 2px;
            color: #64748b;
            font-size: 8px;
            font-weight: 800;
            letter-spacing: 0.06em;
            text-transform: uppercase;
          }

          .info-value {
            color: #0f172a;
            font-size: 11px;
            font-weight: 700;
            line-height: 1.3;
            word-break: break-word;
          }

          .info-value.light {
            font-weight: 500;
            color: #334155;
          }

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 2px;
          }

          thead {
            display: table-header-group;
          }

          tbody {
            display: table-row-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th {
            padding: 7px 7px;
            border-bottom: 1px solid #dbe4ef;
            color: #334155;
            font-size: 9px;
            text-align: left;
            white-space: nowrap;
          }

          td {
            padding: 8px 7px;
            border-bottom: 1px solid #e5edf6;
            font-size: 10px;
            vertical-align: top;
          }

          .designation-cell {
            width: 45%;
            word-break: break-word;
          }

          .center-cell {
            text-align: center;
          }

          .right-cell {
            text-align: right;
          }

          .nowrap {
            white-space: nowrap;
          }

          .strong {
            font-weight: 800;
          }

          .total-box {
            width: 300px;
            max-width: 100%;
            margin-top: 10px;
            margin-left: auto;
            border: 1px solid #dbe4ef;
            border-radius: 13px;
            padding: 12px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
            margin-bottom: 6px;
            font-size: 11px;
          }

          .total-row span:last-child {
            font-weight: 800;
            white-space: nowrap;
            text-align: right;
          }

          .total-row.final {
            margin-top: 8px;
            padding-top: 8px;
            border-top: 1px solid #dbe4ef;
            font-size: 16px;
            font-weight: 900;
          }

          .conditions-text {
            color: #334155;
            font-size: 11px;
            line-height: 1.4;
          }

          .signature-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            margin-top: 10px;
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .signature-box {
            min-height: 72px;
            border: 1px solid #dbe4ef;
            border-radius: 13px;
            padding: 12px;
          }

          .footer {
            margin-top: 10px;
            color: #64748b;
            font-size: 9px;
            line-height: 1.35;
          }

          @media print {
            body {
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }

            .page {
              max-width: none;
              padding: 10mm 12mm;
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
              <h1 class="doc-title">Devis</h1>
              <p class="doc-line"><strong>N°</strong> ${echapperHtml(
                devisSelectionne.id
              )}</p>
              <p class="doc-line"><strong>Date :</strong> ${texteOuDefaut(
                devisSelectionne.date
              )}</p>
              <p class="doc-line"><strong>Statut :</strong> ${texteOuDefaut(
                devisSelectionne.statut
              )}</p>
              <p class="doc-line"><strong>Validité :</strong> ${
                devisSelectionne.validiteJours
              } jours</p>
            </div>
          </div>

          <div class="card">
            <div class="label">Client</div>
            <div class="main-name">${texteOuDefaut(
              devisSelectionne.client
            )}</div>

            <div class="info-grid">
              <div>
                <div class="info-label">Adresse</div>
                <div class="info-value">${texteOuDefaut(
                  devisSelectionne.adresse,
                  "Adresse non renseignée"
                )}</div>
                <div class="info-value light">
                  ${texteOuDefaut(
                    codePostalVille(
                      devisSelectionne.codePostal,
                      devisSelectionne.ville
                    ),
                    "Coordonnées non renseignées"
                  )}
                </div>
              </div>

              <div>
                <div class="info-label">Contact</div>
                <div class="info-value">${texteOuDefaut(
                  devisSelectionne.email,
                  "Email non renseigné"
                )}</div>
                <div class="info-value">${texteOuDefaut(
                  devisSelectionne.telephone,
                  "Téléphone non renseigné"
                )}</div>
              </div>

              <div>
                <div class="info-label">Type client</div>
                <div class="info-value light">${texteOuDefaut(
                  devisSelectionne.typeClient
                )}</div>
              </div>

              <div>
                <div class="info-label">Chantier lié</div>
                <div class="info-value light">${texteOuDefaut(
                  devisSelectionne.chantierTitre,
                  "Aucun chantier lié"
                )}</div>
              </div>
            </div>
          </div>

          <div class="card prestations-card">
            <div class="label">Prestations</div>

            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th class="center-cell">Qté</th>
                  <th class="center-cell">Unité</th>
                  <th class="right-cell">PU</th>
                  <th class="right-cell">Total</th>
                </tr>
              </thead>

              <tbody>
                ${lignesHtml}
              </tbody>
            </table>

            <div class="after-table-block">
              <div class="total-box">
                <div class="total-row">
                  <span>Total HT</span>
                  <span>${formatMontant(totalHt)}</span>
                </div>

                <div class="total-row">
                  <span>TVA (${devisSelectionne.tvaTaux}%)</span>
                  <span>${formatMontant(montantTva)}</span>
                </div>

                <div class="total-row final">
                  <span>Total TVAC</span>
                  <span>${formatMontant(totalTvac)}</span>
                </div>

                <div class="total-row" style="margin-top:10px;">
                  <span>Acompte (${devisSelectionne.acomptePourcentage}%)</span>
                  <span>${formatMontant(montantAcompte)}</span>
                </div>

                <div class="total-row">
                  <span>Solde à la livraison</span>
                  <span>${formatMontant(soldeRestant)}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="label">Conditions</div>
            <div class="conditions-text">
              ${texteMultiligneOuDefaut(devisSelectionne.conditions)}
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
            Merci pour votre confiance. Ce devis est valable ${
              devisSelectionne.validiteJours
            } jours à compter de sa date d’émission.
          </div>
        </div>

        ${getPrintScript()}
      </body>
    </html>
  `);

  fenetre.document.close();
}