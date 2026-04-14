alter table public.events
  add column if not exists created_by uuid references public.users(id) on delete set null,
  add column if not exists image_url text;

create index if not exists events_created_by_idx on public.events (created_by);

update public.events
set
  created_by = coalesce(created_by, organizer_id),
  image_url = coalesce(image_url, cover_image_url)
where created_by is null
   or image_url is null;

create or replace function public.sync_event_legacy_aliases()
returns trigger
language plpgsql
as $$
begin
  if new.created_by is null then
    new.created_by := new.organizer_id;
  end if;

  if new.organizer_id is null then
    new.organizer_id := new.created_by;
  end if;

  if new.image_url is null or new.image_url = '' then
    new.image_url := new.cover_image_url;
  end if;

  if new.cover_image_url is null or new.cover_image_url = '' then
    new.cover_image_url := new.image_url;
  end if;

  return new;
end;
$$;

drop trigger if exists events_sync_legacy_aliases on public.events;
create trigger events_sync_legacy_aliases
before insert or update on public.events
for each row
execute function public.sync_event_legacy_aliases();

alter table public.posts
  add column if not exists author_id uuid references public.users(id) on delete set null,
  add column if not exists content text not null default '',
  add column if not exists is_pinned boolean not null default false;

create index if not exists posts_author_id_idx on public.posts (author_id, created_at desc);

update public.posts
set
  author_id = coalesce(author_id, user_id),
  content = case
    when coalesce(content, '') = '' then content_text
    else content
  end
where author_id is null
   or coalesce(content, '') = '';

create or replace function public.sync_post_legacy_aliases()
returns trigger
language plpgsql
as $$
begin
  if new.author_id is null then
    new.author_id := new.user_id;
  end if;

  if new.user_id is null then
    new.user_id := new.author_id;
  end if;

  if coalesce(new.content, '') = '' then
    new.content := new.content_text;
  end if;

  if coalesce(new.content_text, '') = '' then
    new.content_text := new.content;
  end if;

  return new;
end;
$$;

drop trigger if exists posts_sync_legacy_aliases on public.posts;
create trigger posts_sync_legacy_aliases
before insert or update on public.posts
for each row
execute function public.sync_post_legacy_aliases();

alter table public.comments
  add column if not exists author_id uuid references public.users(id) on delete set null,
  add column if not exists content text,
  add column if not exists like_count int not null default 0,
  add column if not exists updated_at timestamptz not null default now();

create index if not exists comments_author_id_idx on public.comments (author_id, created_at desc);

update public.comments
set
  author_id = coalesce(author_id, user_id),
  content = case
    when coalesce(content, '') = '' then content_text
    else content
  end,
  updated_at = coalesce(updated_at, created_at, now())
where author_id is null
   or coalesce(content, '') = ''
   or updated_at is null;

create or replace function public.sync_comment_legacy_aliases()
returns trigger
language plpgsql
as $$
begin
  if new.author_id is null then
    new.author_id := new.user_id;
  end if;

  if new.user_id is null then
    new.user_id := new.author_id;
  end if;

  if coalesce(new.content, '') = '' then
    new.content := new.content_text;
  end if;

  if coalesce(new.content_text, '') = '' then
    new.content_text := new.content;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists comments_sync_legacy_aliases on public.comments;
create trigger comments_sync_legacy_aliases
before insert or update on public.comments
for each row
execute function public.sync_comment_legacy_aliases();
