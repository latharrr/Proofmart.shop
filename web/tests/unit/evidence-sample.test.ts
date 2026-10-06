import { describe, it, expect } from "vitest";
import { FINDINGS, TXNS } from "@/lib/evidence-data";

/**
 * The hero rail shows a synthetic bank statement next to the findings it
 * produced, and invites the reader to check one against the other — that
 * cross-check is the entire pitch of a forensics product.
 *
 * So the sample is not decoration, it is an argument, and an argument that
 * contradicts itself on the landing page is worse than no sample at all.
 * These tests hold the demo data to the standard the page claims for it.
 */

const money = (n: number) => n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

describe("sample findings reconcile against the sample statement", () => {
  it("every finding's printed coordinate is the box it actually highlights", () => {
    for (const f of FINDINGS) {
      expect(f.addr2, `${f.marker} prints a coordinate that is not its own box`).toBe(`${f.rect.x},${f.rect.y}`);
    }
  });

  it("BALANCE_BREAK's arithmetic uses the two rows it points at", () => {
    const f = FINDINGS.find((x) => x.marker === "BALANCE_BREAK")!;
    const row = TXNS.find((t) => t.breakBalance)!;
    const prior = TXNS[TXNS.indexOf(row) - 1];

    // prior balance + credit − debit, versus what the row actually shows
    expect(f.arithmetic).toContain(money(prior.balance));
    expect(f.arithmetic).toContain(money(row.credit ?? 0));
    expect(f.arithmetic).toContain(money(prior.balance + (row.credit ?? 0) - (row.debit ?? 0)));
    expect(f.arithmetic).toContain(money(row.balance));
  });

  it("BALANCE_BREAK's stated discrepancy is the real one", () => {
    const f = FINDINGS.find((x) => x.marker === "BALANCE_BREAK")!;
    const row = TXNS.find((t) => t.breakBalance)!;
    const prior = TXNS[TXNS.indexOf(row) - 1];
    const delta = prior.balance + (row.credit ?? 0) - (row.debit ?? 0) - row.balance;

    expect(f.explanation).toContain(money(delta));
  });

  it("CROSS_PAGE_TOTAL_MISMATCH cites the opening row that is actually rendered", () => {
    const f = FINDINGS.find((x) => x.marker === "CROSS_PAGE_TOTAL_MISMATCH")!;
    const opening = TXNS[0];

    // The number it calls the page-4 opening row must be the page-4 opening row.
    expect(f.arithmetic).toContain(money(opening.balance));
    expect(f.arithmetic).toContain(money(opening.credit ?? 0));
  });

  it("CROSS_PAGE_TOTAL_MISMATCH's carry-forward arithmetic adds up", () => {
    const f = FINDINGS.find((x) => x.marker === "CROSS_PAGE_TOTAL_MISMATCH")!;
    const opening = TXNS[0];

    // Pull the four figures out of the two printed lines and check the sum
    // resolves, and that the shortfall is the one the explanation claims.
    const nums = (f.arithmetic.match(/[\d,]+\.\d{2}/g) ?? []).map((n) => Number(n.replace(/,/g, "")));
    expect(nums.length).toBe(5); // closing + credit − debit = expected, then shown

    const [closing, credit, debit, expected, shown] = nums;
    expect(closing + credit - debit).toBe(expected);
    expect(shown).toBe(opening.balance);
    expect(f.explanation).toContain(money(shown - expected));
  });

  it("every finding addresses a row the statement contains", () => {
    for (const f of FINDINGS) {
      const onPage4 = f.addr1.match(/^p4·r(\d+)$/);
      if (!onPage4) continue; // p2 and p3→p4 findings reference pages not rendered here
      const row = Number(onPage4[1]);
      expect(
        TXNS.some((t) => t.i === row),
        `${f.marker} points at p4 row ${row}, which the rendered page does not have`,
      ).toBe(true);
    }
  });
});
