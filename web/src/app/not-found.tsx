import Link from "next/link";
import Topbar from "@/components/home/topbar";
import SiteFooter from "@/components/home/site-footer";
import RequestedPath from "@/components/account/requested-path";
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
    <div className="pm-page">
      <Topbar />
      <main id="main">
        <div className="pm-shell pm-nf">
          <div className="pm-nf-text">
            {/* A missing page is not a verdict about anyone's document, so
                nothing here takes a verdict colour. */}
            <p className="pm-eyebrow">404 · Page not found</p>
            <h1 className="pm-display pm-nf-title">
              There&rsquo;s no page at this <em>address.</em>
            </h1>
            <p className="pm-lead pm-nf-lead">
              Nothing is published at <RequestedPath />. The link may be mistyped or out of date. Everything else on ProofMart is working normally.
            </p>
            <div className="pm-nf-cta">
              <Link href={signedIn ? "/documents" : "/"} className="pm-btn pm-btn-filled">
                {signedIn ? "Go to my documents" : "Go to the homepage"}
              </Link>
              {signedIn && (
                <Link href="/" className="pm-link">
                  ProofMart home
                  <span className="pm-arrow" aria-hidden="true">
                    <span>→</span>
                  </span>
                </Link>
              )}
            </div>
          </div>

          <nav className="pm-nf-ways" aria-labelledby="pm-nf-ways-title">
            <h2 id="pm-nf-ways-title" className="pm-nf-ways-title">
              Or go straight to
            </h2>
            <ul>
              {ways.map((w) => (
                <li key={w.href}>
                  {w.href.startsWith("/#") ? (
                    <a href={w.href} className="pm-nf-way">
                      <WayBody way={w} />
                    </a>
                  ) : (
                    <Link href={w.href} className="pm-nf-way">
                      <WayBody way={w} />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function WayBody({ way }: { way: Way }) {
  return (
    <>
      <span className="pm-nf-way-text">
        <span className="pm-nf-way-title">{way.title}</span>
        <span className="pm-nf-way-body">{way.body}</span>
      </span>
      <span className="pm-nf-way-arrow" aria-hidden="true">
        <span>→</span>
      </span>
    </>
  );
}
