-- Enable pg_net for async HTTP calls from triggers
create extension if not exists pg_net with schema extensions;

-- Schedule batch release: every Sunday at 00:15 UTC
-- Updates pending flares to published, which triggers notify_followers_on_flare_publish
select cron.schedule(
  'batch-release-flares',
  '15 0 * * 0',
  $$
    update signal_flares
    set status = 'published'
    where status = 'pending'
      and batch_release_at <= now();
  $$
);

-- Store webhook config in vault
select vault.create_secret(
  current_setting('app.webhook_secret', true),
  'webhook_secret',
  'Secret for push notification webhook'
);

select vault.create_secret(
  current_setting('app.app_url', true),
  'app_url',
  'Production app URL for webhooks'
);

-- Trigger function: call push webhook via pg_net when a notification is inserted
create or replace function send_push_on_notification_insert()
returns trigger as $$
declare
  webhook_secret text;
  app_url text;
begin
  -- Retrieve secrets from vault
  select decrypted_secret into webhook_secret
  from vault.decrypted_secrets
  where name = 'webhook_secret'
  limit 1;

  select decrypted_secret into app_url
  from vault.decrypted_secrets
  where name = 'app_url'
  limit 1;

  -- Only send push for flare and corroboration notification types
  if NEW.type in ('flare', 'corroboration') then
    perform net.http_post(
      url := app_url || '/api/webhooks/notify-push',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || webhook_secret
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'table', 'notifications',
        'record', jsonb_build_object(
          'id', NEW.id,
          'user_id', NEW.user_id,
          'title', NEW.title,
          'body', NEW.body,
          'type', NEW.type,
          'link', NEW.link
        )
      )
    );
  end if;

  return NEW;
end;
$$ language plpgsql security definer set search_path = public, vault, extensions;

create trigger trg_send_push_on_notification
  after insert on notifications
  for each row
  execute function send_push_on_notification_insert();

-- Fix search_path on all signal flare functions (security advisory)
alter function public.link_flare_to_issue() set search_path = public;
alter function public.update_corroboration_count() set search_path = public;
alter function public.signal_update_timestamp() set search_path = public;
alter function public.notify_followers_on_flare_publish() set search_path = public;
alter function public.notify_author_on_corroboration() set search_path = public;
