"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import CopyButton from "./copy-button";

/**
 * The one-time reveal of a freshly minted secret (an API key, a webhook
 * signing secret). It is the page's single peach surface: the one moment on
 * the page that has to stop someone, because what it shows is never shown
 * again. Focus moves to its heading so a screen reader announces it, and
 * dismissing it before anything was copied asks first.
 */
export default function SecretReveal({
  title,
  children,
  secret,
  secretLabel,
  envName,
  onDone,
}: {
  title: string;
  children: ReactNode;
  secret: string;
  secretLabel: string;
  /** Offers a second copy as a shell `export NAME=…` line. */
  envName?: string;
  onDone: () => void;
}) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  function done() {
    if (!copied && !window.confirm("You haven't copied it yet. Once you close this it can't be shown again. Close anyway?")) return;
    onDone();
  }

  return (
    <section className="pm-acct-reveal" aria-labelledby="pm-acct-reveal-title" data-testid="secret-reveal">
      <h2 id="pm-acct-reveal-title" ref={headingRef} tabIndex={-1} className="pm-acct-reveal-title">
        {title}
      </h2>
      <p className="pm-acct-reveal-body">{children}</p>

      <div className="pm-acct-reveal-secret">
        <span className="pm-acct-reveal-label">{secretLabel}</span>
        <code className="pm-mono pm-acct-reveal-value">{secret}</code>
      </div>

      <div className="pm-acct-reveal-actions">
        <CopyButton value={secret} className="pm-btn pm-btn-filled" copiedLabel="Copied" onCopied={() => setCopied(true)}>
          Copy {secretLabel.toLowerCase()}
        </CopyButton>
        {envName && (
          <CopyButton value={`export ${envName}=${secret}`} className="pm-acct-reveal-alt" copiedLabel="Copied export line" onCopied={() => setCopied(true)}>
            Copy as <span className="pm-mono">export {envName}=…</span>
          </CopyButton>
        )}
        <button type="button" className="pm-btn pm-btn-ghost pm-acct-reveal-done" onClick={done}>
          I&rsquo;ve saved it
        </button>
      </div>
    </section>
  );
}
