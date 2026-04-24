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

  const blocEntreprise = getBlocEntreprise(entreprise);

  const lignesHtml = devisSelectionne.lignes
    .map((ligne) => {
      const sousTotal = ligne.quantite * ligne.prixUnitaire;

      return `
        <tr>
          <td class="designation-cell">${texteOuDefaut(ligne.designation)}</td>
          <td class="center-cell">${ligne.quantite}</td>
          <td class="center-cell">${texteOuDefaut(ligne.unite)}</td>
          <td class="right-cell nowrap">${formatMontant(
            ligne.prixUnitaire
          )}</td>
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

          .card.can-break {
            break-inside: auto;
            page-break-inside: auto;
          }

          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
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

          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }

          thead {
            display: table-header-group;
          }

          tr {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          th {
            text-align: left;
            font-size: 12px;
            color: #64748b;
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-weight: 700;
            white-space: nowrap;
          }

          td {
            padding: 14px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
            vertical-align: top;
            color: #0f172a;
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
            font-weight: 700;
          }

          .total-box {
            margin-top: 24px;
            margin-left: auto;
            width: 380px;
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
              <p class="doc-title">Devis</p>
              <h2 class="doc-number">N° ${echapperHtml(
                devisSelectionne.id
              )}</h2>
              <p class="subtitle"><strong>Date :</strong> ${texteOuDefaut(
                devisSelectionne.date
              )}</p>
              <p class="subtitle"><strong>Statut :</strong> ${texteOuDefaut(
                devisSelectionne.statut
              )}</p>
              <p class="subtitle"><strong>Validité :</strong> ${
                devisSelectionne.validiteJours
              } jours</p>
            </div>
          </div>

          <div class="card">
            <div class="label">Client</div>
            <div class="value">${texteOuDefaut(devisSelectionne.client)}</div>

            <div style="height:14px;"></div>

            <div class="grid">
              <div>
                <div class="label">Adresse</div>
                <div class="small-value">${texteOuDefaut(
                  devisSelectionne.adresse,
                  "Adresse non renseignée"
                )}</div>
                <div class="small-value">
                  ${texteOuDefaut(
                    [devisSelectionne.codePostal, devisSelectionne.ville]
                      .filter(Boolean)
                      .join(" · "),
                    "Coordonnées non renseignées"
                  )}
                </div>
              </div>

              <div>
                <div class="label">Contact</div>
                <div class="small-value">${texteOuDefaut(
                  devisSelectionne.email,
                  "Email non renseigné"
                )}</div>
                <div class="small-value">${texteOuDefaut(
                  devisSelectionne.telephone,
                  "Téléphone non renseigné"
                )}</div>
                <div class="small-value">TVA client : ${texteOuDefaut(
                  devisSelectionne.tvaClient,
                  "Non renseignée"
                )}</div>
              </div>
            </div>

            <div style="height:14px;"></div>

            <div class="grid">
              <div>
                <div class="label">Type client</div>
                <div class="small-value">${texteOuDefaut(
                  devisSelectionne.typeClient
                )}</div>
              </div>

              <div>
                <div class="label">Chantier lié</div>
                <div class="small-value">${texteOuDefaut(
                  devisSelectionne.chantierTitre,
                  "Aucun chantier lié"
                )}</div>
              </div>
            </div>
          </div>

          <div class="card can-break">
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

              <div class="total-row" style="margin-top:18px;">
                <span>Acompte (${devisSelectionne.acomptePourcentage}%)</span>
                <span>${formatMontant(montantAcompte)}</span>
              </div>

              <div class="total-row">
                <span>Solde à la livraison</span>
                <span>${formatMontant(soldeRestant)}</span>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="label">Conditions</div>
            <div class="small-value">
              ${texteMultiligneOuDefaut(devisSelectionne.conditions)}
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