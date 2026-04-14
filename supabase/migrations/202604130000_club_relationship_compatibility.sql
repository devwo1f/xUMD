create extension if not exists pgcrypto;

alter table public.events
  add column if not exists club_id uuid references public.clubs(id) on delete set null,
  add column if not exists is_featured boolean not null default false;

create index if not exists events_club_id_idx on public.events (club_id);
create index if not exists events_is_featured_idx on public.events (is_featured);

alter table public.posts
  add column if not exists club_id uuid references public.clubs(id) on delete set null;

create index if not exists posts_club_id_idx on public.posts (club_id);

create table if not exists public.club_members (
  club_id uuid not null references public.clubs(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  role text not null default 'member'
    check (role in ('member', 'officer', 'president', 'admin')),
  status text not null default 'approved'
    check (status in ('pending', 'approved', 'rejected')),
  joined_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (club_id, user_id)
);

create index if not exists club_members_user_id_idx on public.club_members (user_id);
create index if not exists club_members_role_idx on public.club_members (club_id, role);
create index if not exists club_members_status_idx on public.club_members (club_id, status);

create table if not exists public.club_media (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs(id) on delete cascade,
  url text not null,
  type text not null default 'photo'
    check (type in ('photo', 'video')),
  caption text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists club_media_club_created_idx on public.club_media (club_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists club_members_set_updated_at on public.club_members;
create trigger club_members_set_updated_at
before update on public.club_members
for each row
execute function public.set_updated_at();

create or replace function public.recalculate_club_member_count(target_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clubs
  set member_count = (
    select count(*)
    from public.club_members
    where club_id = target_club_id
      and status = 'approved'
  ),
  updated_at = now()
  where id = target_club_id;
end;
$$;

create or replace function public.increment_member_count(target_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clubs
  set member_count = member_count + 1,
      updated_at = now()
  where id = target_club_id;
end;
$$;

create or replace function public.decrement_member_count(target_club_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.clubs
  set member_count = greatest(0, member_count - 1),
      updated_at = now()
  where id = target_club_id;
end;
$$;

create or replace function public.sync_club_member_count()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  affected_club_id uuid;
begin
  affected_club_id := coalesce(new.club_id, old.club_id);
  perform public.recalculate_club_member_count(affected_club_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists club_members_sync_count on public.club_members;
create trigger club_members_sync_count
after insert or update or delete on public.club_members
for each row
execute function public.sync_club_member_count();

alter table public.club_members enable row level security;
alter table public.club_media enable row level security;

drop policy if exists "club_members_select_authenticated" on public.club_members;
create policy "club_members_select_authenticated"
on public.club_members
for select
to authenticated
using (true);

drop policy if exists "club_members_insert_self_or_service" on public.club_members;
create policy "club_members_insert_self_or_service"
on public.club_members
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "club_members_update_authenticated" on public.club_members;
create policy "club_members_update_authenticated"
on public.club_members
for update
to authenticated
using (true)
with check (true);

drop policy if exists "club_members_delete_authenticated" on public.club_members;
create policy "club_members_delete_authenticated"
on public.club_members
for delete
to authenticated
using (true);

drop policy if exists "club_media_select_authenticated" on public.club_media;
create policy "club_media_select_authenticated"
on public.club_media
for select
to authenticated
using (true);

drop policy if exists "club_media_insert_authenticated" on public.club_media;
create policy "club_media_insert_authenticated"
on public.club_media
for insert
to authenticated
with check (true);

drop policy if exists "club_media_update_authenticated" on public.club_media;
create policy "club_media_update_authenticated"
on public.club_media
for update
to authenticated
using (true)
with check (true);

drop policy if exists "club_media_delete_authenticated" on public.club_media;
create policy "club_media_delete_authenticated"
on public.club_media
for delete
to authenticated
using (true);
