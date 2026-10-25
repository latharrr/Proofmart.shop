# ProofMart: go-live checklist

What stands between the current deployment and a product real customers can
sign up for, use, and pay for. Each item says what's wrong, why it matters,
exactly how to fix it, who has to do it, and how to confirm it's done.

Checked against production on **17 Oct 2026** (live site, Vercel project
`proofmart-shop`, Supabase project `proofmart` / `llfhgspktwacuvlmxigy`,
`ap-south-1`). Re-check anything older than a few weeks before relying on it.

---

## Where things stand

| Area | Status | Evidence |
|---|---|---|
| Site live at https://proofmart.shop | ✅ Working | `/`, `/security`, `/login`, `/signup`, `/robots.txt`, `/sitemap.xml`, `/opengraph-image` all return 200 |
| New design (working-paper system) | ✅ Shipped | PR #1 merged to `main` |
| PDF upload + live scan | ✅ Working | `/api/upload-token` returns `{"available":true}`; private Blob store connected (`BLOB_STORE_ID`, `BLOB_WEBHOOK_PUBLIC_KEY` set) |
| Public API auth | ✅ Working | `POST /v1/verify` with a bad key returns `401 invalid_api_key`, not `503`, so `SUPABASE_SERVICE_ROLE_KEY` is set |
| Dossier signing | ✅ Configured | `PROOFMART_SIGNING_PRIVATE_KEY_B64` / `_PUBLIC_KEY_B64` set |
| Supabase auth env | ✅ Set | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` |
| Daily cron (webhook retries + data pruning) | ❌ **Failing** | `CRON_SECRET` not set, so `/api/webhooks/sweep` refuses every run |
| Signup / reset emails | ⚠️ Testing-grade | Supabase built-in sender; rate-limited to a couple of emails per hour |
| Google sign-in | ❓ Unverified | Needs Google provider in Supabase dashboard |
| Payments | ❌ Not configured | No `RAZORPAY_*` env vars; never tested with a real account |
| Legal pages |  ✅ Live, operator details filled 2026-10-25 | `/privacy` `/terms` `/refunds` `/contact` live with owner-confirmed details (Deepanshu Lathar / deepanshulathar@gmail.com / Delhi 110002), linked from footer + signup form, in sitemap — a lawyer's review still advisable (2026-10-25) |
| Real usage so far | None | `documents` and `profiles` tables have 0 rows |

---

## P0: fix before telling anyone to sign up

### 1. Set `CRON_SECRET` so the daily sweep actually runs

**What's wrong.** `vercel.json` schedules `/api/webhooks/sweep` daily at 03:00
UTC. The route refuses every request when `CRON_SECRET` is unset
(`src/app/api/webhooks/sweep/route.ts`), and it isn't set in Vercel.

**Why it matters.**
- Failed webhook deliveries are never retried, so the promised "six attempts
  over ~12h" doesn't happen.
- Retention pruning never runs: webhook delivery logs (90 days), audit events
  (180 days) and rate-limit counters (1 day) are kept forever.
- `/security` publicly states these are "pruned automatically, daily". Today
  that statement is false.

**How (you, ~5 min).**
1. Generate a value: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
2. Vercel → `proofmart-shop` → Settings → Environment Variables → add
   `CRON_SECRET` (Production + Preview, type Sensitive).
3. Redeploy production. Vercel only injects new env vars into builds made after
   they're saved.

**Verify.**
- Vercel → Settings → Cron Jobs → "Run" the sweep once and confirm it returns
  200, not 503.
- `curl -i https://proofmart.shop/api/webhooks/sweep` without the secret should
  now return 401, not 503.

### 2. Configure real email (SMTP) in Supabase

**What's wrong.** Supabase's built-in mail sender is for testing only. A live
test during the build hit `email rate limit exceeded (429)` on the second
signup.

**Why it matters.** Signup confirmation and password reset both depend on
email. With the built-in sender, the third person to sign up in an hour gets
no email and is stuck.

**How (you).**
1. Pick a provider: Resend, Amazon SES, Postmark or Zoho ZeptoMail (India
   pricing). Verify the `proofmart.shop` domain with it (SPF + DKIM DNS
   records; add DMARC too).
2. Supabase → Authentication → Emails → SMTP Settings → enter host, port, user,
   password, and sender `no-reply@proofmart.shop`.
3. Raise the auth email rate limit (Authentication → Rate Limits) to suit your
   expected volume.
4. Optional: edit the Confirm signup and Reset password templates so they say
   ProofMart, not Supabase.

**Verify.** Sign up three times in a row with real inboxes (e.g. Gmail
`+tags`). All three emails should arrive within a minute and not in spam.

