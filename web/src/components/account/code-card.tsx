import type { ReactNode } from "react";
import CopyButton from "./copy-button";

export type CodeLine = { indent?: number; text: string; dim?: boolean };

/**
 * A ready-to-paste snippet on an ink card: a filename-style label, a copy
 * control that copies exactly the text shown, and the lines themselves.
 * The same ink terminal the home page's Integrate section uses, so a
 * developer sees one request shape everywhere.
 */
export default function CodeCard({ label, note, lines, copyLabel = "Copy" }: { label: string; note?: ReactNode; lines: CodeLine[]; copyLabel?: string }) {
  const plain = lines.map((l) => " ".repeat(l.indent ?? 0) + l.text).join("\n");
  return (
    <figure className="pm-acct-code">
      <div className="pm-acct-code-head">
        <figcaption className="pm-mono pm-acct-code-label">{label}</figcaption>
        {note && <span className="pm-mono pm-acct-code-note">{note}</span>}
        <CopyButton value={plain} className="pm-acct-code-copy" ariaLabel={`Copy ${label}`}>
          {copyLabel}
        </CopyButton>
      </div>
      <pre className="pm-mono pm-acct-code-body">
        {lines.map((l, i) => (
          <span key={i} className="pm-acct-code-line" data-dim={l.dim ? "" : undefined} style={{ ["--pm-indent" as string]: l.indent ?? 0 }}>
            {l.text || " "}
          </span>
        ))}
      </pre>
    </figure>
  );
}
