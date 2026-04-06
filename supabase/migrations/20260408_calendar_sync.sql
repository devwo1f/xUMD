begin;

create table if not exists public.calendar_personal_blocks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  location_name text not null default 'Personal time',
  location_id uuid null references public.campus_locations(id) on delete set null,
  latitude double precision null,
  longitude double precision null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  recurrence text not null default 'never' check (recurrence in ('never', 'daily', 'weekly')),
  recurrence_days integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint calendar_personal_blocks_time_check check (ends_at > starts_at)
);

create index if not exists calendar_personal_blocks_user_id_idx
  on public.calendar_personal_blocks (user_id, starts_at);

create table if not exists public.calendar_sync_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  token text not null unique default replace(gen_random_uuid()::text, '-', ''),
  include_courses boolean not null default true,
  include_events_going boolean not null default true,
  include_events_interested boolean not null default false,
  include_club_meetings boolean not null default true,
  include_personal_blocks boolean not null default true,
  last_synced_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists calendar_sync_preferences_token_idx
  on public.calendar_sync_preferences (token);

drop trigger if exists calendar_personal_blocks_set_updated_at on public.calendar_personal_blocks;
create trigger calendar_personal_blocks_set_updated_at
before update on public.calendar_personal_blocks
for each row
execute function public.set_updated_at();

drop trigger if exists calendar_sync_preferences_set_updated_at on public.calendar_sync_preferences;
create trigger calendar_sync_preferences_set_updated_at
before update on public.calendar_sync_preferences
for each row
execute function public.set_updated_at();

alter table public.calendar_personal_blocks enable row level security;
alter table public.calendar_sync_preferences enable row level security;

drop policy if exists "calendar personal blocks select own" on public.calendar_personal_blocks;
create policy "calendar personal blocks select own"
on public.calendar_personal_blocks
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "calendar personal blocks insert own" on public.calendar_personal_blocks;
create policy "calendar personal blocks insert own"
on public.calendar_personal_blocks
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "calendar personal blocks update own" on public.calendar_personal_blocks;
create policy "calendar personal blocks update own"
on public.calendar_personal_blocks
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "calendar personal blocks delete own" on public.calendar_personal_blocks;
create policy "calendar personal blocks delete own"
on public.calendar_personal_blocks
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "calendar sync preferences select own" on public.calendar_sync_preferences;
create policy "calendar sync preferences select own"
on public.calendar_sync_preferences
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "calendar sync preferences insert own" on public.calendar_sync_preferences;
create policy "calendar sync preferences insert own"
on public.calendar_sync_preferences
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "calendar sync preferences update own" on public.calendar_sync_preferences;
create policy "calendar sync preferences update own"
on public.calendar_sync_preferences
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "calendar sync preferences delete own" on public.calendar_sync_preferences;
create policy "calendar sync preferences delete own"
on public.calendar_sync_preferences
for delete
to authenticated
using (auth.uid() = user_id);

commit;
