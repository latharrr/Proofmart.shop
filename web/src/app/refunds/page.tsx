import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";

export const metadata = {
  title: "Refund policy · ProofMart",
  description: "How ProofMart handles plan cancellations and refunds.",
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

export default function RefundsPage() {
  return (
    <div className="pm-page">
      {/* Contact details confirmed by the owner on 2026-10-25. Not reviewed by a lawyer. */}
      <Topbar />
      <main id="main">
        <header className="pm-wrap pm-sec-hero">
          <h1 className="pm-sec-title">Refund policy.</h1>
          <p className="pm-h-lead">
            How plan cancellations and refunds work.
          </p>
        </header>

        <div className="pm-wrap pm-sec-layout">
          <div className="pm-sec-body">
            <Section id="status" n="01" title="Where payments stand today">
              <p>
                <strong>Online payments are not yet enabled — no charges are being collected today.</strong> The prices shown on the site are
                placeholders and are not confirmed with the business. The policy below describes how billing will work once it is enabled.
              </p>
            </Section>

            <Section id="cancel" n="02" title="Cancelling a plan">
              <ul>
                <li>
                  The Pro upgrade on <Link href="/account/billing" className="pm-link">the billing page</Link> is a single payment, not a subscription:
                  nothing renews and nothing is charged again automatically.
                </li>
                <li>There is no in-app cancel button yet. To move back to the free plan, write to deepanshulathar@gmail.com from the email address on the account.</li>
                <li>Downgrading to the free plan keeps your account and saved documents; only the quota changes.</li>
              </ul>
            </Section>

            <Section id="refunds" n="03" title="Refunds">
              <ul>
                <li>Failed or duplicate charges are refunded in full. Write to deepanshulathar@gmail.com with the charge details; refunds are issued by hand, not automatically.</li>
                <li>Other refund requests are handled case by case. Write to deepanshulathar@gmail.com with your account email and the charge details; we will answer with a decision, not a template.</li>
                <li>Approved refunds go back to the original payment method via Razorpay and can take 5–10 business days to appear, depending on the bank.</li>
              </ul>
            </Section>

            <Section id="contact" n="04" title="Questions">
              <p>Anything about a charge, a cancellation or a refund: deepanshulathar@gmail.com.</p>
              <p className="pm-mono">Last updated: 25 October 2026.</p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
