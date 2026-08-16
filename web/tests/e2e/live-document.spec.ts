import { expect, test } from "@playwright/test";
import { emptyBytes, malformedPdfBytes, multiPagePdf, nativeTextPdf, tableHeavyPdf } from "../fixtures/build";
import { canvasDataUrl, collectConsoleErrors, rail, resetAnonRateLimit, upload, visibleImageRect, waitUntilReady } from "./helpers";

test.describe("live document upload", () => {
  test.beforeEach(async () => {
    await resetAnonRateLimit();
  });

  test("uploading a real PDF replaces the sample with real findings", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");

    const buf = await nativeTextPdf();
    await upload(page, buf, "quarterly-report.pdf");
    await waitUntilReady(page);

    await expect(rail(page).getByText("quarterly-report.pdf")).toBeVisible();
    await expect(rail(page).getByText("UPLOADED · REAL DOCUMENT")).toBeVisible();
    // The sample's hardcoded verification finding must not still be showing
    // *in the rail* (the marketing page below references it in copy, so the
    // assertion has to be scoped to the rail, not the whole page).
    await expect(rail(page).getByText("BALANCE_BREAK")).toHaveCount(0);
    // A real extracted fact (document classification) should be present.
    await expect(rail(page).getByText(/TEXTBASED/)).toBeVisible();

    expect(errors).toEqual([]);
  });

  test("page navigation operates on the real uploaded PDF", async ({ page }) => {
    await page.goto("/");
    const buf = await multiPagePdf(5);
    await upload(page, buf, "multi-page.pdf");
    await waitUntilReady(page);

    await expect(rail(page).getByText("of 5")).toBeVisible();

    const canvas = rail(page).locator("canvas").first();
    const nextButton = rail(page).getByRole("button", { name: "›" });
    const prevButton = rail(page).getByRole("button", { name: "‹" });
    const pageIndicator = rail(page).getByText("page").locator("..").getByText(/^\d+$/);

    await expect(prevButton).toBeDisabled();
    await expect(pageIndicator).toHaveText("1");

    // The canvas is a raster of the real PDF page — verify navigation by
    // diffing its actual rendered bitmap (text baked into the pixels isn't
    // queryable as DOM text), not just the page-number label.
    const page1Bitmap = await canvasDataUrl(canvas);
    await nextButton.click();
    await expect(pageIndicator).toHaveText("2");
    await expect.poll(() => canvasDataUrl(canvas)).not.toBe(page1Bitmap);
    const page2Bitmap = await canvasDataUrl(canvas);

    await nextButton.click();
    await nextButton.click();
    await nextButton.click();
    // At page 5 of 5, forward nav should now be disabled.
    await expect(nextButton).toBeDisabled();
    await expect(pageIndicator).toHaveText("5");
    await expect.poll(() => canvasDataUrl(canvas)).not.toBe(page2Bitmap);

    await prevButton.click();
    await expect(prevButton).toBeEnabled();
    await expect(pageIndicator).toHaveText("4");
  });

  test("table-heavy PDF surfaces a table fact", async ({ page }) => {
    await page.goto("/");
    const buf = await tableHeavyPdf();
    await upload(page, buf, "ledger.pdf");
    await waitUntilReady(page);
    await expect(rail(page).getByText(/structure detected on page/i)).toBeVisible();
  });

  test("annotation overlay stays aligned with the canvas across viewport sizes and zoom", async ({ page }) => {
    await page.goto("/");
    const buf = await nativeTextPdf();
    await upload(page, buf, "quarterly-report.pdf");
    await waitUntilReady(page);

    // nativeTextPdf() carries one real positioned fact: a genuine PDF /Link
    // annotation (not just text that looks like a URL). The default pin
    // prefers a finding with real coordinates, so the overlay should
    // already be drawn against it.
    await expect(rail(page).getByText("https://example.com/report")).toBeVisible();
    const canvas = rail(page).locator("canvas").first();
    const overlayRect = rail(page).locator("svg rect").first();

    for (const viewport of [
      { width: 1440, height: 900 },
      { width: 900, height: 700 },
    ]) {
      await page.setViewportSize(viewport);
      for (const zoom of ["0.5", "1", "2"]) {
        await page.evaluate((z) => {
          document.documentElement.style.zoom = z;
        }, zoom);
        await page.waitForTimeout(50);

        const imageRect = await visibleImageRect(canvas);
        const rectBox = await overlayRect.boundingBox();
        expect(rectBox).not.toBeNull();
        if (!rectBox) continue;

        // The annotation must remain fully inside the rendered *image*
        // (not just the canvas element's box, which can be letterboxed),
        // with a little tolerance for sub-pixel rounding.
        const tol = 1.5;
        expect(rectBox.x).toBeGreaterThanOrEqual(imageRect.x - tol);
        expect(rectBox.y).toBeGreaterThanOrEqual(imageRect.y - tol);
        expect(rectBox.x + rectBox.width).toBeLessThanOrEqual(imageRect.x + imageRect.width + tol);
        expect(rectBox.y + rectBox.height).toBeLessThanOrEqual(imageRect.y + imageRect.height + tol);

        // The link's native PDF Rect is [72,625,220,642] on a 792pt-tall
        // page — top-left-origin that's (792-642)/792=18.9% to
        // (792-625)/792=21.1% down from the page top. Confirm the rendered
        // rect lands in that same relative band of the image, not just
        // "somewhere inside it" — this is what actually proves the
        // native-PDF-space-to-rail-space Y flip is correct, not merely that
        // nothing drifted off-canvas.
        const relativeY = (rectBox.y - imageRect.y) / imageRect.height;
        expect(relativeY).toBeGreaterThan(0.15);
        expect(relativeY).toBeLessThan(0.25);
      }
    }
    await page.evaluate(() => {
      document.documentElement.style.zoom = "1";
    });
  });

  test("a non-PDF file is rejected client-side, before any network call", async ({ page }) => {
    await page.goto("/");
    // Wrong extension and wrong MIME type — validateFile() should reject
    // this before pdf.js or the server ever see it.
    await upload(page, Buffer.from("just some text"), "notes.txt", "text/plain");
    await expect(rail(page).getByText("INVALID FILE")).toBeVisible({ timeout: 10_000 });
  });

  test("an empty file is rejected as invalid", async ({ page }) => {
    await page.goto("/");
    await upload(page, emptyBytes(), "empty.pdf");
    await expect(rail(page).getByText("INVALID FILE")).toBeVisible({ timeout: 10_000 });
  });

  test("a malformed PDF body is rejected as unreadable, with the existing error visual language", async ({ page }) => {
    await page.goto("/");
    await upload(page, malformedPdfBytes(), "broken.pdf");
    await expect(rail(page).getByText("UNREADABLE")).toBeVisible({ timeout: 15_000 });
    await expect(rail(page).getByText(/couldn.t read this PDF/i)).toBeVisible();
  });

  test("Close reverts a live document back to the sample", async ({ page }) => {
    await page.goto("/");
    const buf = await nativeTextPdf();
    await upload(page, buf, "quarterly-report.pdf");
    await waitUntilReady(page);

    await rail(page).getByRole("button", { name: "Clear document" }).click();
    await expect(rail(page).getByText("hdfc_apr25_statement.pdf")).toBeVisible();
    await expect(rail(page).getByText("BALANCE_BREAK")).toBeVisible();
  });

  test("no console errors across a full upload -> ready -> reset cycle", async ({ page }) => {
    const errors = collectConsoleErrors(page);
    await page.goto("/");
    const buf = await nativeTextPdf();
    await upload(page, buf, "quarterly-report.pdf");
    await waitUntilReady(page);
    await rail(page).getByRole("button", { name: "Clear document" }).click();
    await expect(rail(page).getByText("hdfc_apr25_statement.pdf")).toBeVisible();
    expect(errors).toEqual([]);
  });
});
