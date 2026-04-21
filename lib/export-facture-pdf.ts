import { getEntrepriseSettings } from "./get-entreprise-settings";
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

function texteOuDefaut(valeur: string, defaut = "-") {
  const nettoyee = valeur.trim();
  return nettoyee ? echapperHtml(nettoyee) : defaut;
}

function texteMultiligneOuDefaut(valeur: string, defaut = "Aucune note.") {
  const nettoyee = valeur.trim();

  if (!nettoyee) {
    return defaut;
  }

  return echapperHtml(nettoyee).replaceAll("\n", "<br />");
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
        <title>${echapperHtml(factureSelectionnee.reference)}</title>
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
            margin: 0 0 4px;
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
          .grid-2x2 {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-top: 16px;
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
            line-height: 1.5;
          }
          .small-value {
            font-size: 14px;
            line-height: 1.6;
            color: #334155;
          }
          .total-box {
            margin-top: 24px;
            margin-left: auto;
            width: 380px;
            border: 1px solid #e2e8f0;
            border-radius: 16px;
            padding: 20px;
          }
          .total-row {
            display: flex;
            justify-content: space-between;
            gap: 12px;
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
          .note-text {
            font-size: 14px;
            font-weight: 400;
            line-height: 1.6;
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
              <h2 class="title">Facture</h2>
              <p class="subtitle">N° ${echapperHtml(factureSelectionnee.reference)}</p>
              <p class="subtitle">Objet : ${texteOuDefaut(factureSelectionnee.objet)}</p>
              <p class="subtitle">Devis lié : ${texteOuDefaut(factureSelectionnee.devisReference, "Aucun devis lié")}</p>
              <p class="subtitle">Date émission : ${texteOuDefaut(factureSelectionnee.dateEmission)}</p>
              <p class="subtitle">Date échéance : ${texteOuDefaut(factureSelectionnee.dateEcheance)}</p>
              <p class="subtitle">Statut : ${texteOuDefaut(factureSelectionnee.statut)}</p>
            </div>
          </div>

          <div class="card">
            <div class="label">Client</div>
            <div class="value">${texteOuDefaut(factureSelectionnee.clientNom)}</div>

            <div class="grid-2x2">
              <div>
                <div class="label">Adresse</div>
                <div class="small-value">${texteOuDefaut(factureSelectionnee.clientAdresse, "Adresse non renseignée")}</div>
              </div>

              <div>
                <div class="label">Code postal / Ville</div>
                <div class="small-value">
                  ${texteOuDefaut(
                    [factureSelectionnee.clientCodePostal, factureSelectionnee.clientVille]
                      .filter(Boolean)
                      .join(" · "),
                    "Coordonnées non renseignées"
                  )}
                </div>
              </div>

              <div>
                <div class="label">Email</div>
                <div class="small-value">${texteOuDefaut(factureSelectionnee.clientEmail, "Email non renseigné")}</div>
              </div>

              <div>
                <div class="label">Téléphone</div>
                <div class="small-value">${texteOuDefaut(factureSelectionnee.clientTelephone, "Téléphone non renseigné")}</div>
              </div>
            </div>

            <div style="height:16px;"></div>

            <div class="grid">
              <div>
                <div class="label">Chantier lié</div>
                <div class="value">${texteOuDefaut(factureSelectionnee.chantierTitre, "Aucun chantier lié")}</div>
              </div>

              <div>
                <div class="label">Paiement</div>
                <div class="value">${texteOuDefaut(factureSelectionnee.datePaiement, "Non renseigné")}</div>
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
            <div class="note-text">
              ${texteMultiligneOuDefaut(factureSelectionnee.notes, "Aucune note pour cette facture.")}
            </div>
          </div>

          <div class="signature-grid">
            <div class="signature-box">
              <div class="label">Pour le client</div>
              <div class="note-text">
                Bon pour accord, date, nom et signature
              </div>
            </div>

            <div class="signature-box">
              <div class="label">Pour l’entreprise</div>
              <div class="note-text">
                ${echapperHtml(entreprise.nom)}
              </div>
            </div>
          </div>

          <div class="footer">
            Merci pour votre confiance.
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