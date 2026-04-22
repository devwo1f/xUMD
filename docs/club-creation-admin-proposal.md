# xUMD Club Creation + Admin Approval Proposal

This document proposes a clean way to add `Create Club` to xUMD while keeping club data canonical, moderated, and consistent across clubs, search, profiles, feed, and events.

It is based on the current app architecture:

- canonical club records live in `public.clubs`
- canonical membership records live in `public.club_members`
- club UI currently reads through:
  - `src/services/campusClubs.ts`
  - `src/features/clubs/hooks/useCampusClubs.ts`
- search, profile, and other surfaces already consume approved club data

## 1. Product Goal

Allow a student to submit a new club request from the app by answering a short guided form.

That request should:

- not immediately become a public club
- enter an admin review queue
- be approved or rejected by an authorized xUMD admin
- create a real canonical club only after approval

## 2. Recommendation

Do not create a separate admin login flow.

Use the same normal xUMD auth system and mark certain existing users as admins with a role table.

This is the best fit for the current app because:

- auth is already centralized
- user profiles already exist in `public.users`
- edge functions already fit the moderation pattern
- it avoids maintaining a second authentication system

## 3. Core Principle

Pending club requests should not be stored directly in `public.clubs`.

Instead:

- `public.clubs` remains the source of truth for approved clubs only
- pending requests live in a separate table until reviewed

This matters because many app surfaces already read `clubs` directly. If pending clubs are inserted there, they could leak into:

- clubs home
- club detail
- profile common clubs
- search
- recommendations
- posts/events linked to clubs

## 4. Proposed Data Model

### 4.1 `admin_users`

Purpose:

- marks which normal users are allowed to review club creation requests

Suggested columns:

```sql
create table public.admin_users (
  user_id uuid primary key references public.users(id) on delete cascade,
  role text not null check (role in ('club_admin', 'super_admin')),
  is_active boolean not null default true,
  granted_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);
```

Notes:

- `club_admin` can review club requests
- `super_admin` can do everything `club_admin` can do and later own higher-risk actions

### 4.2 `club_creation_requests`

Purpose:

- stores the form submission before a club becomes real and public

Suggested columns:

```sql
create table public.club_creation_requests (
  id uuid primary key default gen_random_uuid(),
  requested_by uuid not null references public.users(id) on delete cascade,
  status public.moderation_status not null default 'pending',

  club_name text not null,
  slug text,
  category text not null default 'other',

  short_description text not null default '',
  description text not null default '',
  mission text,
  why_this_club text,
  how_is_it_different text,

  meeting_schedule text,
  location_name text,
  location_id uuid references public.campus_locations(id) on delete set null,

  contact_email text,
  instagram_handle text,
  tags text[] not null default '{}',

  logo_url text,
  cover_url text,

  answers jsonb not null default '{}'::jsonb,

  review_notes text,
  reviewed_by uuid references public.users(id) on delete set null,
  reviewed_at timestamptz,

  approved_club_id uuid references public.clubs(id) on delete set null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

Recommended indexes:

```sql
create index on public.club_creation_requests (status, created_at desc);
create index on public.club_creation_requests (requested_by, created_at desc);
create unique index on public.club_creation_requests (lower(club_name))
  where status = 'pending';
