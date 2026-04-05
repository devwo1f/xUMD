-- xUMD campus map + event discovery foundation
-- Adds campus locations, live event data, RSVPs, reports, storage, RLS,
-- and helper functions used by the interactive Mapbox discovery system.

create extension if not exists pgcrypto;
create extension if not exists pg_cron;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'event_category_enum') then
    create type public.event_category_enum as enum (
      'academic',
      'social',
      'sports',
      'club',
      'career',
      'arts',
      'food',
      'workshop',
      'party',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status_enum') then
    create type public.event_status_enum as enum (
      'upcoming',
      'live',
      'completed',
      'cancelled'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'campus_building_type_enum') then
    create type public.campus_building_type_enum as enum (
      'academic',
      'dining',
      'recreation',
      'library',
      'admin',
      'residential',
      'outdoor',
      'arena',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'event_rsvp_status_enum') then
    create type public.event_rsvp_status_enum as enum ('going', 'interested');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_report_reason_enum') then
    create type public.event_report_reason_enum as enum (
      'spam',
      'inappropriate',
      'misleading',
      'harassment',
      'other'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'moderation_status') then
    create type public.moderation_status as enum ('pending', 'approved', 'rejected');
  end if;
end
$$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.compute_event_status(
  p_starts_at timestamptz,
  p_ends_at timestamptz,
  p_current_status public.event_status_enum default null
)
returns public.event_status_enum
language plpgsql
stable
as $$
begin
  if p_current_status = 'cancelled' then
    return 'cancelled';
  end if;

  if p_ends_at <= now() then
    return 'completed';
  end if;

  if p_starts_at <= now() and p_ends_at > now() then
    return 'live';
  end if;

  return 'upcoming';
end;
$$;

create table if not exists public.campus_locations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  short_name text not null,
  latitude double precision not null,
  longitude double precision not null,
  building_type public.campus_building_type_enum not null,
  floor_count int,
  address text,
  created_at timestamptz not null default now()
);

create index if not exists campus_locations_type_idx
  on public.campus_locations (building_type);

create index if not exists campus_locations_lat_lng_idx
  on public.campus_locations (latitude, longitude);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 150),
  description text not null default '' check (char_length(description) <= 2000),
  organizer_id uuid not null references public.users(id) on delete cascade,
  organizer_name text not null default '',
  category public.event_category_enum not null,
  location_name text not null,
  location_id uuid references public.campus_locations(id) on delete set null,
  latitude double precision not null,
  longitude double precision not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  status public.event_status_enum not null default 'upcoming',
  cover_image_url text,
  tags text[] not null default '{}',
  attendee_count int not null default 0 check (attendee_count >= 0),
  interested_count int not null default 0 check (interested_count >= 0),
  max_capacity int check (max_capacity is null or max_capacity > 0),
  moderation_status public.moderation_status not null default 'approved',
  flagged_categories jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_time_order check (ends_at > starts_at)
);

create index if not exists events_starts_at_idx
  on public.events (starts_at);

create index if not exists events_status_idx
  on public.events (status);

create index if not exists events_category_idx
  on public.events (category);

create index if not exists events_lat_lng_idx
  on public.events (latitude, longitude);

create index if not exists events_organizer_idx
  on public.events (organizer_id);

create index if not exists events_tags_gin_idx
  on public.events using gin (tags);

create index if not exists events_status_moderation_starts_idx
  on public.events (status, moderation_status, starts_at);

drop trigger if exists events_set_updated_at on public.events;
create trigger events_set_updated_at
before update on public.events
for each row
execute function public.set_updated_at();

create or replace function public.set_event_runtime_status()
returns trigger
language plpgsql
as $$
begin
  new.status := public.compute_event_status(new.starts_at, new.ends_at, new.status);
  return new;
end;
$$;

drop trigger if exists events_set_runtime_status on public.events;
create trigger events_set_runtime_status
before insert or update of starts_at, ends_at, status on public.events
for each row
execute function public.set_event_runtime_status();

create or replace function public.refresh_event_statuses()
returns void
language plpgsql
as $$
begin
  update public.events
  set status = public.compute_event_status(starts_at, ends_at, status)
  where status <> 'cancelled'
    and moderation_status <> 'rejected';
end;
$$;

create table if not exists public.event_rsvps (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  status public.event_rsvp_status_enum not null,
  created_at timestamptz not null default now(),
  unique (event_id, user_id)
);

create index if not exists event_rsvps_event_idx
  on public.event_rsvps (event_id);

