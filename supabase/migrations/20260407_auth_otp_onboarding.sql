-- xUMD passwordless OTP auth + onboarding foundation
-- Extends the existing social graph schema with UMD-only auth enforcement,
-- onboarding metadata, and course lookup tables used by the client.

create extension if not exists pgcrypto;

alter table public.users
  add column if not exists degree_type text,
  add column if not exists minor text,
  add column if not exists interests text[] not null default '{}',
  add column if not exists profile_completed boolean not null default false,
  add column if not exists onboarding_step int not null default 0,
  add column if not exists pronouns text;

update public.users
set
  interests = coalesce(interests, '{}'),
  profile_completed = coalesce(profile_completed, false),
  onboarding_step = coalesce(onboarding_step, 0)
where interests is null
   or profile_completed is null
   or onboarding_step is null;

update public.users
set
  profile_completed = true,
  onboarding_step = greatest(onboarding_step, 4),
  updated_at = now()
where profile_completed = false
  and major is not null
  and graduation_year is not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_degree_type_check'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_degree_type_check
      check (degree_type is null or degree_type in ('bs', 'ba', 'ms', 'phd', 'mba', 'other'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'users_onboarding_step_non_negative'
      and conrelid = 'public.users'::regclass
  ) then
    alter table public.users
      add constraint users_onboarding_step_non_negative
      check (onboarding_step >= 0 and onboarding_step <= 4);
  end if;
end
$$;

create index if not exists users_interests_gin_idx on public.users using gin (interests);
create index if not exists users_profile_completed_idx on public.users (profile_completed);

create or replace function public.check_umd_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_domain text;
begin
  if new.email is null or trim(new.email) = '' then
    raise exception 'Email is required';
  end if;

  email_domain := lower(split_part(new.email, '@', 2));

  if email_domain not in ('umd.edu', 'terpmail.umd.edu') then
    raise exception 'Only @umd.edu and @terpmail.umd.edu emails are allowed';
  end if;

  new.email := lower(trim(new.email));
  return new;
end;
$$;

drop trigger if exists enforce_umd_email on auth.users;
create trigger enforce_umd_email
  before insert or update of email on auth.users
  for each row
  execute function public.check_umd_email();

create or replace function public.generate_onboarding_username(p_email text)
returns text
language plpgsql
immutable
as $$
declare
  email_prefix text;
  cleaned text;
begin
  email_prefix := split_part(coalesce(p_email, 'terp'), '@', 1);
  cleaned := regexp_replace(lower(email_prefix), '[^a-z0-9]+', '_', 'g');
  cleaned := trim(both '_' from cleaned);

  if cleaned is null or cleaned = '' then
    cleaned := 'terp';
  end if;

  return left(cleaned, 24);
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  email_prefix text;
  base_username text;
  candidate_username text;
  display_name_value text;
  username_suffix int := 0;
begin
  email_prefix := split_part(coalesce(new.email, 'terp'), '@', 1);
  base_username := public.generate_onboarding_username(new.email);
  candidate_username := base_username;

  while exists (
    select 1
    from public.users
    where username = candidate_username
      and id <> new.id
  ) loop
    username_suffix := username_suffix + 1;
    candidate_username := left(base_username, greatest(3, 24 - length(username_suffix::text))) || username_suffix::text;
  end loop;

  display_name_value := trim(
    regexp_replace(
      initcap(replace(replace(replace(email_prefix, '.', ' '), '_', ' '), '-', ' ')),
      '\s+',
      ' ',
      'g'
    )
  );

  if display_name_value is null or display_name_value = '' then
    display_name_value := 'Terp';
  end if;

  insert into public.users (
    id,
    email,
    username,
    display_name,
    avatar_url,
    major,
    graduation_year,
    degree_type,
    minor,
    bio,
    pronouns,
    clubs,
    courses,
    interests,
    follower_count,
    following_count,
    profile_completed,
    onboarding_step,
    created_at,
    updated_at
  )
  values (
    new.id,
    lower(trim(new.email)),
    candidate_username,
    coalesce(nullif(new.raw_user_meta_data ->> 'display_name', ''), display_name_value),
    nullif(new.raw_user_meta_data ->> 'avatar_url', ''),
    nullif(new.raw_user_meta_data ->> 'major', ''),
    nullif(new.raw_user_meta_data ->> 'graduation_year', '')::int,
    nullif(new.raw_user_meta_data ->> 'degree_type', ''),
    nullif(new.raw_user_meta_data ->> 'minor', ''),
    nullif(new.raw_user_meta_data ->> 'bio', ''),
    nullif(new.raw_user_meta_data ->> 'pronouns', ''),
    '{}',
    '{}',
    '{}',
    0,
    0,
    false,
    0,
    now(),
    now()
  )
  on conflict (id) do update
  set
    email = excluded.email,
    username = coalesce(public.users.username, excluded.username),
    display_name = coalesce(nullif(public.users.display_name, ''), excluded.display_name),
    avatar_url = coalesce(public.users.avatar_url, excluded.avatar_url),
    major = coalesce(public.users.major, excluded.major),
    graduation_year = coalesce(public.users.graduation_year, excluded.graduation_year),
    degree_type = coalesce(public.users.degree_type, excluded.degree_type),
    minor = coalesce(public.users.minor, excluded.minor),
    bio = coalesce(public.users.bio, excluded.bio),
    pronouns = coalesce(public.users.pronouns, excluded.pronouns),
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

create or replace function public.protect_user_fields()
returns trigger
language plpgsql
as $$
begin
  new.id := old.id;
  new.email := old.email;
  new.follower_count := old.follower_count;
  new.following_count := old.following_count;
  new.created_at := old.created_at;
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists users_set_updated_at on public.users;
drop trigger if exists protect_user_fields_trigger on public.users;
create trigger protect_user_fields_trigger
  before update on public.users
  for each row
  execute function public.protect_user_fields();

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  course_code text not null,
  section text not null,
  title text not null,
  credits int,
  instructor text,
  meeting_days text[] not null default '{}',
  start_time time,
  end_time time,
  building_name text,
  room_number text,
  location_id uuid references public.campus_locations(id) on delete set null,
  semester text not null,
  is_online boolean not null default false,
  is_async boolean not null default false,
  created_at timestamptz not null default now(),
  unique (course_code, section, semester)
);

