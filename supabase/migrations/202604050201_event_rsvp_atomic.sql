create or replace function public.rsvp_event_atomic(
  p_event_id uuid,
  p_user_id uuid,
  p_status public.event_rsvp_status_enum
)
returns public.event_rsvps
language plpgsql
security definer
set search_path = public
as $rsvp_event_atomic$
declare
  v_row public.event_rsvps;
begin
  insert into public.event_rsvps (event_id, user_id, status)
  values (p_event_id, p_user_id, p_status)
  on conflict (event_id, user_id)
  do update set status = excluded.status
  returning * into v_row;

  perform public.sync_event_rsvp_counters(p_event_id);
  return v_row;
end;
$rsvp_event_atomic$;
