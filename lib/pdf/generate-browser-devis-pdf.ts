import { getEntrepriseSettings } from "../get-entreprise-settings";
import {
  renderDevisHtml,
  type DevisPdfData,
} from "./render-devis-html";

export async function generateBrowserDevisPdf(devis: DevisPdfData) {
  const fenetre = window.open("", "_blank", "width=1100,height=900");

  if (!fenetre) {
    alert("Impossible d’ouvrir la fenêtre d’export PDF.");
    return;
  }

  const entreprise = await getEntrepriseSettings(devis.entrepriseId ?? null);

  fenetre.document.write(
    renderDevisHtml(devis, entreprise, {
      autoPrint: true,
    })
  );
  fenetre.document.close();
}