### 3. Supabase redirect allowlist must include the live domain

**What's wrong.** `web/README.md` (Auth section) lists only `localhost` and
`proofmart-shop.vercel.app` in the allowlist instructions, and says
`proofmart.shop` should be added "once/if" the domain is pointed here. It now
is.

**Why it matters.** Every confirmation, reset and Google link uses a
`redirectTo` on `proofmart.shop`. Supabase silently ignores redirects that
aren't allowlisted, so users get dropped on the wrong page or the link fails.

**How (you).** Supabase → Authentication → URL Configuration:
- Site URL: `https://proofmart.shop`
- Redirect URLs: add `https://proofmart.shop/**` (keep the localhost and
  vercel.app entries for development and previews).

**Verify.** Request a password reset on https://proofmart.shop/account/reset-password.
The emailed link should land on `https://proofmart.shop/account/update-password`.

### 4. Google sign-in

**What's wrong.** "Continue with Google" appears on `/login` and `/signup`, but
it needs a Google OAuth client registered in Supabase. This can't be set from
code, and its state couldn't be confirmed from outside.

**How (you).**
1. Google Cloud Console → APIs & Services → Credentials → Create OAuth client
   ID → Web application.
2. Authorized redirect URI: `https://llfhgspktwacuvlmxigy.supabase.co/auth/v1/callback`.
   This is Supabase's callback, not the app's `/auth/callback`.
3. OAuth consent screen: app name ProofMart, support email, and links to the
   privacy policy and terms from item 5. Publish it; while it's in "Testing",
   only listed test users can sign in.
4. Supabase → Authentication → Providers → Google → paste the client ID and
   secret, enable.

**Verify.** On https://proofmart.shop/login, "Continue with Google" should
complete and land on `/documents`. Alternatively, remove the Google button if
you won't support it at launch.

### 5. Legal and contact pages

**What's wrong.** There is no privacy policy, terms of service, refund policy
or contact page. The site processes bank statements, which is financial
personal data.

**Why it matters.**
- India's Digital Personal Data Protection Act 2023 expects a clear notice of
  what personal data you process, why, how long you keep it, and how people
  can reach you or ask for deletion.
- Razorpay's merchant onboarding checks the website for terms, privacy,
  refund/cancellation and contact pages before it activates live payments.
- Google's OAuth consent screen asks for privacy and terms URLs.

**How.**
- Code: add `/privacy`, `/terms`, `/refunds` and `/contact` in the existing
  design, linked from the footer and the signup form.
- You: review the legal wording (ideally with a lawyer) and provide a real
  business name, address and contact email.

The facts to state are already written down. `/security` documents storage,
retention, deletion, sub-processors (Vercel, Supabase) and the absence of
third-party AI processing; the privacy policy should match it exactly.

**Verify.** All four pages are reachable from the footer and listed in
`/sitemap.xml`.

**Status 2026-10-17:** code done (pages, footer links, sitemap, signup-form
consent line). Remaining: you supply the real business name, address and
contact email, and review the wording (ideally with a lawyer) — the pages
carry `DRAFT` markers until then. This unblocks Razorpay's website check and
Google's OAuth consent screen once the placeholders are filled.

### 6. ProofMart shares its database with another app

**What's wrong.** The Supabase project `proofmart` also contains tables from
an unrelated bot: `posts`, `past_posts`, `chat_state`, `voice_profile`,
`settings` and `bot_api_calls` (about 3,000 rows). It also has the `vector`
extension and two functions, `match_past_posts` and `find_similar_topic`.

**Why it matters.**
- ProofMart's security story is "RLS on every table, service-role key used
  only by ProofMart server code". Any service-role key the bot holds can read
  and write every ProofMart table too: documents, API key hashes, webhook
  secrets.
- Its load, quotas and backups are mixed in with ProofMart's.
- `/security` says "two infrastructure providers handle data". A second app
  with full access to the same database undercuts that.

**How (you).** Move the bot to its own Supabase project, the cleaner fix. Or
move ProofMart to a fresh project by applying `web/supabase/migrations/` in
order, then swap the three Supabase env vars in Vercel. Then rotate the
service-role key, so only one app holds it.

**Verify.** Supabase Table Editor on the ProofMart project shows only
ProofMart's tables: `profiles`, `api_keys`, `api_usage_events`, `documents`,
`verification_signatures`, `webhook_endpoints`, `webhook_deliveries`,
`rate_limits`, `audit_events`, `subscriptions`.

---

## P1: fix before charging money

### 7. Razorpay keys and a real end-to-end payment

