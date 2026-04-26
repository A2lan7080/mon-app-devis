import { entreprise as entrepriseParDefaut } from "./devis-constants";
import {
  calculerValiditeDevis,
  calculerMontantTva,
  calculerTotalHt,
  calculerTotalTvac,
  formatMontant,
} from "./devis-helpers";
import { formatNumeroDevisPourAffichage } from "./format-numero-devis";
import type { Devis, Entreprise } from "../types/devis";

type DevisBusiness = Devis & {
  acomptePourcentage: number;
  validiteJours: number;
  conditions: string;
  archive?: boolean;
  createdAt?: number;
  entrepriseId?: string;
  createdByUid?: string;
};

type EntrepriseSettings = Entreprise & {
  logoUrl?: string;
  logoRemplaceNomEntreprise?: boolean;
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
  valeur: string,
  defaut = "Aucune condition particulière."
) {
  const nettoyee = valeur.trim();

  if (!nettoyee) {
    return defaut;
  }

  return echapperHtml(nettoyee).replaceAll("\n", "<br />");
}

function getLogoState(logoUrl?: string) {
  const logoUrlNettoyee = logoUrl?.trim();

  if (!logoUrlNettoyee) {
    return { afficherLogo: false, blocLogo: "" };
  }

  return {
    afficherLogo: true,
    blocLogo: `
      <div style="margin-bottom:14px;">
        <img
          src="${echapperHtml(logoUrlNettoyee)}"
          alt="Logo entreprise"
          style="max-height:130px; max-width:360px; width:auto; object-fit:contain; display:block;"
        />
      </div>
    `,
  };
}