create index if not exists courses_code_idx on public.courses (course_code);
create index if not exists courses_semester_idx on public.courses (semester);
create index if not exists courses_search_idx on public.courses using gin (
  to_tsvector('english', course_code || ' ' || title)
);

create table if not exists public.user_courses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  course_id uuid references public.courses(id) on delete set null,
  course_code text not null,
  section text not null,
  semester text not null,
  meeting_days text[] not null default '{}',
  start_time time,
  end_time time,
  building_name text,
  room_number text,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists user_courses_user_idx on public.user_courses (user_id);
create index if not exists user_courses_semester_idx on public.user_courses (semester);

insert into public.courses (
  course_code,
  section,
  title,
  credits,
  instructor,
  meeting_days,
  start_time,
  end_time,
  building_name,
  room_number,
  location_id,
  semester,
  is_online,
  is_async
)
values
  ('CMSC131', '0101', 'Object-Oriented Programming I', 4, 'J. Nelson', array['Mo','We'], '09:00', '09:50', 'Brendan Iribe Center', '0324', (select id from public.campus_locations where short_name = 'IRB'), 'Spring 2026', false, false),
  ('CMSC216', '0201', 'Introduction to Computer Systems', 4, 'A. Yoon', array['Tu','Th'], '11:00', '12:15', 'Brendan Iribe Center', '1118', (select id from public.campus_locations where short_name = 'IRB'), 'Spring 2026', false, false),
  ('CMSC330', '0101', 'Organization of Programming Languages', 3, 'M. Hicks', array['Tu','Th'], '14:00', '15:15', 'Brendan Iribe Center', '0324', (select id from public.campus_locations where short_name = 'IRB'), 'Spring 2026', false, false),
  ('CMSC351', '0201', 'Algorithms', 3, 'D. Mount', array['Mo','We','Fr'], '10:00', '10:50', 'A.V. Williams Building', '2460', (select id from public.campus_locations where short_name = 'AVW'), 'Spring 2026', false, false),
  ('DATA100', '0101', 'Data in Society', 3, 'K. Wiggins', array['Mo','We'], '13:00', '14:15', 'Edward St. John Learning and Teaching Center', '2204', (select id from public.campus_locations where short_name = 'ESJ'), 'Spring 2026', false, false),
  ('DATA200', '0101', 'Data Science Foundations', 3, 'L. Chen', array['Tu','Th'], '12:30', '13:45', 'Edward St. John Learning and Teaching Center', '2204', (select id from public.campus_locations where short_name = 'ESJ'), 'Spring 2026', false, false),
  ('INST201', '0105', 'Introduction to Information Science', 3, 'S. Kumar', array['Tu','Th'], '09:30', '10:45', 'Hornbake Library', '1102', (select id from public.campus_locations where short_name = 'HBK'), 'Spring 2026', false, false),
  ('BMGT220', '0101', 'Principles of Accounting I', 3, 'R. Patel', array['Mo','We'], '11:00', '12:15', 'Van Munching Hall', '1208', (select id from public.campus_locations where short_name = 'VMH'), 'Spring 2026', false, false),
  ('MATH141', '0101', 'Calculus II', 4, 'T. Nguyen', array['Mo','We','Fr'], '12:00', '12:50', 'Kirwan Hall', '1110', (select id from public.campus_locations where short_name = 'KIR'), 'Spring 2026', false, false),
  ('STAT400', '0201', 'Applied Probability and Statistics I', 3, 'E. Brooks', array['Tu','Th'], '15:30', '16:45', 'Kim Engineering Building', '1110', (select id from public.campus_locations where short_name = 'KEB'), 'Spring 2026', false, false),
  ('ENGL101', '0102', 'Academic Writing', 3, 'P. Rivera', array['Mo','We'], '15:00', '16:15', 'Tawes Hall', '0328', (select id from public.campus_locations where short_name = 'TAW'), 'Spring 2026', false, false),
  ('PHYS161', '0101', 'General Physics I', 3, 'G. Alvarez', array['Mo','We'], '16:00', '17:15', 'Physics Building', '1412', (select id from public.campus_locations where short_name = 'PHY'), 'Spring 2026', false, false)
