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

/** Window event "Run the sample" fires: the rail returns to its SAMPLE, pins the first finding and focuses it. */
export const RUN_SAMPLE_EVENT = "proofmart:run-sample";

/** Scroll layer → rail: `detail` is the index of the SAMPLE finding to make active (pins it, turns to its page). */
export const RAIL_STEP_EVENT = "proofmart:rail-step";

/** Rail → scroll layer: the visitor clicked or used the keyboard in the rail, so scroll stops driving it. */
export const RAIL_USER_EVENT = "proofmart:rail-user";
