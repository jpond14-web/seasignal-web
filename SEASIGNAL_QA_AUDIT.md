# SeaSignal v3 — Comprehensive QA Audit

You are auditing **SeaSignal**, a full-stack Next.js + Supabase application. Your job is to systematically test every feature, every page, every flow, and every edge case. You are acting as five separate QA teams running in sequence. Do NOT skip any section. Do NOT assume anything works — verify it.

**Supabase Project ID:** `wzfqrfuspbssvjvpcdag`

For each issue found, log it with:
- **Severity:** P0 (app-breaking), P1 (feature-breaking), P2 (visual/UX), P3 (polish/nitpick)
- **Location:** file path and line number
- **Description:** what's wrong
- **Fix:** what needs to change

Fix all P0 and P1 issues immediately. Collect P2 and P3 issues into a list and fix them in a batch at the end.

---

## TEAM 1: BUILD & CODE QUALITY

### 1.1 Build Verification
- Run `npm run build` — must pass with zero errors and zero warnings
- Run `npx tsc --noEmit` — must pass with zero TypeScript errors
- Check for any `// @ts-ignore` or `// @ts-expect-error` — remove and fix properly
- Check for any `any` types that should be properly typed
- Run `npm run lint` if eslint is configured — fix all errors

### 1.2 Dependency Audit
- Run `npm audit` — flag any high/critical vulnerabilities
- Check that all imports resolve (no missing modules)
- Verify no unused dependencies in package.json
- Verify no missing dependencies (imported but not in package.json)

### 1.3 Environment & Configuration
- Verify `.env.local` has NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
- Verify SUPABASE_SERVICE_ROLE_KEY is referenced only in server-side code (API routes, server components) — NEVER in client components
- Search entire codebase for any hardcoded API keys, tokens, or secrets
- Verify middleware.ts exists and handles auth redirects properly
- Verify next.config.ts has no security issues (no open CORS, no exposed internal routes)

### 1.4 Code Patterns
- Search for `console.log` — remove all except intentional error logging
- Search for `TODO`, `FIXME`, `HACK` — resolve or document each one
- Verify all Supabase queries have proper error handling (check for `.error` on every query result)
- Verify no raw SQL injection vectors (all queries use parameterized Supabase client)
- Check that all form submissions have loading states and error feedback
- Verify all async operations have try/catch blocks
- Check for memory leaks: useEffect cleanup functions, subscription unsubscribes, event listener removal

### 1.5 Database Schema Verification
- Connect to Supabase and verify all tables exist: profiles, companies, vessels, crew_history, reviews, pay_reports, seafarer_certificates, conversations, conversation_members, messages, forums, forum_posts, forum_replies, post_votes, incident_logs, fatigue_assessments, wellness_checkins, verification_requests, verification_settings
- Verify all RLS policies are enabled on every table
- Verify the vault schema tables exist and are NOT accessible from the client (test with anon key)
- Verify these functions exist and work: get_pay_percentiles(), update_cert_status(), check_vessel_safety_signals(), get_wellness_aggregates()
- Test get_wellness_aggregates() with sample_size < 20 — must return insufficient_sample_size error

---

## TEAM 2: FEATURE FLOW TESTING

Test every user flow end-to-end. For each flow, note what happens at each step.

### 2.1 Authentication
- Sign up with email — verify profile creation
- Log out — verify redirect to login
- Log in with existing email — verify redirect to dashboard
- Try accessing /dashboard without auth — should redirect to login
- Try accessing /companies (public page) without auth — should work
- Verify magic link flow works (check Supabase auth settings)
- Verify profile is created on first login with default values

### 2.2 Profile
- View own profile — all fields display correctly
- Edit profile — change display_name, bio, department_tag, rank_range, experience_band, vessel_type_tags, home_port
- Save profile — changes persist on reload
- View another user's profile — should show public info only
- Verify "Verified Seafarer" badge only shows when is_verified = true
- Check that verification status is clearly visible

### 2.3 Company Intelligence
- Browse company directory — loads, shows company cards
- Search companies by name — returns relevant results
- Filter companies by type (shipowner, manning_agency, manager) — works correctly
- Click into a company detail page — all sections render
- Verify company pages are accessible WITHOUT authentication (public for SEO)
- Check that reviews display with batch_release_at logic (only show reviews where batch_release_at <= now())
- Check structured ratings breakdown — all 7 dimensions display
- Check pay data summary on company page
- Follow a company — verify follow persists
- Unfollow a company — verify it's removed

