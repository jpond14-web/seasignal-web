-- Notify company followers when a Signal Flare is published
-- notifications.user_id = profiles.auth_user_id (auth UUID)
-- company_follows.profile_id = profiles.id (profile UUID)

create or replace function notify_followers_on_flare_publish()
returns trigger as $$
declare
  follower record;
  flare_title text;
  company_name text;
begin
  -- Only fire when status changes to 'published' and batch_release_at has passed
  if NEW.status = 'published' and (OLD.status is distinct from 'published') then
    -- Get company name
    select name into company_name from companies where id = NEW.company_id;

    flare_title := coalesce(NEW.title, 'New report');

    -- Insert notification for each follower of this company
    insert into notifications (user_id, title, body, type, link)
    select
      p.auth_user_id,
      'Signal Flare: ' || coalesce(company_name, 'Unknown Company'),
      flare_title,
      'flare',
      '/intel/flares'
    from company_follows cf
    join profiles p on p.id = cf.profile_id
    where cf.company_id = NEW.company_id
      -- Don't notify the flare author
      and cf.profile_id != NEW.profile_id;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_followers_on_flare_publish
  after update on signal_flares
  for each row
  execute function notify_followers_on_flare_publish();

-- Also notify on direct insert with published status (admin publish)
create trigger trg_notify_followers_on_flare_insert_published
  after insert on signal_flares
  for each row
  when (NEW.status = 'published')
  execute function notify_followers_on_flare_publish();


-- Notify flare author when someone corroborates their report
create or replace function notify_author_on_corroboration()
returns trigger as $$
declare
  flare_row record;
  author_auth_id uuid;
  corroborator_count int;
begin
  -- Get the flare and its author
  select sf.*, p.auth_user_id
  into flare_row
  from signal_flares sf
  join profiles p on p.id = sf.profile_id
  where sf.id = NEW.flare_id;

  if flare_row is null then
    return NEW;
  end if;

  author_auth_id := flare_row.auth_user_id;

  -- Don't notify if the author is corroborating their own flare
  if NEW.profile_id = flare_row.profile_id then
    return NEW;
  end if;

  -- Get updated count
  select count(*) into corroborator_count
  from signal_flare_corroborations
  where flare_id = NEW.flare_id;

  insert into notifications (user_id, title, body, type, link)
  values (
    author_auth_id,
    corroborator_count || ' seafarer' || case when corroborator_count != 1 then 's' else '' end || ' corroborated your report',
    coalesce(flare_row.title, 'Your Signal Flare'),
    'corroboration',
    '/intel/flares'
  );

  return NEW;
end;
$$ language plpgsql security definer;

create trigger trg_notify_author_on_corroboration
  after insert on signal_flare_corroborations
  for each row
  execute function notify_author_on_corroboration();
