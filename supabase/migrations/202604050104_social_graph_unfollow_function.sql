create or replace function public.unfollow_user_atomic(
  p_follower_id uuid,
  p_following_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $unfollow_user$
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
$unfollow_user$;
