import { createClient } from "@supabase/supabase-js";
import { existsSync, readFileSync } from "node:fs";
import { expect, type Locator, type Page } from "@playwright/test";

function loadEnvLocal(): Record<string, string> {
  if (!existsSync(".env.local")) return {};
  return Object.fromEntries(
    readFileSync(".env.local", "utf8")
      .split("\n")
      .filter((l) => l.includes("=") && !l.trim().startsWith("#"))
      .map((l) => {
        const i = l.indexOf("=");
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
      }),
  );
}

/**
 * Every spec in this suite uploads through the same loopback IP, so the
 * real, Postgres-backed anonymous rate limiter (10 uploads / 600s per IP —
 * lib/rate-limit.ts) sees one long-lived test run as a single visitor
 * making far more requests than any one real anonymous session would in
 * that window. Reset its bucket before each upload-driving test so the
 * suite exercises "does the limiter correctly gate a real request",
 * not "does this specific run's request count exceed a real production
 * limit" — call this in `beforeEach`, not the limiter itself.
 */
export async function resetAnonRateLimit() {
  const env = { ...loadEnvLocal(), ...process.env };
  const url = env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) return;
  const supabase = createClient(url, serviceKey);
  await supabase.from("rate_limits").delete().like("key", "%127.0.0.1%");
}

export function collectConsoleErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(`pageerror: ${err.message}`));
  return errors;
}

export function rail(page: Page): Locator {
  return page.getByTestId("evidence-rail");
}

export async function upload(page: Page, buffer: Buffer, name: string, mimeType = "application/pdf") {
  // The document panel is the click target that opens the hidden file input.
  const fileChooserPromise = page.waitForEvent("filechooser");
  await page.locator('div[style*="cursor"]').first().click();
  const chooser = await fileChooserPromise;
  await chooser.setFiles({ name, mimeType, buffer });
}

/** Ready is unambiguous and stage-specific: the canvas only mounts once a real page has been rendered. */
export async function waitUntilReady(page: Page) {
  await expect(rail(page).locator("canvas").first()).toBeVisible({ timeout: 15_000 });
}

export async function canvasDataUrl(canvas: Locator): Promise<string> {
  return canvas.evaluate((el: HTMLCanvasElement) => el.toDataURL());
}

/**
 * `canvas.boundingBox()` returns the element's full CSS box, but with
 * `object-fit: contain` the *visible* raster can be letterboxed inside that
 * box (its intrinsic pixel aspect ratio rarely matches the box's own). The
 * overlay SVG letterboxes identically (`preserveAspectRatio="xMidYMid
 * meet"` against the same page aspect ratio), so alignment only has to be
 * checked against the actual visible image rect, not the raw element box.
 */
export async function visibleImageRect(canvas: Locator): Promise<{ x: number; y: number; width: number; height: number }> {
  const box = await canvas.boundingBox();
  if (!box) throw new Error("canvas has no bounding box");
  const intrinsic = await canvas.evaluate((el: HTMLCanvasElement) => ({ w: el.width, h: el.height }));
  const boxAspect = box.width / box.height;
  const imageAspect = intrinsic.w / intrinsic.h;
  if (boxAspect > imageAspect) {
    // Pillarboxed: full height, centered horizontally.
    const width = box.height * imageAspect;
    return { x: box.x + (box.width - width) / 2, y: box.y, width, height: box.height };
  }
  // Letterboxed: full width, centered vertically.
  const height = box.width / imageAspect;
  return { x: box.x, y: box.y + (box.height - height) / 2, width: box.width, height };
}
