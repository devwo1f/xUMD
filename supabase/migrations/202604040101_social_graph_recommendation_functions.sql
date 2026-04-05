create or replace function public.follow_user_atomic(
  p_follower_id uuid,
  p_following_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $follow_user$
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
$follow_user$;
