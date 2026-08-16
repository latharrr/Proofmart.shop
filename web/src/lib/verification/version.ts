/**
 * Bumped by hand whenever the marker registry or verdict logic changes
 * meaningfully. Stored alongside a saved document's result so "My documents"
 * can tell a user their saved verdict was computed by an older engine and
 * offer Re-run, rather than silently presenting a stale result as current.
 */
export const VERIFICATION_ENGINE_VERSION = "1";
