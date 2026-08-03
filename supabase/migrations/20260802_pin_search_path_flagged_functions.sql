-- Pin search_path on all 15 functions flagged by the Supabase
-- function_search_path_mutable advisor.
-- Applied to production 2026-08-02 via MCP migration
-- `pin_search_path_flagged_functions`.
--
-- Bodies reference only public-schema tables (unqualified) and
-- schema-qualified auth.uid(), so `search_path = public` is safe.
-- Functions that already carried a search_path setting
-- (link_flare_to_issue, notify_author_on_corroboration,
--  notify_followers_on_flare_publish, update_corroboration_count,
--  send_push_on_notification_insert [public, vault, extensions],
--  signal_update_timestamp) are intentionally untouched.

alter function public.update_cert_status() set search_path = public;
alter function public.update_updated_at() set search_path = public;
alter function public.get_pay_percentiles(text, public.vessel_type, text) set search_path = public;
alter function public.find_mutual_crew(uuid) set search_path = public;
alter function public.check_message_rate_limit() set search_path = public;
alter function public.auto_join_default_channels() set search_path = public;
alter function public.cleanup_expired_messages() set search_path = public;
alter function public.prevent_privilege_escalation() set search_path = public;
alter function public.update_channel_member_count() set search_path = public;
alter function public.update_channel_last_activity() set search_path = public;
alter function public.handle_story_reaction_count() set search_path = public;
alter function public.handle_updated_at() set search_path = public;
alter function public.handle_guide_vote_count() set search_path = public;
alter function public.get_wellness_aggregates(text, text, integer, integer, date) set search_path = public;
alter function public.check_vessel_safety_signals(uuid, integer) set search_path = public;

-- DOWN (restore mutable search_path):
-- alter function public.<name>(<args>) reset search_path;
-- (repeat for each of the 15 functions above)
