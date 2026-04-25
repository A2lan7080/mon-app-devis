import { expect, test } from "@playwright/test";
import {
  cleanupBatiflowTestIdentity,
  createBatiflowTestIdentity,
  findLatestClient,
  findLatestDevis,
  findLatestFacture,
  mockSendDevisByEmail,
  type TestIdentity,
} from "../support/firebase-admin";

test.describe("BatiFlow V1 - parcours devis à facture", () => {
  let identity: TestIdentity;

  test.beforeAll(async () => {
    identity = await createBatiflowTestIdentity();
  });

  test.afterAll(async () => {
    await cleanupBatiflowTestIdentity(identity);
  });

  test("admin crée, fait accepter et facture un devis", async ({
    page,
    context,
  }) => {
    const clientName = `Client E2E ${identity.entrepriseId}`;
    const clientEmail = `client-${identity.entrepriseId}@batiflow-e2e.test`;
    const chantierName = `Chantier ${identity.entrepriseId}`;

    await context.addInitScript(() => {
      window.print = () => undefined;
    });

    await page.goto("/login");
    await page.getByTestId("login-email").fill(identity.email);
    await page.getByTestId("login-password").fill(identity.password);
    await page.getByTestId("login-submit").click();

    await expect(page.getByRole("heading", { name: "Devis" })).toBeVisible();

    await page.getByTestId("primary-action").click();
    const devisForm = page.locator('[data-testid="devis-form"]:visible');
    await expect(devisForm).toBeVisible();

    await devisForm.getByTestId("devis-client").fill(clientName);
    await devisForm.getByTestId("devis-chantier-titre").fill(chantierName);
    await devisForm.getByTestId("devis-date").fill("2026-04-25");
    await devisForm.getByTestId("devis-adresse").fill("12 rue du Parc");
    await devisForm.getByTestId("devis-code-postal").fill("1000");
    await devisForm.getByTestId("devis-ville").fill("Bruxelles");
    await devisForm.getByTestId("devis-email").fill(clientEmail);
    await devisForm.getByTestId("devis-telephone").fill("+32 2 111 22 33");
    await devisForm.getByTestId("devis-tva-taux").fill("21");

    await devisForm
      .getByTestId("devis-line-0-designation")
      .fill("Main d'oeuvre E2E");
    await devisForm.getByTestId("devis-line-0-quantite").fill("2");
    await devisForm.getByTestId("devis-line-0-unite").selectOption("heure");
    await devisForm.getByTestId("devis-line-0-prix-unitaire").fill("100");
    await devisForm
      .getByTestId(`devis-add-prestation-${identity.prestationId}`)
      .click();

    await devisForm.getByTestId("devis-save").click();

    await expect
      .poll(async () => Boolean(await findLatestDevis(identity.entrepriseId)))
      .toBe(true);
    const devis = await findLatestDevis(identity.entrepriseId);
    if (!devis) throw new Error("Devis E2E introuvable après création.");
    const devisId = String(devis.id);

    await expect(
      page.getByTestId("devis-list-item").filter({ hasText: clientName })
    ).toBeVisible();
    await expect(page.getByTestId("devis-total-ht").first()).toContainText(
      /450,00/
    );
    await expect(page.getByTestId("devis-total-tva").first()).toContainText(
      /94,50/
    );
    await expect(page.getByTestId("devis-total-tvac").first()).toContainText(
      /544,50/
    );

    const acceptanceToken = await mockSendDevisByEmail({
      devisId,
      entrepriseId: identity.entrepriseId,
      toEmail: clientEmail,
    });

    await expect
      .poll(async () => (await findLatestDevis(identity.entrepriseId))?.statut)
      .toBe("Envoyé");
    await expect(page.getByTestId("devis-detail-status").first()).toContainText(
      /Envoy/
    );

    await page.goto(`/accepter-devis/${encodeURIComponent(acceptanceToken)}`);
    await expect(page.getByRole("heading", { name: devisId })).toBeVisible();
    await page.getByTestId("acceptance-name").fill("Client Signature");
    await page.getByTestId("acceptance-email").fill(clientEmail);
    await page.getByTestId("acceptance-submit").click();

    await expect(page.getByText(/Ce devis est accept/i)).toBeVisible();
    await expect
      .poll(async () => (await findLatestDevis(identity.entrepriseId))?.statut)
      .toBe("Accepté");

    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Devis" })).toBeVisible();
    await page.getByTestId("devis-list-item").filter({ hasText: clientName }).click();
    await expect(page.getByTestId("devis-detail-status").first()).toContainText(
      /Accept/
    );

    await page.getByTestId("nav-factures").click();
    await expect(page.getByRole("heading", { name: "Factures" })).toBeVisible();
    await page.getByTestId("primary-action").click();
    const factureForm = page.locator('[data-testid="facture-form"]:visible');
    await expect(factureForm).toBeVisible();
    await expect(
      factureForm.getByTestId("facture-devis-select").locator("option", {
        hasText: devisId,
      })
    ).toHaveCount(1);

    await factureForm.getByTestId("facture-devis-select").selectOption(devisId);

    await expect
      .poll(async () => Boolean(await findLatestClient(identity.entrepriseId)))
      .toBe(true);
    const client = await findLatestClient(identity.entrepriseId);
    if (!client) throw new Error("Client E2E introuvable après création.");
    await factureForm
      .getByTestId("facture-client-select")
      .selectOption(String(client.id));
    await factureForm.getByTestId("facture-date-emission").fill("2026-04-25");
    await factureForm.getByTestId("facture-date-echeance").fill("2026-05-25");
    await expect(factureForm.getByTestId("facture-montant-ht")).toHaveValue(
      "450"
    );
    await expect(factureForm.getByTestId("facture-tva-taux")).toHaveValue("21");

    await factureForm.getByTestId("facture-save").click();

    await expect
      .poll(async () => Boolean(await findLatestFacture(identity.entrepriseId)))
      .toBe(true);
    const facture = await findLatestFacture(identity.entrepriseId);
    if (!facture) throw new Error("Facture E2E introuvable après création.");

    const factureListItem = page
      .getByTestId("facture-list-item")
      .filter({ hasText: String(facture.reference) });
    await expect(factureListItem).toBeVisible();
    await factureListItem.click();

    const popupPromise = page.waitForEvent("popup");
    await page.locator('[data-testid="facture-export-pdf"]:visible').click();
    const pdfPage = await popupPromise;
    await expect(pdfPage.locator("body")).toContainText("Facture");
    await expect(pdfPage.locator("body")).toContainText(String(facture.reference));
  });
});