### 2.4 Vessel Intelligence
- Browse vessel directory — loads, shows vessel cards
- Search/filter by type, flag, company
- Click into vessel detail page — all sections render
- **CRITICAL: Check the safety signal indicator** — if check_vessel_safety_signals() returns has_pattern = true, does the warning banner appear?
- Check linked company on vessel page
- Check crew review history on vessel page

### 2.5 Reviews
- Submit a review for a company — fill all structured ratings (1-5 for each of 7 dimensions) + narrative
- Submit as anonymous — verify the review shows "Anonymous Seafarer" not your name
- Verify batch_release_at is set to next Sunday midnight UTC on submission
- Check that newly submitted review does NOT appear immediately (batch release)
- Submit a review for a vessel — same checks
- Submit a manning agency review — same checks

### 2.6 Pay Transparency
- Submit a pay report — all fields (rank, vessel_type, flag, company, monthly_base_usd, overtime, leave_pay, contract_duration, year)
- View pay explorer — filter by rank x vessel_type x flag
- Verify percentile display (P25/P50/P75) renders correctly
- Test with no data matching filters — should show appropriate empty state
- Verify get_pay_percentiles() function returns correct data structure

### 2.7 Certificate Wallet
- Add a new certificate — all fields (type, number, issuing_authority, issue_date, expiry_date)
- Verify cert status auto-calculates: green (valid), amber (expiring within 90 days), red (expired)
- **Upload a document** — verify file uploads to Supabase Storage successfully
- **Verify verification_level upgrades** from self_reported to document_uploaded on file upload
- **Check the verification level badge** on cert cards — 4-tier display (self_reported, document_uploaded, hash_verified, authority_confirmed)
- Edit a certificate — changes persist
- Delete a certificate — removed from list
- Check expiry timeline view — renders correctly with multiple certs
- Test with an expired cert — verify red status indicator

### 2.8 Maritime Professional Record
- Navigate to the Maritime Professional Record page
- Verify it aggregates: total sea time (from crew_history), certificate count and status, vessels served, rank progression
- Check with empty data — appropriate empty state
- Check with populated data — readable career summary
- Verify it's READ-ONLY — no edit buttons

### 2.9 Verification Settings
- Navigate to verification settings page
- Toggle each setting (allow_coc_verification, allow_stcw_verification, allow_medical_verification, allow_endorsement_verification, allow_specialty_verification, auto_authorize_psc)
- Verify toggles persist on reload
- Verify default state is all OFF

### 2.10 Fatigue Assessment (Phase 4)
- Navigate to fatigue assessment page
- Submit a fatigue score (1-7 Samn-Perelli scale)
- Verify optional fields work: hours_of_rest_last_24h, watch_schedule
- Submit — verify it saves to fatigue_assessments table
- Try submitting twice on the same day — should fail (UNIQUE constraint on profile_id + assessment_date)
- Check the fatigue trend chart — renders with data points
- Check with only 1 data point — doesn't crash

### 2.11 Wellness Check-in (Phase 4)
- Navigate to wellness check-in page
- Rate all 8 dimensions (sleep_quality, stress_level, shore_leave_access, connectivity_rating, safety_culture_rating, food_quality_rating, workload_rating, overall_morale) — each 1-5
- Fill optional free text
- Submit — verify saves to wellness_checkins table
- Check contract_day_number auto-calculation from active crew_history
- Check the wellness trends dashboard — spider/radar chart renders
- Verify contract strain banner appears on dashboard when appropriate thresholds are hit (180, 270, 330+ days)

### 2.12 Incident Log (Phase 5)
- Create an incident — title, description, category (safety/maintenance/wages/harassment/other)
- Attach a file — verify upload works
- Verify timestamp is immutable after creation
- Link to a vessel and/or company — verify associations
- Edit an incident — changes persist
- Verify incidents are PRIVATE — other users cannot see your incidents
- **Check the Witness Network**: after filing an incident tagged to a vessel, does the system run check_vessel_safety_signals()? If has_pattern = true, does the vessel detail page show the safety signal?

### 2.13 Contract Check (Phase 5)
- Run through the full Contract Check wizard — each category (Unpaid Wages, Unsafe Conditions, Contract Disputes, Harassment, Abandonment)
- Answer all questions in each category
- Verify the results page shows: plain-language rights summary, specific contacts, template complaint letters
- Check the template library — all templates accessible and formatted
- Verify it works without an internet connection (static content)