create index if not exists event_rsvps_user_idx
  on public.event_rsvps (user_id);

create table if not exists public.event_reports (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events(id) on delete cascade,
  reporter_id uuid not null references public.users(id) on delete cascade,
  reason public.event_report_reason_enum not null,
  details text check (char_length(coalesce(details, '')) <= 500),
  created_at timestamptz not null default now(),
  unique (event_id, reporter_id)
);

create index if not exists event_reports_event_idx
  on public.event_reports (event_id);

create index if not exists event_reports_reporter_idx
  on public.event_reports (reporter_id);

create or replace function public.sync_event_rsvp_counters(p_event_id uuid)
returns void
language plpgsql
as $$
begin
  update public.events
  set
    attendee_count = (
      select count(*)
      from public.event_rsvps
      where event_id = p_event_id and status = 'going'
    ),
    interested_count = (
      select count(*)
      from public.event_rsvps
      where event_id = p_event_id and status = 'interested'
    )
  where id = p_event_id;
end;
$$;

create or replace function public.handle_event_rsvp_counter_update()
returns trigger
language plpgsql
as $$
begin
  perform public.sync_event_rsvp_counters(coalesce(new.event_id, old.event_id));
  return coalesce(new, old);
end;
$$;

drop trigger if exists event_rsvps_sync_counts on public.event_rsvps;
create trigger event_rsvps_sync_counts
after insert or update or delete on public.event_rsvps
for each row
execute function public.handle_event_rsvp_counter_update();

create or replace function public.handle_event_report_flagging()
returns trigger
language plpgsql
as $$
declare
  v_report_count int;
begin
  select count(*)
  into v_report_count
  from public.event_reports
  where event_id = new.event_id;

  if v_report_count >= 3 then
    update public.events
    set
      moderation_status = 'pending',
      flagged_categories = jsonb_build_object(
        'report_count', v_report_count,
        'last_reason', new.reason,
        'last_reported_at', now()
      ),
      updated_at = now()
    where id = new.event_id;
  end if;

  return new;
end;
$$;

drop trigger if exists event_reports_auto_flag on public.event_reports;
create trigger event_reports_auto_flag
after insert on public.event_reports
for each row
execute function public.handle_event_report_flagging();

create or replace function public.rsvp_event_atomic(
  p_event_id uuid,
  p_user_id uuid,
  p_status public.event_rsvp_status_enum
)
returns public.event_rsvps
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.event_rsvps;
begin
  insert into public.event_rsvps (event_id, user_id, status)
  values (p_event_id, p_user_id, p_status)
  on conflict (event_id, user_id)
  do update set status = excluded.status
  returning * into v_row;

  perform public.sync_event_rsvp_counters(p_event_id);
  return v_row;
end;
$$;