```

### 4.3 Optional Later: `club_creation_request_members`

Purpose:

- supports co-founders and proposed officers in the request itself

Suggested use:

- useful later, not needed for V1

## 5. Proposed User Flow

### Student Flow

1. User taps `Create Club`
2. User fills a short multi-step form
3. App submits a `club_creation_request`
4. User sees `Pending review`
5. User can track request status from profile or clubs

### Admin Flow

1. Admin opens `Club Requests`
2. Admin sees `Pending`, `Approved`, and `Rejected` queues
3. Admin opens one request
4. Admin reviews:
   - requester
   - club name
   - category
   - description
   - mission
   - schedule/location
   - uploaded media
   - possible duplicate clubs
5. Admin chooses:
   - `Approve`
   - `Reject`
   - optional future `Request changes`

### Approval Outcome

On approval:

- create row in `public.clubs`
- create `public.club_members` row for requester as `president`
- optionally create additional officer/member rows later
- update request to `approved`
- set `approved_club_id`

On rejection:

- keep the request row
- set `status = 'rejected'`
- save `review_notes`

## 6. Club Creation Form Proposal

The form should be short, guided, and mobile-friendly.

### Step 1: Basics

- Club name
- Category
- One-line summary
- Full description

### Step 2: Purpose

- What is this club about?
- Why should this exist at UMD?
- How is it different from existing clubs?

### Step 3: Logistics

- Meeting schedule
- Preferred location / building
- Contact email
- Instagram or other social link

### Step 4: Branding

- Logo upload
- Cover image upload

### Step 5: Review

- Preview of final submission
- Submit request

## 7. UI Proposal

### Student UI

Suggested entry points:

- `Clubs` home header action
- or `Profile` / `Settings` under creation tools

Suggested screens:

- `CreateClubIntroScreen`
- `CreateClubFormScreen`
- `MyClubRequestsScreen`

Suggested status display:

- `Pending review`
- `Approved`
- `Rejected`

### Admin UI

Keep this out of the public tab bar in V1.

Suggested admin entry point:

- Profile
- Settings
- hidden admin tools section if user is an admin

Suggested screens:

- `AdminClubRequestsScreen`
- `AdminClubRequestDetailScreen`

## 8. Security and Authorization

This part should be handled through edge functions, not direct client-side writes.

Recommended functions:

- `submit-club-request`
- `list-club-requests`
- `review-club-request`

### Why edge functions are the right place

- approval should never depend on client trust
- admin role checks should happen server-side
- club creation on approval is multi-step and should be atomic
- duplicate prevention is safer server-side

### Required authorization rules

`submit-club-request`

- authenticated user only
- requester must exist in `public.users`

`list-club-requests`

- student can list only their own requests
- admin can list all requests

`review-club-request`

- admin only
- should validate admin role from `admin_users`

## 9. Approval Transaction Logic

Approval should be treated like a transaction, even if implemented as a sequence inside an edge function.

### Approve

1. validate admin role
2. fetch request
3. verify request is still `pending`
4. check for duplicate club name / slug
5. create row in `public.clubs`
6. create row in `public.club_members` with:
   - `role = 'president'`
   - `status = 'approved'`
7. update request:
   - `status = 'approved'`
   - `reviewed_by`
   - `reviewed_at`
   - `approved_club_id`

### Reject

1. validate admin role
2. fetch request
3. verify request is still `pending`
4. update request:
   - `status = 'rejected'`
   - `review_notes`
   - `reviewed_by`
   - `reviewed_at`

## 10. Consistency Benefits

This design keeps the app consistent because:

- only approved clubs enter `public.clubs`
- only approved clubs are visible to search and profile surfaces
- `club_members` remains the canonical membership table
- events and posts can safely link only to real approved clubs
- no pending club leaks into public UI by accident

## 11. Suggested Admin Model

Recommendation:

- start with one manually-seeded admin user in `admin_users`
- do not expose admin promotion UI in V1

Why:

- simpler
- safer
- avoids a second-order permissions problem too early

For example:

- your personal xUMD account can be seeded as `super_admin`

## 12. Notifications

Good V1 notifications:

- request submitted
- request approved
- request rejected

Later enhancements:

- `needs changes`
- duplicate warning before submission
- approval with auto-follow or auto-open club page

## 13. Nice V2 Improvements

- duplicate club detection during submission
- request edits after rejection
- request changes flow instead of only approve/reject
- add co-founders during request creation
- moderate uploaded logo/cover images
- auto-create first welcome post when a club is approved
- auto-provision starter club media

## 14. Recommended V1 Scope

Best first implementation:

1. add `admin_users`
2. add `club_creation_requests`
3. add student `Create Club` form
4. add admin review queue
5. approval creates canonical `clubs` + `club_members`

This gives you the full workflow without polluting the existing club graph.

## 15. Why This Is Better Than Two Alternatives

### Alternative A: Pending rows directly in `clubs`

Why not:

- pending clubs can leak into public UI
- every club reader must remember to filter
- higher risk of inconsistent behavior across the app

### Alternative B: Separate admin login

Why not:

- duplicates auth logic
- adds more maintenance
- harder to keep secure and coherent
- unnecessary because admins are already normal users with profiles

## 16. Recommended Next Build Order

If we implement this, the safest order is:

1. schema migration for `admin_users` and `club_creation_requests`
2. server-side edge functions
3. client service layer
4. student create-club UI
5. admin review UI
6. notification polish

## 17. Final Recommendation

Build club creation as a moderated request workflow.

- Students submit requests
- Admin users review them
- Only approved requests create real clubs

That keeps `clubs` and `club_members` canonical, matches the rest of xUMD’s moderation direction, and avoids a lot of downstream inconsistency.
