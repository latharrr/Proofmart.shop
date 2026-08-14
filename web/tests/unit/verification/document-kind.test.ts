import { describe, expect, it } from "vitest";
import { classifyDocumentKind } from "@/lib/verification/document-kind";
import type { ProcessedDocument, ProcessedPage } from "@/lib/pdf/types";

function page(markdown: string): ProcessedPage {
  return { page: 1, widthPt: 612, heightPt: 792, markdown, needsOcr: false, hasTable: false, hasColumns: false };
}

function doc(title: string | null, pages: ProcessedPage[]): ProcessedDocument {
  return {
    source: "upload",
    filename: "test.pdf",
    sizeBytes: 100,
    pdfType: "TextBased",
    confidence: 0.9,
    pageCount: pages.length,
    processingTimeMs: 10,
    title,
    hasEncodingIssues: false,
    isComplexLayout: false,
    pages,
    facts: [],
  };
}

describe("classifyDocumentKind", () => {
  it("bank statement: Debit/Credit/Balance ledger headers", () => {
    expect(classifyDocumentKind(doc("Statement", [page("Date Description Debit Credit Balance")]))).toBe("bank_statement");
  });

  it("invoice: GSTIN + Bill To", () => {
    expect(classifyDocumentKind(doc("Invoice", [page("Tax Invoice\nGSTIN: 29ABCDE1234F1Z5\nBill To: Acme Corp")]))).toBe("invoice");
  });

  it("receipt: cash memo language", () => {
    expect(classifyDocumentKind(doc(null, [page("Cash Memo\nAmount Paid: 500.00\nThank you for your purchase")]))).toBe("receipt");
  });

  it("salary slip: payslip terms", () => {
    expect(classifyDocumentKind(doc(null, [page("Payslip for April\nBasic Salary: 40000\nNet Pay: 35000\nEmployee ID: E1023")]))).toBe(
      "salary_slip",
    );
  });

  it("payment proof: UPI transaction confirmation", () => {
    expect(classifyDocumentKind(doc(null, [page("Payment Successful\nUPI Transaction ID: 123456789012")]))).toBe("payment_proof");
  });

  it("generic: no recognizable keywords for any supported kind", () => {
    expect(classifyDocumentKind(doc("Quarterly Report", [page("Prepared for the native-text classification fixture.")]))).toBe("generic");
  });
});
