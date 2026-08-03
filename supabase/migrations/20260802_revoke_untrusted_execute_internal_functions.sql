-- Revoke EXECUTE on internal (trigger-only / cron-only / maintenance) functions
-- from client-facing roles (anon / authenticated / PUBLIC).
-- Applied to production 2026-08-02 via MCP migration
-- `revoke_untrusted_execute_internal_functions`.
--
-- Safety notes:
-- * Trigger firing is unaffected: PostgreSQL checks EXECUTE on trigger
--   functions at CREATE TRIGGER time, not at fire time.
-- * pg_cron jobs (cleanup_expired_messages, batch flare release) run as
--   postgres, which retains EXECUTE as owner.
--
-- KEPT anon + authenticated (called from public pre-login pages):
--   check_vessel_safety_signals(uuid,integer)
--     server-side supabase.rpc on public route /intel/vessels/[id]
--     (src/app/(main)/intel/vessels/[id]/page.tsx)
--   get_wellness_aggregates(text,text,integer,integer,date)
--     aggregate-only reader; /welfare/mental-health pages are public.
--     No caller in current src, kept out of caution for deployed builds.
-- KEPT authenticated only (client RPCs behind login):
--   get_pay_percentiles(text,vessel_type,text)
--     /pay and /intel/pay are login-gated in src/lib/supabase/middleware.ts
--   find_mutual_crew(uuid)
--     find-crew page requires a signed-in user before calling the RPC
--     (src/app/(main)/community/seafarers/find-crew/page.tsx)

-- App-facing RPCs: remove anon + PUBLIC, keep authenticated
revoke execute on function public.get_pay_percentiles(text, public.vessel_type, text) from anon, public;
revoke execute on function public.find_mutual_crew(uuid) from anon, public;

-- Cron-only maintenance
revoke execute on function public.cleanup_expired_messages() from anon, authenticated, public;

-- Trigger-only functions (SECURITY DEFINER)
revoke execute on function public.prevent_privilege_escalation() from anon, authenticated, public;
revoke execute on function public.link_flare_to_issue() from anon, authenticated, public;
revoke execute on function public.notify_author_on_corroboration() from anon, authenticated, public;
revoke execute on function public.notify_followers_on_flare_publish() from anon, authenticated, public;
revoke execute on function public.send_push_on_notification_insert() from anon, authenticated, public;
revoke execute on function public.update_corroboration_count() from anon, authenticated, public;
revoke execute on function public.update_channel_last_activity() from anon, authenticated, public;
revoke execute on function public.update_channel_member_count() from anon, authenticated, public;
revoke execute on function public.handle_guide_vote_count() from anon, authenticated, public;
revoke execute on function public.handle_story_reaction_count() from anon, authenticated, public;

-- Trigger-only functions (SECURITY INVOKER, hygiene)
revoke execute on function public.auto_join_default_channels() from anon, authenticated, public;
revoke execute on function public.check_message_rate_limit() from anon, authenticated, public;
revoke execute on function public.handle_updated_at() from anon, authenticated, public;
revoke execute on function public.update_updated_at() from anon, authenticated, public;
revoke execute on function public.update_cert_status() from anon, authenticated, public;
revoke execute on function public.signal_update_timestamp() from anon, authenticated, public;

-- DOWN (restore previous state):
-- grant execute on function public.get_pay_percentiles(text, public.vessel_type, text) to anon, public;
-- grant execute on function public.find_mutual_crew(uuid) to anon, public;
-- grant execute on function public.cleanup_expired_messages() to anon, authenticated, public;
-- grant execute on function public.prevent_privilege_escalation() to anon, authenticated, public;
-- grant execute on function public.link_flare_to_issue() to anon, authenticated, public;
-- grant execute on function public.notify_author_on_corroboration() to anon, authenticated, public;
-- grant execute on function public.notify_followers_on_flare_publish() to anon, authenticated, public;
-- grant execute on function public.send_push_on_notification_insert() to anon, authenticated, public;
-- grant execute on function public.update_corroboration_count() to anon, authenticated, public;
-- grant execute on function public.update_channel_last_activity() to anon, authenticated, public;
-- grant execute on function public.update_channel_member_count() to anon, authenticated, public;
-- grant execute on function public.handle_guide_vote_count() to anon, authenticated, public;
-- grant execute on function public.handle_story_reaction_count() to anon, authenticated, public;
-- grant execute on function public.auto_join_default_channels() to anon, authenticated, public;
-- grant execute on function public.check_message_rate_limit() to anon, authenticated, public;
-- grant execute on function public.handle_updated_at() to anon, authenticated, public;
-- grant execute on function public.update_updated_at() to anon, authenticated, public;
-- grant execute on function public.update_cert_status() to anon, authenticated, public;
-- grant execute on function public.signal_update_timestamp() to anon, authenticated, public;
