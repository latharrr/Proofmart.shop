import { expect, test } from "@playwright/test";
import { arithmeticInconsistencyPdf, cleanStatementPdf, duplicateTransactionPdf } from "../fixtures/build";
import { collectConsoleErrors, rail, resetAnonRateLimit, upload, waitUntilReady } from "./helpers";

test.describe("verification engine — real findings on real documents", () => {
  test.beforeEach(async () => {
    await resetAnonRateLimit();
  });

  test("an arithmetic inconsistency produces a real FAIL verdict with a colored finding and real evidence", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    const buf = await arithmeticInconsistencyPdf();
    await upload(page, buf, "break.pdf");
    await waitUntilReady(page);

    await expect(rail(page)).toContainText("FAIL");
    await expect(rail(page).getByText("BALANCE_BREAK")).toBeVisible();
    // The arithmetic evidence block — same treatment the sample's findings use.
    await expect(rail(page).getByText(/12,500\.00/)).toBeVisible();
    await expect(rail(page).getByText(/document shows/)).toBeVisible();
    // A real coordinate highlight should be drawn for the pinned finding.
    await expect(rail(page).locator("svg rect").first()).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("a clean statement produces a real CLEAR verdict with no FAIL/REVIEW findings", async ({ page }) => {
    await page.goto("/");
    const buf = await cleanStatementPdf();
    await upload(page, buf, "clean.pdf");
    await waitUntilReady(page);

    await expect(rail(page)).toContainText("CLEAR");
    await expect(rail(page).getByText("BALANCE_BREAK")).toHaveCount(0);
  });

  test("a duplicate transaction produces a real REVIEW verdict", async ({ page }) => {
    await page.goto("/");
    const buf = await duplicateTransactionPdf();
    await upload(page, buf, "dup.pdf");
    await waitUntilReady(page);

    await expect(rail(page)).toContainText("REVIEW");
    await expect(rail(page).getByText("DUPLICATE_TRANSACTION")).toBeVisible();
  });

  test("clicking a different finding moves the real coordinate highlight", async ({ page }) => {
    await page.goto("/");
    const buf = await arithmeticInconsistencyPdf();
    await upload(page, buf, "break.pdf");
    await waitUntilReady(page);

    // The fixture carries two distinctly-positioned real findings: the
    // BALANCE_BREAK row (in the table, lower on the page) and a real /Link
    // annotation near the title (upper on the page, an extracted fact).
    const overlayRect = rail(page).locator("svg rect").first();
    await expect(overlayRect).toBeVisible();
    const balanceBreakBox = await overlayRect.boundingBox();

    await rail(page).getByText("statements.example.com/support").click();
    await page.waitForTimeout(250);
    const linkBox = await overlayRect.boundingBox();

    expect(balanceBreakBox).not.toBeNull();
    expect(linkBox).not.toBeNull();
    if (balanceBreakBox && linkBox) {
      // The link sits near the top of the page, the balance break row much
      // lower — the highlight must have genuinely moved, not just re-drawn
      // in place.
      expect(linkBox.y).toBeLessThan(balanceBreakBox.y - 20);
    }
  });

  test("reset to sample restores the sample's own FAIL verdict and findings", async ({ page }) => {
    await page.goto("/");
    const buf = await cleanStatementPdf();
    await upload(page, buf, "clean.pdf");
    await waitUntilReady(page);
    await expect(rail(page)).toContainText("CLEAR");

    await rail(page).getByRole("button", { name: "Clear document" }).click();

    await expect(rail(page).getByText("hdfc_apr25_statement.pdf")).toBeVisible();
    await expect(rail(page)).toContainText("FAIL");
    await expect(rail(page).getByText("BALANCE_BREAK")).toBeVisible();
    await expect(rail(page).getByText("CROSS_PAGE_TOTAL_MISMATCH")).toBeVisible();
  });
});
