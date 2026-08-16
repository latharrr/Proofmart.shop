import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

// Google OAuth via Auth.js, JWT sessions — no database required. Reads
// AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET / AUTH_SECRET from the environment
// (see .env.example); the app runs with "Sign in" disabled if they're unset.
//
// trustHost: true — required behind any reverse proxy (Vercel, or a plain
// `next start` on a host/port that isn't the AUTH_URL/localhost:3000 default
// Auth.js infers). Without it every request throws "UntrustedHost" instead
// of running auth() at all — reproduced locally via `npm run build && npm
// run start` on :3100 (what the Playwright suite runs against) and a real
// risk on Vercel too, since Auth.js's auto-trust there relies on the
// platform's VERCEL env var being visible at the exact point auth() runs,
// which isn't guaranteed for every route. This is Auth.js's own documented
// setting for exactly this deployment shape — not a security loosening,
// since the app doesn't trust the Host header for anything beyond routing.
export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [Google],
  session: { strategy: "jwt" },
  trustHost: true,
});
