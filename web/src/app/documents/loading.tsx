import AppShell, { AppPage, AppPageHeaderSkeleton } from "@/components/app/app-shell";

/** My documents while the list query is in flight: the real frame, the header's shape, and placeholder rows where the documents will be. */
export default function DocumentsLoading() {
  return (
    <AppShell active="documents">
      <AppPage>
        <AppPageHeaderSkeleton label="Loading your documents" />
        <div className="pm-docs pm-skeleton" aria-hidden="true">
          <div className="pm-docs-head">
            <span>Document</span>
            <span>Verdict</span>
            <span>Findings</span>
            <span>Verified</span>
            <span className="pm-docs-head-actions">Actions</span>
          </div>
          <ul className="pm-docs-rows">
            {[68, 52, 74, 46].map((w, i) => (
              <li key={i} className="pm-docs-row pm-skeleton-row">
                <div className="pm-docs-name">
                  <span className="pm-docs-sheet" />
                  <span className="pm-docs-name-text">
                    <span className="pm-skeleton-bar" style={{ width: `${w}%` }} />
                    <span className="pm-skeleton-bar pm-skeleton-bar-sm" style={{ width: "32%" }} />
                  </span>
                </div>
                <div className="pm-docs-verdict">
                  <span className="pm-skeleton-pill" />
                </div>
                <div className="pm-docs-count">
                  <span className="pm-skeleton-bar" style={{ width: 72 }} />
                </div>
                <div className="pm-docs-date">
                  <span className="pm-skeleton-bar" style={{ width: 88 }} />
                </div>
                <div className="pm-docs-actions" />
              </li>
            ))}
          </ul>
        </div>
      </AppPage>
    </AppShell>
  );
}
