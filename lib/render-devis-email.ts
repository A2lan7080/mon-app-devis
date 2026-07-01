import { entreprise as entrepriseParDefaut } from "./devis-constants";
import {
  calculerTotauxDevis,
  calculerValiditeDevis,
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

function renderLogo(entreprise: EntrepriseSettings) {
  const logoUrl = entreprise.logoUrl?.trim();

  if (!logoUrl) return "";

  return `
    <div style="display:inline-block; padding:9px 12px; background:#ffffff; border-radius:14px;">
      <img
        src="${echapperHtml(logoUrl)}"
        alt="Logo de ${texteOuDefaut(entreprise.nom, "l'entreprise")}"
        style="display:block; width:auto; max-width:240px; max-height:72px; object-fit:contain;"
      />
    </div>
  `;
}

function renderMessage(message?: string) {
  const messageNettoye = message?.trim();
  const contenu =
    messageNettoye ||
    `Bonjour,

Veuillez trouver ci-joint votre devis.

Vous pouvez également le consulter en ligne avant de l'accepter ou de le refuser.

Le PDF est joint à cet email.`;

  return echapperHtml(contenu).replaceAll("\n", "<br />");
}

export function renderDevisEmailHtml(
  devis: DevisBusiness,
  entreprise: EntrepriseSettings = entrepriseParDefaut,
  acceptanceUrl?: string,
  message?: string
) {
  const numeroDevis = formatNumeroDevisPourAffichage(devis.id);
  const totalTvac = calculerTotauxDevis(devis).totalTtc;
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);
  const logo = renderLogo(entreprise);
  const afficherNom = !logo || entreprise.logoRemplaceNomEntreprise !== true;
  const url = acceptanceUrl?.trim();

  return `
<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${echapperHtml(numeroDevis)}</title>
    <style>
      @media only screen and (max-width: 620px) {
        .email-outer { padding: 0 !important; }
        .email-shell { width: 100% !important; border-radius: 0 !important; }
        .email-pad { padding-left: 20px !important; padding-right: 20px !important; }
        .summary-label, .summary-value { display: block !important; width: 100% !important; text-align: left !important; }
        .summary-value { padding-top: 3px !important; }
        .primary-button { display: block !important; text-align: center !important; }
      }
    </style>
  </head>
  <body style="margin:0; padding:0; background:#e2e8f0; font-family:Arial, Helvetica, sans-serif; color:#0f172a;">
    <div style="display:none; max-height:0; overflow:hidden; opacity:0;">
      Votre devis ${echapperHtml(numeroDevis)} est disponible en ligne et en pièce jointe.
    </div>

    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; background:#e2e8f0;">
      <tr>
        <td class="email-outer" align="center" style="padding:28px 12px;">
          <table class="email-shell" role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%; max-width:640px; overflow:hidden; border:1px solid #cbd5e1; border-radius:22px; background:#ffffff; box-shadow:0 18px 45px rgba(15,23,42,.12);">
            <tr>
              <td class="email-pad" style="padding:28px 32px; background:#0f172a;">
                ${logo}
                ${
                  afficherNom
                    ? `<div style="${logo ? "margin-top:14px;" : ""} font-size:24px; line-height:30px; font-weight:800; color:#ffffff;">${texteOuDefaut(
                        entreprise.nom,
                        "Votre entreprise"
                      )}</div>`
                    : ""
                }
              </td>
            </tr>

            <tr>
              <td class="email-pad" style="padding:34px 32px 32px;">
                <div style="font-size:12px; line-height:18px; font-weight:800; letter-spacing:.12em; text-transform:uppercase; color:#f97316;">
                  Votre devis
                </div>
                <h1 style="margin:8px 0 0; font-size:32px; line-height:39px; letter-spacing:-.02em; color:#0f172a;">
                  ${echapperHtml(numeroDevis)}
                </h1>

                <div style="margin-top:22px; font-size:15px; line-height:25px; color:#334155;">
                  ${renderMessage(message)}
                </div>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:26px; border:1px solid #e2e8f0; border-radius:16px; background:#f8fafc;">
                  <tr>
                    <td style="padding:18px;">
                      ${
                        devis.client?.trim()
                          ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                              <tr>
                                <td class="summary-label" style="padding:5px 0; font-size:13px; color:#64748b;">Client</td>
                                <td class="summary-value" align="right" style="padding:5px 0; font-size:14px; font-weight:700; color:#0f172a;">${texteOuDefaut(
                                  devis.client
                                )}</td>
                              </tr>
                            </table>`
                          : ""
                      }
                      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                        <tr>
                          <td class="summary-label" style="padding:5px 0; font-size:13px; color:#64748b;">Montant total TVAC</td>
                          <td class="summary-value" align="right" style="padding:5px 0; font-size:17px; font-weight:800; color:#0f172a;">${formatMontant(
                            totalTvac
                          )}</td>
                        </tr>
                        <tr>
                          <td class="summary-label" style="padding:5px 0; font-size:13px; color:#64748b;">Date</td>
                          <td class="summary-value" align="right" style="padding:5px 0; font-size:14px; font-weight:700; color:#0f172a;">${texteOuDefaut(
                            devis.date
                          )}</td>
                        </tr>
                        <tr>
                          <td class="summary-label" style="padding:5px 0; font-size:13px; color:#64748b;">Validité</td>
                          <td class="summary-value" align="right" style="padding:5px 0; font-size:14px; font-weight:700; color:#0f172a;">${echapperHtml(
                            validite.label
                          )}</td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>

                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:18px; border:1px solid #fed7aa; border-radius:14px; background:#fff7ed;">
                  <tr>
                    <td style="padding:16px 18px; font-size:13px; line-height:21px; color:#9a3412;">
                      <strong>Le PDF du devis est joint à cet email.</strong><br />
                      Vous pouvez également consulter ce devis en ligne avant de prendre votre décision.
                    </td>
                  </tr>
                </table>

                ${
                  url
                    ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin-top:24px;">
                        <tr>
                          <td align="center">
                            <a class="primary-button" href="${echapperHtml(
                              url
                            )}" style="display:inline-block; padding:14px 22px; border-radius:12px; background:#f97316; color:#ffffff; font-size:15px; line-height:21px; font-weight:800; text-decoration:none;">
                              Consulter le devis en ligne
                            </a>
                          </td>
                        </tr>
                      </table>`
                    : ""
                }

                <div style="margin-top:28px; padding-top:20px; border-top:1px solid #e2e8f0; font-size:12px; line-height:20px; color:#64748b;">
                  ${[
                    entreprise.nom?.trim(),
                    entreprise.email?.trim(),
                    entreprise.telephone?.trim(),
                  ]
                    .filter(Boolean)
                    .map((info) => echapperHtml(info as string))
                    .join(" &middot; ")}
                </div>
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
  const numeroDevis = formatNumeroDevisPourAffichage(devis.id);
  const totalTvac = calculerTotauxDevis(devis).totalTtc;
  const validite = calculerValiditeDevis(devis.date, devis.validiteJours);
  const messageProfessionnel =
    message?.trim() ||
    `Bonjour,

Veuillez trouver ci-joint votre devis.

Vous pouvez également le consulter en ligne avant de l'accepter ou de le refuser.

Le PDF est joint à cet email.`;

  return `
${entreprise.nom?.trim() || "Votre entreprise"}

DEVIS ${numeroDevis}
${devis.client?.trim() ? `Client : ${devis.client.trim()}\n` : ""}Montant total TVAC : ${formatMontant(
    totalTvac
  )}
Date : ${devis.date || "-"}
Validité : ${validite.label}

${messageProfessionnel}

Le PDF du devis est joint à cet email.
Vous pouvez également consulter ce devis en ligne avant de prendre votre décision.

${
  acceptanceUrl?.trim()
    ? `Consulter le devis en ligne : ${acceptanceUrl.trim()}`
    : ""
}

${[entreprise.nom, entreprise.email, entreprise.telephone]
  .map((info) => info?.trim())
  .filter(Boolean)
  .join(" - ")}
`.trim();
}
