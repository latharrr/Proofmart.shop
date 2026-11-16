import http from "node:http";
import type { AddressInfo } from "node:net";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { pinnedPost } from "@/lib/webhooks/pinned-post";

describe("pinnedPost", () => {
  let server: http.Server;
  let received = "";
  beforeAll(async () => {
    server = http.createServer((req, res) => {
      req.on("data", (chunk) => (received += chunk));
      req.on("end", () => res.writeHead(204).end());
    });
    await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  });
  afterAll(() => server.close());

  it("connects to the approved address without resolving the hostname again", async () => {
    const port = (server.address() as AddressInfo).port;
    // ".invalid" never resolves, so reaching the server proves the pinned address was used.
    const res = await pinnedPost(
      `http://webhook-receiver.invalid:${port}/hook`,
      { headers: { "content-type": "application/json" }, body: '{"ok":true}', signal: AbortSignal.timeout(5000) },
      [{ address: "127.0.0.1", family: 4 }],
    );
    expect(res.status).toBe(204);
    expect(received).toBe('{"ok":true}');
  });
});
