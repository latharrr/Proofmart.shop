import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";
import LineReveal from "@/components/motion/line-reveal";
import Reveal from "@/components/motion/reveal";
import RollPill from "@/components/motion/roll-pill";
import RequestedPath from "@/components/account/requested-path";
import MissingPageStage from "@/components/account/missing-page-stage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

type Way = { href: string; title: string; body: string };

const SIGNED_OUT: Way[] = [
  { href: "/#access", title: "Verify a document", body: "Upload a PDF and get one verdict, with the arithmetic shown." },
  { href: "/#pipeline", title: "How it works", body: "What the markers check, from running balances to duplicate rows." },
  { href: "/#pricing", title: "Pricing", body: "Free for 50 API calls a month. Pro when you need more." },
  { href: "/login", title: "Sign in", body: "Back to your saved documents, API keys and webhooks." },
];

const SIGNED_IN: Way[] = [
  { href: "/documents", title: "My documents", body: "Every report you've saved, newest first." },
  { href: "/#access", title: "Verify a document", body: "Upload a PDF and get one verdict, with the arithmetic shown." },
  { href: "/account/api-keys", title: "API keys", body: "Create and revoke keys, with a request ready to paste." },
  { href: "/security", title: "Trust & security", body: "How documents are stored, who can see them, and deletion." },
];

export default async function NotFound() {
  // Same check the topbar makes; a missing Supabase config is "signed out".
  const signedIn = isSupabaseConfigured() ? Boolean((await (await createClient()).auth.getClaims()).data?.claims) : false;
  const ways = signedIn ? SIGNED_IN : SIGNED_OUT;

  return (
    <div className="pm-page pm-nf-page">
      <Topbar />
      <main id="main">
        <section className="pm-wrap pm-nf" aria-labelledby="pm-nf-title">
          <div className="pm-nf-text">
            {/* A missing page is not a verdict about anyone's document, so
                nothing here takes a verdict colour. */}
            <p className="pm-t-label pm-nf-kicker">
              <span className="pm-nf-kicker-dot" aria-hidden="true" />
              404 · Page not found
            </p>
            <LineReveal as="h1" id="pm-nf-title" className="pm-t-display pm-nf-title">
              Page not found.
            </LineReveal>
            <Reveal delay={240}>
              <p className="pm-t-body-lg pm-nf-lead">
                Nothing is published at <RequestedPath />. The link may be mistyped or out of date. Everything else on ProofMart is working normally.
              </p>
              <div className="pm-nf-cta">
                {signedIn ? (
                  <>
                    <RollPill href="/documents" dot>
                      Go to my documents
                    </RollPill>
                    <RollPill href="/" variant="secondary">
                      ProofMart home
                    </RollPill>
                  </>
                ) : (
                  <>
                    <RollPill href="/" dot>
                      Go to the homepage
                    </RollPill>
                    <RollPill href="/#access" native variant="secondary">
                      Verify a document
                    </RollPill>
                  </>
                )}
              </div>
            </Reveal>
          </div>

          <Reveal delay={120} className="pm-nf-visual">
            <MissingPageStage />
          </Reveal>
        </section>

        <nav className="pm-wrap pm-nf-ways" aria-labelledby="pm-nf-ways-title">
          <h2 id="pm-nf-ways-title" className="pm-t-label pm-nf-ways-title">
            Or go straight to
          </h2>
          <ul>
            {ways.map((w, i) => (
              <Reveal as="li" key={w.href} delay={i * 80}>
                {w.href.startsWith("/#") ? (
                  <a href={w.href} className="pm-nf-way">
                    <WayBody way={w} i={i} />
                  </a>
                ) : (
                  <Link href={w.href} className="pm-nf-way">
                    <WayBody way={w} i={i} />
                  </Link>
                )}
              </Reveal>
            ))}
          </ul>
        </nav>
      </main>
      <SiteFooter />
    </div>
  );
}

function WayBody({ way, i }: { way: Way; i: number }) {
  return (
    <>
      <span className="pm-t-mono pm-nf-way-n" aria-hidden="true">
        {String(i + 1).padStart(2, "0")}
      </span>
      <span className="pm-t-heading-sm pm-nf-way-title">{way.title}</span>
      <span className="pm-nf-way-body">{way.body}</span>
      <span className="pm-nf-way-arrow" aria-hidden="true">
        <span>→</span>
        <span>→</span>
      </span>
    </>
  );
}
