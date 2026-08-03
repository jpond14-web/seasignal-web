-- Fix Supabase auth_rls_initplan performance advisor (94 policies):
-- wrap bare auth.uid() / auth.jwt() calls in RLS policy qual / with_check
-- as scalar subselects `(select auth.uid())` so the planner evaluates them
-- once per query (InitPlan) instead of once per row.
--
-- Applied to production 2026-08-02 via MCP migrations
-- `rls_initplan_wrap_auth_calls_test_batch` (3 certificates policies),
-- `rls_initplan_wrap_auth_calls_batch_1` (50) and
-- `rls_initplan_wrap_auth_calls_batch_2` (remaining 41).
--
-- The rewrite is purely mechanical: each policy's own expression is read from
-- pg_policies and only bare (not already-subselect-wrapped) auth.uid()/auth.jwt()
-- occurrences are replaced. Policy logic, command, and roles are unchanged.
-- The block is idempotent: after rewriting, the pretty-printed form is
-- `( SELECT auth.uid() AS uid)`, which the lookbehind excludes on re-run.
--
-- All 94 flagged policies were rewritten; none skipped. Affected tables:
-- admin_audit_log(2), certificates(4), company_follows(4),
-- conversation_members(5), conversations(2), crew_history(3),
-- fatigue_assessments(1), forum_posts(2), guide_votes(3), guides(3),
-- incident_logs(4), industry_alerts(3), job_applications(4), job_listings(4),
-- mentors(3), mentorship_requests(3), messages(5), notifications(3),
-- pay_reports(1), post_votes(1), profiles(2), push_subscriptions(3),
-- reported_content(3), reviews(2), sea_stories(3), sea_time_records(4),
-- search_analytics(1), signal_articles(1), signal_flare_corroborations(1),
-- signal_flares(2), signal_issues(1), signal_outreach_log(1),
-- story_reactions(2), user_blocks(1), user_settings(3),
-- verification_requests(2), verification_settings(1), wellness_checkins(1).

do $$
declare
  r record;
  new_qual text;
  new_wc text;
  stmt text;
  cnt int := 0;
begin
  for r in
    select schemaname, tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual ~ '(?<!SELECT )auth\.(uid|jwt)\(\)' or with_check ~ '(?<!SELECT )auth\.(uid|jwt)\(\)')
    order by tablename, policyname
  loop
    new_qual := regexp_replace(regexp_replace(r.qual, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'g'), '(?<!SELECT )auth\.jwt\(\)', '(select auth.jwt())', 'g');
    new_wc := regexp_replace(regexp_replace(r.with_check, '(?<!SELECT )auth\.uid\(\)', '(select auth.uid())', 'g'), '(?<!SELECT )auth\.jwt\(\)', '(select auth.jwt())', 'g');
    stmt := format('ALTER POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    if r.qual is not null then
      stmt := stmt || format(' USING (%s)', new_qual);
    end if;
    if r.with_check is not null then
      stmt := stmt || format(' WITH CHECK (%s)', new_wc);
    end if;
    execute stmt;
    cnt := cnt + 1;
  end loop;
  raise notice 'rewrote % policies', cnt;
end $$;

-- DOWN (unwrap back to bare calls):
-- Run the same block with the replacement reversed, i.e. replace
--   '\( SELECT auth\.uid\(\) AS uid\)'  -> 'auth.uid()'
--   '\( SELECT auth\.jwt\(\) AS jwt\)'  -> 'auth.jwt()'
-- against pg_policies quals/with_checks. Caveat: this would also unwrap any
-- policy that was already subselect-wrapped before this migration; as of
-- 2026-08-02 none of the other 24 public-schema policies contained wrapped
-- auth calls, so the reverse is exact.
