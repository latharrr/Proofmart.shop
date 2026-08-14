/**
 * Pure validation helpers for the upload path — split out of
 * `/api/inspect/route.ts` rather than exported from it: a Next.js route
 * file may only export recognized route handlers/config (`POST`, `runtime`,
 * etc.), and webpack's route-export validation enforces that at build time
 * (Turbopack does not currently catch this, which is how these ended up
 * exported from the route file in the first place — only surfaced when
 * testing a `next build --webpack` fallback).
 */

/** Strips path components and control characters — the filename is only ever displayed, never used as a filesystem path, but sanitize defensively anyway. */
export function sanitizeFilename(name: string): string {
  const base = name.split(/[/\\]/).pop() ?? "upload.pdf";
  const CONTROL_CHARS = /[\x00-\x1f\x7f]/g;
  return base.replace(CONTROL_CHARS, "").slice(0, 255) || "upload.pdf";
}

/**
 * Only ever fetch from Vercel Blob's own storage host, never an
 * arbitrary client-supplied URL — without this check, `{ blobUrl }` would
 * be a server-side-request-forgery vector (the server would fetch whatever
 * URL a client sent it).
 */
export function isTrustedBlobUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    return protocol === "https:" && hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}
