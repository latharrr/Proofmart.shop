/**
 * Deterministic JSON serialization for signing: recursively sorts object
 * keys so the same logical payload always produces the same bytes,
 * regardless of construction order. Not a general JCS (RFC 8785)
 * implementation — this only needs to handle the plain
 * strings/numbers/booleans/nulls/arrays/objects that make up a
 * `SignedPayload`, which is all this ever serializes.
 */
export function canonicalize(value: unknown): string {
  return stringify(value);
}

function stringify(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value === "number") {
    if (!Number.isFinite(value)) throw new Error(`canonicalize: non-finite number ${value}`);
    return JSON.stringify(value);
  }
  if (typeof value === "boolean" || typeof value === "string") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stringify).join(",")}]`;
  if (typeof value === "object") {
    const keys = Object.keys(value as Record<string, unknown>).sort();
    const entries = keys.map((k) => `${JSON.stringify(k)}:${stringify((value as Record<string, unknown>)[k])}`);
    return `{${entries.join(",")}}`;
  }
  throw new Error(`canonicalize: unsupported value type ${typeof value}`);
}
