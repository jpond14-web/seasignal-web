# SeaSignal Admin Guide (for Morgane)

A non-developer walkthrough of the admin and advocacy workflows. Every
section names the page you use and what each button does. All paths are
relative to the live site: **https://seasignal-web.vercel.app**

You need an account with admin access (see HANDOVER.md → "Onboarding
Morgane"). Once granted, an **Admin Panel** appears at `/admin` with a
sidebar: Dashboard, Users, Companies, Vessels, Forums, Reviews,
Incidents, Verification, Reports, Signal Flares, Advocacy, Channels,
Audit Log.

---

## 1. The weekly rhythm (the one thing to internalise)

Seafarers submit **Signal Flares** — reports of problems on board
(wage theft, unsafe water, forced overtime, harassment, etc.). To
protect anonymity, flares are **not published immediately**: each new
flare is queued as *pending* and scheduled for the **next Sunday**.

**Every Sunday at 00:15 UTC, automatically and with no action from
anyone**, all pending flares whose release date has passed are
published in one batch. When that happens, the system also
automatically:

- makes the flare publicly visible on `/intel/flares` and on the
  company's page;
- files it under an **Issue** (one issue per company + problem
  category), creating the issue if it doesn't exist;
- updates the issue's counts (reports, corroborations, vessels);
- promotes the issue from "Monitoring" to "Emerging" once it has 5+
  reports, or 3+ corroborations, or reports across 3+ vessels;
- notifies users who follow that company (in-app and push
  notification).

Reviews (company/vessel reviews) are also stamped for Sunday, but they
do **not** auto-publish — you approve each one by hand (section 4).

**Your weekly moderation window is therefore: before Sunday 00:15 UTC,
look at the pending flares and flag or delete anything that shouldn't
go out.** Anything you leave as "pending" and past its release date
goes live Sunday.

## 2. Signal Flare moderation — `/admin/flares`

The queue of the 100 most recent flares, newest first. Each card shows
the category, severity (concern / violation / critical), status badge,
whether it is anonymous, the corroboration count, company and vessel,
and the description.

Buttons on each flare:

- **Publish** (only on pending flares) — releases it immediately
  instead of waiting for Sunday. Publishing triggers all the automatic
  steps from section 1 (issue linking, notifications).
- **Flag / Unflag** — takes a flare out of (or back into) public view
  while you check it. Use Flag when something looks defamatory,
  identifying, or fake and you need time to decide.
- **Delete** (then **Confirm**) — permanently removes the flare. There
  is no undo. Prefer Flag unless you are certain.

Statuses: **pending** (queued for Sunday), **published** (public),
**flagged** (hidden, under review), **removed** (hidden, kept in the
database).

### Corroborations

Other seafarers can press "I experienced this too" on a published
flare and optionally add a statement — these are **corroborations**.
You see the count on each flare here and on the public flare pages
(`/intel/flares`). Corroborations are what turn one complaint into a
pattern: they raise the issue's totals and can auto-promote an issue
to "Emerging". There is no separate corroboration moderation queue; if
a corroboration statement is abusive, ask Julian to remove it.

## 3. The Advocacy pipeline — `/admin/advocacy`

This is the investigation dashboard built for your workflow. It tracks
**Issues** — one per company + category — from first reports through
investigation, company outreach, and resolution.

The top row shows counts per stage; click a stage to filter. The
stages, and the buttons that move an issue forward:

| Stage | Meaning | Your button(s) |
| --- | --- | --- |
| **Monitoring** | Reports exist but below thresholds. Not public. | Mark Emerging |
| **Emerging** | Pattern forming (auto-promoted at 5+ reports, 3+ corroborations, or 3+ vessels). Public from here on. | Investigate |
| **Investigating** | You are actively looking into it. | Contact Company |
| **Company Contacted** | You've reached out. Clicking this stamps the contact date and starts a visible **14-day response countdown** ("Awaiting response (N days remaining)" → "No response in N days"). | Publish Report / Mark Resolved / Mark Unresolved |
| **Published** | You've gone public with findings. | Mark Resolved / Mark Unresolved |
| **Resolved** | Company fixed it (resolution date stamped automatically). | Mark Recurring (if it happens again — flips back to Investigating with a red "Recurring" badge) |
| **Unresolved** | Company failed to fix it. | Re-investigate / Mark Resolved |

Each issue card shows report/corroboration/vessel counts, "since" date,
company link, and a timeline (contacted date, response received,
response text, resolution).

**Known gaps (see HANDOVER.md):** the dashboard can *display* a
company's response text and a resolution description, but there is no
box to type them in yet, and the detailed outreach log (who you
emailed, when, what they said) has no screen at all. Until those are
built, keep your outreach records in your own notes/email and ask
Julian to attach response text to an issue when needed.

Note "company contacted" here is a status you set — the app does not
send the email for you. Outreach itself happens from your own inbox.

## 4. Review moderation — `/admin/reviews`

Anonymous company/vessel reviews from seafarers. Each pending review
needs a manual decision: **approve** (makes it public) or **reject**,
and you can delete outright. Nothing auto-publishes reviews, so check
this queue weekly — pending reviews are invisible to everyone until
you act.

## 5. Reported content — `/admin/reports`

Users can report messages and other content. Each report shows the
reported item and reporter. You can **dismiss** the report, **resolve**
it (which can include deleting the offending message), or strip a
user's verified badge. Handled reports are stamped with your name as
reviewer.

## 6. Verification queue — `/admin/verify`

Seafarers ask to be "verified" (adds a badge and unlocks trust
features). The queue lists unverified profiles; you mark them verified
after whatever check you and Julian agree on. Note: the dashboard's
"Pending Verifications" number counts *all* unverified users, not just
those who asked — don't panic at the size.

## 7. Publishing content

- **"The Signal" articles** (`/intel/signals` — investigations, guides,
  resolution spotlights): **no admin screen yet.** Drafting and
  publishing currently goes through Julian (SQL). Send him the final
  text; he publishes it.
- **Community guides** (`/intel/guides`): any signed-in user (including
  you) can write and publish a guide directly from that page — use the
  form at the top. Admins can also delete guides there.
- **Forums** (`/admin/forums`): create/edit/delete forum categories.
- **Companies and vessels** (`/admin/companies`, `/admin/vessels`):
  add or edit the company/vessel records that flares, reviews, and
  issues attach to. Use "New" to add one, "Edit" to fix names/details.

## 8. Everything else in the sidebar

- **Dashboard** (`/admin`) — stats (users, signups, messages, reviews,
  pending queues), search trends, recent activity. Start here daily.
- **Users** (`/admin/users`) — search users, toggle **Verify**, toggle
  **Make Admin / Remove Admin**. Be careful: admin gives full power,
  including over other admins.
- **Incidents** (`/admin/incidents`) — read-only view of incident logs
  seafarers keep (safety/welfare events). Useful investigation context.
- **Channels** (`/admin/channels`) — group messaging channels: edit,
  remove members, delete channels/messages.
- **Audit Log** (`/admin/audit`) — a record of admin actions. If
  something changed and nobody knows why, look here.

## 9. What happens automatically (so you don't wonder)

- **Sundays 00:15 UTC** — pending flares auto-publish (section 1).
  This runs from two schedulers (belt and braces); the result is the
  same either way.
- **Hourly** — expired disappearing messages are cleaned up.
- **On publish/corroboration** — followers get in-app + push
  notifications; no one has to send anything.
- **Issue creation/promotion** — issues appear and advance to
  "Emerging" on their own; your judgement takes over from
  "Investigating" onward.