**What's wrong.** `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET` aren't set. `/account/billing` correctly says
"payments aren't configured", and the checkout and webhook code has never run
against a real Razorpay account.

**How (you, then a test pass).**
1. Complete Razorpay KYC and website verification. This needs the legal pages
   from item 5.
2. Start in Test Mode: set the three test-mode keys in Vercel (Preview first).
3. Razorpay Dashboard → Webhooks → add `https://proofmart.shop/api/billing/webhook`
   with the payment events the code handles (see
   `src/app/api/billing/webhook/route.ts`), using the same webhook secret.
4. Run a full test: Free account → Upgrade to Pro → pay with a Razorpay test
   card → webhook arrives → plan flips to Pro → the quota on
   `/account/billing` shows 2,000.
5. Test a failed payment and a duplicate webhook delivery too.
6. Switch to live keys only after all of the above pass.

**Verify.** The `subscriptions` table has a row for the test user with plan
`pro`, and `/account/billing` shows Pro after a refresh.

### 8. Decide the real price

**What's wrong.** `web/src/lib/billing/plans.ts` marks Free (50 calls/month)
and Pro (₹999 for 2,000 calls/month) as **placeholders not confirmed with the
business**. The home page and billing page present them as real.

**How (you decide, then code).** Edit `PLANS` in `lib/billing/plans.ts` and
`PRICING` in `lib/home-data.ts`. They must agree, and the pricing table reads
from both. Consider whether GST is included in the price shown.

### 9. Meter `/v1/inspect` and `/v1/extract`

**What's wrong.** The monthly plan quota (`lib/billing/usage.ts`) is enforced
only on `/v1/verify`. `/v1/inspect` and `/v1/extract` are only rate-limited
per minute, so they're effectively unlimited on the free plan, even though
`/account/billing` says all three count.

**How (code).** Apply the same quota check and usage recording in those two
routes, and add unit tests alongside the existing ones in `web/tests/unit/`.

**Verify.** On a Free key, the 51st call to `/v1/extract` in a month returns
`402 quota_exceeded`.

**Status 2026-10-17:** code + tests done. Both routes already called
`checkUsageQuota` + `recordUsageEvent`; added `tests/unit/quota.test.ts` which
drives the real route handlers (mocked usage store) and asserts the 51st
`/v1/extract` and `/v1/inspect` calls on a Free key return `402
quota_exceeded`. Pricing untouched — item 8 is still your call.

---

## P2: before a public launch

### 10. Replace the real bank in the sample statement

The bundled SAMPLE statement (`components/evidence-rail/sample-statement.ts`
and the rail drawing) uses **HDFC Bank's name and corporate ID number**.
Although it's labelled SAMPLE, showing a real bank's identity on a document
the product marks as FAIL invites a complaint. Swap it for a fictional bank
name and ID. The findings and arithmetic stay identical.

**Status 2026-10-17:** done. Sample bank is now **Meridian Trust Bank**
(fictional CIN `U65999MH2020PLC000000`); transaction descriptions
fictionalized (`okmtb`, `zomato@mtb`, `MTB-HOME LOAN` …); all amounts, rows,
findings and geometry unchanged; sample filename renamed to
`meridian_apr25_statement.pdf` everywhere including the e2e specs.

### 11. A security contact

`/security` says plainly that there is no security contact yet. Set up
`security@proofmart.shop` (a forwarding alias is enough), publish
`/.well-known/security.txt`, and update the "Reporting an issue" section.

**Status 2026-10-17:** code done — `public/.well-known/security.txt`
published (`Contact: mailto:security@proofmart.shop`, expires 2027-10-17)
and the `/security` reporting section points at it. Remaining: you create
the `security@proofmart.shop` alias (a forwarder is enough); until then the
page points at an unmonitored inbox.

### 12. Supabase hardening (from the Supabase advisor)

- **Leaked password protection is off.** Turn it on: Authentication →
  Policies/Passwords → "Prevent use of leaked passwords". It's a one-click
  change. [Supabase docs](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)
- The remaining advisor warnings all concern the bot's objects: `vector`
  extension in `public`, mutable `search_path` on `match_past_posts` /
  `find_similar_topic`, and bot tables with RLS but no policies. They go away
  with item 6.
- Performance advisors only flag unused indexes, which is expected with zero
  traffic. Re-check after real usage.

### 13. Production error: malformed API URL crashes instead of 404