function renderEntrepriseBloc(
  entreprise: EntrepriseSettings,
  blocLogo: string,
  afficherLogo: boolean
) {
  const codePostalVille = [entreprise.codePostal, entreprise.ville]
    .filter(Boolean)
    .join(" · ");

  const afficherNom = !afficherLogo;

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0; border-radius:16px; margin-bottom:20px;">
      <tr>
        <td style="padding:18px;">
          ${blocLogo}

          <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
            Entreprise
          </div>

          ${
            afficherNom
              ? `
                <div style="margin-top:6px; font-size:22px; line-height:30px; font-weight:700; color:#0f172a; word-break:break-word;">
                  ${texteOuDefaut(entreprise.nom, "Entreprise")}
                </div>
              `
              : ""
          }

          <div style="${afficherNom ? "margin-top:8px;" : "margin-top:10px;"} font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
            <strong>Adresse :</strong> ${texteOuDefaut(
              entreprise.adresse,
              "Adresse non renseignée"
            )}
          </div>

          <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
            <strong>Code postal / Ville :</strong> ${texteOuDefaut(
              codePostalVille,
              "Coordonnées non renseignées"
            )}
          </div>

          <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
            <strong>Email :</strong> ${texteOuDefaut(
              entreprise.email,
              "Email non renseigné"
            )}
          </div>

          <div style="font-size:14px; line-height:22px; color:#475569;">
            <strong>Téléphone :</strong> ${texteOuDefaut(
              entreprise.telephone,
              "Téléphone non renseigné"
            )}
          </div>

          <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
            <strong>TVA :</strong> ${texteOuDefaut(
              entreprise.tva,
              "Non renseignée"
            )}
          </div>
        </td>
      </tr>
    </table>
  `;
}

function renderFooterEntreprise(entreprise: EntrepriseSettings) {
  const infosEntreprise = [
    entreprise.nom?.trim(),
    entreprise.email?.trim(),
    entreprise.telephone?.trim(),
    entreprise.tva?.trim() ? `TVA : ${entreprise.tva.trim()}` : "",
  ].filter(Boolean);

  return `
    <tr>
      <td style="padding-top:4px; font-size:14px; line-height:24px; color:#475569;">
        Merci pour votre confiance.
        ${
          infosEntreprise.length > 0
            ? `
              <div style="margin-top:10px; font-size:12px; line-height:20px; color:#64748b; word-break:break-word;">
                ${infosEntreprise
                  .map((info) => echapperHtml(info))
                  .join(" &middot; ")}
              </div>
            `
            : ""
        }
      </td>
    </tr>
  `;
}

function renderAcceptanceBlock(acceptanceUrl?: string) {
  const url = acceptanceUrl?.trim();

  if (!url) return "";

  const urlHtml = echapperHtml(url);

  return `
    <tr>
      <td style="padding-bottom:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#ecfdf5; border:1px solid #bbf7d0; border-radius:16px;">
          <tr>
            <td style="padding:18px;">
              <div style="font-size:18px; line-height:26px; font-weight:700; color:#064e3b;">
                Accepter ce devis en ligne
              </div>

              <div style="margin-top:8px; font-size:14px; line-height:22px; color:#166534;">
                Confirmez votre accord avec votre nom et votre adresse email.
              </div>

              <div style="margin-top:16px;">
                <a href="${urlHtml}" style="display:inline-block; background:#047857; color:#ffffff; text-decoration:none; font-size:14px; line-height:20px; font-weight:700; padding:12px 18px; border-radius:12px;">
                  Accepter le devis
                </a>
              </div>

              <div style="margin-top:12px; font-size:12px; line-height:18px; color:#166534; word-break:break-all;">
                ${urlHtml}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

export function renderDevisEmailHtml(
  devis: DevisBusiness,
  entreprise: EntrepriseSettings = entrepriseParDefaut,
  acceptanceUrl?: string
) {
  const totalHt = calculerTotalHt(devis);
  const montantTva = calculerMontantTva(devis);
  const totalTvac = calculerTotalTvac(devis);
  const montantAcompte = totalTvac * (devis.acomptePourcentage / 100);
  const soldeRestant = totalTvac - montantAcompte;
  const numeroDevisAffiche = formatNumeroDevisPourAffichage(devis.id);
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);

  const { afficherLogo, blocLogo } = getLogoState(entreprise.logoUrl);

  const blocEntreprise = renderEntrepriseBloc(
    entreprise,
    blocLogo,
    afficherLogo
  );

  const lignesHtml = devis.lignes
    .map((ligne) => {
      const sousTotal = ligne.quantite * ligne.prixUnitaire;

      return `
        <tr>
          <td style="padding:10px 0; font-size:14px; line-height:22px; color:#0f172a;">
            ${texteOuDefaut(ligne.designation)}
          </td>
          <td align="center" style="padding:10px 0; font-size:14px; line-height:22px; color:#334155;">
            ${ligne.quantite}
          </td>
          <td align="center" style="padding:10px 0; font-size:14px; line-height:22px; color:#334155;">
            ${texteOuDefaut(ligne.unite)}
          </td>
          <td align="right" style="padding:10px 0; font-size:14px; line-height:22px; color:#334155;">
            ${formatMontant(ligne.prixUnitaire)}
          </td>
          <td align="right" style="padding:10px 0; font-size:14px; line-height:22px; font-weight:700; color:#0f172a;">
            ${formatMontant(sousTotal)}
          </td>
        </tr>
      `;
    })
    .join("");

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${echapperHtml(numeroDevisAffiche)}</title>
  </head>

  <body style="margin:0; padding:0; background:#f1f5f9; font-family:Arial, sans-serif; color:#0f172a;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f1f5f9; margin:0; padding:0; width:100%;">
      <tr>
        <td align="center" style="padding:20px 12px;">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px; width:100%; background:#ffffff; border:1px solid #e2e8f0; border-radius:18px;">
            <tr>
              <td style="padding:24px;">
                ${blocEntreprise}

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom:20px;">
                      <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                        Devis
                      </div>

                      <div style="margin-top:6px; font-size:30px; line-height:36px; font-weight:700; color:#0f172a; word-break:break-word;">
                        ${echapperHtml(numeroDevisAffiche)}
                      </div>

                      <div style="margin-top:10px; font-size:14px; line-height:22px; color:#475569;">
                        <strong>Date :</strong> ${texteOuDefaut(devis.date)}
                      </div>

                      <div style="font-size:14px; line-height:22px; color:#475569;">
                        <strong>Statut :</strong> ${texteOuDefaut(devis.statut)}
                      </div>

                      <div style="font-size:14px; line-height:22px; color:#475569;">
                        <strong>Validité :</strong> ${echapperHtml(
                          validite.label
                        )}
                      </div>
                    </td>
                  </tr>

                  ${renderAcceptanceBlock(acceptanceUrl)}

                  <tr>
                    <td style="padding-bottom:16px;">
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0; border-radius:16px;">
                        <tr>
                          <td style="padding:18px 18px 8px 18px;">
                            <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b;">
                              Client
                            </div>

                            <div style="margin-top:6px; font-size:20px; line-height:28px; font-weight:700; color:#0f172a; word-break:break-word;">
                              ${texteOuDefaut(devis.client)}
                            </div>

                            <div style="margin-top:6px; font-size:14px; line-height:22px; color:#475569;">
                              ${texteOuDefaut(devis.typeClient)}
                              ${
                                devis.societe.trim()
                                  ? ` · ${texteOuDefaut(devis.societe)}`
                                  : ""
                              }
                            </div>
                          </td>
                        </tr>

                        <tr>
                          <td style="padding:0 18px 18px 18px;">
                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Chantier :</strong> ${texteOuDefaut(
                                devis.chantierTitre,
                                "Aucun chantier lié"
                              )}
                            </div>

                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Adresse :</strong> ${texteOuDefaut(
                                devis.adresse,
                                "Non renseignée"
                              )}
                            </div>

                            <div style="font-size:14px; line-height:22px; color:#475569;">
                              <strong>Code postal / Ville :</strong> ${texteOuDefaut(
                                [devis.codePostal, devis.ville]
                                  .filter(Boolean)
                                  .join(" · "),
                                "Coordonnées non renseignées"
                              )}
                            </div>

                            <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
                              <strong>Email :</strong> ${texteOuDefaut(
                                devis.email,
                                "Non renseigné"
                              )}
                            </div>

                            <div style="font-size:14px; line-height:22px; color:#475569;">
                              <strong>Téléphone :</strong> ${texteOuDefaut(
                                devis.telephone,
                                "Non renseigné"
                              )}
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
                              Prestations
                            </div>

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">Désignation</td>
                                <td align="center" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">Qté</td>
                                <td align="center" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">Unité</td>
                                <td align="right" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">PU</td>
                                <td align="right" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">Total</td>
                              </tr>

                              ${lignesHtml}
                            </table>

                            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px;">
                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">Total HT</td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">${formatMontant(
                                  totalHt
                                )}</td>
                              </tr>

                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">TVA (${devis.tvaTaux}%)</td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">${formatMontant(
                                  montantTva
                                )}</td>
                              </tr>

                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">Total TVAC</td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">${formatMontant(
                                  totalTvac
                                )}</td>
                              </tr>

                              <tr>
                                <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">Acompte (${devis.acomptePourcentage}%)</td>
                                <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">${formatMontant(
                                  montantAcompte
                                )}</td>
                              </tr>

                              <tr>
                                <td colspan="2" style="padding-top:10px;">
                                  <div style="border-top:1px solid #e2e8f0;"></div>
                                </td>
                              </tr>

                              <tr>
                                <td style="padding:14px 0 4px 0; font-size:22px; line-height:28px; font-weight:700; color:#0f172a;">Solde à la livraison</td>
                                <td align="right" style="padding:14px 0 4px 0; font-size:22px; line-height:28px; font-weight:700; color:#0f172a;">${formatMontant(
                                  soldeRestant
                                )}</td>
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
                              Conditions
                            </div>

                            <div style="font-size:14px; line-height:24px; color:#334155; word-break:break-word;">
                              ${texteMultiligneOuDefaut(
                                devis.conditions,
                                "Aucune condition particulière."
                              )}
                            </div>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>

                  ${renderFooterEntreprise(entreprise)}
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

