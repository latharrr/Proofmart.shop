import Link from "next/link";
import { MONO, SANS } from "@/lib/evidence-data";

const H2 = { fontFamily: SANS, fontWeight: 500, fontSize: 18, letterSpacing: "-0.01em", margin: "40px 0 10px" } as const;
const P = { fontFamily: SANS, fontSize: 14, color: "#43494F", lineHeight: 1.65, margin: "0 0 10px" } as const;
const LI = { fontFamily: SANS, fontSize: 14, color: "#43494F", lineHeight: 1.65, marginBottom: 6 } as const;
const CODE = { fontFamily: MONO, fontSize: 13, background: "#F5F5F0", padding: "1px 5px", borderRadius: 2 } as const;

export const metadata = { title: "Security · ProofMart", description: "How ProofMart actually stores, processes, and protects your documents." };

export default function SecurityPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#FFFFFF" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "56px 24px 96px" }}>
        <Link href="/" className="pm-hoverable" style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 40, width: "fit-content" }}>
          <div aria-hidden="true" style={{ width: 22, height: 22, background: "#0E1216", position: "relative" }}>
            <div style={{ position: "absolute", inset: 5, border: "1.5px solid #F5F5F0" }} />
          </div>
          <span style={{ fontFamily: SANS, fontWeight: 600, letterSpacing: "-0.01em", fontSize: 17, color: "#0E1216" }}>ProofMart</span>
        </Link>

        <h1 style={{ fontFamily: SANS, fontWeight: 500, fontSize: 26, letterSpacing: "-0.01em", margin: "0 0 6px" }}>Security</h1>
        <p style={{ ...P, color: "#767C83" }}>
          What actually happens to a document you upload, and what ProofMart&rsquo;s verdict does and doesn&rsquo;t mean. This page describes the real,
          current architecture — not aspirational plans.
        </p>

        <h2 style={H2}>Authentication</h2>
        <p style={P}>
          Sign-in is handled by Supabase Auth: email/password, and Google OAuth where configured. Passwords are never stored by ProofMart directly —
          Supabase hashes and stores credentials on its own infrastructure. Sessions are cookie-based; every server request that touches your data
          re-verifies that cookie&rsquo;s session before running any query.
        </p>

        <h2 style={H2}>Document storage</h2>
        <p style={P}>
          Uploaded PDFs are written to a <strong>private</strong> Vercel Blob store — not a public one. The browser uploads directly to that store
          using a short-lived, single-use, size- and content-type-restricted token; the file is never routed through a third party in between.
          A private blob&rsquo;s URL alone is not enough to read it — retrieving it requires the server&rsquo;s own storage credential, which never
          reaches the browser.
        </p>
        <p style={P}>
          If you upload while <strong>signed out</strong>, the file is processed and then deleted immediately — nothing about that upload is
          retained. If you upload while <strong>signed in</strong>, the result is saved to your account (<Link href="/documents" className="pm-hoverable" style={{ color: "#0E1216" }}>My documents</Link>) and the original file is kept so you can reopen or re-run it — until you delete it.
        </p>

        <h2 style={H2}>Processing</h2>
        <p style={P}>
          PDF parsing, positioned-text extraction, and OCR (Tesseract.js, bundled and run in-process) all happen server-side, inside ProofMart&rsquo;s
          own runtime. No document content is sent to a third-party AI or OCR API. Verification runs a fixed set of deterministic markers — arithmetic
          reconciliation, date-sequence checks, duplicate-transaction detection, encoding/extraction-confidence signals — never a machine-learning
          model making a judgment call. The same check on the same bytes always produces the same result.
        </p>

        <h2 style={H2}>Access control</h2>
        <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
          <li style={LI}>Every table (documents, API keys, webhooks, usage, audit events) enforces Postgres Row Level Security — a query only ever returns rows owned by the requesting user, at the database layer, not just in application code.</li>
          <li style={LI}>API keys are shown once, at creation. Only a SHA-256 hash is stored — ProofMart itself cannot recover a raw key. Revoking a key takes effect immediately.</li>
          <li style={LI}>The Supabase service-role key (which bypasses Row Level Security) is used only for a small number of specific server-side operations — validating an API key, recording usage, delivering a webhook — and is never sent to the browser.</li>
        </ul>

        <h2 style={H2}>API &amp; webhooks</h2>
        <p style={P}>
          <code style={CODE}>/v1/verify</code>, <code style={CODE}>/v1/inspect</code>, and <code style={CODE}>/v1/extract</code> require a Bearer API
          key and are rate-limited per key. Webhook deliveries are signed with HMAC-SHA256 (<code style={CODE}>x-proofmart-signature</code>) so a
          receiver can confirm a delivery genuinely came from ProofMart; a registered webhook URL is checked against private/internal address ranges
          both when you add it and again immediately before every delivery attempt.
        </p>

        <h2 style={H2}>In transit and at rest</h2>
        <p style={P}>
          All traffic to ProofMart is served over HTTPS. Data at rest (documents, results, account data) sits in Supabase&rsquo;s managed Postgres and
          Vercel Blob, both encrypted at rest by those providers. Downloadable dossiers are signed with Ed25519 (Node&rsquo;s own <code style={CODE}>crypto</code> module) so a modified dossier fails verification.
        </p>

        <h2 style={H2}>Retention &amp; deletion</h2>
        <p style={P}>
          Deleting a document removes both its database record and its stored file — not one without the other. Anonymous uploads are never
          retained in the first place. Internal operational records (rate-limit counters, webhook delivery logs) exist only to make the product work
          and aren&rsquo;t document content.
        </p>

        <h2 style={H2}>External providers</h2>
        <ul style={{ margin: "0 0 10px", paddingLeft: 20 }}>
          <li style={LI}><strong>Vercel</strong> — hosting, serverless compute, private Blob storage.</li>
          <li style={LI}><strong>Supabase</strong> — Postgres database, authentication, Row Level Security.</li>
        </ul>
        <p style={P}>No other third party ever receives document content.</p>

        <h2 style={H2}>What a verdict does not mean</h2>
        <p style={P}>
          A <strong>CLEAR</strong> verdict means every check that could run found no inconsistency — it is not a legal, forensic, or accounting
          certification, and it does not confirm a document&rsquo;s issuer, absolute correctness, or authenticity in a broader sense. ProofMart is
          not SOC 2, ISO 27001, HIPAA, or PCI certified, and does not hold GDPR certification (GDPR itself has no formal certification scheme to
          hold). Treat a ProofMart result as one input to a review, not a substitute for verifying a document with the party that issued it.
        </p>

        <h2 style={H2}>Reporting an issue</h2>
        <p style={P}>
          ProofMart is early-stage and doesn&rsquo;t yet have a dedicated security contact address or bug-bounty program — that&rsquo;s a real gap,
          stated honestly rather than papered over with an inbox that isn&rsquo;t actually monitored.
        </p>
      </div>
    </div>
  );
}
