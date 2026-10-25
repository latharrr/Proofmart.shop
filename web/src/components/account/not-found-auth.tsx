"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import RollPill from "@/components/motion/roll-pill";
import MissingPageStage, { type Way } from "@/components/account/missing-page-stage";

/**
 * The auth-dependent parts of the 404 page. Rendered on the client for the
 * same reason as header-auth.tsx: a server-side session read here made the
 * shared not-found boundary dynamic, which opted EVERY route in the app out
 * of static prerendering. The server HTML is the signed-out variant for
 * everyone; after hydration the browser client swaps in the signed-in
 * destinations when a session exists.
 */
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

export default function NotFoundAuth() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured()) return;
    const supabase = createClient();
    const apply = (session: Session | null) => setSignedIn(Boolean(session));
    supabase.auth.getSession().then(({ data }) => apply(data.session));
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => apply(session));
    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
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
      <div className="pm-nf-visual">
        <MissingPageStage ways={signedIn ? SIGNED_IN : SIGNED_OUT} />
      </div>
    </>
  );
}