create or replace function public.clear_event_rsvp_atomic(
  p_event_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.event_rsvps
  where event_id = p_event_id and user_id = p_user_id;

  perform public.sync_event_rsvp_counters(p_event_id);
end;
$$;

insert into public.campus_locations (
  name,
  short_name,
  latitude,
  longitude,
  building_type,
  floor_count,
  address
)
values
  ('McKeldin Library', 'MCK', 38.9860, -76.9447, 'library', 7, '7649 Library Ln, College Park, MD 20742'),
  ('Stamp Student Union', 'STAMP', 38.9882, -76.9452, 'admin', 4, '3972 Campus Dr, College Park, MD 20742'),
  ('Brendan Iribe Center', 'IRB', 38.9890, -76.9365, 'academic', 5, '8125 Paint Branch Dr, College Park, MD 20742'),
  ('Kim Engineering Building', 'KEB', 38.9910, -76.9395, 'academic', 6, 'A. James Clark Hall, College Park, MD 20742'),
  ('Edward St. John Learning and Teaching Center', 'ESJ', 38.9895, -76.9382, 'academic', 5, '4131 Campus Dr, College Park, MD 20742'),
  ('The Clarice Smith Center', 'CLAR', 38.9915, -76.9460, 'other', 4, '8270 Alumni Dr, College Park, MD 20742'),
  ('XFINITY Center', 'XFIN', 38.9940, -76.9430, 'arena', 4, '8500 Paint Branch Dr, College Park, MD 20742'),
  ('Eppley Recreation Center', 'ERC', 38.9935, -76.9415, 'recreation', 4, '4128 Valley Dr, College Park, MD 20742'),
  ('Hornbake Library', 'HBK', 38.9880, -76.9468, 'library', 7, '4130 Campus Dr, College Park, MD 20742'),
  ('Van Munching Hall', 'VMH', 38.9825, -76.9440, 'academic', 4, '7699 Mowatt Ln, College Park, MD 20742'),
  ('Cole Field House', 'CFH', 38.9930, -76.9445, 'arena', 3, '4131 Field House Dr, College Park, MD 20742'),
  ('Maryland Stadium', 'STADIUM', 38.9907, -76.9488, 'arena', 5, '90 Stadium Dr, College Park, MD 20742'),
  ('Chemistry Building', 'CHEM', 38.9870, -76.9425, 'academic', 5, '8051 Regents Dr, College Park, MD 20742'),
  ('Physics Building', 'PHY', 38.9878, -76.9415, 'academic', 4, '4150 Campus Dr, College Park, MD 20742'),
  ('South Campus Commons', 'SCC', 38.9810, -76.9430, 'residential', 4, '1 Lehigh Rd, College Park, MD 20742'),
  ('The Diner', 'DINER', 38.9935, -76.9385, 'dining', 2, '4250 Farm Dr, College Park, MD 20742'),
  ('Yahentamitsi Dining Hall', 'YAH', 38.9928, -76.9395, 'dining', 2, '4250 Farm Dr, College Park, MD 20742'),
  ('McKeldin Mall', 'MALL', 38.9858, -76.9447, 'outdoor', null, 'McKeldin Mall, College Park, MD 20742'),
  ('Memorial Chapel', 'CHAPEL', 38.9869, -76.9478, 'other', 3, '3972 Campus Dr, College Park, MD 20742'),
  ('Tawes Hall', 'TAW', 38.9847, -76.9454, 'academic', 4, '7751 Alumni Dr, College Park, MD 20742'),
  ('Tydings Hall', 'TYD', 38.9843, -76.9437, 'academic', 5, '7349 Preinkert Dr, College Park, MD 20742'),
  ('Marie Mount Hall', 'MMH', 38.9850, -76.9418, 'academic', 4, '7814 Regents Dr, College Park, MD 20742'),
  ('Jimenez Hall', 'JMP', 38.9879, -76.9397, 'academic', 5, '7842 Regents Dr, College Park, MD 20742'),
  ('LeFrak Hall', 'LEF', 38.9888, -76.9411, 'academic', 5, '7251 Preinkert Dr, College Park, MD 20742'),
  ('H.J. Patterson Hall', 'HJP', 38.9872, -76.9400, 'academic', 4, '4065 Campus Dr, College Park, MD 20742'),
  ('Plant Sciences Building', 'PLS', 38.9876, -76.9391, 'academic', 4, '4122 Field House Dr, College Park, MD 20742'),
  ('Animal Sciences Building', 'ANSC', 38.9918, -76.9388, 'academic', 3, '4291 Farm Dr, College Park, MD 20742'),
  ('Reckord Armory', 'ARM', 38.9859, -76.9433, 'other', 2, '4490 Rossborough Ln, College Park, MD 20742'),
  ('Regents Drive Garage', 'RDG', 38.9897, -76.9407, 'admin', 6, '8056 Regents Dr, College Park, MD 20742'),
  ('Mowatt Lane Garage', 'MLG', 38.9819, -76.9456, 'admin', 6, '8300 Baltimore Ave, College Park, MD 20740'),
  ('A.V. Williams Building', 'AVW', 38.9906, -76.9361, 'academic', 7, '8223 Paint Branch Dr, College Park, MD 20742'),
  ('Glenn L. Martin Hall', 'GLM', 38.9903, -76.9380, 'academic', 4, '4298 Campus Dr, College Park, MD 20742'),
  ('Thurgood Marshall Hall', 'TMH', 38.9866, -76.9427, 'academic', 6, '7805 Regents Dr, College Park, MD 20742'),
  ('Knight Hall', 'KNH', 38.9855, -76.9471, 'academic', 4, '7765 Alumni Dr, College Park, MD 20742'),
  ('Samuel Riggs IV Alumni Center', 'ALUMNI', 38.9870, -76.9504, 'admin', 3, '7801 Alumni Dr, College Park, MD 20742'),
  ('School of Public Health Building', 'SPH', 38.9930, -76.9440, 'academic', 5, '4200 Valley Dr, College Park, MD 20742'),
  ('University Health Center', 'UHC', 38.9828, -76.9460, 'admin', 4, '140 Campus Dr, College Park, MD 20742'),
  ('Oakland Hall', 'OAK', 38.9832, -76.9437, 'residential', 6, '3900 Stadium Dr, College Park, MD 20742'),
  ('La Plata Hall', 'LPA', 38.9818, -76.9466, 'residential', 6, '4121 Farm Dr, College Park, MD 20742'),
  ('Cambridge Community Center', 'CAM', 38.9849, -76.9488, 'residential', 2, '7000 Auburn Ave, College Park, MD 20740'),
  ('Terrapin Trail Garage', 'TTG', 38.9936, -76.9404, 'admin', 6, '4250 Terrapin Trail, College Park, MD 20742'),
  ('Testudo Statue', 'TESTUDO', 38.9867, -76.9438, 'outdoor', null, 'McKeldin Mall, College Park, MD 20742'),
  ('Hornbake Plaza', 'PLAZA', 38.9887, -76.9449, 'outdoor', null, 'Hornbake Plaza, College Park, MD 20742'),
  ('Chapel Field', 'FIELD', 38.9874, -76.9486, 'outdoor', null, 'Memorial Chapel Lawn, College Park, MD 20742'),
  ('Kirwan Hall', 'KIR', 38.9881, -76.9404, 'academic', 5, '7901 Regents Dr, College Park, MD 20742'),
  ('Skelton Place', 'SKEL', 38.9894, -76.9442, 'outdoor', null, 'Skelton Place, College Park, MD 20742'),
  ('M Square Shuttle Stop', 'MSQ', 38.9920, -76.9374, 'other', null, 'M Square Research Park, College Park, MD 20740')
on conflict (name) do update
set
  short_name = excluded.short_name,
  latitude = excluded.latitude,
  longitude = excluded.longitude,
  building_type = excluded.building_type,
  floor_count = excluded.floor_count,
  address = excluded.address;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-covers',
  'event-covers',
  false,
  15728640,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

alter table public.campus_locations enable row level security;
alter table public.events enable row level security;
alter table public.event_rsvps enable row level security;
alter table public.event_reports enable row level security;

drop policy if exists "campus_locations_select_authenticated" on public.campus_locations;
create policy "campus_locations_select_authenticated"
on public.campus_locations
for select
to authenticated
using (true);

drop policy if exists "events_select_public_or_own" on public.events;
create policy "events_select_public_or_own"
on public.events
for select
to authenticated
using (moderation_status = 'approved' or organizer_id = auth.uid());

drop policy if exists "events_insert_self" on public.events;
create policy "events_insert_self"
on public.events
for insert
to authenticated
with check (organizer_id = auth.uid());

drop policy if exists "events_update_self" on public.events;
create policy "events_update_self"
on public.events
for update
to authenticated
using (organizer_id = auth.uid())
with check (organizer_id = auth.uid());

drop policy if exists "events_delete_self" on public.events;
create policy "events_delete_self"
on public.events
for delete
to authenticated
using (organizer_id = auth.uid());

drop policy if exists "event_rsvps_select_authenticated" on public.event_rsvps;
create policy "event_rsvps_select_authenticated"
on public.event_rsvps
for select
to authenticated
using (true);

drop policy if exists "event_rsvps_insert_self" on public.event_rsvps;
create policy "event_rsvps_insert_self"
on public.event_rsvps
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "event_rsvps_update_self" on public.event_rsvps;
create policy "event_rsvps_update_self"
on public.event_rsvps
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists "event_rsvps_delete_self" on public.event_rsvps;
create policy "event_rsvps_delete_self"
on public.event_rsvps
for delete
to authenticated
using (user_id = auth.uid());

drop policy if exists "event_reports_insert_self" on public.event_reports;
create policy "event_reports_insert_self"
on public.event_reports
for insert
to authenticated
with check (reporter_id = auth.uid());

drop policy if exists "event_covers_select_authenticated" on storage.objects;
create policy "event_covers_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'event-covers');

drop policy if exists "event_covers_insert_own_folder" on storage.objects;
create policy "event_covers_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "event_covers_update_own_folder" on storage.objects;
create policy "event_covers_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'event-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "event_covers_delete_own_folder" on storage.objects;
create policy "event_covers_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-covers'
  and auth.uid()::text = (storage.foldername(name))[1]
);

do $$
begin
  begin
    alter publication supabase_realtime add table public.events;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.event_rsvps;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end
$$;

do $$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.schedule(
        'xumd-refresh-event-statuses',
        '* * * * *',
        $$select public.refresh_event_statuses();$$
      );
    exception
      when others then
        raise notice 'Skipping pg_cron schedule for xUMD event statuses: %', sqlerrm;
    end;
  end if;
end
$$;
