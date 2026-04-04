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
    array_agg(distinct lower(trim(leading '#' from match_text))),
    '{}'
  )
  from regexp_matches(coalesce(p_content_text, ''), '#([A-Za-z0-9_]+)', 'g') as m(match_text);
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

create or replace function public.follow_user_atomic(
  p_follower_id uuid,
  p_following_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_follower_id = p_following_id then
    raise exception 'Users cannot follow themselves';
  end if;

  insert into public.follows (follower_id, following_id)
  values (p_follower_id, p_following_id)
  on conflict (follower_id, following_id) do nothing;

  if found then
    update public.users
    set following_count = following_count + 1
    where id = p_follower_id;

    update public.users
    set follower_count = follower_count + 1
    where id = p_following_id;
  end if;
end;
$$;

create or replace function public.unfollow_user_atomic(
  p_follower_id uuid,
  p_following_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.follows
  where follower_id = p_follower_id
    and following_id = p_following_id;

  if found then
    update public.users
    set following_count = greatest(0, following_count - 1)
    where id = p_follower_id;

    update public.users
    set follower_count = greatest(0, follower_count - 1)
    where id = p_following_id;
  end if;
end;
$$;

create or replace function public.match_posts_by_interest(
  p_user_id uuid,
  p_match_count int default 20,
  p_window_hours int default 48
)
returns table (
  post_id uuid,
  topic_affinity double precision
)
language sql
stable
as $$
  select
    pe.post_id,
    1 - (uiv.interest_vector <=> pe.embedding) as topic_affinity
  from public.user_interest_vectors uiv
  join public.post_embeddings pe on true
  join public.posts p on p.id = pe.post_id
  where uiv.user_id = p_user_id
    and p.created_at >= now() - make_interval(hours => p_window_hours)
    and p.moderation_status = 'approved'
  order by uiv.interest_vector <=> pe.embedding asc
  limit p_match_count;
$$;

create or replace function public.get_mutual_follow_candidates(
  p_user_id uuid,
  p_limit int default 50
)
returns table (
  candidate uuid,
  mutual_count bigint
)
language sql
stable
as $$
  select
    f2.following_id as candidate,
    count(*) as mutual_count
  from public.follows f1
  join public.follows f2 on f1.following_id = f2.follower_id
  where f1.follower_id = p_user_id
    and f2.following_id <> p_user_id
    and not exists (
      select 1
      from public.follows existing
      where existing.follower_id = p_user_id
        and existing.following_id = f2.following_id
    )
  group by f2.following_id
  order by mutual_count desc
  limit p_limit;
$$;

create or replace function public.get_interaction_overlap_candidates(
  p_user_id uuid,
  p_limit int default 50
)
returns table (
  candidate uuid,
  overlap_count bigint
)
language sql
stable
as $$
  with my_recent_posts as (
    select distinct target_id
    from public.interactions
    where user_id = p_user_id
      and target_type = 'post'
      and action_type in ('like', 'comment', 'share')
      and created_at >= now() - interval '14 days'
  )
  select
    i.user_id as candidate,
    count(distinct i.target_id) as overlap_count
  from public.interactions i
  join my_recent_posts mp on mp.target_id = i.target_id
  where i.user_id <> p_user_id
    and i.target_type = 'post'
    and i.action_type in ('like', 'comment', 'share')
    and i.created_at >= now() - interval '14 days'
  group by i.user_id
  order by overlap_count desc
  limit p_limit;
$$;

create or replace function public.get_interest_similarity_candidates(
  p_user_id uuid,
  p_limit int default 50
)
returns table (
  candidate uuid,
  vector_similarity double precision
)
language sql
stable
as $$
  select
    other.user_id as candidate,
    1 - (mine.interest_vector <=> other.interest_vector) as vector_similarity
  from public.user_interest_vectors mine
  join public.user_interest_vectors other on other.user_id <> mine.user_id
  where mine.user_id = p_user_id
  order by mine.interest_vector <=> other.interest_vector asc
  limit p_limit;
$$;

-- Compatibility view for the existing app code that still references `profiles`.
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
as $$
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
$$;

drop trigger if exists profiles_view_upsert_trigger on public.profiles;
create trigger profiles_view_upsert_trigger
instead of insert or update on public.profiles
for each row
execute function public.profiles_view_upsert();

alter table public.users enable row level security;
alter table public.posts enable row level security;
alter table public.follows enable row level security;
alter table public.interactions enable row level security;
alter table public.comments enable row level security;
alter table public.feed_cache enable row level security;
alter table public.people_recommendations enable row level security;
alter table public.post_likes enable row level security;
alter table public.content_reports enable row level security;

drop policy if exists "storage_social_media_select_authenticated" on storage.objects;
create policy "storage_social_media_select_authenticated"
on storage.objects
for select
to authenticated
using (bucket_id = 'social-media');

drop policy if exists "storage_social_media_insert_own_folder" on storage.objects;
create policy "storage_social_media_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'social-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "storage_social_media_update_own_folder" on storage.objects;
create policy "storage_social_media_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'social-media'
  and split_part(name, '/', 1) = auth.uid()::text
)
with check (
  bucket_id = 'social-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "storage_social_media_delete_own_folder" on storage.objects;
create policy "storage_social_media_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'social-media'
  and split_part(name, '/', 1) = auth.uid()::text
);

drop policy if exists "users_select_all_authenticated" on public.users;
create policy "users_select_all_authenticated"
on public.users
for select
to authenticated
using (true);

drop policy if exists "users_update_self" on public.users;
create policy "users_update_self"
on public.users
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "users_insert_self" on public.users;
create policy "users_insert_self"
on public.users
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "posts_select_public" on public.posts;
create policy "posts_select_public"
on public.posts
for select
to authenticated
using (moderation_status = 'approved');

drop policy if exists "posts_insert_self" on public.posts;
create policy "posts_insert_self"
on public.posts
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "posts_update_self" on public.posts;
create policy "posts_update_self"
on public.posts
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "follows_select_public" on public.follows;
create policy "follows_select_public"
on public.follows
for select
to authenticated
using (true);

drop policy if exists "follows_insert_self" on public.follows;
create policy "follows_insert_self"
on public.follows
for insert
to authenticated
with check (auth.uid() = follower_id);

drop policy if exists "follows_delete_self" on public.follows;
create policy "follows_delete_self"
on public.follows
for delete
to authenticated
using (auth.uid() = follower_id);

drop policy if exists "interactions_select_self" on public.interactions;
create policy "interactions_select_self"
on public.interactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "interactions_insert_self" on public.interactions;
create policy "interactions_insert_self"
on public.interactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "comments_select_public" on public.comments;
create policy "comments_select_public"
on public.comments
for select
to authenticated
using (moderation_status = 'approved');

drop policy if exists "comments_insert_self" on public.comments;
create policy "comments_insert_self"
on public.comments
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "feed_cache_select_self" on public.feed_cache;
create policy "feed_cache_select_self"
on public.feed_cache
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "people_recommendations_select_self" on public.people_recommendations;
create policy "people_recommendations_select_self"
on public.people_recommendations
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "post_likes_select_all_authenticated" on public.post_likes;
create policy "post_likes_select_all_authenticated"
on public.post_likes
for select
to authenticated
using (true);

drop policy if exists "post_likes_insert_self" on public.post_likes;
create policy "post_likes_insert_self"
on public.post_likes
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "post_likes_delete_self" on public.post_likes;
create policy "post_likes_delete_self"
on public.post_likes
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "content_reports_insert_self" on public.content_reports;
create policy "content_reports_insert_self"
on public.content_reports
for insert
to authenticated
with check (auth.uid() = reporter_id);
