import { test, expect } from "@playwright/test";
import { rail } from "./helpers";

// Both CTAs deliberately stopped auto-opening the native file picker (see
// open-scan-button.tsx) — popping the OS dialog the instant someone clicks a
// nav button skipped past the rail's own drag/paste/click affordances. They
// now only scroll the rail into view; the rail's own document panel (covered
// by tests/e2e/helpers.ts's `upload()`, exercised throughout the other e2e
// specs) is what actually opens the picker.

test("START A SCAN scrolls the Evidence Rail into view without opening the file picker", async ({ page }) => {
  await page.goto("/");
  let fileChooserFired = false;
  page.once("filechooser", () => {
    fileChooserFired = true;
  });

  await page.getByRole("button", { name: "START A SCAN →" }).click();
  await expect(rail(page)).toBeInViewport();
  expect(fileChooserFired).toBe(false);
});

test("GET ACCESS (topbar) scrolls the Evidence Rail into view without opening the file picker", async ({ page }) => {
  await page.goto("/");
  let fileChooserFired = false;
  page.once("filechooser", () => {
    fileChooserFired = true;
  });

  await page.getByRole("button", { name: "GET ACCESS →" }).click();
  await expect(rail(page)).toBeInViewport();
  expect(fileChooserFired).toBe(false);
});