### 2.14 Messaging (Phase 6)
- Send a DM to another user — message appears in real-time
- Create a group conversation — name it, add members
- Send messages in a group — real-time delivery
- Check unread count badges on conversation list
- **Vessel rooms:** navigate to a vessel detail page, find the vessel room, post a message
- **Port beacon:** activate "I'm in [port]" — verify port channel creates or joins, shows other users in port, auto-expire logic (72h inactivity)
- **Crew reconnect:** check profile/crew history page — "You may have sailed with these people" shows profiles with overlapping vessel + date ranges

### 2.15 Forums (Phase 6)
- View forum category listing — all categories with post count, latest activity
- Create a new post — title, body (markdown), category, anonymous toggle
- Verify anonymous posts show "Anonymous Seafarer" with verified badge but no profile link
- Reply to a post — threaded reply appears
- Upvote a post — count increments
- Downvote a post — count decrements
- Verify one vote per user per post
- **Ask the Fleet:** find the prominent "Ask a Question" button — verify it works

### 2.16 Verification Request API (Phase 7)
- Send a POST to /api/verify with test data: requester_name, requester_email, requester_organization, requester_type, platform_token, cert_type
- Verify the request is created in verification_requests table
- Check that the request appears on the seafarer's home feed (The Pulse)
- Test auto-authorize for port_state_control when auto_authorize_psc is true
- Test approve/deny flow from the certs/verification page
- On approval: verify the response returns ONLY cert status (yes/no/expired) — zero profile data
- Test with invalid platform_token — should return appropriate error
- Test rate limiting if implemented

### 2.17 The Pulse / Home Feed (Phase 7)
- Verify all signal types appear:
  - New review on a followed company
  - Certificate expiring in 30/60/90 days
  - Crew reconnect suggestions
  - Active port channels
  - Unread messages count
  - **Fatigue trend alert** (elevated 4+ of last 7 days)
  - **Contract strain banner** (180/270/330+ day thresholds)
  - **Verification request received**
  - Wellness check-in prompt (if none in last 7 days)
- Verify signals are sorted by relevance and recency
- Verify cert alerts, verification requests, and unread messages float to top
- Check empty state for new users: "Welcome to SeaSignal..."
- Verify quick action buttons link to correct pages

### 2.18 Landing Page
- Load the public landing page (unauthenticated)
- Verify hero: "Connect. Protect. Know your worth."
- Verify subtitle mentions "No employer access — ever"
- Check feature grid — should now show 8 cards including Credential Verification and Wellness Monitor
- Check trust section
- Check "How it works" section
- Verify CTA buttons work: "Create Free Account" → signup, "Browse Companies" → public directory
- Verify company directory is accessible without auth

---

## TEAM 3: VISUAL & UX AUDIT

