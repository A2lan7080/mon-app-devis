import { generateBrowserDevisPdf } from "./pdf/generate-browser-devis-pdf";
import type { DevisPdfData } from "./pdf/render-devis-html";

/**
 * API historique conservée pour ne modifier aucun appel existant.
 */
export function exporterDevisPdf(devisSelectionne: DevisPdfData) {
  return generateBrowserDevisPdf(devisSelectionne);
}
