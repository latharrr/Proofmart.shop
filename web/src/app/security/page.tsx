import Link from "next/link";
import type { ReactNode } from "react";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";

export const metadata = {
  title: "Security · ProofMart",
  description: "How ProofMart stores, processes, retains and deletes your documents — and who can see them.",
};

/*
 * Written for a buyer's security reviewer, who arrives with a checklist and
 * wants each answer in one line, then the detail behind it. Every statement
 * here describes code that exists today: storage and deletion in
 * app/api/inspect + app/documents/actions.ts, retention windows in
 * lib/retention.ts (pruned daily by the /api/webhooks/sweep cron), signing in
 * lib/signing, webhook signing in lib/webhooks. Nothing aspirational.
 */

const GLANCE: { q: string; a: ReactNode; href: string }[] = [
  { q: "Where documents live", a: "A private Vercel Blob store. No public URLs; reading a file needs a credential that only the server holds.", href: "#storage" },
  { q: "Who can see them", a: "Only the account that uploaded them. Postgres Row Level Security enforces it on every table.", href: "#access" },
  { q: "Signed-out uploads", a: "Processed, then deleted. Nothing about the upload is kept.", href: "#retention" },
  {
    q: "API uploads",
    a: (
      <>
        <code className="pm-code">/v1/verify</code> processes the file in memory and returns the result. The file is not written to storage.
      </>
    ),
    href: "#retention",
  },
  { q: "Saved documents", a: "Kept until you delete them. Deleting removes the record and the file together.", href: "#retention" },
  { q: "Processing", a: "Parsing and OCR run inside ProofMart. No document content goes to a third-party AI or OCR API.", href: "#processing" },
  { q: "Signing", a: "Dossiers are signed with Ed25519; webhooks with HMAC-SHA256.", href: "#signing" },
  { q: "Certifications", a: "None yet. ProofMart is not SOC 2, ISO 27001, HIPAA or PCI certified.", href: "#limits" },
];

const RETENTION = [
  { data: "File uploaded while signed out", kept: "Not kept", how: "Deleted as soon as the scan finishes" },
  { data: "File sent to the API", kept: "Not stored", how: "Processed in memory; only the response leaves" },
  { data: "Saved document — original file and result", kept: "Until you delete it", how: "You, from My documents; record and file go together" },
  { data: "Webhook delivery log, including the result payload", kept: "90 days", how: "Pruned automatically, daily" },
  { data: "Audit events (sign-ins, uploads, key and webhook changes)", kept: "180 days", how: "Pruned automatically, daily" },
  { data: "Rate-limit counters", kept: "1 day", how: "Pruned automatically, daily" },
  { data: "API keys — stored as a SHA-256 hash, never the raw key", kept: "Until revoked", how: "You; revoking takes effect immediately" },
];

const PROVIDERS = [
  { name: "Vercel", role: "Hosting, serverless compute, private Blob storage", holds: "Uploaded files, while they are kept" },
  { name: "Supabase", role: "Postgres database, authentication", holds: "Account data and saved scan results" },
];

const TOC = [
  { id: "storage", label: "Storage" },
  { id: "access", label: "Access control" },
  { id: "processing", label: "Processing" },
  { id: "retention", label: "Retention & deletion" },
  { id: "signing", label: "Signing & encryption" },
  { id: "api", label: "API & webhooks" },
  { id: "auth", label: "Authentication" },
  { id: "providers", label: "Providers" },
  { id: "limits", label: "What a verdict means" },
  { id: "report", label: "Reporting an issue" },
];

function Arrow() {
  return (
    <span className="pm-arrow" aria-hidden="true">
      <span>→</span>
    </span>
  );
}

