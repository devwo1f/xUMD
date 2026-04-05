create or replace function public.clear_event_rsvp_atomic(
  p_event_id uuid,
  p_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $clear_event_rsvp_atomic$
begin
  delete from public.event_rsvps
  where event_id = p_event_id and user_id = p_user_id;

  perform public.sync_event_rsvp_counters(p_event_id);
end;
$clear_event_rsvp_atomic$;
