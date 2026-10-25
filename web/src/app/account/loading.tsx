import AppShell, { AppPage, AppPageHeaderSkeleton } from "@/components/app/app-shell";

/**
 * Account pages (API keys, webhooks, billing) while their server queries are
 * in flight: the real app frame and header shape with placeholder bars where
 * the content will be. Without this boundary the router holds the previous
 * screen until the page's data finishes (measured 0.8-1.5s TTFB on these
 * routes), which read as the app hanging on every tap. No fake data: bars
 * and pills only, same pattern as documents/loading.tsx.
 */
export default function AccountLoading() {
  return (
    <AppShell>
      <AppPage>
        <AppPageHeaderSkeleton label="Loading your account" />
        <div className="pm-docs pm-skeleton" aria-hidden="true">
          <ul className="pm-docs-rows">
            {[64, 48, 72].map((w, i) => (
              <li key={i} className="pm-docs-row pm-skeleton-row">
                <div className="pm-docs-name">
                  <span className="pm-docs-sheet" />
                  <span className="pm-docs-name-text">
                    <span className="pm-skeleton-bar" style={{ width: `${w}%` }} />
                    <span className="pm-skeleton-bar pm-skeleton-bar-sm" style={{ width: "36%" }} />
                  </span>
                </div>
                <div className="pm-docs-verdict">
                  <span className="pm-skeleton-pill" />
                </div>
                <div className="pm-docs-date">
                  <span className="pm-skeleton-bar" style={{ width: 88 }} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      </AppPage>
    </AppShell>
  );
}
