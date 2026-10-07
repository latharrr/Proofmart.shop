import AppShell, { AppPage } from "@/components/app/app-shell";

/** A saved report while its row (and the full result envelope) loads: the frame, the back link, and the report's shape. */
export default function DocumentLoading() {
  return (
    <AppShell active="documents">
      <AppPage>
        <div className="pm-app-head">
          <span className="pm-link pm-app-back" aria-hidden="true">
            <span className="pm-app-back-arrow">←</span>
            My documents
          </span>
          <div className="pm-skeleton" role="status" aria-label="Loading the report">
            <span className="pm-skeleton-pill" />
            <span className="pm-skeleton-bar pm-skeleton-title" />
            <span className="pm-skeleton-bar pm-skeleton-bar-sm" style={{ width: 280 }} />
          </div>
        </div>
        <div className="pm-report pm-skeleton" aria-hidden="true">
          <div className="pm-report-summary pm-skeleton-summary" />
          <div className="pm-report-body">
            <div className="pm-report-findings">
              {[0, 1, 2].map((i) => (
                <div key={i} className="pm-skeleton-finding">
                  <span className="pm-skeleton-bar" style={{ width: "38%" }} />
                  <span className="pm-skeleton-bar pm-skeleton-bar-sm" style={{ width: "82%" }} />
                  <span className="pm-skeleton-block" />
                </div>
              ))}
            </div>
            <div className="pm-report-page">
              <div className="pm-skeleton-page" />
            </div>
          </div>
        </div>
      </AppPage>
    </AppShell>
  );
}