### 3.1 Design Consistency
- Verify consistent color palette throughout: deep navy (#0A1628) background, cyan/teal (#06B6D4) accents, white text
- Check all fonts: Inter for body, JetBrains Mono for data/numbers
- Verify no default/unstyled HTML elements anywhere
- Check all icons are consistent (same icon library throughout)
- Verify all buttons have consistent styling (primary, secondary, ghost variants)
- Check all form inputs have consistent styling
- Verify all cards/panels have consistent border radius, padding, shadow

### 3.2 Mobile Responsiveness
Test on viewport widths: 375px (iPhone SE), 390px (iPhone 14), 768px (iPad), 1024px (laptop), 1440px (desktop)

For EACH viewport:
- Navigation — sidebar collapses to bottom tab bar on mobile
- Company directory — cards stack properly
- Vessel directory — same
- Certificate wallet — cards readable, upload button accessible
- Messaging — conversation list and thread readable
- Forums — post list and thread readable
- Fatigue assessment — form fills full width on mobile
- Wellness check-in — sliders/inputs work on touch
- The Pulse/home feed — signals stack, readable
- Landing page — hero, feature grid, CTAs all work
- Tables — horizontal scroll or responsive collapse
- Charts/graphs — resize properly, labels readable

### 3.3 Loading States
- Every page load shows a loading skeleton or spinner — never a blank white page
- Every form submission shows a loading indicator on the submit button
- Every data fetch shows a loading state while pending
- After submission, show success feedback (toast notification or inline confirmation)
- On error, show clear error message — never silent failure

### 3.4 Empty States
- Company directory with no companies — appropriate message
- Vessel directory with no vessels — appropriate message
- Certificate wallet with no certs — "Add your first certificate" prompt
- Messaging with no conversations — "Start a conversation" prompt
- Forum category with no posts — "Be the first to post" prompt
- Pay explorer with no matching data — "No data available for this filter combination"
- Fatigue trends with no assessments — "Log your first fatigue assessment"
- Wellness dashboard with no check-ins — appropriate prompt
- The Pulse with no signals — welcome message for new users

### 3.5 Error States
- Submit a form with missing required fields — clear validation messages
- Network error during submission — retry option or clear error message
- Try to access a company/vessel that doesn't exist — 404 page or redirect
- Try to access another user's private data (incidents, wellness) — access denied
- Supabase rate limit — graceful handling

### 3.6 Accessibility
- All images have alt text
- All form inputs have labels
- All interactive elements are keyboard-accessible (tab through the entire app)
- Color contrast meets WCAG AA for all text
- Focus indicators visible on all focusable elements
- Screen reader compatibility for key flows (signup, navigation, review submission)

---

## TEAM 4: SECURITY AUDIT

### 4.1 Authentication & Authorization
- Verify all /dashboard/* routes require authentication
- Verify /companies and /companies/[id] are publicly accessible
- Verify /api/verify endpoint validates input and rate limits
- Verify vault schema is NOT accessible from client-side Supabase queries
- Test RLS: create two test users, verify user A cannot read user B's incidents, wellness data, fatigue assessments, or verification settings
- Verify service_role key is NEVER exposed in client-side JavaScript (search the built output)

### 4.2 Data Privacy
- Verify no profile data leaks through the /api/verify endpoint — only cert status returned
- Verify anonymous reviews truly hide the author (no profile_id in the response payload)
- Verify incident logs are only visible to the owner
- Verify fatigue assessments and wellness check-ins are only visible to the owner
- Verify get_wellness_aggregates() enforces the minimum sample size of 20
- Check that batch_release_at on reviews prevents timing-based de-anonymization

### 4.3 Input Validation
- Test XSS: submit a review with `<script>alert('xss')</script>` in the narrative — must be escaped
- Test SQL injection: submit form fields with `'; DROP TABLE profiles; --` — must be handled
- Test file upload: try uploading a non-document file type (e.g., .exe) — should be rejected
- Test oversized file upload — should be rejected with clear message
- Verify all user-generated content is sanitized before rendering

### 4.4 API Security
- /api/verify: test with missing required fields — return 400
- /api/verify: test with invalid platform_token — return 404 or appropriate error
- /api/verify: test without proper authentication/API key — return 401
- Verify no server-side secrets in client bundle (search .next/static for env vars)

---

## TEAM 5: PERFORMANCE & POLISH

### 5.1 Page Load Performance
- Measure initial load time of landing page — should be under 3 seconds
- Measure dashboard load time — should be under 2 seconds
- Check for unnecessarily large JavaScript bundles (run `npm run build` and check output sizes)
- Verify images are optimized (using next/image where applicable)
- Check for N+1 query patterns (multiple sequential Supabase calls that could be combined)

### 5.2 Real-time Performance
- Messaging: send a message and verify it appears in under 1 second on the other client
- Supabase Realtime subscriptions: verify they connect, reconnect on disconnect, and clean up on unmount

### 5.3 Typography & Content
- Check all headings for consistent hierarchy (H1 → H2 → H3, no skips)
- Check for typos, grammatical errors, or placeholder text ("Lorem ipsum", "TODO", etc.)
- Verify all dates use consistent formatting throughout
- Verify all currency values use consistent formatting (USD, two decimal places)
- Check that the Samn-Perelli scale descriptions are accurate (1=Fully alert through 7=Completely exhausted)
- Verify MLC 2006 references are accurate in the Contract Check and Know Your Rights sections

### 5.4 Final Polish
- Favicon and page title set correctly on every route
- Meta description and OG tags on landing page for social sharing
- 404 page exists and is styled consistently
- No horizontal scrolling on any page at any viewport width
- No layout shift during page loads (CLS)
- All external links open in new tab
- All internal navigation uses Next.js Link component (no full page reloads)
- Smooth page transitions — no jarring white flashes between routes

---

## DELIVERABLE

After completing all five audit teams, produce:

1. **A fix log** — every issue found, its severity, location, and the fix applied
2. **A remaining issues list** — anything you chose not to fix and why
3. **A final build verification** — `npm run build` passes clean after all fixes
4. **A commit** with message: "QA: comprehensive v3 audit — [X] issues found, [Y] fixed"

Do not skip any section. Start with Team 1 and work through to Team 5 in order.
