import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";
import RollPill from "@/components/motion/roll-pill";
import RequestedPath from "@/components/account/requested-path";
import MissingPageStage, { type Way } from "@/components/account/missing-page-stage";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server";

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
    <div className="pm-page">
      <Topbar />
      <main id="main">
        <section className="pm-wrap pm-nf" aria-labelledby="pm-nf-title">
          <div className="pm-nf-text">
            {/* A missing page is not a verdict about anyone's document, so
                nothing here takes a pencil colour. */}
            <h1 id="pm-nf-title" className="pm-nf-title">
              Page not found.
            </h1>
            <div>
              <p className="pm-h-lead pm-nf-lead">
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
            </div>
          </div>

          <div className="pm-nf-visual">
            <MissingPageStage ways={ways} />
          </div>
        </section>

      </main>
      <SiteFooter />
    </div>
  );
}
