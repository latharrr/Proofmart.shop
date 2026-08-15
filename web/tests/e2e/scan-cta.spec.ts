import { test, expect } from "@playwright/test";

test("START A SCAN opens the real file picker", async ({ page }) => {
  await page.goto("/");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "START A SCAN →" }).click();
  const chooser = await chooserPromise;
  expect(chooser.isMultiple()).toBe(false);
  const input = chooser.element();
  expect(await input.getAttribute("accept")).toBe("application/pdf,.pdf");
});

test("GET ACCESS (topbar) opens the real file picker", async ({ page }) => {
  await page.goto("/");
  const chooserPromise = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: "GET ACCESS →" }).click();
  await chooserPromise;
});
