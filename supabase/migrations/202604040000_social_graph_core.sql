-- xUMD social graph + personalized feed foundation
-- This migration follows the requested "users/posts/follows" model while
-- keeping a compatibility view for the app's existing `profiles` reads.

create extension if not exists vector;
create extension if not exists pgcrypto;

create type public.post_media_type as enum ('none', 'image', 'video');
create type public.moderation_status as enum ('pending', 'approved', 'rejected');
create type public.interaction_target_type as enum ('post', 'user');
create type public.interaction_action_type as enum (
  'like',
  'comment',
  'share',
  'view',
  'profile_visit',
  'follow',
  'follow_from_recommendation'
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  username text not null unique,
  display_name text not null default '',
  bio text,
  avatar_url text,
  major text,
  graduation_year int,
  clubs text[] not null default '{}',
  courses text[] not null default '{}',
  notification_prefs jsonb not null default jsonb_build_object(
    'push_enabled', true,
    'email_enabled', true,
    'club_updates', true,
    'event_reminders', true,
    'feed_activity', true
  ),
  push_token text,
  follower_count int not null default 0 check (follower_count >= 0),
  following_count int not null default 0 check (following_count >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists users_major_idx on public.users (major);
create index if not exists users_graduation_year_idx on public.users (graduation_year);
create index if not exists users_created_at_idx on public.users (created_at desc);
create index if not exists users_clubs_gin_idx on public.users using gin (clubs);
create index if not exists users_courses_gin_idx on public.users using gin (courses);

create trigger users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

create or replace function public.default_username_for_auth_user(
  p_email text,
  p_user_id uuid
)
returns text
language sql
immutable
as $$
  select lower(
    regexp_replace(split_part(coalesce(p_email, 'terp'), '@', 1), '[^a-zA-Z0-9_]', '', 'g')
    || '_'
    || left(replace(p_user_id::text, '-', ''), 6)
  );
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text;
  v_display_name text;
begin
  v_display_name := coalesce(new.raw_user_meta_data ->> 'display_name', split_part(coalesce(new.email, 'Terp'), '@', 1));
  v_username := coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    public.default_username_for_auth_user(new.email, new.id)
  );

  insert into public.users (
    id,
    email,
    username,
    display_name,
    avatar_url,
    major,
    graduation_year
  )
  values (
    new.id,
    new.email,
    lower(v_username),
    v_display_name,
    new.raw_user_meta_data ->> 'avatar_url',
    new.raw_user_meta_data ->> 'major',
    nullif(new.raw_user_meta_data ->> 'graduation_year', '')::int
  )
  on conflict (id) do update
  set
    email = excluded.email,
    display_name = coalesce(excluded.display_name, public.users.display_name),
    avatar_url = coalesce(excluded.avatar_url, public.users.avatar_url),
    major = coalesce(excluded.major, public.users.major),
    graduation_year = coalesce(excluded.graduation_year, public.users.graduation_year),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  content_text text not null default '',
  media_urls text[] not null default '{}',
  media_type public.post_media_type not null default 'none',
  hashtags text[] not null default '{}',
  like_count int not null default 0 check (like_count >= 0),
  comment_count int not null default 0 check (comment_count >= 0),
  share_count int not null default 0 check (share_count >= 0),
  moderation_status public.moderation_status not null default 'approved',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists posts_user_created_idx on public.posts (user_id, created_at desc);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_hashtags_gin_idx on public.posts using gin (hashtags);
create index if not exists posts_moderation_status_idx on public.posts (moderation_status);

create trigger posts_set_updated_at
before update on public.posts
for each row
execute function public.set_updated_at();

create or replace function public.extract_hashtags(p_content_text text)
returns text[]
language sql
immutable
as $$
  select coalesce(
    array_agg(distinct lower(match_text[1])),
    '{}'
  )
  from regexp_matches(coalesce(p_content_text, ''), '#([A-Za-z0-9_]+)', 'g') as match_text;
$$;

create or replace function public.set_post_hashtags()
returns trigger
language plpgsql
as $$
begin
  if coalesce(array_length(new.hashtags, 1), 0) = 0 then
    new.hashtags := public.extract_hashtags(new.content_text);
  end if;

  if coalesce(array_length(new.media_urls, 1), 0) = 0 then
    new.media_type := 'none';
  end if;

  return new;
end;
$$;

drop trigger if exists posts_set_hashtags on public.posts;
create trigger posts_set_hashtags
before insert or update on public.posts
for each row
execute function public.set_post_hashtags();

create table if not exists public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null references public.users(id) on delete cascade,
  following_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint follows_unique unique (follower_id, following_id),
  constraint follows_not_self check (follower_id <> following_id)
);

