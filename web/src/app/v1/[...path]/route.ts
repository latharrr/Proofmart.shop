import { randomUUID } from "node:crypto";
import { logRequest } from "@/lib/observability/log";

export const runtime = "nodejs";

/**
 * Catch-all for unknown /v1/* paths. Concrete routes (/v1/verify,
 * /v1/inspect, /v1/extract, /v1/documents/…, /v1/verify-signature) take
 * precedence; anything else — including malformed paths like /v1/verify\
 * (trailing backslash), which once 500'd looking for a pages-router module
 * — gets a JSON 404 here instead of an HTML 404 or a 500.
 */
function notFound(request: Request, method: string) {
  const requestId = randomUUID();
  logRequest({ requestId, route: "/v1/[...path]", method, status: 404, durationMs: 0, failureCategory: "not_found" });
  return Response.json({ error: "not_found" }, { status: 404, headers: { "x-request-id": requestId } });
}

export async function GET(request: Request) {
  return notFound(request, "GET");
}

export async function POST(request: Request) {
  return notFound(request, "POST");
}

export async function PUT(request: Request) {
  return notFound(request, "PUT");
}

export async function PATCH(request: Request) {
  return notFound(request, "PATCH");
}

export async function DELETE(request: Request) {
  return notFound(request, "DELETE");
}
