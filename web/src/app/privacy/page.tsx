import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";

export const metadata = {
  title: "Privacy · ProofMart",
  description: "What personal data ProofMart processes, why, how long it is kept, and how to ask for its deletion.",
};

function Section({ id, n, title, children }: { id: string; n: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="pm-sec-section" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="pm-sec-h">
        <span className="pm-mono pm-sec-n">{n}</span>
        {title}
      </h2>
      <div className="pm-prose">{children}</div>
    </section>
  );
}

/**
 * Privacy policy. Mirrors the /security page's stated facts exactly (storage,
 * retention, deletion, sub-processors, no third-party AI processing). Adds
 * the DPDP Act 2023 notice elements: what data, why, how long, deletion, contact.
 */
export default function PrivacyPage() {
  return (
    <div className="pm-page">
      {/* <!-- DRAFT — pending review by [BUSINESS NAME] (and ideally a lawyer). Business name, address and contact email are loud placeholders. Do not treat as final legal advice. --> */}
      <Topbar />
      <main id="main">
        <header className="pm-wrap pm-sec-hero">
          <h1 className="pm-sec-title">Privacy policy.</h1>
          <p className="pm-h-lead">
            What personal data ProofMart processes, why it processes it, how long anything is kept, and how you can ask for it to be deleted. The
            facts here match the <Link href="/security" className="pm-link">security page</Link> exactly; that page describes the systems this policy
            rests on.
          </p>
          <p className="pm-h-lead">
            <strong>Draft.</strong> This policy is pending legal review. Business details are placeholders until [BUSINESS NAME] confirms them.
          </p>
        </header>

        <div className="pm-wrap pm-sec-layout">
          <div className="pm-sec-body">
            <Section id="who" n="01" title="Who we are">
              <p>
                This service is operated by <strong>[BUSINESS NAME]</strong>, [REGISTERED ADDRESS]. For anything about your personal data, write to{" "}
                <strong>[CONTACT EMAIL]</strong>.
              </p>
            </Section>

            <Section id="what" n="02" title="What personal data we process">
              <p>The site processes bank statements, which are financial personal data under India&rsquo;s Digital Personal Data Protection Act 2023.</p>
              <ul>
                <li>
                  <strong>Account data:</strong> your email address and sign-in credentials. Passwords are handled by Supabase Auth; ProofMart never
                  stores a password itself.
                </li>
                <li>
                  <strong>Documents you upload:</strong> the PDF files you submit for verification and the results derived from them (extracted facts,
                  findings, verdicts).
                </li>
                <li>
                  <strong>API keys:</strong> only a SHA-256 hash and a display prefix are stored, never the raw key.
                </li>
                <li>
                  <strong>Webhook endpoints</strong> you register, and the signed delivery log for each one (which carries the verification result).
                </li>
                <li>
                  <strong>Operational records:</strong> API usage events (which key, which event type), audit events (sign-ins, uploads, key and webhook
                  changes), and rate-limit counters.
                </li>
                <li>
                  <strong>Billing records:</strong> your plan and its status, and the Razorpay order ID for any upgrade. ProofMart never
                  sees or stores card, UPI or bank details.
                </li>
              </ul>
            </Section>

            <Section id="why" n="03" title="Why we process it">
              <ul>
                <li>To run the verification pipeline you asked for: parse the PDF, extract its content, and check it against the fixed marker rules.</li>
                <li>To operate your account: sign-in, saved documents, API keys, webhooks, billing quota.</li>
                <li>To keep the service working and safe: audit events, rate limits, retrying failed webhook deliveries.</li>
              </ul>
              <p>
                Processing happens server-side inside ProofMart&rsquo;s own runtime. <strong>No document content is sent to a third-party AI or OCR API.</strong>
              </p>
            </Section>

            <Section id="how-long" n="04" title="How long we keep it">
              <div className="pm-ledger-wrap">
                <table className="pm-ledger pm-sec-table">
                  <thead>
                    <tr>
                      <th scope="col">Data</th>
                      <th scope="col">Kept for</th>
                      <th scope="col">Removed by</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">File uploaded while signed out</th>
                      <td data-label="Kept for" className="pm-sec-kept">Not kept</td>
                      <td data-label="Removed by">Deleted as soon as the scan finishes</td>
                    </tr>
                    <tr>
                      <th scope="row">File sent to the API</th>
                      <td data-label="Kept for" className="pm-sec-kept">Not stored</td>
                      <td data-label="Removed by">Processed in memory; only the response leaves</td>
                    </tr>
                    <tr>
                      <th scope="row">Saved document: original file and result</th>
                      <td data-label="Kept for" className="pm-sec-kept">Until you delete it</td>
                      <td data-label="Removed by">You, from My documents; record and file go together</td>
                    </tr>
                    <tr>
                      <th scope="row">Webhook delivery log, including the result payload</th>
                      <td data-label="Kept for" className="pm-sec-kept">90 days</td>
                      <td data-label="Removed by">Pruned automatically, daily</td>
                    </tr>
                    <tr>
                      <th scope="row">Audit events</th>
                      <td data-label="Kept for" className="pm-sec-kept">180 days</td>
                      <td data-label="Removed by">Pruned automatically, daily</td>
                    </tr>
                    <tr>
                      <th scope="row">Rate-limit counters</th>
                      <td data-label="Kept for" className="pm-sec-kept">1 day</td>
                      <td data-label="Removed by">Pruned automatically, daily</td>
                    </tr>
                    <tr>
                      <th scope="row">API keys (stored as a SHA-256 hash)</th>
                      <td data-label="Kept for" className="pm-sec-kept">Until revoked</td>
                      <td data-label="Removed by">You; revoking takes effect immediately</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="who-sees" n="05" title="Who else sees your data">
              <p>Two infrastructure providers handle data, and a payment processor handles Pro checkout. No other third party receives document content.</p>
              <div className="pm-ledger-wrap">
                <table className="pm-ledger pm-sec-table">
                  <thead>
                    <tr>
                      <th scope="col">Provider</th>
                      <th scope="col">Used for</th>
                      <th scope="col">Holds</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <th scope="row">Vercel</th>
                      <td data-label="Used for">Hosting, serverless compute, private Blob storage</td>
                      <td data-label="Holds">Uploaded files, while they are kept</td>
                    </tr>
                    <tr>
                      <th scope="row">Supabase</th>
                      <td data-label="Used for">Postgres database, authentication</td>
                      <td data-label="Holds">Account data and saved scan results</td>
                    </tr>
                    <tr>
                      <th scope="row">Razorpay</th>
                      <td data-label="Used for">Payments for the Pro plan, once billing is enabled</td>
                      <td data-label="Holds">Your email, user ID and the order; card, UPI or bank details you enter at checkout stay with Razorpay</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Section>

            <Section id="deletion" n="06" title="Deletion and your rights">
              <ul>
                <li>
                  <strong>Saved documents:</strong> deleting one from <Link href="/documents" className="pm-link">My documents</Link> removes its database
                  record and its stored file together, never one without the other.
                </li>
                <li>
                  <strong>Your account:</strong> write to [CONTACT EMAIL] to ask for your account and its data to be deleted, or to correct it.
                </li>
                <li>
                  <strong>API keys:</strong> revoking a key takes effect immediately; the stored hash can no longer authenticate a request.
                </li>
              </ul>
              <p>We will confirm a deletion request once it is done, and tell you plainly if some record has to be kept (for example, a payment record the law requires).</p>
            </Section>

            <Section id="cookies" n="07" title="Cookies">
              <p>Sessions are cookie-based: one cookie keeps you signed in. There are no advertising or cross-site tracking cookies.</p>
            </Section>

            <Section id="changes" n="08" title="Changes to this policy">
              <p>If this policy changes in a way that matters, the change will be noted here with the date. Continued use of the service after a change means you accept the updated policy.</p>
              <p className="pm-mono">Last reviewed: not yet — draft.</p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
