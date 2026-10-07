import AppShell, { AppPage, AppPageHeader } from "@/components/app/app-shell";

/** My documents while the list query is in flight: the real frame, the real title, and placeholder rows where the documents will be. */
export default function DocumentsLoading() {
  return (
    <AppShell active="documents">
      <AppPage>
        <AppPageHeader
          title="My documents"
          description="Every PDF you verify while signed in is saved here with its report. Only you can see them."
        />
        <div className="pm-docs pm-skeleton" role="status" aria-label="Loading your documents">
          <div className="pm-docs-head" aria-hidden="true">
            <span>Document</span>
            <span>Verdict</span>
            <span>Findings</span>
            <span>Verified</span>
            <span className="pm-docs-head-actions">Actions</span>
          </div>
          <ul className="pm-docs-rows" aria-hidden="true">
            {[68, 52, 74, 46].map((w, i) => (
              <li key={i} className="pm-docs-row pm-skeleton-row">
                <div className="pm-docs-name">
                  <span className="pm-skeleton-bar" style={{ width: `${w}%` }} />
                  <span className="pm-skeleton-bar pm-skeleton-bar-sm" style={{ width: "32%" }} />
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
