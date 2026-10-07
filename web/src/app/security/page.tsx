import Link from "next/link";
import type { ReactNode } from "react";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";
import DepthStage from "@/components/home/depth-stage";
import SectionKicker from "@/components/home/section-kicker";
import SecurityToc from "@/components/home/security-toc";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import { ScrollVar } from "@/components/motion/scroll-progress";

export const metadata = {
  title: "Security · ProofMart",
  description: "How ProofMart stores, processes, retains, deletes and signs your documents, and who can see them.",
};

/*
 * Written for a buyer's security reviewer, who arrives with a checklist and
 * wants each answer in one line, then the detail behind it. Every statement
 * here describes code that exists today: storage and deletion in
 * app/api/inspect + app/documents/actions.ts, retention windows in
 * lib/retention.ts (pruned daily by the /api/webhooks/sweep cron), signing in
 * lib/signing, webhook signing in lib/webhooks. Nothing aspirational.
 */

const JUMP = [
  { id: "storage", label: "Storage" },
  { id: "access", label: "Access" },
  { id: "retention", label: "Retention" },
  { id: "deletion", label: "Deletion" },
  { id: "signing", label: "Signing" },
];

const GLANCE: { topic: string; q: string; a: ReactNode; href: string }[] = [
  { topic: "Storage", q: "Private blob store", a: "No public URLs. Reading a file needs a credential only the server holds.", href: "#storage" },
  { topic: "Access", q: "Only the uploader", a: "Postgres Row Level Security enforces it on every table, in the database itself.", href: "#access" },
  { topic: "Retention", q: "Signed-out: deleted", a: "Processed, then deleted as soon as the scan finishes. Nothing about the upload is kept.", href: "#retention" },
  {
    topic: "Retention",
    q: "API: never stored",
    a: (
      <>
        <code>/v1/verify</code> processes the file in memory. Only the response leaves.
      </>
    ),
    href: "#retention",
  },
  { topic: "Deletion", q: "Saved: until you delete", a: "Deleting removes the record and the stored file together, never one without the other.", href: "#deletion" },
  { topic: "Processing", q: "No third-party AI", a: "Parsing and OCR run inside ProofMart. No document content goes to an outside AI or OCR API.", href: "#processing" },
  { topic: "Signing", q: "Ed25519 and HMAC", a: "Dossiers are signed with Ed25519; webhook deliveries with HMAC-SHA256.", href: "#signing" },
  { topic: "Certifications", q: "None yet", a: "ProofMart is not SOC 2, ISO 27001, HIPAA or PCI certified.", href: "#limits" },
];

const LIFECYCLE = [
  { k: "Signed out", path: "Upload → scan → deleted", note: "Nothing kept" },
  { k: "API key", path: "POST → in memory → response", note: "File never stored" },
  { k: "Signed in, saved", path: "Upload → private blob → yours", note: "Until you delete it" },
];

const RETENTION = [
  { data: "File uploaded while signed out", kept: "Not kept", how: "Deleted as soon as the scan finishes" },
  { data: "File sent to the API", kept: "Not stored", how: "Processed in memory; only the response leaves" },
  { data: "Saved document: original file and result", kept: "Until you delete it", how: "You, from My documents; record and file go together" },
  { data: "Webhook delivery log, including the result payload", kept: "90 days", how: "Pruned automatically, daily" },
  { data: "Audit events (sign-ins, uploads, key and webhook changes)", kept: "180 days", how: "Pruned automatically, daily" },
  { data: "Rate-limit counters", kept: "1 day", how: "Pruned automatically, daily" },
  { data: "API keys, stored as a SHA-256 hash, never the raw key", kept: "Until revoked", how: "You; revoking takes effect immediately" },
];

const PROVIDERS = [
  { name: "Vercel", role: "Hosting, serverless compute, private Blob storage", holds: "Uploaded files, while they are kept" },
  { name: "Supabase", role: "Postgres database, authentication", holds: "Account data and saved scan results" },
];

const TOC = [
  { id: "storage", label: "Storage" },
  { id: "access", label: "Access control" },
  { id: "processing", label: "Processing" },
  { id: "retention", label: "Retention" },
  { id: "deletion", label: "Deletion" },
  { id: "signing", label: "Signing & encryption" },
  { id: "api", label: "API & webhooks" },
  { id: "auth", label: "Authentication" },
  { id: "providers", label: "Providers" },
  { id: "limits", label: "What a verdict means" },
  { id: "report", label: "Reporting an issue" },
];

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="pm-mk-sec-section" aria-labelledby={`${id}-h`}>
      <div className="pm-mk-sec-section-head">
        <span className="pm-t-label pm-mk-mute">{n}</span>
        <LineReveal as="h2" id={`${id}-h`} className="pm-t-heading">
          {title}
        </LineReveal>
      </div>
      <div className="pm-mk-prose">{children}</div>
    </section>
  );
}

