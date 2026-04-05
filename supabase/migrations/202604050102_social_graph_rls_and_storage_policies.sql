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
