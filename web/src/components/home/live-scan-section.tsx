import EvidenceRail from "@/components/evidence-rail/evidence-rail";
import SheetHead from "@/components/home/sheet-head";

const ASSURANCES = ["No account needed", "Deterministic rules, no ML model", "Signed-out uploads deleted after the scan"];

/**
 * The working product, second thing on the page: the sample scan in the
 * Evidence Rail, and the real upload behind it. `#access` is the scroll
 * target every "Start a scan" CTA and SCAN_URL (/?scan=1#access) aim at.
 */
export default function LiveScanSection() {
  return (
    <section className="pm-h-section pm-h-live" aria-labelledby="live-title">
      <div className="pm-wrap">
        <SheetHead
          id="live-title"
          wp="A"
          title="Click a finding. The page turns to it."
          aside={
            <>
              <p>
                This is the real rail, running a six-page sample. Pin a finding and it opens the page it lives on and rings the row. Drop your own PDF
                on it and the same engine reads that instead.
              </p>
              <ul className="pm-h-ticks">
                {ASSURANCES.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            </>
          }
        />
        <div id="access" className="pm-h-rail-slot">
          <EvidenceRail />
        </div>
      </div>
    </section>
  );
}
