do $$
begin
  alter type public.event_category_enum add value if not exists 'tech';
  alter type public.event_category_enum add value if not exists 'talks';
exception
  when duplicate_object then
    null;
end
$$;

alter table public.events
  add column if not exists location_details text,
  add column if not exists organizer_ids uuid[] not null default '{}',
  add column if not exists co_host_club_ids uuid[] not null default '{}',
  add column if not exists attachments jsonb not null default '[]'::jsonb,
  add column if not exists waitlist_enabled boolean not null default false,
  add column if not exists require_approval boolean not null default false,
  add column if not exists is_free boolean not null default true,
  add column if not exists ticket_price numeric(10, 2),
  add column if not exists visibility text not null default 'public',
  add column if not exists contact_info text,
  add column if not exists series_root_id uuid,
  add column if not exists recurrence_frequency text,
  add column if not exists recurs_until timestamptz;

update public.events
set
  organizer_ids = case
    when organizer_id is null then '{}'
    else array[organizer_id]
  end,
  visibility = coalesce(nullif(visibility, ''), 'public'),
  is_free = coalesce(is_free, true)
where coalesce(array_length(organizer_ids, 1), 0) = 0
   or visibility is null
   or is_free is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_visibility_check'
  ) then
    alter table public.events
      add constraint events_visibility_check
      check (visibility in ('public', 'club_members_only'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_recurrence_frequency_check'
  ) then
    alter table public.events
      add constraint events_recurrence_frequency_check
      check (
        recurrence_frequency is null
        or recurrence_frequency in ('weekly', 'biweekly', 'monthly')
      );
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'events_ticket_price_check'
  ) then
    alter table public.events
      add constraint events_ticket_price_check
      check (ticket_price is null or ticket_price >= 0);
  end if;
end
$$;

create index if not exists events_visibility_idx
  on public.events (visibility, starts_at);

create index if not exists events_series_root_idx
  on public.events (series_root_id);

create index if not exists events_organizer_ids_gin_idx
  on public.events using gin (organizer_ids);

create index if not exists events_co_host_club_ids_gin_idx
  on public.events using gin (co_host_club_ids);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'event-media',
  'event-media',
  false,
  31457280,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'video/mp4',
    'video/quicktime',
    'application/pdf'
  ]
)
on conflict (id) do nothing;

drop policy if exists "events_select_public_or_own" on public.events;
drop policy if exists "events_select_public_or_visible" on public.events;
create policy "events_select_public_or_visible"
on public.events
for select
to authenticated
using (
  organizer_id = auth.uid()
  or auth.uid() = any(coalesce(organizer_ids, array[]::uuid[]))
  or (
    moderation_status = 'approved'
    and (
      visibility = 'public'
      or (
        visibility = 'club_members_only'
        and club_id is not null
        and exists (
          select 1
          from public.club_members membership
          where membership.club_id = public.events.club_id
            and membership.user_id = auth.uid()
            and membership.status = 'approved'
        )
      )
    )
  )
);

drop policy if exists "events_update_self" on public.events;
create policy "events_update_self"
on public.events
for update
to authenticated
using (
  organizer_id = auth.uid()
  or auth.uid() = any(coalesce(organizer_ids, array[]::uuid[]))
)
with check (
  organizer_id = auth.uid()
  or auth.uid() = any(coalesce(organizer_ids, array[]::uuid[]))
);

drop policy if exists "events_delete_self" on public.events;
create policy "events_delete_self"
on public.events
for delete
to authenticated
using (
  organizer_id = auth.uid()
  or auth.uid() = any(coalesce(organizer_ids, array[]::uuid[]))
);

drop policy if exists "event_media_select_authenticated" on storage.objects;
create policy "event_media_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'event-media');

drop policy if exists "event_media_insert_own_folder" on storage.objects;
create policy "event_media_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'event-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "event_media_update_own_folder" on storage.objects;
create policy "event_media_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'event-media'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'event-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "event_media_delete_own_folder" on storage.objects;
create policy "event_media_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'event-media'
  and auth.uid()::text = (storage.foldername(name))[1]
);
