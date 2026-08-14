// Test-only stub: the real `server-only` package throws unless resolved via
// Next's bundler-specific export conditions. Unit tests intentionally run
// the "server" pdf/* modules directly in Node, which is a legitimate
// server-side context, so the guard is a no-op here.
export {};
