"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Frame from "@/components/motion/frame";
import CopyButton from "./copy-button";
import PillLabel from "./pill-label";

/**
 * The one-time reveal of a freshly minted secret (an API key, a webhook
 * signing secret). It is the page's single dark content band: the one
 * moment that has to stop someone, because what it shows is never shown
 * again. The secret is drawn on left to right behind a volt scan line, the
 * same "examined" gesture as the rest of the product. Focus moves to its
 * heading so a screen reader announces it, and dismissing it before
 * anything was copied asks first.
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
      <Frame tone="graphite" columns={4} label={copied ? "Copied · close when saved" : "Shown once"} stageClassName="pm-acct-reveal-stage">
        <p className="pm-t-label pm-acct-reveal-kicker">
          <span className="pm-acct-reveal-dot" aria-hidden="true" />
          New {secretLabel.toLowerCase()} · not stored
        </p>
        <h2 id="pm-acct-reveal-title" ref={headingRef} tabIndex={-1} className="pm-t-heading pm-acct-reveal-title">
          <span className="pm-acct-reveal-line">
            <span>{title}</span>
          </span>
        </h2>
        <p className="pm-t-body pm-acct-reveal-body">{children}</p>

        <div className="pm-acct-reveal-secret">
          <span className="pm-t-label pm-acct-reveal-label">{secretLabel}</span>
          <code className="pm-acct-reveal-value">
            <span className="pm-acct-reveal-ink">{secret}</span>
          </code>
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
