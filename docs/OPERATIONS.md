# SeaSignal Operations Map

Short technical reference for whoever maintains SeaSignal. Non-technical
workflows live in `docs/ADMIN_GUIDE.md`; handover context in
`HANDOVER.md`.

## Stack

- **Framework:** Next.js 16.2.2 (App Router, React 19), TypeScript,
  Tailwind CSS 4. PWA (service worker, offline page).
- **Backend:** Supabase (Postgres 17, Auth, RLS, Realtime). Browser and
  server clients in `src/lib/supabase/`; generated DB types in
  `src/lib/supabase/types.ts`. Prisma client is present for tooling
  (`prisma/`, `DATABASE_URL`).
- **Email:** Resend (sender domain temporarily gabier.com).
- **Push:** Web Push (VAPID) via `web-push`, delivered by
  `/api/webhooks/notify-push`, invoked from a Postgres `pg_net` trigger
  on `notifications` inserts.
- **Errors:** Sentry — server (`sentry.server.config.ts`), edge
  (`sentry.edge.config.ts`), browser (`instrumentation-client.ts`).
- **Tests:** Vitest (133 unit tests, `npm run test:run`) + Playwright
  e2e (`npm run test:e2e`, not in CI).

## Environments & secrets

All variable **names** and where each is set: see `ENVIRONMENT.md`
(names only; placeholder shapes in `.env.example`). Real values live in
Vercel project settings (production) and `.env.local` (local, not
committed). Never commit real values.

## Deploy flow

1. Push/merge to `main` on GitHub.
2. GitHub Actions CI (`.github/workflows/ci.yml`) runs typecheck +
   vitest. Lint and e2e are intentionally excluded (10 known eslint
   errors; e2e needs a live env).
3. Vercel's GitHub integration builds and deploys every push
   (production from `main`, previews for PRs).

**URLs:** production is public at https://seasignal-web.vercel.app.
The `*-julian-ponds-projects.vercel.app` and `git-main` aliases are
behind Vercel Deployment Protection (SSO) — expected, leave as is. No
custom domain yet.

## Database

- **Supabase project:** `seasignal-platform`, ref
  `wzfqrfuspbssvjvpcdag`, region `ca-central-1`, Postgres 17.
- **Migrations:** `supabase/migrations/` — notably
  `20260411_signal_flares.sql` (whole accountability schema: enums,
  `signal_flares`, `signal_issues`, `signal_flare_corroborations`,
  `signal_articles`, `signal_outreach_log`, RLS, triggers),
  `20260411_flare_notifications.sql`,
  `20260412_pg_net_cron_push.sql` (pg_cron + pg_net + vault secrets),
  and the `20260802_*` hardening trio (execute revokes, search_path
  pins, RLS initplan rewrites).
- **Seed:** `supabase/seed/signal_articles_seed.sql` (editorial
  articles — currently the only way content reaches `/intel/signals`).
- **Admin model:** `profiles.is_admin` boolean. Enforced in
  `src/lib/supabase/middleware.ts` (server redirect for `/admin/*`),
  `src/app/(main)/admin/layout.tsx` (client gate), and RLS policies
  (`... WHERE auth_user_id = auth.uid() AND is_admin = true`).

## Scheduled jobs (two schedulers — keep in sync)

| Job | Schedule (UTC) | Where | What |
| --- | --- | --- | --- |
| Batch-release flares | Sun 00:15 | Vercel Cron → `GET /api/cron/batch-release` (vercel.json), auth `Bearer CRON_SECRET` | Sets pending flares with `batch_release_at <= now()` to `published`, row by row (fires DB triggers) |
| `batch-release-flares` | Sun 00:15 | pg_cron (in DB) | Same UPDATE done directly in SQL — redundant with the above, idempotent |
| `cleanup-expired-messages` | hourly | pg_cron | Deletes expired disappearing messages |

DB triggers do the rest on publish: `link_flare_to_issue` (creates/
updates `signal_issues`, auto-advances monitoring → emerging at
thresholds), `notify_followers_on_flare_publish`, and
`send_push_on_notification_insert` (pg_net POST to
`/api/webhooks/notify-push` with `WEBHOOK_SECRET` from Vault).

Inspect jobs: `select * from cron.job;` — run history:
`cron.job_run_details`.

## Where problems surface

1. **Sentry** — runtime errors (server, edge, browser).
2. **Vercel dashboard** — build failures, function logs, cron
   execution history.
3. **Supabase dashboard** — Postgres logs, auth logs, advisors
   (`get_advisors`), pg_cron run details.
4. **GitHub Actions** — CI failures on push/PR.

## Known debt

See HANDOVER.md → "What is NOT done": no admin UI for
`signal_articles` or `signal_outreach_log`, no form for issue
response/resolution text, manual review publishing, 10 eslint errors,
no custom domain, no mobile app.
