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
as $match_posts_by_interest$
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
$match_posts_by_interest$;

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
as $get_mutual_follow_candidates$
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
$get_mutual_follow_candidates$;

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
as $get_interaction_overlap_candidates$
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
$get_interaction_overlap_candidates$;

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
as $get_interest_similarity_candidates$
  select
    other.user_id as candidate,
    1 - (mine.interest_vector <=> other.interest_vector) as vector_similarity
  from public.user_interest_vectors mine
  join public.user_interest_vectors other on other.user_id <> mine.user_id
  where mine.user_id = p_user_id
  order by mine.interest_vector <=> other.interest_vector asc
  limit p_limit;
$get_interest_similarity_candidates$;
