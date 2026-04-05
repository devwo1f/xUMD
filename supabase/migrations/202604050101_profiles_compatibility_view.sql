create or replace view public.profiles as
select
  id,
  email,
  username,
  display_name,
  avatar_url,
  major,
  graduation_year,
  bio,
  notification_prefs,
  push_token,
  created_at,
  updated_at
from public.users;

create or replace function public.profiles_view_upsert()
returns trigger
language plpgsql
security definer
set search_path = public
as $profiles_view_upsert$
begin
  insert into public.users (
    id,
    email,
    username,
    display_name,
    avatar_url,
    major,
    graduation_year,
    bio,
    notification_prefs,
    push_token
  )
  values (
    new.id,
    new.email,
    lower(coalesce(new.username, public.default_username_for_auth_user(new.email, new.id))),
    coalesce(new.display_name, ''),
    new.avatar_url,
    new.major,
    new.graduation_year,
    new.bio,
    coalesce(new.notification_prefs, jsonb_build_object(
      'push_enabled', true,
      'email_enabled', true,
      'club_updates', true,
      'event_reminders', true,
      'feed_activity', true
    )),
    new.push_token
  )
  on conflict (id) do update
  set
    email = coalesce(excluded.email, public.users.email),
    username = coalesce(excluded.username, public.users.username),
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    major = coalesce(excluded.major, public.users.major),
    graduation_year = coalesce(excluded.graduation_year, public.users.graduation_year),
    bio = coalesce(excluded.bio, public.users.bio),
    notification_prefs = coalesce(excluded.notification_prefs, public.users.notification_prefs),
    push_token = coalesce(excluded.push_token, public.users.push_token),
    updated_at = now();

  return new;
end;
$profiles_view_upsert$;

drop trigger if exists profiles_view_upsert_trigger on public.profiles;
create trigger profiles_view_upsert_trigger
instead of insert or update on public.profiles
for each row
execute function public.profiles_view_upsert();
