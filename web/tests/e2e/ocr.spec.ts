import { expect, test, type BrowserContext } from "@playwright/test";
import { PDFDocument } from "pdf-lib";
import { collectConsoleErrors, rail, resetAnonRateLimit, upload, waitUntilReady } from "./helpers";

/**
 * Renders real text to a PNG via a second page in the same browser context
 * (no extra browser launch needed — Playwright's own `page` is already a
 * real Chromium instance), then embeds it as a page-covering image: a
 * scanned document, structurally, with real recognizable text for
 * Tesseract.js to find.
 */
async function scannedPdfWithText(context: BrowserContext, lines: string[]): Promise<Buffer> {
  const renderPage = await context.newPage();
  await renderPage.setViewportSize({ width: 850, height: 300 });
  const spans = lines.map((l, i) => `<div style="position:absolute;left:20px;top:${20 + i * 60}px;font:32px sans-serif;">${l}</div>`).join("");
  await renderPage.setContent(`<div style="position:relative;width:850px;height:300px;background:white;">${spans}</div>`);
  const png = await renderPage.screenshot();
  await renderPage.close();

  const doc = await PDFDocument.create();
  const image = await doc.embedPng(png);
  const pdfPage = doc.addPage([612, 792]);
  pdfPage.drawImage(image, { x: 0, y: 792 - 300, width: 612, height: (300 * 612) / 850 });
  return Buffer.from(await doc.save());
}

test.describe("OCR (real Tesseract.js, bundled local assets)", () => {
  test.beforeEach(async () => {
    await resetAnonRateLimit();
  });

  // This is the one test in the suite that exercises the actual OCR code
  // path end to end through the real production build (this project's e2e
  // suite runs against `npm run start`'s compiled output, not source run
  // through a dev-mode transform) — every other upload test uses
  // native-text fixtures that never touch OCR at all. That gap is exactly
  // how a real bug (require.resolve() silently resolving to a bundler
  // module ID instead of a filesystem path under Turbopack, breaking OCR
  // asset resolution) made it past the rest of the suite; this test exists
  // specifically to close it.
  test("a scanned PDF is recognized end-to-end and the OCR text appears in the Evidence Rail", async ({ page, context }) => {
    const errors = collectConsoleErrors(page);
    const buf = await scannedPdfWithText(context, ["BALANCE 91710.00"]);

    await page.goto("/");
    await upload(page, buf, "scanned-statement.pdf");
    await waitUntilReady(page);

    await expect(rail(page).getByText("OCR TEXT").first()).toBeVisible({ timeout: 30_000 });
    await expect(rail(page)).toContainText("91710.00");

    expect(errors).toEqual([]);
  });
});
