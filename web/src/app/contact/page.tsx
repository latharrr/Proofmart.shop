import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";

export const metadata = {
  title: "Contact · ProofMart",
  description: "How to reach the people behind ProofMart.",
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

export default function ContactPage() {
  return (
    <div className="pm-page">
      {/* Contact details confirmed by the owner on 2026-10-25. */}
      <Topbar />
      <main id="main">
        <header className="pm-wrap pm-sec-hero">
          <h1 className="pm-sec-title">Contact.</h1>
          <p className="pm-h-lead">
            How to reach the people behind ProofMart.
          </p>
        </header>

        <div className="pm-wrap pm-sec-layout">
          <div className="pm-sec-body">
            <Section id="reach" n="01" title="Reach us">
              <div className="pm-ledger-wrap">
                <table className="pm-ledger pm-sec-table">
                  <tbody>
                    <tr>
                      <th scope="row">Email</th>
                      <td>deepanshulathar@gmail.com</td>
                    </tr>
                    <tr>
                      <th scope="row">Post</th>
                      <td>Deepanshu Lathar, Delhi 110002</td>
                    </tr>
                    <tr>
                      <th scope="row">Security issues</th>
                      <td>
                        <span className="pm-mono">deepanshulathar@gmail.com</span> — see <span className="pm-mono">/.well-known/security.txt</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p>Email is the fastest way to reach us. Say what your question is about in the subject line — billing, a verification result, a bug — and include your account email so we can look it up.</p>
            </Section>

            <Section id="data" n="02" title="Data and deletion requests">
              <p>
                To ask for a copy of your data, a correction, or the deletion of your account and its documents, write to deepanshulathar@gmail.com from the
                email address on the account. Saved documents can also be deleted directly from My documents at any time — the record and the stored
                file go together.
              </p>
            </Section>

            <Section id="response" n="03" title="What not to expect">
              <p>
                We make no promise about response times on this page — a support SLA we haven&rsquo;t staffed would be fiction. Everything that arrives
                is read; urgent security reports go first.
              </p>
              <p className="pm-mono">Last updated: 25 October 2026.</p>
            </Section>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
