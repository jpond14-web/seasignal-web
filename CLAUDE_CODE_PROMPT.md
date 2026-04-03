# SeaSignal — Claude Code Build Prompt

You are building **SeaSignal**, a privacy-first community and professional hub for seafarers. This is a full-stack Next.js application with Supabase backend. The database schema is already deployed and live.

## What This Is

SeaSignal is a **decision engine, career system of record, and trust layer** for the maritime industry. It is NOT a social app with features bolted on — it's a system that owns the seafarer lifecycle. Every feature answers one of three questions: **Where should I work? What should I accept? What am I worth?**

Core principle: **No employer access — ever.** No enterprise tier, no API for shipping companies, no mechanism to identify crew. This is architecturally enforced, not just policy.

## Tech Stack

- **Framework:** Next.js 14+ (App Router) with TypeScript
- **Styling:** Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Supabase Project ID:** `wzfqrfuspbssvjvpcdag` (region: ca-central-1)
- **Hosting:** Vercel
- **Repo:** `seasignal-web`
## Database Schema (Already Deployed)

The following tables exist and have RLS policies configured:

### Vault Tables (Identity Isolation — service_role access only)
- `vault_verified_identities` — real names (encrypted), CoC hash, flag state, rank, department, verification status, opaque `platform_token`
- `vault_access_log` — audited access trail

### Platform Tables
- `profiles` — pseudonymous community identity (display_name, avatar, is_verified, department_tag, rank_range, experience_band, vessel_type_tags, reputation_score, subscription_tier, bio, home_port). Linked to auth.users via auth_user_id.
- `companies` — shipping companies and manning agencies (name, company_type [owner|operator|manager|manning_agency], country, avg_rating, review_count, pay_reliability_score, safety_culture_score, contract_accuracy_score, pattern_flags)
- `vessels` — first-class entities (imo_number unique, name, vessel_type, flag_state, dwt, built_year, owner/operator/manager company FKs, avg_rating, review_count)
- `crew_history` — anonymized vessel-crew connections (profile_id, vessel_id, company_id, rank_held, joined_at, left_at, is_current)
- `reviews` — deep structured reviews (profile_id, company_id, vessel_id, review_type [company|vessel|manning_agency], contract_period (fuzzy text), ratings (jsonb), narrative, is_anonymous, batch_release_at, status [pending|published|flagged|removed])
- `pay_reports` — compensation transparency (profile_id, rank, vessel_type, flag_state, company_id, monthly_base_usd, overtime_structure, leave_pay, contract_duration_months, year, is_verified)
- `certificates` — smart cert wallet (profile_id, cert_type [coc|stcw|medical|visa|endorsement|short_course|flag_state|gmdss|other], title, cert_number, issuing_authority, flag_state, issue_date, expiry_date, document_url, alert_days int[] default {90,60,30,14,7}, status auto-calculated [valid|expiring|expired], offline_cached)
- `conversations` — context-based channels (type [dm|group|vessel_channel|company_channel|port_channel], context_vessel_id, context_company_id, context_port, is_encrypted, auto_expire_hours)
- `conversation_members` — membership (conversation_id, profile_id, role [member|admin|moderator], last_read_at, is_muted)
- `messages` — E2E encrypted messaging (conversation_id, sender_id, ciphertext, plaintext, message_type [text|image|file|system], reply_to_id, expires_at). Realtime enabled.
- `incident_logs` — private evidence vault (profile_id, title, description_encrypted, category [safety|maintenance|wages|harassment|contract|other], attachments jsonb, vessel_id, company_id, incident_date)
- `forum_categories` — 10 seeded categories (general, deck, engine, companies, safety, contracts, certs, legal, life, cadets)
- `forum_posts` — threaded discussions (category_id, profile_id, title, body, parent_id for threading, is_anonymous, is_pinned, upvote_count, reply_count)
- `post_votes` — upvote/downvote (post_id, profile_id, value [-1|1])