Vercel runtime logs (14 Oct) show `Cannot find module
'./.next/server/pages/v1/verify%5C.js'` for requests to `/v1/verify\` (a
trailing backslash). Harmless, but it's a 500 where a 404 belongs. Add a
rewrite or redirect in `next.config.ts` that strips a trailing backslash on
`/v1/*`, or return a JSON 404 for unknown `/v1` paths.

**Status 2026-10-17:** done. `src/app/v1/[...path]/route.ts` returns JSON
`{"error": "not_found"}` with 404 for GET/POST/PUT/PATCH/DELETE on any
unknown `/v1/*` path (concrete routes take precedence — verified in the
build's route table). Covered by `tests/unit/v1-catchall.test.ts`.

**Follow-up 2026-10-23:** the catch-all did not cover the original
trailing-backslash case — `/v1/verify\` still 500'd on Vercel (it throws
inside Next's route matching before the catch-all is consulted; not
reproducible on a local build). Fixed at the earliest interception point:
`src/proxy.ts` now answers any `/v1/*` path containing a backslash (literal
or `%5C`) with the same JSON 404 before routing runs. Guard logic is a pure
function (`src/lib/api/backslash-guard.ts`) covered by
`tests/unit/backslash-guard.test.ts`.

### 14. Tests and CI

- There is no CI. Add a GitHub Actions workflow running `npm ci`, `tsc
  --noEmit`, `npm run lint`, `npm run test:unit` and `npm run build` on every
  pull request.
- Four existing lint errors must be fixed first, or the lint step fails:
  `account-menu.tsx` and `app/mobile-menu.tsx` (ref read during render), and
  `account/key-list.tsx` (`Date.now()` during render).
- The RLS cross-tenant test (`tests/unit/rls-cross-tenant.test.ts`) skips
  unless its test-user credentials are set (see `web/.env.example`). Run it
  once against the real project before launch; it is the executable proof of
  the security page's access-control claims.
- The live-upload e2e tests need the Supabase env. Run `npm run test:e2e`
  locally with `.env.local` filled in.

**Status 2026-10-17:** CI added (`.github/workflows/ci.yml`, PR + push to
main: `npm ci`, `tsc --noEmit`, `lint`, unit tests, `build` in `web/`), and
all 4 lint errors fixed (`account-menu.tsx`, `mobile-menu.tsx` ref
read-during-render; `key-list.tsx` `Date.now()` during render — now a client
component; plus a pre-existing `LayoutProps` type error in
`src/app/layout.tsx`). The two OCR unit tests that need the sandbox-only
Chromium path are excluded in CI per `web/README.md`. Still manual: the RLS
cross-tenant test run against the real project, and the live e2e run.

### 15. Monitoring

- Turn on Vercel Web Analytics and set an alert on runtime errors (Vercel →
  Observability), so a broken deploy is noticed before a customer reports it.
- Add an uptime check on `https://proofmart.shop/api/upload-token` (expects
  `{"available":true}`).

---

## Launch-day smoke test

Run in a private window against https://proofmart.shop:

1. Home loads; "Start a scan" opens the drop zone; drop a real PDF; findings
   appear; the page turn works.
2. Sign up with email; the confirmation email arrives; the link lands signed
   in.
3. Upload while signed in; the report is saved at `/documents`; open it;
   download the dossier; check it at `POST /v1/verify-signature`.
4. Create an API key; `curl` `/v1/verify` with a PDF; get a verdict.
5. Register a webhook (e.g. webhook.site); call `/v1/verify`; a signed delivery
   arrives.
6. Reset the password; the email arrives; set a new one; you stay signed in.
7. Billing shows the right plan and quota; a test-mode upgrade works (once
   item 7 is done).
8. Delete a saved document; it disappears and its file is gone.

## Who does what

| Item | You (dashboards, accounts, decisions) | Code (Claude can do) |
|---|---|---|
| 1 Cron secret | Add env var, redeploy | — |
| 2 SMTP | Provider, DNS, Supabase settings | — |
| 3 Redirect allowlist | Supabase setting | — |
| 4 Google sign-in | Google Cloud + Supabase | Remove the button if skipped |
| 5 Legal pages | Business details, legal review | Build the four pages and footer links |
| 6 Shared database | Move one app, rotate key | Apply migrations to a new project |
| 7 Razorpay | KYC, keys, webhook | Test plan and fixes |
| 8 Price | Decide | Update both price sources |
| 9 Metering | — | Quota on inspect/extract + tests |
| 10 Sample bank | — | Fictional bank |
| 11 Security contact | Email alias | security.txt + page copy |
| 12 Leaked passwords | One toggle | — |
| 13 `/v1` 404 | — | Rewrite + test |
| 14 CI | — | Workflow + lint fixes |
| 15 Monitoring | Turn on alerts | Uptime check config |
