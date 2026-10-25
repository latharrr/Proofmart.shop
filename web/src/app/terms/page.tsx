import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";

export const metadata = {
  title: "Terms of service · ProofMart",
  description: "The terms under which ProofMart provides its document-verification service.",
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

export default function TermsPage() {
  return (
    <div className="pm-page">
      {/* Operator details confirmed by the owner on 2026-10-25. Prices remain placeholders until the owner confirms them. Not reviewed by a lawyer. */}
      <Topbar />
      <main id="main">
        <header className="pm-wrap pm-sec-hero">
          <h1 className="pm-sec-title">Terms of service.</h1>
          <p className="pm-h-lead">
            The terms under which Deepanshu Lathar provides ProofMart. By creating an account or using the API, you accept these terms.
          </p>
        </header>

        <div className="pm-wrap pm-sec-layout">
          <div className="pm-sec-body">
            <Section id="service" n="01" title="The service">
              <p>
                ProofMart checks PDF documents — typically bank statements — against a fixed set of deterministic rules and reports what it found: a
                verdict (<code>CLEAR</code>, <code>REVIEW</code> or <code>FAIL</code>), the findings behind it, and where each finding sits on the page.
                It is delivered four ways on one engine: web upload, the public API, signed webhooks, and the <code>proofmart</code> CLI.
              </p>
            </Section>

            <Section id="account" n="02" title="Your account">
              <ul>
                <li>You must provide a working email address. Sign-in is handled by Supabase Auth; ProofMart never stores your password.</li>
                <li>You are responsible for keeping your credentials and API keys safe. An API key is shown once, at creation; only its SHA-256 hash is stored.</li>
                <li>You may revoke an API key at any time; revocation takes effect immediately. You may ask for your account to be deleted at any time by writing to deepanshulathar@gmail.com.</li>
              </ul>
            </Section>

            <Section id="api" n="03" title="Using the API">
              <ul>
                <li>Your account carries a monthly plan quota, shared by all of its API keys and counted across verify, inspect and extract calls; each key also has a per-minute rate limit. The 51st call on a free plan in a calendar month (UTC) is refused with <code>402 quota_exceeded</code>.</li>
                <li>Do not share keys, embed them in client-side code, or use the service to harm, overload or probe it.</li>
                <li>We may revoke a key or suspend an account that is being abused, after telling you why where it is practical to do so.</li>
              </ul>
            </Section>

            <Section id="pricing" n="04" title="Pricing and payments">
              <p>
                <strong>The prices shown on this site are placeholders and are not confirmed with the business.</strong> Treat every price you see as
                provisional until the operator confirms the real pricing.
              </p>
              <p>Billing, when enabled, runs on Razorpay in INR. Online payments are not yet enabled; no charges are being collected today.</p>
              <p>
                Paid plans are described on <Link href="/account/billing" className="pm-link">the billing page</Link>; refunds are covered by the{" "}
                <Link href="/refunds" className="pm-link">refund policy</Link>.
              </p>
            </Section>

            <Section id="use" n="05" title="Acceptable use">
              <ul>
                <li>Only submit documents you are entitled to process. Do not use ProofMart to facilitate fraud, forgery or any unlawful act.</li>
                <li>Do not misrepresent a ProofMart result — see the disclaimers below about what a verdict does and does not mean.</li>
              </ul>
            </Section>

            <Section id="ip" n="06" title="Intellectual property">
              <p>
                ProofMart, its design and its code are the property of Deepanshu Lathar. Your documents remain yours; the verification results we
                generate for you are yours to use. Nothing here transfers any intellectual-property right except the right to use the service.
              </p>
            </Section>

            <Section id="disclaimers" n="07" title="What a verdict does not mean">
              <div className="pm-callout">
                <p>
                  A <strong>CLEAR</strong> verdict means every check that could run found no inconsistency. It is not a legal, forensic or accounting
                  certification, and it does not confirm who issued a document or that it is authentic in a broader sense. Treat a ProofMart result as
                  one input to a review, not a substitute for checking with the issuer.
                </p>
                <p>
                  ProofMart is not SOC 2, ISO 27001, HIPAA or PCI certified. The service is provided as-is, without warranties of any kind.
                </p>
              </div>
            </Section>

            <Section id="liability" n="08" title="Liability">
              <p>
                To the maximum extent the law allows, Deepanshu Lathar&rsquo;s liability for anything arising from your use of ProofMart is limited to
                what you paid for the service in the twelve months before the claim. Deepanshu Lathar is not liable for indirect or consequential
                losses, including decisions made on the basis of a verification result.
              </p>
            </Section>

            <Section id="changes" n="09" title="Changes and termination">
              <p>
                We may change these terms; material changes will be noted here with the date, and continued use after a change means you accept the
                updated terms. Either side may end the relationship at any time: you by deleting your account, us by suspending or terminating access
                for a breach of these terms.
              </p>
            </Section>

            <Section id="law" n="10" title="Governing law and contact">
              <p>These terms are governed by the laws of India. Deepanshu Lathar, Delhi 110002. Questions: deepanshulathar@gmail.com.</p>
              <p className="pm-mono">Last updated: 25 October 2026.</p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
