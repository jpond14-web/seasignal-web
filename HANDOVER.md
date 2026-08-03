# SeaSignal — Handover (Julian → Morgane)

_Last updated: 2 August 2026_

This document is the starting point for Morgane taking over day-to-day
operation of SeaSignal (moderation, investigations, company outreach,
content). Technical maintenance stays with Julian. Two companion guides
live in `docs/`:

- **[docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)** — Morgane's non-developer
  walkthrough of every admin workflow (what to click, what happens).
- **[docs/OPERATIONS.md](docs/OPERATIONS.md)** — the short technical map
  for whoever maintains the code and infrastructure.

---

## What SeaSignal is

SeaSignal is a crew-side platform for the world's 1.9M seafarers — "the
decision engine for seafarers" (see the pitch deck, served live at
`/pitch-deck.html`). It is three things:

1. **Decision engine** — anonymous company reviews, pay transparency,
   vessel ratings, manning-agency profiles, contract checking.
2. **Trust layer** — verified credentials, certificate tracking with
   expiry alerts, sea-time logging, a third-party verification API.
3. **Protection network** — fatigue/wellness tracking, MLC rights
   reference, incident logging, mental-health resources, community
   forums, messaging.

The accountability core — Morgane's territory — is the **Signal Flare
pipeline**:

```
Seafarer submits a flare (anonymous by default)
        │  status: pending, scheduled for the next Sunday batch
        ▼
Weekly batch release (Sundays 00:15 UTC, automatic)
        │  flare becomes public; followers are notified
        ▼
Flares auto-aggregate into an Issue (one per company + category)
        │  corroborations from other seafarers raise the signal
        ▼
Advocacy pipeline: monitoring → emerging → investigating
        → company contacted → published / resolved / unresolved
```

Core rule from the pitch: **no employer access — ever**. It is enforced
in the database (row-level security), not just policy.

## Current state (2 Aug 2026)

- **Live and public:** https://seasignal-web.vercel.app — this is the
  only public URL. The other Vercel aliases
  (`seasignal-web-julian-ponds-projects.vercel.app` and the `git-main`
  alias) are behind Vercel Deployment Protection (SSO) and will bounce
  you to a Vercel login — do not share those.
- **No custom domain yet.** Buying one (e.g. seasignal.app / .com) is a
  Julian decision; until then the vercel.app URL is the product URL.
- **Tests green:** 133/133 unit tests pass (verified 2 Aug 2026); CI
  runs typecheck + tests on every push to `main` and every PR.
- **Database hardened (Aug 2026):** function execute revokes,
  `search_path` pins, and RLS performance/initplan rewrites landed as
  the three `20260802_*` migrations.
- **Deploys working:** push to `main` → GitHub → Vercel auto-deploys.
- **Error tracking:** Sentry wired for server, edge, and browser.

## What is NOT done

- **Custom domain** — not purchased (Julian decision).
- **Mobile app** — none. The site is a PWA (installable from the
  browser, works offline for some pages) but there is no App Store /
  Play Store presence.
- **Editorial publishing UI ("The Signal" articles)** — the
  `signal_articles` table (investigations, guides, resolution
  spotlights, with draft → review → published statuses) powers the
  public `/intel/signals` page, but **there is no admin screen to write
  or publish them**. Today's articles come from a seed SQL file
  (`supabase/seed/signal_articles_seed.sql`). Publishing a new
  investigation write-up currently requires Julian running SQL. This is
  the biggest gap in Morgane's workflow.
- **Company outreach log UI** — the `signal_outreach_log` table (a
  paper-trail of initial contact / follow-ups / company responses /
  resolution verification per issue) exists with admin-only access, but
  **no screen reads or writes it**. Likewise, the Advocacy dashboard
  displays a company's response text and resolution description but has
  **no form to enter them** — the stage buttons only set dates/stages.
  Recording the actual response text currently requires Julian running
  SQL.
- **Review batch release** — crew reviews are stamped with a
  next-Sunday `batch_release_at` on submission, but unlike flares
  nothing auto-publishes them. Reviews sit in "pending" until an admin
  approves each one in `/admin/reviews`. Treat review moderation as a
  fully manual weekly chore.
- **ESLint debt** — 10 lint errors outstanding; lint is intentionally
  excluded from CI until clean.
- Minor: the admin dashboard's "Channels" stat card currently shows the
  conversations count, and "Pending Verifications" counts every
  unverified profile (so the number looks alarmingly large — it is not
  a queue of requests).

## Who runs what

| Area | Owner |
| --- | --- |
| Infrastructure, deploys, secrets, env vars, Vercel, Supabase, Sentry, domain purchase | **Julian** |
| Database changes (SQL, migrations), incl. publishing articles and logging outreach until UIs exist | **Julian** (on Morgane's request) |
| Flare moderation, corroboration review | **Morgane** |
| Advocacy pipeline: investigations, company outreach, resolutions | **Morgane** |
| Review / report / forum / channel moderation, user verification | **Morgane** |
| Content (articles, guides), comms, advocacy strategy | **Morgane** |

## Onboarding Morgane — exact steps

1. **Morgane creates her own account** (nobody creates it for her):
   go to https://seasignal-web.vercel.app/signup and sign up with her
   own email + password. Completing the short onboarding is fine to
   skip/minimise.
2. **Julian grants admin.** Admin is a single boolean column
   (`profiles.is_admin`) checked by the server middleware, the admin
   layout, and the database RLS policies. Two equivalent options:
   - **UI (preferred):** Julian logs in with his admin account →
     https://seasignal-web.vercel.app/admin/users → search Morgane's
     display name/email → click **Make Admin**.
   - **SQL:** in the Supabase SQL editor (project `seasignal-platform`,
     `wzfqrfuspbssvjvpcdag`):

     ```sql
     UPDATE public.profiles
     SET is_admin = true
     WHERE auth_user_id = (
       SELECT id FROM auth.users WHERE email = 'MORGANES-EMAIL-HERE'
     );
     ```
3. **Morgane reloads the site** (or logs out and back in) and opens
   https://seasignal-web.vercel.app/admin — the Admin Panel sidebar
   should appear.
4. **Morgane reads [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)** — it
   walks through every screen she now has access to.
5. Suggested first session together: review whatever is sitting in
   **Signal Flares** and **Reviews** queues before the next Sunday
   batch, and walk one issue through the Advocacy pipeline end-to-end.
