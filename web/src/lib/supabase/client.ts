import { createBrowserClient } from "@supabase/ssr";

// For Client Components — runs in the browser. createBrowserClient uses a
// singleton internally, so calling this in multiple components is cheap.
export function createClient() {
  return createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!);
}
