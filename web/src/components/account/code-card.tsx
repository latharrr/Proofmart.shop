import type { ReactNode } from "react";
import CopyButton from "./copy-button";

/** One token of a line. `dim` = flags, punctuation, comments; `accent` = the one value to notice (volt). */
export type CodePart = { text: string; tone?: "dim" | "accent" | "str" };
export type CodeLine = { indent?: number; text?: string; parts?: CodePart[]; dim?: boolean };

function lineText(l: CodeLine): string {
  return l.parts ? l.parts.map((p) => p.text).join("") : (l.text ?? "");
}

/**
 * A ready-to-paste snippet on a graphite terminal: a filename-style label,
 * a copy pill that copies exactly the text shown, numbered lines. Tokens are
 * achromatic except one `accent` (the env var a reader has to set), which
 * takes the volt highlight.
 */
export default function CodeCard({
  label,
  note,
  lines,
  copyLabel = "Copy",
  className,
}: {
  label: string;
  note?: ReactNode;
  lines: CodeLine[];
  copyLabel?: string;
  className?: string;
}) {
  const plain = lines.map((l) => " ".repeat(l.indent ?? 0) + lineText(l)).join("\n");
  return (
    <figure className={className ? `pm-acct-code ${className}` : "pm-acct-code"}>
      <div className="pm-acct-code-head">
        <figcaption className="pm-t-mono pm-acct-code-label">{label}</figcaption>
        {note && <span className="pm-t-mono pm-acct-code-note">{note}</span>}
        <CopyButton value={plain} variant="secondary" className="pm-acct-code-copy" ariaLabel={`Copy ${label}`}>
          {copyLabel}
        </CopyButton>
      </div>
      <pre className="pm-t-mono pm-acct-code-body">
        {lines.map((l, i) => (
          <span key={i} className="pm-acct-code-line" data-dim={l.dim ? "" : undefined} style={{ ["--pm-indent" as string]: l.indent ?? 0 }}>
            <span className="pm-acct-code-n" aria-hidden="true">
              {String(i + 1).padStart(2, "0")}
            </span>
            <span className="pm-acct-code-text">
              {l.parts
                ? l.parts.map((p, j) => (
                    <span key={j} data-tone={p.tone}>
                      {p.text}
                    </span>
                  ))
                : l.text || " "}
            </span>
          </span>
        ))}
      </pre>
    </figure>
  );
}
