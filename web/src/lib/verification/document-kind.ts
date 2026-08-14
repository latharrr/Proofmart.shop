import "server-only";

import type { ProcessedDocument } from "@/lib/pdf/types";

export type DocumentKind = "bank_statement" | "invoice" | "receipt" | "salary_slip" | "payment_proof" | "generic";

/**
 * A deterministic keyword classifier, not a semantic one — it counts
 * distinctive-term hits against each page's extracted markdown text and
 * the document title, and picks the kind with the most hits above a
 * minimum threshold. This is a labeling/routing signal for transparency
 * (surfaced alongside the verdict, e.g. in the copy-JSON payload), not a
 * gate on which markers run: BALANCE_BREAK etc. already self-gate on real
 * structural evidence (a recognizable Debit/Credit/Balance table), so a
 * misclassified "invoice" that happens to have a real ledger table still
 * gets checked correctly. `generic` means none of the keyword sets cleared
 * the threshold — an honest "not one of the document types this pipeline
 * has targeted checks for", not a guess.
 */
const KEYWORDS: Record<Exclude<DocumentKind, "generic">, string[]> = {
  bank_statement: ["statement of account", "account number", "ifsc", "opening balance", "closing balance", "account statement", "statement period", "swift code", "debit", "credit", "balance"],
  invoice: ["invoice", "gstin", "bill to", "invoice number", "invoice date", "purchase order", "tax invoice"],
  receipt: ["receipt", "paid by", "amount paid", "cash memo", "thank you for your purchase"],
  salary_slip: ["payslip", "salary slip", "net pay", "gross pay", "basic salary", "employee id", "pf number", "hra"],
  payment_proof: ["payment successful", "transaction id", "utr number", "upi", "payment confirmation", "reference number", "txn id"],
};

const MIN_HITS = 1;

export function classifyDocumentKind(document: ProcessedDocument): DocumentKind {
  const haystack = [document.title ?? "", ...document.pages.map((p) => p.markdown)].join("\n").toLowerCase();

  let best: DocumentKind = "generic";
  let bestHits = MIN_HITS - 1;
  for (const [kind, terms] of Object.entries(KEYWORDS) as [Exclude<DocumentKind, "generic">, string[]][]) {
    const hits = terms.filter((t) => haystack.includes(t)).length;
    if (hits > bestHits) {
      best = kind;
      bestHits = hits;
    }
  }
  return best;
}