### Database Functions
- `get_pay_percentiles(rank, vessel_type?, flag_state?)` — returns jsonb with count, p25, p50, p75, min, max
- `update_cert_status()` — trigger that auto-sets cert status based on expiry_date
- `update_updated_at()` — trigger on all tables with updated_at

### Enums
verification_status, verification_method, rank_category, department_type, company_type, vessel_type (14 types), cert_type (9 types), cert_status, review_type, review_status, conversation_type, message_type, incident_category, subscription_tier, experience_band

### Realtime
Enabled on: `messages`, `conversation_members`
## Feature Pillars (Build All)

### 1. Auth & Identity
- Supabase Auth (email + magic link)
- On signup → create profile with chosen display_name (pseudonym)
- Verification flow: upload credential docs → manual review (v1) → set is_verified on profile
- Profile page: display name, optional tags (department, rank range, experience band, vessel types), bio, "Verified Seafarer" badge

### 2. Company & Vessel Intelligence
- Company directory: browse, search, filter by type
- Company detail page: overview, structured ratings breakdown, reviews timeline, pattern flags, pay data
- Vessel directory: browse by type, flag, company
- Vessel detail page: overview, crew review history, linked company
- Review submission: structured ratings (pay_reliability, contract_accuracy, safety_culture, food_quality, shore_leave, management, equipment_condition — each 1-5) + narrative. Option for anonymous. Reviews go to pending status with batch_release_at set to next weekly batch window.
- Manning agency scoring: same review system, company_type filter

### 3. Pay Transparency
- Pay report submission form (rank, vessel type, flag, company, monthly base USD, overtime, leave pay, contract duration, year)
- Pay explorer: filter by rank × vessel type × flag → display P25/P50/P75 ranges using get_pay_percentiles function
- Contract comparison: "People like you are getting $X"

### 4. Certificate Wallet
- Add/edit/delete certificates with all fields
- Upload document (Supabase Storage, encrypted bucket)
- Dashboard: cards showing each cert with color-coded status (green=valid, amber=expiring, red=expired)
- Expiry timeline view
- Career path display: based on current certs and experience, show "next steps"
### 5. Communication
- Direct messages: 1:1 conversations between profiles
- Group chats: user-created groups
- Context channels: vessel-based, company-based, port-based (auto-expire)
- Real-time messaging using Supabase Realtime subscriptions on messages table
- For v1: plaintext messages (ciphertext column exists for future E2E). Store in plaintext column for non-encrypted channels.
- Message composition, delivery, read receipts (last_read_at on conversation_members)
- Crew reconnect: from crew_history, suggest "You sailed with these people"

### 6. Forums
- Category listing page with post counts
- Category detail: threaded posts, sorted by recent/popular
- Post creation with optional anonymous toggle
- Threaded replies (parent_id)
- Upvoting/downvoting via post_votes
- Search across posts

### 7. Incident Log (Private)
- Create/view/edit incidents (only visible to the owner)
- Attach files (Supabase Storage)
- Timestamped, immutable created_at
- Category tagging, vessel/company linking

### 8. Rights & Protection
- Static content pages: MLC 2006 guide, Know Your Rights
- "Am I Being Screwed?" guided flow: series of questions → outputs rights summary + who to contact
- Emergency contacts page: ITF, port authorities, embassies (static data, works offline)
## Design Direction