on conflict (course_code, section, semester) do update
set
  title = excluded.title,
  credits = excluded.credits,
  instructor = excluded.instructor,
  meeting_days = excluded.meeting_days,
  start_time = excluded.start_time,
  end_time = excluded.end_time,
  building_name = excluded.building_name,
  room_number = excluded.room_number,
  location_id = excluded.location_id,
  is_online = excluded.is_online,
  is_async = excluded.is_async;

alter table public.courses enable row level security;
alter table public.user_courses enable row level security;

drop policy if exists "courses_select_authenticated" on public.courses;
create policy "courses_select_authenticated"
on public.courses
for select
to authenticated
using (true);

drop policy if exists "user_courses_select_self" on public.user_courses;
create policy "user_courses_select_self"
on public.user_courses
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "user_courses_insert_self" on public.user_courses;
create policy "user_courses_insert_self"
on public.user_courses
for insert
to authenticated
with check (user_id = auth.uid());

drop policy if exists "user_courses_delete_self" on public.user_courses;
create policy "user_courses_delete_self"
on public.user_courses
for delete
to authenticated
using (user_id = auth.uid());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "avatars_public_select" on storage.objects;
create policy "avatars_public_select"
on storage.objects
for select
to public
using (bucket_id = 'avatars');

drop policy if exists "avatars_insert_own_folder" on storage.objects;
create policy "avatars_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars_update_own_folder" on storage.objects;
create policy "avatars_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
)
with check (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);

drop policy if exists "avatars_delete_own_folder" on storage.objects;
create policy "avatars_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'avatars'
  and auth.uid()::text = (storage.foldername(name))[1]
);