export default function SecurityPage() {
  return (
    <div className="pm-page">
      <Topbar />
      <main id="main">
        <header className="pm-shell pm-sec-hero">
          <p className="pm-eyebrow">Trust &amp; security</p>
          <h1 className="pm-h2 pm-sec-title">What happens to a document you send us.</h1>
          <p className="pm-lead pm-sec-lead">
            How files are stored, who can see them, how long anything is kept and how it is deleted — as the system is built today, including the
            parts that aren&rsquo;t done yet.
          </p>
        </header>

        <section aria-labelledby="glance" className="pm-shell pm-sec-glance-wrap">
          <h2 id="glance" className="pm-eyebrow" style={{ marginBottom: 16 }}>
            At a glance
          </h2>
          <dl className="pm-sec-glance">
            {GLANCE.map((g) => (
              <div key={g.q} className="pm-sec-glance-row">
                <dt className="pm-body pm-sec-q">{g.q}</dt>
                <dd className="pm-body pm-sec-a">{g.a}</dd>
                <dd className="pm-sec-more">
                  <a href={g.href} className="pm-link pm-caption">
                    Details
                    <Arrow />
                  </a>
                </dd>
              </div>
            ))}
          </dl>
        </section>

        <div className="pm-shell pm-sec-layout">
          <nav aria-label="On this page" className="pm-sec-toc">
            <p className="pm-caption" style={{ color: "var(--pm-ash)", marginBottom: 12 }}>
              On this page
            </p>
            <ul>
              {TOC.map((t) => (
                <li key={t.id}>
                  <a href={`#${t.id}`} className="pm-nav-link pm-caption">
                    {t.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="pm-sec-body">
            <section id="storage">
              <h2>Storage</h2>
              <p>
                Uploaded PDFs are written to a <strong>private</strong> Vercel Blob store, not a public one. The browser uploads directly to that
                store with a short-lived, single-use token restricted by size and content type, so the file is never routed through anyone else on
                the way.
              </p>
              <p>
                A private blob&rsquo;s URL is not enough to read it. Retrieving a file needs the server&rsquo;s own storage credential, which never
                reaches the browser.
              </p>
            </section>

            <section id="access">
              <h2>Access control</h2>
              <ul>
                <li>
                  Every table — documents, API keys, webhooks, usage, audit events — enforces Postgres <strong>Row Level Security</strong>. A query
                  only ever returns rows owned by the requesting user, enforced in the database, not just in application code.
                </li>
                <li>
                  Every server request that touches your data re-verifies your session before it runs a query.
                </li>
                <li>
                  The Supabase service-role key, which bypasses Row Level Security, is used for a small set of server-side operations only —
                  validating an API key, recording usage, delivering a webhook — and is never sent to the browser.
                </li>
              </ul>
            </section>

            <section id="processing">
              <h2>Processing</h2>
              <p>
                PDF parsing, positioned-text extraction and OCR (Tesseract, bundled and run in-process) all happen server-side inside
                ProofMart&rsquo;s own runtime. <strong>No document content is sent to a third-party AI or OCR API.</strong>
              </p>
              <p>
                Verification is a fixed set of deterministic rules — arithmetic reconciliation, date order, duplicate detection, encoding and OCR
                confidence — not a machine-learning model making a judgment call. The same bytes always produce the same result.
              </p>
            </section>

            <section id="retention">
              <h2>Retention &amp; deletion</h2>
              <p>
                What is kept depends on how a document arrived. Deleting a saved document removes its database record and its stored file together
                — never one without the other.
              </p>
              <div className="pm-sec-table-wrap">
                <table className="pm-sec-table pm-sec-table-retention">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Kept for</th>
                      <th scope="col">Removed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    {RETENTION.map((r) => (
                      <tr key={r.data}>
                        <th scope="row">{r.data}</th>
                        <td data-label="Kept for">{r.kept}</td>
                        <td data-label="Removed by">{r.how}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                If you register a webhook, each delivery&rsquo;s payload is the verification result, which includes extracted text and finding
                summaries. That log exists so failed deliveries can be retried and debugged, and it is pruned after 90 days.
              </p>
              <p>
                <Link href="/documents" className="pm-link">
                  See and delete your saved documents
                  <Arrow />
                </Link>
              </p>
            </section>

            <section id="signing">
              <h2>Signing &amp; encryption</h2>
              <ul>
                <li>
                  Downloadable dossiers are signed with <strong>Ed25519</strong> using Node&rsquo;s own <code>crypto</code> module. A modified dossier
                  fails verification, and anyone can check one at <code>/v1/verify-signature</code> without an account.
                </li>
                <li>
                  Webhook deliveries are signed with <strong>HMAC-SHA256</strong> in the <code>x-proofmart-signature</code> header, so a receiver can
                  confirm a delivery came from ProofMart.
                </li>
                <li>All traffic is served over HTTPS.</li>
                <li>Data at rest — documents, results, account data — sits in Supabase&rsquo;s managed Postgres and Vercel Blob, both encrypted at rest by those providers.</li>
              </ul>
            </section>

            <section id="api">
              <h2>API &amp; webhooks</h2>
              <ul>
                <li>
                  <code>/v1/verify</code>, <code>/v1/extract</code> and <code>/v1/inspect</code> require a Bearer API key and are rate-limited per key.
                </li>
                <li>
                  API keys are shown once, at creation. Only a SHA-256 hash is stored — ProofMart cannot recover a raw key.
                </li>
                <li>
                  A webhook URL is checked against private and internal address ranges when you add it, and again immediately before every delivery
                  attempt.
                </li>
              </ul>
            </section>

            <section id="auth">
              <h2>Authentication</h2>
              <p>
                Sign-in is handled by Supabase Auth: email and password, and Google OAuth where configured. ProofMart never stores passwords itself —
                Supabase hashes and stores credentials on its own infrastructure. Sessions are cookie-based.
              </p>
            </section>

            <section id="providers">
              <h2>Providers</h2>
              <p>Two infrastructure providers handle data. No other third party receives document content.</p>
              <div className="pm-sec-table-wrap">
                <table className="pm-sec-table pm-sec-table-providers">
                  <thead>
                    <tr>
                      <th scope="col">Provider</th>
                      <th scope="col">Used for</th>
                      <th scope="col">Holds</th>
                    </tr>
                  </thead>
                  <tbody>
                    {PROVIDERS.map((p) => (
                      <tr key={p.name}>
                        <th scope="row">{p.name}</th>
                        <td data-label="Used for">{p.role}</td>
                        <td data-label="Holds">{p.holds}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section id="limits">
              <div className="pm-sec-accent">
                <h2>What a verdict does not mean</h2>
                <p>
                  A <strong>CLEAR</strong> verdict means every check that could run found no inconsistency. It is not a legal, forensic or accounting
                  certification, and it does not confirm who issued a document or that it is authentic in a broader sense. Treat a ProofMart result as
                  one input to a review, not a substitute for checking with the issuer.
                </p>
                <p>
                  ProofMart is not SOC 2, ISO 27001, HIPAA or PCI certified, and does not claim GDPR certification — GDPR has no formal certification
                  scheme to hold.
                </p>
              </div>
            </section>

            <section id="report">
              <h2>Reporting an issue</h2>
              <p>
                ProofMart is early-stage and does not yet have a dedicated security contact address or a bug-bounty program. That is a real gap,
                stated plainly rather than covered with an inbox nobody monitors.
              </p>
              <p className="pm-sec-back">
                <a href="#main" className="pm-link pm-caption">
                  Back to the top
                  <Arrow />
                </a>
              </p>
            </section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
