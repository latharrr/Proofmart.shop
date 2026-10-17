"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Frame from "@/components/motion/frame";
import CopyButton from "./copy-button";
import PillLabel from "./pill-label";

/**
 * The one-time reveal of a freshly minted secret (an API key, a webhook
 * signing secret). It is the only sheet in the product printed in graphite
 * ink: the one moment that has to stop someone, because what it shows is
 * never shown again. Focus moves to its heading so a screen reader announces
 * it, and dismissing it before anything was copied asks first.
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
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.closest("section")?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, []);

  function done() {
    if (!copied && !window.confirm("You haven't copied it yet. Once you close this it can't be shown again. Close anyway?")) return;
    onDone();
  }

  return (
    <section className="pm-acct-reveal" aria-labelledby="pm-acct-reveal-title" data-testid="secret-reveal" data-copied={copied ? "" : undefined}>
      <Frame tone="ink" label={copied ? "Copied · close when saved" : `New ${secretLabel.toLowerCase()}`} stageClassName="pm-acct-reveal-stage">
        <div className="pm-acct-reveal-head">
          <h2 id="pm-acct-reveal-title" ref={headingRef} tabIndex={-1} className="pm-acct-reveal-title">
            {title}
          </h2>
          <span className="pm-stamp">Shown once · not stored</span>
        </div>
        <p className="pm-acct-reveal-body">{children}</p>

        <div className="pm-acct-reveal-secret">
          <span className="pm-label pm-acct-reveal-label">{secretLabel}</span>
          <code className="pm-acct-reveal-value">{secret}</code>
        </div>

        <div className="pm-acct-reveal-actions">
          <CopyButton value={secret} variant="paper" size="md" dot copiedLabel="Copied" onCopied={() => setCopied(true)}>
            Copy {secretLabel.toLowerCase()}
          </CopyButton>
          {envName && (
            <CopyButton
              value={`export ${envName}=${secret}`}
              variant="secondary"
              size="md"
              className="pm-acct-on-dark"
              copiedLabel="Copied export line"
              ariaLabel={`Copy as a shell line: export ${envName}=…`}
              onCopied={() => setCopied(true)}
            >
              Copy as export
            </CopyButton>
          )}
          <button type="button" className="pm-pill pm-acct-on-dark pm-acct-reveal-done" data-variant="secondary" data-size="md" onClick={done}>
            <PillLabel>I&rsquo;ve saved it</PillLabel>
          </button>
        </div>
        {envName && (
          <p className="pm-acct-reveal-env">
            &ldquo;Copy as export&rdquo; gives you <code className="pm-acct-code-inline">export {envName}=…</code>, ready to paste into a shell.
          </p>
        )}
      </Frame>
    </section>
  );
}
