import {
  getEntrepriseSettings,
  type EntrepriseSettings,
} from "./get-entreprise-settings";
import {
  calculerValiditeDevis,
  calculerMontantTva,
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
} from "./devis-helpers";
import { formatNumeroDevisPourAffichage } from "./format-numero-devis";
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

        <div class="iban-info">
          <div class="info-label">IBAN</div>
          <div class="info-value iban-value">${texteOuDefaut(
            entreprise.iban,
            "IBAN non renseigné"
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

function formaterHorodatage(timestamp?: number) {
  if (!timestamp || !Number.isFinite(timestamp)) return "";

  return new Intl.DateTimeFormat("fr-BE", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(timestamp));
}

function getStatutPdfClasse(statut: DevisBusiness["statut"]) {
  switch (statut) {
    case "Accepté":
      return "status-accepted";
    case "Refusé":
      return "status-refused";
    case "Envoyé":
      return "status-sent";
    case "Brouillon":
    default:
      return "status-draft";
  }
}

function getPreuveElectroniqueHtml(devis: DevisBusiness) {
  if (devis.statut === "Accepté") {
    return `
      <div class="card proof-card proof-accepted">
        <div class="label">Preuve électronique</div>
        <div class="proof-title">Accepté électroniquement</div>
        <div class="proof-grid">
          <div>
            <div class="info-label">Date</div>
            <div class="info-value">${texteOuDefaut(
              formaterHorodatage(devis.acceptedAt)
            )}</div>
          </div>
          <div>
            <div class="info-label">Nom</div>
            <div class="info-value">${texteOuDefaut(
              devis.acceptedByName,
              "Non renseigné"
            )}</div>
          </div>
          <div>
            <div class="info-label">Email</div>
            <div class="info-value">${texteOuDefaut(
              devis.acceptedByEmail,
              "Non renseigné"
            )}</div>
          </div>
        </div>
      </div>
    `;
  }

  if (devis.statut === "Refusé") {
    return `
      <div class="card proof-card proof-refused">
        <div class="label">Preuve électronique</div>
        <div class="proof-title">Refusé électroniquement</div>
        <div class="proof-grid">
          <div>
            <div class="info-label">Date</div>
            <div class="info-value">${texteOuDefaut(
              formaterHorodatage(devis.refusedAt)
            )}</div>
          </div>
          <div>
            <div class="info-label">Nom</div>
            <div class="info-value">${texteOuDefaut(
              devis.refusedByName,
              "Non renseigné"
            )}</div>
          </div>
          <div>
            <div class="info-label">Email</div>
            <div class="info-value">${texteOuDefaut(
              devis.refusedByEmail,
              "Non renseigné"
            )}</div>
          </div>
        </div>
      </div>
    `;
  }

  return "";
}

function getSignatureEntrepriseHtml(entreprise: EntrepriseSettings) {
  return `
    <div class="signature-box">
      <div class="label">Pour l’entreprise</div>
      <div class="signature-name">${texteOuDefaut(
        entreprise.nom,
        "BatiFlow"
      )}</div>
      <div class="signature-field">
        <span>Date</span>
      </div>
      <div class="signature-field">
        <span>Nom</span>
      </div>
      <div class="signature-field signature-field-large">
        <span>Signature</span>
      </div>
    </div>
  `;
}

function getSignatureClientHtml(devis: DevisBusiness) {
  if (devis.statut === "Accepté" && devis.acceptedAt) {
    return `
      <div class="signature-box">
        <div class="label">Pour le client</div>
        <div class="signature-proof-title">Accepté électroniquement</div>
        <div class="signature-proof-line">
          Date : ${texteOuDefaut(formaterHorodatage(devis.acceptedAt))}
        </div>
        <div class="signature-proof-line">
          Nom : ${texteOuDefaut(devis.acceptedByName, "Non renseigné")}
        </div>
        <div class="signature-proof-line">
          Email : ${texteOuDefaut(devis.acceptedByEmail, "Non renseigné")}
        </div>
        <div class="signature-electronic-mark">Signature électronique enregistrée</div>
      </div>
    `;
  }

  if (devis.statut === "Refusé" && devis.refusedAt) {
    return `
      <div class="signature-box">
        <div class="label">Pour le client</div>
        <div class="signature-proof-title signature-proof-title-refused">Refusé électroniquement</div>
        <div class="signature-proof-line">
          Date : ${texteOuDefaut(formaterHorodatage(devis.refusedAt))}
        </div>
        <div class="signature-proof-line">
          Nom : ${texteOuDefaut(devis.refusedByName, "Non renseigné")}
        </div>
        <div class="signature-proof-line">
          Email : ${texteOuDefaut(devis.refusedByEmail, "Non renseigné")}
        </div>
        <div class="signature-electronic-mark signature-electronic-mark-refused">Signature électronique de refus enregistrée</div>
      </div>
    `;
  }

  return `
    <div class="signature-box">
      <div class="label">Pour le client</div>
      <div class="signature-name">${texteOuDefaut(
        devis.client,
        "Client"
      )}</div>
      <div class="signature-field">
        <span>Date</span>
      </div>
      <div class="signature-field">
        <span>Nom</span>
      </div>
      <div class="signature-field signature-field-large">
        <span>Signature</span>
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
  const numeroDevisAffiche = formatNumeroDevisPourAffichage(
    devisSelectionne.id
  );
  const validite = calculerValiditeDevis(
    devisSelectionne.date,
    devisSelectionne.validiteJours
  );

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
        <title>${echapperHtml(numeroDevisAffiche)}</title>
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

          .status-pill {
            display: inline-block;
            margin: 2px 0 5px;
            padding: 5px 9px;
            border-radius: 999px;
            font-size: 10px;
            line-height: 1;
            font-weight: 800;
          }

          .status-draft {
            background: #f1f5f9;
            color: #334155;
          }

          .status-sent {
            background: #dbeafe;
            color: #1d4ed8;
          }

          .status-accepted {
            background: #dcfce7;
            color: #15803d;
          }

          .status-refused {
            background: #fee2e2;
            color: #b91c1c;
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

          .iban-info {
            grid-column: 1 / -1;
          }

          .iban-value {
            font-size: 13px;
            letter-spacing: 0.02em;
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

          .proof-card {
            border-width: 1.5px;
          }

          .proof-accepted {
            border-color: #bbf7d0;
            background: #f0fdf4;
          }

          .proof-refused {
            border-color: #fecaca;
            background: #fef2f2;
          }

          .proof-title {
            margin-bottom: 8px;
            font-size: 14px;
            line-height: 1.25;
            font-weight: 900;
          }

          .proof-accepted .proof-title {
            color: #15803d;
          }

          .proof-refused .proof-title {
            color: #b91c1c;
          }

          .proof-grid {
            display: grid;
            grid-template-columns: 0.8fr 1fr 1.2fr;
            gap: 8px 14px;
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
            min-height: 142px;
            border: 1px solid #dbe4ef;
            border-radius: 13px;
            padding: 12px;
          }

          .signature-box-legacy {
            display: none;
          }

          .signature-name {
            min-height: 18px;
            margin-bottom: 10px;
            color: #0f172a;
            font-size: 12px;
            line-height: 1.3;
            font-weight: 800;
            word-break: break-word;
          }

          .signature-field {
            display: flex;
            align-items: flex-end;
            height: 26px;
            margin-top: 6px;
            border-bottom: 1px solid #cbd5e1;
            color: #64748b;
            font-size: 9px;
            font-weight: 800;
            letter-spacing: 0.05em;
            text-transform: uppercase;
          }

          .signature-field-large {
            height: 42px;
          }

          .signature-proof-title {
            margin-bottom: 8px;
            color: #15803d;
            font-size: 12px;
            font-weight: 900;
          }

          .signature-proof-title-refused {
            color: #b91c1c;
          }

          .signature-proof-line {
            margin-top: 4px;
            color: #334155;
            font-size: 10px;
            line-height: 1.35;
            word-break: break-word;
          }

          .signature-electronic-mark {
            margin-top: 12px;
            border-top: 1px solid #bbf7d0;
            padding-top: 8px;
            color: #15803d;
            font-size: 10px;
            font-weight: 800;
          }

          .signature-electronic-mark-refused {
            border-top-color: #fecaca;
            color: #b91c1c;
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
                numeroDevisAffiche
              )}</p>
              <p class="doc-line"><strong>Date :</strong> ${texteOuDefaut(
                devisSelectionne.date
              )}</p>
              <div class="doc-line"><strong>Statut :</strong></div>
              <div class="status-pill ${getStatutPdfClasse(
                devisSelectionne.statut
              )}">${texteOuDefaut(devisSelectionne.statut)}</div>
              <p class="doc-line"><strong>Validité :</strong> ${
                validite.label
              }</p>
            </div>
          </div>

          ${getPreuveElectroniqueHtml(devisSelectionne)}

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
            ${getSignatureEntrepriseHtml(entreprise)}
            ${getSignatureClientHtml(devisSelectionne)}

            <div class="signature-box signature-box-legacy">
              <div class="label">Pour l’entreprise</div>
              <div class="conditions-text">
                ${texteOuDefaut(entreprise.nom, "BatiFlow")}
              </div>
            </div>
          </div>

          <div class="footer">
            Merci pour votre confiance. Ce devis est valable ${validite.label}.
          </div>
        </div>

        ${getPrintScript()}
      </body>
    </html>
  `);

  fenetre.document.close();
}
