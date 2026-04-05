do $realtime$
begin
  begin
    alter publication supabase_realtime add table public.events;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;

  begin
    alter publication supabase_realtime add table public.event_rsvps;
  exception
    when duplicate_object then null;
    when undefined_object then null;
  end;
end
$realtime$;

do $cron$
begin
  if exists (select 1 from pg_extension where extname = 'pg_cron') then
    begin
      perform cron.schedule(
        'xumd-refresh-event-statuses',
        '* * * * *',
        'select public.refresh_event_statuses();'
      );
    exception
      when others then
        raise notice 'Skipping pg_cron schedule for xUMD event statuses: %', sqlerrm;
    end;
  end if;
end
$cron$;
