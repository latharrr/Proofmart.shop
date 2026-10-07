/**
 * Window event a "Start a scan" CTA fires so the Evidence Rail shows its drop
 * zone and focuses its "Choose a PDF" button. Lives in its own module so the
 * CTA (which ships in the topbar on every page) doesn't import the rail.
 */
export const SCAN_INTENT_EVENT = "proofmart:scan-intent";

/**
 * The same intent as a URL, for links from pages without the rail (the
 * signed-in workspace's "Verify a document"): the rail arms itself on load
 * when `scan` is present, and `#access` scrolls it into view.
 */
export const SCAN_URL = "/?scan=1#access";
