import EvidenceRail from "@/components/evidence-rail/evidence-rail";
import OpenScanButton from "@/components/home/open-scan-button";
import SectionHead, { Serif } from "@/components/home/section-head";
import { SAMPLE_FINDINGS, SAMPLE_PAGE_COUNT } from "@/components/evidence-rail/sample-statement";

/**
 * The working product, second on the page and the visual peak: the sample
 * scan in the Evidence Rail, full width between the grid's outer hairlines,
 * and the real upload behind it. `#access` is the scroll target every
 * "Start a scan" CTA and SCAN_URL (/?scan=1#access) aim at.
 */
export default function LiveScanSection() {
  return (
    <section id="product" className="pm-section pm-live" aria-labelledby="live-title">
      <div className="pm-wrap">
        <SectionHead
          n="02"
          label="Evidence rail"
          meta={`Sample · ${SAMPLE_PAGE_COUNT} pages`}
          id="live-title"
          title={
            <>
              Click a finding. The page <Serif>turns to it.</Serif>
            </>
          }
          aside={
            <>
              <p>
                This is the real rail, running a six-page sample. Pin a finding and it opens the page it lives on and boxes the row. Drop your own PDF
                on it and the same engine reads that instead: no account, and signed-out uploads are deleted after the scan.
              </p>
              <div className="pm-actions">
                <OpenScanButton variant="secondary">Start a scan</OpenScanButton>
              </div>
            </>
          }
        />
        <div id="access" className="pm-live-slot">
          <EvidenceRail />
          {/* Scroll layer only: one tick per finding while scroll steps through them. */}
          <ol className="pm-rail-ticks" aria-hidden="true">
            {SAMPLE_FINDINGS.slice(0, 4).map((f) => (
              <li key={f.id} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
