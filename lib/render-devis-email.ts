import { entreprise as entrepriseParDefaut } from "./devis-constants";
import {
  calculerTotauxDevis,
  calculerValiditeDevis,
  formatMontant,
  normaliserLignesDevis,
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
      <div style="display:inline-block; padding:10px 14px; background:#ffffff; border-radius:14px;">
        <img
          src="${echapperHtml(logoUrlNettoyee)}"
          alt="Logo entreprise"
          style="max-height:76px; max-width:280px; width:auto; object-fit:contain; display:block;"
        />
      </div>
    `,
  };
}

function renderBrandHeader(
  entreprise: EntrepriseSettings,
  blocLogo: string,
  afficherLogo: boolean
) {
  const afficherNom =
    !afficherLogo || entreprise.logoRemplaceNomEntreprise !== true;

  return `
    <tr>
      <td class="email-pad" style="padding:28px 32px; background:#0f172a;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="vertical-align:middle;">
              ${blocLogo}
              ${
                afficherNom
                  ? `<div style="${afficherLogo ? "margin-top:14px;" : ""} font-size:24px; line-height:30px; font-weight:800; color:#ffffff; word-break:break-word;">${texteOuDefaut(
                      entreprise.nom,
                      "Entreprise"
                    )}</div>`
                  : ""
              }
            </td>
            <td align="right" style="vertical-align:middle;">
              <div style="display:inline-block; padding:7px 11px; border:1px solid #334155; border-radius:999px; font-size:11px; line-height:16px; font-weight:700; letter-spacing:.08em; text-transform:uppercase; color:#cbd5e1;">
                Document sécurisé
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderEntrepriseBloc(
  entreprise: EntrepriseSettings,
  blocLogo: string,
  afficherLogo: boolean
) {
  const codePostalVille = [entreprise.codePostal, entreprise.ville]
    .filter(Boolean)
    .join(" · ");

  const afficherNom =
    !afficherLogo || entreprise.logoRemplaceNomEntreprise !== true;

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

          <div style="font-size:14px; line-height:22px; color:#475569; word-break:break-word;">
            <strong>IBAN :</strong> ${texteOuDefaut(
              entreprise.iban,
              "IBAN non renseigné"
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
    entreprise.iban?.trim() ? `IBAN : ${entreprise.iban.trim()}` : "",
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
      <td style="padding-bottom:20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f0fdf4; border:1px solid #bbf7d0; border-radius:18px;">
          <tr>
            <td class="card-pad" style="padding:24px;">
              <div style="font-size:20px; line-height:28px; font-weight:800; color:#052e16;">
                Votre devis est prêt
              </div>

              <div style="margin-top:8px; font-size:14px; line-height:22px; color:#166534;">
                Consultez les détails en ligne et transmettez votre décision en quelques instants.
              </div>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:20px;">
                <tr>
                  <td style="padding:0 10px 10px 0;">
                    <a href="${urlHtml}" style="display:inline-block; background:#f97316; color:#ffffff; text-decoration:none; font-size:14px; line-height:20px; font-weight:800; padding:13px 18px; border-radius:12px;">
                      Consulter le devis
                    </a>
                  </td>
                  <td style="padding:0 0 10px 0;">
                    <a href="${urlHtml}" style="display:inline-block; background:#ffffff; border:1px solid #86efac; color:#166534; text-decoration:none; font-size:14px; line-height:20px; font-weight:800; padding:12px 17px; border-radius:12px;">
                      Accepter ou refuser
                    </a>
                  </td>
                </tr>
              </table>

              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:8px; background:#ffffff; border-radius:12px;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-size:13px; line-height:20px; font-weight:800; color:#14532d;">
                      Pourquoi ce lien ?
                    </div>
                    <div style="margin-top:3px; font-size:13px; line-height:20px; color:#166534;">
                      Vous pouvez consulter votre devis en ligne, le télécharger, l'accepter ou le refuser.
                    </div>
                  </td>
                </tr>
              </table>

              <div style="margin-top:12px; font-size:12px; line-height:18px; color:#15803d;">
                Le PDF complet est également joint à cet email.
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderStatusBanner(
  statut: DevisBusiness["statut"],
  expire: boolean
) {
  const configuration =
    statut === "Accepté"
      ? {
          fond: "#ecfdf5",
          bordure: "#a7f3d0",
          couleur: "#065f46",
          label: "Devis accepté",
          detail: "Ce devis a été accepté par le client.",
        }
      : statut === "Refusé"
        ? {
            fond: "#fef2f2",
            bordure: "#fecaca",
            couleur: "#991b1b",
            label: "Devis refusé",
            detail: "Ce devis a été refusé par le client.",
          }
        : expire
          ? {
              fond: "#fff7ed",
              bordure: "#fed7aa",
              couleur: "#9a3412",
              label: "Devis expiré",
              detail:
                "La date de validité de ce devis est dépassée. Contactez l'entreprise pour le renouveler.",
            }
          : null;

  if (!configuration) return "";

  return `
    <tr>
      <td style="padding-bottom:20px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${configuration.fond}; border:1px solid ${configuration.bordure}; border-radius:12px;">
          <tr>
            <td style="padding:13px 16px; font-size:13px; line-height:20px; color:${configuration.couleur};">
              <strong>${configuration.label}</strong> &nbsp;·&nbsp; ${configuration.detail}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderMessageOptionnelHtml(message?: string) {
  const messageNettoye = message?.trim();

  if (!messageNettoye) return "";

  return `
    <tr>
      <td style="padding-bottom:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0; border-radius:16px;">
          <tr>
            <td style="padding:18px;">
              <div style="font-size:12px; line-height:18px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#64748b; padding-bottom:10px;">
                Message
              </div>

              <div style="font-size:14px; line-height:24px; color:#334155; word-break:break-word;">
                ${echapperHtml(messageNettoye).replaceAll("\n", "<br />")}
              </div>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  `;
}

function renderMentionsHtml(mentions?: string) {
  const mentionsNettoyees = mentions?.trim();

  if (!mentionsNettoyees) return "";

  return `
    <tr>
      <td style="padding-bottom:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:14px;">
          <tr>
            <td style="padding:16px 18px;">
              <div style="font-size:11px; line-height:17px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; color:#64748b;">
                Mentions
              </div>
              <div style="margin-top:6px; font-size:12px; line-height:19px; color:#64748b; word-break:break-word;">
                ${echapperHtml(mentionsNettoyees).replaceAll("\n", "<br />")}
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
  acceptanceUrl?: string,
  message?: string
) {
  const totauxDevis = calculerTotauxDevis(devis);
  const totalHt = totauxDevis.totalHt;
  const totalTvac = totauxDevis.totalTtc;
  const montantAcompte = totalTvac * (devis.acomptePourcentage / 100);
  const soldeRestant = totalTvac - montantAcompte;
  const numeroDevisAffiche = formatNumeroDevisPourAffichage(devis.id);
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);

  const { afficherLogo, blocLogo } = getLogoState(entreprise.logoUrl);

  const blocEntreprise = renderEntrepriseBloc(
    entreprise,
    "",
    afficherLogo
  );

  const lignesHtml = normaliserLignesDevis(devis)
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
          <td class="mobile-hide" align="center" style="padding:10px 0; font-size:14px; line-height:22px; color:#334155;">
            ${texteOuDefaut(ligne.unite)}
          </td>
          <td class="mobile-hide" align="right" style="padding:10px 0; font-size:14px; line-height:22px; color:#334155;">
            ${formatMontant(ligne.prixUnitaire)}
          </td>
          <td class="mobile-hide" align="right" style="padding:10px 0; font-size:14px; line-height:22px; color:#334155;">
            ${ligne.tvaTaux}%
          </td>
          <td align="right" style="padding:10px 0; font-size:14px; line-height:22px; font-weight:700; color:#0f172a;">
            ${formatMontant(sousTotal)}
          </td>
        </tr>
      `;
    })
    .join("");
  const detailTvaHtml = totauxDevis.detailTva
    .map(
      (ligne) => `
        <tr>
          <td style="padding:6px 0; font-size:15px; line-height:22px; color:#334155;">TVA ${ligne.taux}%</td>
          <td align="right" style="padding:6px 0; font-size:15px; line-height:22px; font-weight:700; color:#0f172a;">${formatMontant(ligne.montantTva)}</td>
        </tr>
      `
    )
    .join("");

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${echapperHtml(numeroDevisAffiche)}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-shell { width: 100% !important; border-radius: 0 !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .email-outer { padding: 0 !important; }
        .card-pad { padding: 18px !important; }
        .mobile-hide { display: none !important; }
      }
    </style>
  </head>

  <body style="margin:0; padding:0; background:#e2e8f0; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Consultez ${echapperHtml(numeroDevisAffiche)} et répondez en ligne.
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#e2e8f0; margin:0; padding:0; width:100%;">
      <tr>
        <td class="email-outer" align="center" style="padding:28px 12px;">
          <table class="email-shell" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:680px; width:100%; background:#ffffff; border:1px solid #cbd5e1; border-radius:22px; overflow:hidden; box-shadow:0 18px 45px rgba(15,23,42,.12);">
            ${renderBrandHeader(entreprise, blocLogo, afficherLogo)}
            <tr>
              <td class="email-pad" style="padding:32px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                  <tr>
                    <td style="padding-bottom:24px;">
                      <div style="font-size:12px; line-height:18px; font-weight:800; letter-spacing:0.12em; text-transform:uppercase; color:#f97316;">
                        Proposition commerciale
                      </div>

                      <div style="margin-top:8px; font-size:32px; line-height:39px; font-weight:800; letter-spacing:-.02em; color:#0f172a; word-break:break-word;">
                        Votre devis ${echapperHtml(numeroDevisAffiche)}
                      </div>

                      <div style="margin-top:12px; font-size:15px; line-height:24px; color:#475569;">
                        Préparé pour <strong style="color:#0f172a;">${texteOuDefaut(
                          devis.client
                        )}</strong>
                      </div>

                      <div style="margin-top:4px; font-size:13px; line-height:21px; color:#64748b;">
                        Émis le ${texteOuDefaut(devis.date)} &nbsp;·&nbsp; ${echapperHtml(
                          validite.label
                        )} &nbsp;·&nbsp; ${formatMontant(totalTvac)} TVAC
                      </div>
                    </td>
                  </tr>

                  ${renderStatusBanner(devis.statut, validite.expire)}

                  ${renderMessageOptionnelHtml(message)}

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
                      ${blocEntreprise}
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
                                <td class="mobile-hide" align="center" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">Unité</td>
                                <td class="mobile-hide" align="right" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">PU</td>
                                <td class="mobile-hide" align="right" style="padding:0 0 10px 0; border-bottom:1px solid #e2e8f0; font-size:12px; line-height:18px; font-weight:700; color:#64748b;">TVA</td>
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

                              ${detailTvaHtml}

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

                  ${renderMentionsHtml(entreprise.mentionsLegalesFacture)}

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
  acceptanceUrl?: string,
  message?: string
) {
  const totauxDevis = calculerTotauxDevis(devis);
  const totalHt = totauxDevis.totalHt;
  const totalTvac = totauxDevis.totalTtc;
  const montantAcompte = totalTvac * (devis.acomptePourcentage / 100);
  const soldeRestant = totalTvac - montantAcompte;
  const numeroDevisAffiche = formatNumeroDevisPourAffichage(devis.id);
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);
  const detailTvaTexte = totauxDevis.detailTva
    .map((ligne) => `TVA ${ligne.taux}% : ${formatMontant(ligne.montantTva)}`)
    .join("\n");

  const codePostalVille = [entreprise.codePostal, entreprise.ville]
    .filter(Boolean)
    .join(" · ");
  const nomEntreprise = entreprise.nom?.trim() || "Entreprise";
  const statutImportant =
    devis.statut === "Accepté"
      ? "DEVIS ACCEPTÉ"
      : devis.statut === "Refusé"
        ? "DEVIS REFUSÉ"
        : validite.expire
          ? "DEVIS EXPIRÉ"
          : "";
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
IBAN : ${entreprise.iban || "-"}

DEVIS ${numeroDevisAffiche}
Date : ${devis.date}
Statut : ${devis.statut}
Validité : ${validite.label}
${statutImportant}

${message?.trim() ? `MESSAGE\n${message.trim()}\n` : ""}

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
${detailTvaTexte}
Total TVAC : ${formatMontant(totalTvac)}
Acompte (${devis.acomptePourcentage}%) : ${formatMontant(montantAcompte)}
Solde à la livraison : ${formatMontant(soldeRestant)}

${
    acceptanceUrl?.trim()
      ? `DEVIS EN LIGNE
Lien pour voir, accepter ou refuser le devis : ${acceptanceUrl.trim()}

Pourquoi ce lien ?
Vous pouvez consulter votre devis en ligne, le télécharger, l'accepter ou le refuser.
`
      : ""
  }

  Conditions :
${devis.conditions || "Aucune condition particulière."}

${entreprise.mentionsLegalesFacture?.trim() ? `Mentions :\n${entreprise.mentionsLegalesFacture.trim()}\n` : ""}

Merci pour votre confiance.
${infosFooter || ""}
`.trim();
}
