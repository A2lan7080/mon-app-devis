import { expect, test, type Page } from "@playwright/test";

const entreprise = {
  nom: "Atelier Horizon",
  adresse: "18 avenue des Artisans",
  codePostal: "1050",
  ville: "Bruxelles",
  email: "bonjour@atelier-horizon.be",
  telephone: "+32 2 555 24 80",
  tva: "BE 0765.432.109",
  iban: "BE68 5390 0754 7034",
  logoUrl: "",
  logoRemplaceNomEntreprise: false,
};

const devis = {
  id: "demo-DEV-2026-001",
  client: "Sophie Lambert",
  adresse: "24 avenue Louise",
  codePostal: "1050",
  ville: "Bruxelles",
  email: "sophie@example.com",
  telephone: "+32 470 12 34 56",
  typeClient: "Particulier",
  societe: "",
  tvaClient: "",
  date: "01/07/2026",
  statut: "Envoyé",
  chantierTitre: "Rénovation intérieure",
  acomptePourcentage: 30,
  validiteJours: 30,
  conditions: "Offre valable 30 jours.",
  lignes: [
    {
      id: "ligne-1",
      designation: "Préparation du chantier",
      quantite: 2,
      unite: "heure",
      prixUnitaireLabel: "100,00 €",
      tvaTaux: 21,
      montantHtLabel: "200,00 €",
      montantTvaLabel: "42,00 €",
      totalTtcLabel: "242,00 €",
    },
  ],
  detailTva: [
    {
      taux: 21,
      montantHtLabel: "200,00 €",
      montantTvaLabel: "42,00 €",
      totalTtcLabel: "242,00 €",
    },
  ],
  dateValidite: "31/07/2026",
  validiteLabel: "Jusqu’au 31/07/2026 - 30 jours restants",
  validiteExpiree: false,
  joursRestants: 30,
  totalHtLabel: "200,00 €",
  totalTvaLabel: "42,00 €",
  totalTvacLabel: "242,00 €",
  acceptedAt: null,
  acceptedByName: "",
  acceptedByEmail: "",
  refusedAt: null,
  refusedByName: "",
  refusedByEmail: "",
};

async function mockerDevisPublic(page: Page, compterPost: () => void) {
  await page.route(
    "**/api/devis/acceptance/demo-token",
    async (route) => {
      const request = route.request();
      if (request.method() === "POST") {
        compterPost();
        const body = request.postDataJSON() as {
          action: "accept" | "refuse";
          name: string;
          email: string;
          comment?: string;
        };
        const accepte = body.action === "accept";

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            success: true,
            devis: {
              ...devis,
              statut: accepte ? "Accepté" : "Refusé",
              acceptedAt: accepte ? Date.now() : null,
              acceptedByName: accepte ? body.name : "",
              acceptedByEmail: accepte ? body.email : "",
              refusedAt: accepte ? null : Date.now(),
              refusedByName: accepte ? "" : body.name,
              refusedByEmail: accepte ? "" : body.email,
            },
          }),
        });
        return;
      }

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          devis,
          entreprise,
          alreadyAccepted: false,
          alreadyRefused: false,
        }),
      });
    }
  );
}

test.describe("Devis public - Sprint UX", () => {
  test("la lecture précède une acceptation confirmée", async ({ page }) => {
    let nombrePost = 0;
    await mockerDevisPublic(page, () => {
      nombrePost += 1;
    });

    await page.goto("/accepter-devis/demo-token");

    await expect(
      page.getByRole("heading", {
        name: "Vous consultez un devis sécurisé.",
      })
    ).toBeVisible();
    await expect(page.getByTestId("public-devis")).toContainText(
      "Préparation du chantier"
    );
    await expect(page.getByTestId("public-devis")).toContainText("242,00 €");

    await page.getByTestId("acceptance-name").fill("Client Signature");
    await page.getByTestId("acceptance-email").fill("client@example.com");
    await page.getByTestId("acceptance-submit").click();

    await expect(
      page.getByRole("heading", { name: "Confirmer l’acceptation" })
    ).toBeVisible();
    expect(nombrePost).toBe(0);

    await page.getByRole("button", { name: "Annuler", exact: true }).click();
    expect(nombrePost).toBe(0);

    await page.getByTestId("acceptance-submit").click();
    await page.getByTestId("acceptance-confirm").click();

    await expect(
      page.getByRole("heading", { name: "Merci pour votre confiance !" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Télécharger le PDF" })
    ).toHaveAttribute(
      "href",
      "/api/devis/acceptance/demo-token/pdf"
    );
    expect(nombrePost).toBe(1);
  });

  test("le refus se confirme sans débordement sur mobile", async ({ page }) => {
    let nombrePost = 0;
    await page.setViewportSize({ width: 390, height: 844 });
    await mockerDevisPublic(page, () => {
      nombrePost += 1;
    });

    await page.goto("/accepter-devis/demo-token");
    await page.getByTestId("acceptance-name").fill("Client Mobile");
    await page.getByTestId("acceptance-email").fill("mobile@example.com");
    await page.getByTestId("acceptance-refuse").click();

    await expect(
      page.getByRole("heading", { name: "Confirmer le refus" })
    ).toBeVisible();
    await expect(
      page.getByPlaceholder("Souhaitez-vous laisser un commentaire ?")
    ).toBeVisible();
    expect(nombrePost).toBe(0);

    await page
      .getByPlaceholder("Souhaitez-vous laisser un commentaire ?")
      .fill("Projet reporté.");
    await page.getByTestId("acceptance-confirm").click();

    await expect(
      page.getByRole("heading", {
        name: "Votre réponse a bien été enregistrée.",
      })
    ).toBeVisible();
    expect(nombrePost).toBe(1);

    const largeur = await page.evaluate(() => ({
      document: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
    }));
    expect(largeur.document).toBeLessThanOrEqual(largeur.viewport);
  });
});