export default function SecurityPage() {
  return (
    <div className="pm-page pm-mk">
      <Topbar />
      <main id="main">
        <header className="pm-wrap pm-mk-sec-hero">
          <SectionKicker n="—">Trust &amp; security</SectionKicker>
          <LineReveal as="h1" className="pm-t-display pm-mk-sec-title">
            What happens <br />
            to your documents.
          </LineReveal>
          <div className="pm-mk-sec-hero-row">
            <Reveal as="p" delay={240} className="pm-t-body-lg pm-mk-lead">
              Where files are stored, who can see them, how long anything is kept, how it is deleted and how results are signed, as the system is built
              today, including the parts that aren&rsquo;t done yet.
            </Reveal>
            <Reveal delay={320} as="nav" aria-label="Jump to" className="pm-mk-sec-jump">
              {JUMP.map((j) => (
                <RollPill key={j.id} href={`#${j.id}`} native variant="secondary" size="sm">
                  {j.label}
                </RollPill>
              ))}
            </Reveal>
          </div>
        </header>

        <section aria-labelledby="glance" className="pm-wrap pm-mk-sec-glance-wrap">
          <h2 id="glance" className="pm-t-label pm-mk-mute pm-mk-sec-glance-h">
            At a glance
          </h2>
          <ScrollVar as="dl" range="enter" className="pm-mk-sec-glance">
            {GLANCE.map((g, i) => (
              <div key={g.q} className="pm-mk-sec-card" style={{ ["--i" as string]: i % 4, ["--row" as string]: Math.floor(i / 4) }}>
                <dt>
                  <span className="pm-t-label pm-mk-mute">{g.topic}</span>
                  <span className="pm-t-heading-sm">{g.q}</span>
                </dt>
                <dd className="pm-t-body pm-mk-mute">{g.a}</dd>
                <dd className="pm-mk-sec-card-more">
                  <a href={g.href} className="pm-inline-link">
                    Details
                  </a>
                </dd>
              </div>
            ))}
          </ScrollVar>
        </section>

        <section className="pm-wrap pm-mk-sec-life" aria-labelledby="life-h">
          <DepthStage variant="hero" verdict="CLEAR" label="Three ways in, three outcomes" sceneLabel="Statement pages passing through ProofMart, the examined page marked CLEAR." className="pm-mk-sec-life-stage">
            <div className="pm-mk-sec-life-copy">
              <h2 id="life-h" className="pm-t-heading">
                A document&rsquo;s path, by how it arrived.
              </h2>
            </div>
            <ol className="pm-mk-sec-life-steps">
              {LIFECYCLE.map((s) => (
                <li key={s.k}>
                  <span className="pm-t-label">{s.k}</span>
                  <span className="pm-t-mono">{s.path}</span>
                  <span className="pm-mk-sec-life-note">{s.note}</span>
                </li>
              ))}
            </ol>
          </DepthStage>
        </section>

        <div className="pm-wrap pm-mk-sec-layout">
          <SecurityToc items={TOC} />

          <div className="pm-mk-sec-body">
            <Section id="storage" n="01" title="Storage">
              <p>
                Uploaded PDFs are written to a <strong>private</strong> Vercel Blob store, not a public one. The browser uploads directly to that store
                with a short-lived, single-use token restricted by size and content type, so the file is never routed through anyone else on the way.
              </p>
              <p>A private blob&rsquo;s URL is not enough to read it. Retrieving a file needs the server&rsquo;s own storage credential, which never reaches the browser.</p>
            </Section>

            <Section id="access" n="02" title="Access control">
              <ul>
                <li>
                  Every table (documents, API keys, webhooks, usage, audit events) enforces Postgres <strong>Row Level Security</strong>. A query only
                  ever returns rows owned by the requesting user, enforced in the database, not just in application code.
                </li>
                <li>Every server request that touches your data re-verifies your session before it runs a query.</li>
                <li>
                  The Supabase service-role key, which bypasses Row Level Security, is used for a small set of server-side operations only (validating an
                  API key, recording usage, delivering a webhook) and is never sent to the browser.
                </li>
              </ul>
            </Section>

            <Section id="processing" n="03" title="Processing">
              <p>
                PDF parsing, positioned-text extraction and OCR (Tesseract, bundled and run in-process) all happen server-side inside ProofMart&rsquo;s own
                runtime. <strong>No document content is sent to a third-party AI or OCR API.</strong>
              </p>
              <p>
                Verification is a fixed set of deterministic rules (arithmetic reconciliation, date order, duplicate detection, encoding and OCR
                confidence), not a machine-learning model making a judgment call. The same bytes always produce the same result.
              </p>
            </Section>

            <Section id="retention" n="04" title="Retention">
              <p>What is kept depends on how a document arrived.</p>
              <div className="pm-mk-table-wrap">
                <table className="pm-mk-table">
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
                        <td data-label="Kept for" className="pm-mk-table-kept">
                          {r.kept}
                        </td>
                        <td data-label="Removed by">{r.how}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p>
                If you register a webhook, each delivery&rsquo;s payload is the verification result, which includes extracted text and finding summaries.
                That log exists so failed deliveries can be retried and debugged, and it is pruned after 90 days.
              </p>
            </Section>

            <Section id="deletion" n="05" title="Deletion">
              <ul>
                <li>Signed-out uploads delete themselves: the stored file is removed as soon as the scan finishes.</li>
                <li>
                  A saved document stays until you delete it. Deleting removes its database record and its stored file together, never one without the
                  other.
                </li>
                <li>Revoking an API key takes effect immediately; the stored hash can no longer authenticate a request.</li>
              </ul>
              <p>
                <Link href="/documents" className="pm-inline-link">
                  See and delete your saved documents
                </Link>
              </p>
            </Section>

            <Section id="signing" n="06" title="Signing & encryption">
              <ul>
                <li>
                  Downloadable dossiers are signed with <strong>Ed25519</strong> using Node&rsquo;s own <code>crypto</code> module. A modified dossier fails
                  verification, and anyone can check one at <code>/v1/verify-signature</code> without an account.
                </li>
                <li>
                  Webhook deliveries are signed with <strong>HMAC-SHA256</strong> in the <code>x-proofmart-signature</code> header, so a receiver can
                  confirm a delivery came from ProofMart.
                </li>
                <li>All traffic is served over HTTPS.</li>
                <li>Data at rest (documents, results, account data) sits in Supabase&rsquo;s managed Postgres and Vercel Blob, both encrypted at rest by those providers.</li>
              </ul>
            </Section>

            <Section id="api" n="07" title="API & webhooks">
              <ul>
                <li>
                  <code>/v1/verify</code>, <code>/v1/extract</code> and <code>/v1/inspect</code> require a Bearer API key and are rate-limited per key.
                </li>
                <li>API keys are shown once, at creation. Only a SHA-256 hash is stored; ProofMart cannot recover a raw key.</li>
                <li>A webhook URL is checked against private and internal address ranges when you add it, and again immediately before every delivery attempt.</li>
              </ul>
            </Section>

            <Section id="auth" n="08" title="Authentication">
              <p>
                Sign-in is handled by Supabase Auth: email and password, and Google OAuth where configured. ProofMart never stores passwords itself;
                Supabase hashes and stores credentials on its own infrastructure. Sessions are cookie-based.
              </p>
            </Section>

            <Section id="providers" n="09" title="Providers">
              <p>Two infrastructure providers handle data. No other third party receives document content.</p>
              <div className="pm-mk-table-wrap">
                <table className="pm-mk-table">
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
            </Section>

            <Section id="limits" n="10" title="What a verdict does not mean">
              <div className="pm-mk-callout">
                <p>
                  A <strong>CLEAR</strong> verdict means every check that could run found no inconsistency. It is not a legal, forensic or accounting
                  certification, and it does not confirm who issued a document or that it is authentic in a broader sense. Treat a ProofMart result as
                  one input to a review, not a substitute for checking with the issuer.
                </p>
                <p>
                  ProofMart is not SOC 2, ISO 27001, HIPAA or PCI certified, and does not claim GDPR certification; GDPR has no formal certification
                  scheme to hold.
                </p>
              </div>
            </Section>

            <Section id="report" n="11" title="Reporting an issue">
              <p>
                ProofMart is early-stage and does not yet have a dedicated security contact address or a bug-bounty program. That is a real gap, stated
                plainly rather than covered with an inbox nobody monitors.
              </p>
              <p>
                <a href="#main" className="pm-inline-link">
                  Back to the top
                </a>
              </p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