create index if not exists follows_follower_idx on public.follows (follower_id);
create index if not exists follows_following_idx on public.follows (following_id);

create table if not exists public.interactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  target_type public.interaction_target_type not null,
  target_id uuid not null,
  action_type public.interaction_action_type not null,
  created_at timestamptz not null default now()
);

create index if not exists interactions_user_target_action_created_idx
  on public.interactions (user_id, target_type, action_type, created_at desc);
create index if not exists interactions_target_action_created_idx
  on public.interactions (target_id, action_type, created_at desc);

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  parent_id uuid references public.comments(id) on delete cascade,
  content_text text not null,
  moderation_status public.moderation_status not null default 'approved',
  created_at timestamptz not null default now()
);

create index if not exists comments_post_created_idx on public.comments (post_id, created_at desc);
create index if not exists comments_user_created_idx on public.comments (user_id, created_at desc);
create index if not exists comments_parent_idx on public.comments (parent_id);

create table if not exists public.post_embeddings (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null unique references public.posts(id) on delete cascade,
  embedding vector(1536) not null,
  created_at timestamptz not null default now()
);

create index if not exists post_embeddings_hnsw_idx
  on public.post_embeddings
  using hnsw (embedding vector_cosine_ops);

create table if not exists public.user_interest_vectors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.users(id) on delete cascade,
  interest_vector vector(1536) not null,
  last_computed_at timestamptz not null default now()
);

create index if not exists user_interest_vectors_hnsw_idx
  on public.user_interest_vectors
  using hnsw (interest_vector vector_cosine_ops);

create table if not exists public.feed_cache (
  user_id uuid not null references public.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  score double precision not null,
  computed_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists feed_cache_user_score_idx on public.feed_cache (user_id, score desc);

create table if not exists public.people_recommendations (
  user_id uuid not null references public.users(id) on delete cascade,
  recommended_user_id uuid not null references public.users(id) on delete cascade,
  score double precision not null,
  reason text not null,
  computed_at timestamptz not null default now(),
  primary key (user_id, recommended_user_id)
);

create index if not exists people_recommendations_user_score_idx
  on public.people_recommendations (user_id, score desc);

create table if not exists public.content_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.users(id) on delete cascade,
  content_type text not null,
  content_id uuid not null,
  reason text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.post_likes (
  post_id uuid not null references public.posts(id) on delete cascade,
  user_id uuid not null references public.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

create or replace function public.sync_post_like_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set like_count = like_count + 1
    where id = new.post_id;
    return new;
  end if;

  update public.posts
  set like_count = greatest(0, like_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists post_likes_sync_count on public.post_likes;
create trigger post_likes_sync_count
after insert or delete on public.post_likes
for each row
execute function public.sync_post_like_count();

create or replace function public.sync_post_comment_count()
returns trigger
language plpgsql
as $$
begin
  if tg_op = 'INSERT' then
    update public.posts
    set comment_count = comment_count + 1
    where id = new.post_id;
    return new;
  end if;

  update public.posts
  set comment_count = greatest(0, comment_count - 1)
  where id = old.post_id;
  return old;
end;
$$;

drop trigger if exists comments_sync_count on public.comments;
create trigger comments_sync_count
after insert or delete on public.comments
for each row
execute function public.sync_post_comment_count();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'social-media',
  'social-media',
  false,
  52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;