export function renderDevisEmailText(
  devis: DevisBusiness,
  entreprise: EntrepriseSettings = entrepriseParDefaut,
  acceptanceUrl?: string
) {
  const totalHt = calculerTotalHt(devis);
  const montantTva = calculerMontantTva(devis);
  const totalTvac = calculerTotalTvac(devis);
  const montantAcompte = totalTvac * (devis.acomptePourcentage / 100);
  const soldeRestant = totalTvac - montantAcompte;
  const numeroDevisAffiche = formatNumeroDevisPourAffichage(devis.id);
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);

  const codePostalVille = [entreprise.codePostal, entreprise.ville]
    .filter(Boolean)
    .join(" · ");
  const nomEntreprise = entreprise.nom?.trim() || "Entreprise";
  const infosFooter = [
    entreprise.nom?.trim(),
    entreprise.email?.trim(),
    entreprise.telephone?.trim(),
    entreprise.tva?.trim() ? `TVA : ${entreprise.tva.trim()}` : "",
  ]
    .filter(Boolean)
    .join(" - ");

  return `
ENTREPRISE
${nomEntreprise}
Adresse : ${entreprise.adresse || "-"}
Code postal / Ville : ${codePostalVille || "-"}
Email : ${entreprise.email || "-"}
Téléphone : ${entreprise.telephone || "-"}
TVA : ${entreprise.tva || "-"}

DEVIS ${numeroDevisAffiche}
Date : ${devis.date}
Statut : ${devis.statut}
Validité : ${validite.label}

CLIENT
Client : ${devis.client}
Type : ${devis.typeClient}${devis.societe ? ` - ${devis.societe}` : ""}
Chantier : ${devis.chantierTitre || "Aucun chantier lié"}
Adresse : ${devis.adresse || "-"}
Code postal / Ville : ${
    [devis.codePostal, devis.ville].filter(Boolean).join(" · ") || "-"
  }
Email : ${devis.email || "-"}
Téléphone : ${devis.telephone || "-"}

Total HT : ${formatMontant(totalHt)}
TVA (${devis.tvaTaux}%) : ${formatMontant(montantTva)}
Total TVAC : ${formatMontant(totalTvac)}
Acompte (${devis.acomptePourcentage}%) : ${formatMontant(montantAcompte)}
Solde à la livraison : ${formatMontant(soldeRestant)}

${
    acceptanceUrl?.trim()
      ? `ACCEPTATION EN LIGNE
Lien pour accepter le devis : ${acceptanceUrl.trim()}
`
      : ""
  }

Conditions :
${devis.conditions || "Aucune condition particulière."}

Merci pour votre confiance.
${infosFooter || ""}
`.trim();
}
