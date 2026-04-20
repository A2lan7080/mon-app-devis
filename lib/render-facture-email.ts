import { entreprise as entrepriseParDefaut } from "./devis-constants";
import { formatMontant } from "./devis-helpers";
import type { Facture } from "../types/factures";
import type { Entreprise } from "../types/devis";

type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
};

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

export function renderFactureEmailHtml(
  facture: Facture,
  entreprise: EntrepriseSettings = entrepriseParDefaut
) {
  const montantTva = calculerMontantTva(facture);
  const totalTtc = calculerTotalTtc(facture);
  const netAPayer = calculerNetAPayer(facture);

  const blocLogo = entreprise.logoUrl
    ? `
      <div style="margin-bottom:16px;">
        <img
          src="${entreprise.logoUrl}"
          alt="Logo entreprise"
          style="max-height:60px; max-width:180px; object-fit:contain;"
        />
      </div>
    `
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${echapperHtml(facture.reference)}</title>
  </head>
  <body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, sans-serif; color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9; margin:0; padding:0; width:100%;">
      <tr>
        <td align="center" style="padding:20px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px; width:100%; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px;">
            <tr>
              <td style="padding:24px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom:20px;">
                      ${blocLogo}
                      <div style="font-size:28px; line-height:34px; font-weight:700; color:#0f172a;">
                        ${echapperHtml(entreprise.nom)}
                      </div>
                      <div style="margin-top:8px; font-size:14px; line-height:21px; color:#475569;">
                        ${echapperHtml(entreprise.adresse)}
                      </div>
                      <div style="font-size:14px; line-height:21px; color:#475569;">
                        ${echapperHtml(entreprise.email)} · ${echapperHtml(entreprise.telephone)}
                      </div>
                      <div style="font-size:14px; line-height:21px; color:#475569;">
                        TVA ${echapperHtml(entreprise.tva)}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom:20px;">
                      <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                        Facture
                      </div>
                      <div style="margin-top:6px; font-size:30px; line-height:36px; font-weight:700; color:#0f172a; word-break:break-word;">
                        ${echapperHtml(facture.reference)}
                      </div>
                      <div style="margin-top:10px; font-size:14px; line-height:22px; color:#475569;">
                        <strong>Objet :</strong> ${texteOuDefaut(facture.objet)}
                      </div>
                      <div style="font-size:14px; line-height:22px; color:#475569;">
                        <strong>Date émission :</strong> ${texteOuDefaut(facture.dateEmission)}
                      </div>
                      <div style="font-size:14px; line-height:22px; color:#475569;">
                        <strong>Date échéance :</strong> ${texteOuDefaut(facture.dateEcheance)}
                      </div>
                      <div style="font-size:14px; line-height:22px; color:#475569;">
                        <strong>Statut :</strong> ${texteOuDefaut(facture.statut)}
                      </div>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0; border-radius:16px;">
                        <tr>
                          <td style="padding:18px 18px 8px 18px;">
                            <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                              Client
                            </div>
                            <div style="margin-top:6px; font-size:20px; line-height:28px; font-weight:700; color:#0f172a; word-break:break-word;">
                              ${texteOuDefaut(facture.clientNom)}
                            </div>
                          </td>
                        </tr>
                        <tr>
                          <td style="padding:0 18px 18px 18px;">
                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Adresse :</strong> ${texteOuDefaut(facture.clientAdresse, "Adresse non renseignée")}
                            </div>
                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Coordonnées :</strong> ${texteOuDefaut(
                                [facture.clientCodePostal, facture.clientVille]
                                  .filter(Boolean)
                                  .join(" · "),
                                "Coordonnées non renseignées"
                              )}
                            </div>
                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Email :</strong> ${texteOuDefaut(facture.clientEmail, "Email non renseigné")}
                            </div>
                            <div style="font-size:14px; line-height:22px; color:#475569;">
                              <strong>Téléphone :</strong> ${texteOuDefaut(facture.clientTelephone, "Téléphone non renseigné")}
                            </div>
                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Chantier :</strong> ${texteOuDefaut(facture.chantierTitre, "Aucun chantier lié")}
                            </div>
                            <div style="font-size:14px; line-height:22px; color:#475569;">
                              <strong>Date paiement :</strong> ${texteOuDefaut(facture.datePaiement, "Non renseigné")}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0; border-radius:16px;">
                        <tr>
                          <td style="padding:18px;">
                            <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; padding-bottom:14px;">
                              Récapitulatif financier
                            </div>

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">
                                  Montant HT
                                </td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">
                                  ${formatMontant(facture.montantHt)}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">
                                  TVA (${facture.tvaTaux}%)
                                </td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">
                                  ${formatMontant(montantTva)}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">
                                  Total TTC
                                </td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">
                                  ${formatMontant(totalTtc)}
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">
                                  Acompte déduit
                                </td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">
                                  ${formatMontant(facture.acompteDeduit)}
                                </td>
                              </tr>
                              <tr>
                                <td colspan="2" style="padding-top:10px;">
                                  <div style="border-top:1px solid #e2e8f0;"></div>
                                </td>
                              </tr>
                              <tr>
                                <td style="padding:14px 0 4px 0; font-size:22px; line-height:28px; font-weight:700; color:#0f172a;">
                                  Net à payer
                                </td>
                                <td align="right" style="padding:14px 0 4px 0; font-size:22px; line-height:28px; font-weight:700; color:#0f172a;">
                                  ${formatMontant(netAPayer)}
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-bottom:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0; border-radius:16px;">
                        <tr>
                          <td style="padding:18px;">
                            <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; padding-bottom:10px;">
                              Notes
                            </div>
                            <div style="font-size:14px; line-height:24px; color:#334155; word-break:break-word;">
                              ${texteMultiligneOuDefaut(facture.notes, "Aucune note pour cette facture.")}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  <tr>
                    <td style="padding-top:4px; font-size:14px; line-height:24px; color:#475569;">
                      Merci pour votre confiance.<br />
                      Cet email a été envoyé automatiquement depuis Batiflow.
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
  `;
}

export function renderFactureEmailText(
  facture: Facture,
  entreprise: EntrepriseSettings = entrepriseParDefaut
) {
  const montantTva = calculerMontantTva(facture);
  const totalTtc = calculerTotalTtc(facture);
  const netAPayer = calculerNetAPayer(facture);

  return `
${entreprise.nom}
${entreprise.adresse}
${entreprise.email} - ${entreprise.telephone}
TVA ${entreprise.tva}

FACTURE ${facture.reference}
Objet : ${facture.objet}
Client : ${facture.clientNom}
Adresse client : ${facture.clientAdresse || "-"}
Coordonnées client : ${[facture.clientCodePostal, facture.clientVille].filter(Boolean).join(" · ") || "-"}
Email client : ${facture.clientEmail || "-"}
Téléphone client : ${facture.clientTelephone || "-"}
Chantier : ${facture.chantierTitre || "Aucun chantier lié"}
Date émission : ${facture.dateEmission || "-"}
Date échéance : ${facture.dateEcheance || "-"}
Date paiement : ${facture.datePaiement || "-"}
Statut : ${facture.statut}

Montant HT : ${formatMontant(facture.montantHt)}
TVA (${facture.tvaTaux}%) : ${formatMontant(montantTva)}
Total TTC : ${formatMontant(totalTtc)}
Acompte déduit : ${formatMontant(facture.acompteDeduit)}
Net à payer : ${formatMontant(netAPayer)}

Notes :
${facture.notes || "Aucune note pour cette facture."}

Merci pour votre confiance.
`.trim();
}