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
