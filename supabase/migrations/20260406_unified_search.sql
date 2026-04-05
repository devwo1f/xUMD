create extension if not exists vector;
create extension if not exists pgcrypto;

create type public.search_entity_type as enum ('event', 'club', 'user');

create table if not exists public.clubs (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  description text not null default '',
  short_description text not null default '',
  category text not null default 'other',
  tags text[] not null default '{}',
  logo_url text,
  cover_image_url text,
  cover_url text,
  meeting_schedule text,
  location_name text,
  location_id uuid references public.campus_locations(id) on delete set null,
  contact_email text,
  instagram_handle text,
  social_links jsonb not null default '{}'::jsonb,
  member_count int not null default 0,
  is_active boolean not null default true,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists clubs_name_idx on public.clubs (name);
create index if not exists clubs_category_idx on public.clubs (category);
create index if not exists clubs_member_count_idx on public.clubs (member_count desc);
create index if not exists clubs_tags_gin_idx on public.clubs using gin (tags);

create table if not exists public.content_embeddings (
  id uuid primary key default gen_random_uuid(),
  entity_type public.search_entity_type not null,
  entity_id uuid not null,
  content_text text not null,
  embedding vector(1536) not null,
  updated_at timestamptz not null default now(),
  unique (entity_type, entity_id)
);

create index if not exists content_embeddings_hnsw_idx
  on public.content_embeddings
  using hnsw (embedding vector_cosine_ops);

create index if not exists content_embeddings_entity_idx
  on public.content_embeddings (entity_type, entity_id);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  query text not null,
  filters jsonb,
  notify boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists saved_searches_user_created_idx
  on public.saved_searches (user_id, created_at desc);

create or replace function public.semantic_search(
  query_embedding vector(1536),
  match_threshold float default 0.3,
  match_count int default 20,
  entity_types text[] default array['event', 'club', 'user']
)
returns table (
  entity_type text,
  entity_id uuid,
  similarity float
)
language plpgsql
stable
as $$
begin
  return query
  select
    ce.entity_type::text,
    ce.entity_id,
    1 - (ce.embedding <=> query_embedding) as similarity
  from public.content_embeddings ce
  where ce.entity_type::text = any(entity_types)
    and 1 - (ce.embedding <=> query_embedding) > match_threshold
  order by ce.embedding <=> query_embedding
  limit match_count;
end;
$$;

alter table public.clubs enable row level security;
alter table public.content_embeddings enable row level security;
alter table public.saved_searches enable row level security;

drop policy if exists "clubs_select_authenticated" on public.clubs;
create policy "clubs_select_authenticated"
on public.clubs
for select
to authenticated
using (true);

drop policy if exists "saved_searches_select_self" on public.saved_searches;
create policy "saved_searches_select_self"
on public.saved_searches
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "saved_searches_insert_self" on public.saved_searches;
create policy "saved_searches_insert_self"
on public.saved_searches
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "saved_searches_delete_self" on public.saved_searches;
create policy "saved_searches_delete_self"
on public.saved_searches
for delete
to authenticated
using (auth.uid() = user_id);
