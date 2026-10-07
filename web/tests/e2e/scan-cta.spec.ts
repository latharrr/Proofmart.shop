import { test, expect } from "@playwright/test";
import { rail } from "./helpers";

// "Start a scan" deliberately doesn't auto-open the native file picker (see
// open-scan-button.tsx) — popping the OS dialog from a marketing button skips
// the rail's own drag/paste/choose affordances. It scrolls to the rail and
// shows the drop zone instead, focusing its "Choose a PDF" button. The topbar
// "Get access" CTA is an account link, not a scan trigger.

test("Start a scan scrolls the Evidence Rail into view without opening the file picker", async ({ page }) => {
  await page.goto("/");
  let fileChooserFired = false;
  page.once("filechooser", () => {
    fileChooserFired = true;
  });

  await page.getByRole("button", { name: "Start a scan" }).click();
  await expect(rail(page)).toBeInViewport();
  // The visible step: the drop zone appears and its picker button takes focus.
  await expect(page.getByTestId("rail-dropzone")).toBeVisible();
  await expect(page.getByRole("button", { name: "Choose a PDF" })).toBeFocused();
  expect(fileChooserFired).toBe(false);
});

test("Get access (topbar) goes to account creation", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Get access" }).click();
  await expect(page).toHaveURL(/\/signup$/);
});
