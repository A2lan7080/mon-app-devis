import { getEntrepriseSettings } from "./get-entreprise-settings";
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

function texteOuDefaut(valeur: string, defaut = "-") {
  const nettoyee = valeur.trim();
  return nettoyee ? echapperHtml(nettoyee) : defaut;
}

function texteMultiligneOuDefaut(
  valeur: string,
  defaut = "Aucune condition particulière."
) {
  const nettoyee = valeur.trim();

  if (!nettoyee) {
    return defaut;
  }

  return echapperHtml(nettoyee).replaceAll("\n", "<br />");
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
          <td>${echapperHtml(ligne.designation)}</td>
          <td style="text-align:center;">${ligne.quantite}</td>
          <td style="text-align:center;">${echapperHtml(ligne.unite)}</td>
          <td style="text-align:right;">${formatMontant(ligne.prixUnitaire)}</td>
          <td style="text-align:right;">${formatMontant(sousTotal)}</td>
        </tr>
      `;
    })
    .join("");

  const blocLogo = entreprise.logoUrl
    ? `
      <div style="margin-bottom:18px;">
        <img
          src="${entreprise.logoUrl}"
          alt="Logo entreprise"
          style="max-height:100px; max-width:260px; width:auto; object-fit:contain; display:block;"
        />
      </div>
    `
    : "";

  fenetre.document.write(`
    <!DOCTYPE html>
    <html lang="fr">
      <head>
        <meta charset="UTF-8" />
        <title>${echapperHtml(devisSelectionne.id)}</title>
        <style>
          * { box-sizing: border-box; }
          body {
            font-family: Arial, sans-serif;
            margin: 0;
            color: #0f172a;
            background: #ffffff;
          }
          .page {
            max-width: 980px;
            margin: 0 auto;
            padding: 40px;
          }
          .topbar {
            display: flex;
            justify-content: space-between;
            gap: 24px;
            margin-bottom: 32px;
          }
          .bloc { flex: 1; }
          .title {
            font-size: 30px;
            font-weight: 700;
            margin: 0 0 8px;
          }
          .subtitle {
            font-size: 14px;
            color: #475569;
            margin: 0;
          }
          .card {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 20px;
          }
          .grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
          }
          .label {
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.04em;
            color: #64748b;
            margin-bottom: 6px;
          }
          .value {
            font-size: 16px;
            font-weight: 600;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 10px;
          }
          th {
            text-align: left;
            font-size: 12px;
            color: #64748b;
            padding: 12px 10px;
            border-bottom: 1px solid #e2e8f0;
          }
          td {
            padding: 14px 10px;
            border-bottom: 1px solid #e2e8f0;
            font-size: 14px;
          }
          .total-box {
            margin-top: 24px;
            margin-left: auto;
            width: 360px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 15px;
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
          }
          .signature-box {
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
            min-height: 140px;
          }
          .footer {
            margin-top: 30px;
            font-size: 12px;
            color: #64748b;
          }
        </style>
      </head>
      <body>
        <div class="page">
          <div class="topbar">
            <div class="bloc">
              ${blocLogo}
              <h1 class="title">${echapperHtml(entreprise.nom)}</h1>
              <p class="subtitle">${echapperHtml(entreprise.adresse)}</p>
              <p class="subtitle">${echapperHtml(entreprise.email)} · ${echapperHtml(entreprise.telephone)}</p>
              <p class="subtitle">TVA ${echapperHtml(entreprise.tva)}</p>
            </div>
            <div class="bloc" style="text-align:right;">
              <h2 class="title">Devis</h2>
              <p class="subtitle">N° ${echapperHtml(devisSelectionne.id)}</p>
              <p class="subtitle">Date : ${texteOuDefaut(devisSelectionne.date)}</p>
              <p class="subtitle">Statut : ${texteOuDefaut(devisSelectionne.statut)}</p>
              <p class="subtitle">Validité : ${devisSelectionne.validiteJours} jours</p>
            </div>
          </div>

          <div class="card">
            <div class="label">Client</div>
            <div class="value">${texteOuDefaut(devisSelectionne.client)}</div>
            <div style="height:12px;"></div>
            <div class="grid">
              <div>
                <div class="label">Adresse</div>
                <div class="value">${texteOuDefaut(devisSelectionne.adresse)}</div>
                <div class="subtitle" style="margin-top:8px;">
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
                <div class="value">${texteOuDefaut(devisSelectionne.email)}</div>
                <div class="value" style="margin-top:6px;">${texteOuDefaut(devisSelectionne.telephone)}</div>
              </div>
            </div>
          </div>

          <div class="card">
            <div class="label">Prestations</div>
            <table>
              <thead>
                <tr>
                  <th>Désignation</th>
                  <th style="text-align:center;">Qté</th>
                  <th style="text-align:center;">Unité</th>
                  <th style="text-align:right;">PU</th>
                  <th style="text-align:right;">Total</th>
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
            <div class="value" style="font-size:14px; font-weight:400; line-height:1.6;">
              ${texteMultiligneOuDefaut(devisSelectionne.conditions)}
            </div>
          </div>

          <div class="signature-grid">
            <div class="signature-box">
              <div class="label">Pour le client</div>
              <div class="value" style="font-size:14px; font-weight:400;">
                Bon pour accord, date, nom et signature
              </div>
            </div>
            <div class="signature-box">
              <div class="label">Pour l’entreprise</div>
              <div class="value" style="font-size:14px; font-weight:400;">
                ${echapperHtml(entreprise.nom)}
              </div>
            </div>
          </div>

          <div class="footer">
            Merci pour votre confiance. Ce devis est valable ${devisSelectionne.validiteJours} jours à compter de sa date d’émission.
          </div>
        </div>
        <script>
          window.onload = function () {
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  fenetre.document.close();
}