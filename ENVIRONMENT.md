# Environment Variables

Every environment variable referenced by the codebase. Names only — see
`.env.example` for placeholder shapes. `NEXT_PUBLIC_*` values are embedded in
the client bundle at build time; everything else is server-only.

| Variable | Purpose | Where set |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection string used by Prisma | Both (Vercel prod + local) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL for the browser client | Both |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public API key | Both |
| `NEXT_PUBLIC_APP_URL` | Canonical site URL (sitemap, share links) | Both |
| `NEXT_PUBLIC_VAPID_PUBLIC_KEY` | Web Push VAPID public key | Both |
| `VAPID_PRIVATE_KEY` | Web Push VAPID private key (server-only) | Both |
| `RESEND_API_KEY` | Resend transactional email API key | Both |
| `CRON_SECRET` | Authorizes `/api/cron/*` endpoints | Vercel prod (local only when testing cron routes) |
| `WEBHOOK_SECRET` | Verifies `/api/webhooks/notify-push` calls | Vercel prod (local only when testing webhooks) |
| `SENTRY_DSN` | Sentry error reporting, server + edge runtimes | Vercel prod |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry error reporting, browser | Vercel prod |
| `SENTRY_AUTH_TOKEN` | Sourcemap upload at build time | Vercel prod (build-time only) |

## Runtime-provided (never set manually)

| Variable | Purpose | Where set |
| --- | --- | --- |
| `NODE_ENV` | `development` / `production` / `test` | Set by Next.js / tooling |
| `NEXT_RUNTIME` | `nodejs` / `edge` runtime discriminator | Set by Next.js |
| `CI` | Signals a CI environment to tests | Set by CI providers |
