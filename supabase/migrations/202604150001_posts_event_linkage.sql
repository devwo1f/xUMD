alter table public.posts
  add column if not exists event_id uuid references public.events(id) on delete set null;

create index if not exists posts_event_id_idx on public.posts (event_id);