- **Dark maritime theme** — deep navy (#0B1426) base, teal (#0EA5E9) accents, signal cyan (#22D3EE) for highlights
- **Industrial, trustworthy feel** — not corporate, not playful. Think: the bridge of a ship meets a secure terminal.
- **Mobile-first** — most seafarers will use this on phones
- **Clean typography** — Inter for body, JetBrains Mono for data/numbers
- **Minimal, functional UI** — no decorative fluff. Every element earns its place.

## File Structure

```
seasignal-web/
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── signup/
│   │   ├── (main)/
│   │   │   ├── dashboard/
│   │   │   ├── companies/
│   │   │   │   └── [id]/
│   │   │   ├── vessels/
│   │   │   │   └── [id]/
│   │   │   ├── reviews/
│   │   │   │   └── new/
│   │   │   ├── pay/
│   │   │   ├── certs/
│   │   │   ├── messages/
│   │   │   │   └── [conversationId]/│   │   │   ├── forums/
│   │   │   │   ├── [categorySlug]/
│   │   │   │   └── post/[id]/
│   │   │   ├── incidents/
│   │   │   ├── rights/
│   │   │   ├── profile/
│   │   │   │   └── [id]/
│   │   │   └── settings/
│   │   ├── layout.tsx
│   │   └── page.tsx (landing)
│   ├── components/
│   │   ├── ui/ (shared primitives)
│   │   ├── auth/
│   │   ├── companies/
│   │   ├── vessels/
│   │   ├── reviews/
│   │   ├── pay/
│   │   ├── certs/
│   │   ├── messages/
│   │   ├── forums/
│   │   ├── incidents/
│   │   └── layout/ (nav, sidebar, header)
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   ├── middleware.ts
│   │   │   └── types.ts (generated from DB)
│   │   ├── hooks/
│   │   └── utils/│   └── types/
├── public/
├── supabase/
│   └── migrations/ (reference only — already applied)
├── tailwind.config.ts
├── next.config.ts
├── tsconfig.json
└── package.json
```

## Build Order

Start with scaffolding and auth, then build each pillar:

1. **Project setup** — Next.js, Tailwind, Supabase client, env vars, layout shell with nav
2. **Auth** — signup, login, magic link, profile creation on first login
3. **Profile** — view/edit profile, verification status display
4. **Company & Vessel directory** — browse, search, detail pages
5. **Review system** — submission form, display on company/vessel pages
6. **Pay transparency** — submission, explorer with percentile display
7. **Certificate wallet** — CRUD, file upload, dashboard with status indicators
8. **Messaging** — conversation list, message thread, real-time, create DM/group
9. **Forums** — category list, post list, threaded replies, voting
10. **Incident log** — private CRUD with file attachments
11. **Rights pages** — static content + "Am I Being Screwed?" flow
12. **Landing page** — public-facing, explains the platform, drives signups

## Environment Variables Needed

A `.env.local` file already exists in the project root with the URL and anon key set. The service_role key needs to be added from the Supabase Dashboard > Settings > API.

```
NEXT_PUBLIC_SUPABASE_URL=https://wzfqrfuspbssvjvpcdag.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind6ZnFyZnVzcGJzc3ZqdnBjZGFnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUxOTYxNTAsImV4cCI6MjA5MDc3MjE1MH0.1GEQObBrs-mSI6jjLuL_M-QnBhERytzzCSdnyu_BvZA
SUPABASE_SERVICE_ROLE_KEY=[get from Supabase Dashboard > Settings > API — server-side only]
```
## Critical Rules

1. **Never expose vault tables to the client.** Vault access is service_role only, via server-side API routes.
2. **All RLS policies are already set.** Use the Supabase client with user auth tokens — RLS handles access control.
3. **Reviews use batch release.** When creating a review, set batch_release_at to the next Sunday at midnight UTC. The SELECT policy only shows reviews where batch_release_at <= now().
4. **Cert status is auto-calculated by trigger.** Don't manually set status — just set expiry_date and the trigger handles it.
5. **Messages table has both ciphertext and plaintext columns.** For v1, use plaintext for all messages. Ciphertext column is reserved for future E2E encryption.
6. **Realtime is enabled on messages and conversation_members.** Use Supabase Realtime subscriptions for live chat.
7. **Mobile-first responsive design.** Every page must work well on a phone screen.
8. **No employer-facing features.** No analytics dashboards for companies, no bulk data export, no API access for shipping companies.

## Begin

Start by initializing the Next.js project with TypeScript and Tailwind, set up the Supabase client, and build the layout shell with navigation. Then work through the build order above.