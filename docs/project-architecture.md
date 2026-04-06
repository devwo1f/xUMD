# xUMD Project Architecture Guide

This document explains how the xUMD project is organized, which technologies it uses, how the major features fit together, and how data moves through the app from the UI to Supabase and back.

The goal is to make the codebase easier to understand for future development, onboarding, debugging, and deployment.

## 1. What xUMD Is

xUMD is a University of Maryland campus companion app built with React Native and Expo. It is designed to run on:

- mobile phones
- tablets / iPad-sized screens
- the web

The app combines:

- campus map and event discovery
- social feed and posting
- public profile and follow graph
- clubs and organizations
- calendar and personal planning
- campus utilities such as libraries and quick links
- search across people, events, clubs, and places
- UMD-only OTP-based authentication

The codebase is intentionally hybrid:

- it supports real backend-connected behavior through Supabase
- it also contains local fallback and mock layers so the app remains usable when backend pieces are unavailable or still being configured

## 2. Tech Stack

### 2.1 Frontend

- React 19
- React Native 0.83
- Expo SDK 55
- React Native Web
- TypeScript

### 2.2 Navigation and UI

- `@react-navigation/native`
- `@react-navigation/bottom-tabs`
- `@react-navigation/native-stack`
- custom shared UI components in `src/shared/components`

### 2.3 State and Data Fetching

- Zustand for local app state and cross-tab state
- React Query for async server data and caching
- AsyncStorage for persisted local data

### 2.4 Backend

- Supabase Postgres
- Supabase Auth
- Supabase Storage
- Supabase Realtime
- Supabase Edge Functions

### 2.5 Search and Discovery Backend

- Meilisearch for keyword and autocomplete search
- pgvector in Postgres for semantic search
- OpenAI embeddings for semantic search and recommendation signals
- Anthropic filter extraction for natural-language search parsing
- Upstash Redis for short-lived caching

### 2.6 Maps and Geospatial

- `@rnmapbox/maps` for native map rendering
- `mapbox-gl` for web map rendering
- custom geojson and campus overlay utilities

### 2.7 Expo / Native Device Modules

- `expo-dev-client`
- `expo-location`
- `expo-image-picker`
- `expo-image-manipulator`
- `expo-video`
- `expo-notifications`
- `expo-secure-store`
- `expo-linking`
- `expo-local-authentication`

### 2.8 Build and Deployment

- Expo / Metro
- EAS Build
- EAS project config in `app.json` and `eas.json`

## 3. High-Level Architecture

xUMD is organized into four main layers:

### 3.1 App shell layer

This layer starts the app, injects providers, and mounts navigation.

Main files:

- `App.tsx`
- `src/providers/AppProviders.tsx`
- `src/navigation/RootNavigator.tsx`

### 3.2 Navigation layer

This layer decides which stack or tab the user sees and how deep links map to screens.

Main files:

- `src/navigation/MainTabs.tsx`
- `src/navigation/AuthNavigator.tsx`
- `src/navigation/OnboardingNavigator.tsx`
- `src/navigation/linking.ts`
- `src/navigation/deepLinks.ts`
- `src/navigation/types.ts`

### 3.3 Feature layer

This layer contains the actual product features:

- auth
- explore
- map
- feed
- search
- calendar
- clubs
- campus
- profile
- social

Each feature generally owns:

- screens
- hooks
- feature-specific utilities
- feature-specific components
- sometimes a feature-specific Zustand store

### 3.4 Shared infrastructure layer

This layer holds reusable code that multiple features rely on:

- theme tokens
- UI primitives
- data types
- responsive helpers
- shared stores
- shared services

Main folders:

- `src/shared/components`
- `src/shared/hooks`
- `src/shared/stores`
- `src/shared/theme`
- `src/shared/types`
- `src/services`

## 4. Entry Point and App Boot

### 4.1 `App.tsx`

`App.tsx` is the top-level app entry point.

It does three things:

1. wraps the app in shared providers
2. creates the `NavigationContainer`
3. attaches deep-link configuration through `linking`

This file is intentionally small. It acts as the handoff point from Expo to the rest of the architecture.

### 4.2 `src/providers/AppProviders.tsx`

This file sets up global providers:

- `GestureHandlerRootView`
- `QueryClientProvider`
- `SafeAreaProvider`
- Expo `StatusBar`
- `AppFrame`

`AppFrame` is the responsive shell that gives the app a better tablet / desktop presence.

### 4.3 `src/navigation/RootNavigator.tsx`

This is the first real decision-maker in the app.

It determines whether the user should see:

- boot/loading screen
- auth flow
- onboarding flow
- main app tabs

Decision logic:

1. initialize auth session
2. if Supabase is configured and auth is still loading, show boot screen
3. if Supabase is not configured, allow demo-mode access directly into the main app
4. if no session exists, show auth
5. if session exists but profile is incomplete, show onboarding
6. otherwise show the main tab navigator

This design is important because it lets the app work in both:

- full backend-connected mode
- local/demo mode

## 5. Navigation Structure

### 5.1 Bottom tabs

The main app uses a 7-tab bottom navigation setup defined in `src/navigation/MainTabs.tsx`:

- Explore
- Map
- Feed
- Search
- Calendar
- Campus
- Profile

The Search tab is visually elevated and styled as the center action tab.

### 5.2 Nested stacks

Each tab owns its own stack so detail pages can be opened without leaving the tab context.

Examples:

- Explore stack: home, event detail, club detail
- Feed stack: feed home, post detail, public user profile
- Search stack: search home, event detail, club detail, user profile
- Calendar stack: calendar home, add block, sync settings, event detail, club detail
- Campus stack: campus home, clubs, club detail, post detail, user profile, libraries, campus feature detail
- Profile stack: profile home, edit profile, settings, saved events, my posts, connections, event detail, club detail, user profile

### 5.3 Deep linking

The app is configured for browser URLs and deep links through:

- `src/navigation/linking.ts`
- `src/navigation/deepLinks.ts`

This enables routes like:

- `/map`
- `/feed`
- `/search`
- `/calendar`
- `/campus`
- `/clubs/:clubId`
- `/events/:eventId`
- `/people/:userId`
- `/posts/:postId`

This matters for both web routing and shareable in-app links.

## 6. Shared Design System and Responsive Layer

### 6.1 Theme

The design tokens live in:

- `src/shared/theme/colors.ts`
- `src/shared/theme/spacing.ts`
- `src/shared/theme/typography.ts`

These files centralize the visual language so screens stay consistent.

### 6.2 Shared UI primitives

Reusable UI components live in `src/shared/components`, including:

- `Card`
- `Button`
- `Badge`
- `BottomSheet`
- `Avatar`
- `Input`
- `ScreenLayout`
- `UMDBrandLockup`
- `HeaderTag`

These are the base building blocks of most feature screens.

### 6.3 Responsive system

Responsive behavior is powered by:

- `src/shared/hooks/useResponsive.ts`
- `src/shared/components/ResponsiveContainer.tsx`
- `src/shared/components/AppFrame.tsx`
- `src/shared/components/ScreenLayout.tsx`

Responsibilities:

- detect breakpoint: mobile, tablet, desktop
- provide max widths and horizontal padding
- shape the web/tablet shell
- make screen headers and bodies feel centered and intentional on larger screens

## 7. Auth and Onboarding

### 7.1 Feature location

Auth code lives in:

- `src/features/auth/screens`
- `src/features/auth/hooks/useAuth.ts`
- `src/features/auth/stores/authStore.ts`
- `src/services/auth.ts`

### 7.2 Auth model

xUMD uses UMD-only email OTP authentication.

Important auth rules:

- only `@umd.edu` and `@terpmail.umd.edu` are allowed
- the app requests an OTP
- the user enters the OTP
- after verification, the profile is checked
- incomplete users are sent to onboarding

### 7.3 `useAuth.ts`

This hook and store layer handle:

- OTP request
- OTP verification
- session hydration
- profile fetch / refresh
- onboarding state
- profile updates
- sign out

It also contains fallback behavior so the app can still behave safely if Supabase is not configured.

### 7.4 Onboarding

Onboarding currently routes through:

- `ProfileCompletionScreen`

It collects user information such as:

- display name
- username
- major
- graduation year
- degree type
- minor
- courses
- interests
- bio
- avatar

## 8. Feed and Social System

### 8.1 Feed

Feed files:

- `src/features/feed/screens/FeedHomeScreen.tsx`
- `src/features/feed/screens/PostDetailScreen.tsx`
- `src/features/feed/hooks/useFeed.ts`
- `src/features/feed/hooks/useCampusFeed.ts`
- `src/services/feed.ts`

The feed supports:

- post list
- post detail
- like / comment / share actions
- media posts
- suggested content
- following lane

### 8.2 Post media

Media rendering is centralized in:

- `src/features/feed/components/PostMediaGallery.tsx`

This component is used across:

- feed
- profile posts
- club media
- post detail

It is the shared media viewer and playback system.

### 8.3 Social graph

Social graph code lives in:

- `src/features/social/hooks/useSocialGraph.ts`
- `src/features/social/hooks/useCampusSocialGraph.ts`
- `src/features/social/components/FollowButton.tsx`
- `src/features/social/screens/UserProfileScreen.tsx`
- `src/services/social.ts`

This layer powers:

- follow / unfollow
- followers / following lists
- recommendations
- public user profiles
- mutual graph signals

### 8.4 Public profile model

All profiles are public in the current architecture.

Public profile screens can show:

- display name
- username
- bio
- pronouns
- posts
- recent activity
- common clubs
- follower and following counts

## 9. Search System

### 9.1 Search feature files

- `src/features/search/screens/SearchHomeScreen.tsx`
- `src/features/search/hooks/useSearchQueries.ts`
- `src/features/search/hooks/useRecentSearches.ts`
- `src/features/search/utils/localSearch.ts`
- `src/features/search/types.ts`
- `src/services/search.ts`

### 9.2 Search behavior

Search is hybrid:

- keyword search
- semantic search
- discovery hub
- local fallback

On the frontend, the screen has three major states:

1. empty / discovery state
2. autocomplete state
3. full results state

### 9.3 Discovery hub

When no search is submitted, Search acts like a discovery home showing:

- trending events
- trending hashtags
- happening now
- people you may know
- browse by category
- recent searches

### 9.4 Local fallback design

Even if remote search is unavailable, the app still works through `localSearch.ts`.

That file generates:

- local autocomplete
- local unified search
- local discovery hub

This is a recurring pattern across the app: remote-first when available, local-safe when not.

## 10. Explore and Map System

### 10.1 Explore

Explore is lighter-weight and event-first.

Main files:

- `src/features/explore/screens/ExploreHomeScreen.tsx`
- `src/features/explore/screens/EventDetailScreen.tsx`

Explore is intended to surface:

- discoverable events
- quick jumps
- a simpler discovery view

### 10.2 Map

Map is the flagship screen.

Main files:

- `src/features/map/screens/MapHomeScreen.tsx`
- `src/features/map/components/CampusMap.native.tsx`
- `src/features/map/components/CampusMap.web.tsx`
- `src/features/map/hooks/useMapData.ts`
- `src/features/map/hooks/useMapEventDetail.ts`
- `src/features/map/hooks/useMapSearchResults.ts`
- `src/features/map/hooks/useUserLocation.ts`
- `src/features/map/stores/useMapFilterStore.ts`
- `src/features/map/utils/eventDiscovery.ts`
- `src/features/map/utils/wayfinding.ts`
- `src/features/map/utils/geojson.ts`
- `src/features/map/config/campusMapStyle.ts`
- `src/features/map/data/campusOverlays.ts`

### 10.3 What the map system does

The map stack supports:

- campus event markers
- density / heatmap behavior
- building overlays
- route overlays
- dining zones
- location search
- quick lenses such as food / study / tonight
- event list view
- event preview and detail sheets
- building and overlay detail sheets
- route focus
- user location
- create-event from long press

### 10.4 Native vs web map rendering

There are separate map renderers:

- `CampusMap.native.tsx`
- `CampusMap.web.tsx`

This allows platform-specific handling while keeping the higher-level map behavior in the shared screen and hooks.

### 10.5 Map state model

The map uses a mix of:

- React Query for fetched event/detail data
- Zustand for filter state and persistent map options
- local screen state for selected map objects and bottom sheets

## 11. Calendar System

### 11.1 Calendar files

- `src/features/calendar/screens/CalendarHomeScreen.tsx`
- `src/features/calendar/screens/AddPersonalBlockScreen.tsx`
- `src/features/calendar/screens/CalendarSyncSettingsScreen.tsx`
- `src/features/calendar/hooks/useCalendarEntries.ts`
- `src/features/calendar/services/calendar.ts`
- `src/features/calendar/utils/calendar.ts`
- `src/features/calendar/components/MiniCalendarStrip.tsx`

### 11.2 Calendar responsibilities

Calendar combines multiple sources into a single planning surface:

- personal blocks
- event RSVPs
- club meetings
- courses / academic schedule

### 11.3 Calendar UX

The calendar supports:

- day / week / month views
- conflict detection
- up-next summary
- sync settings
- personal time blocking
- map handoff
- detail bottom sheets

### 11.4 Cross-tab handoff

Search and Map can push a pending calendar focus into the cross-tab store, and Calendar can consume it on mount/focus. This is one of the ways the app behaves like a connected product instead of isolated tabs.

## 12. Clubs and Campus

### 12.1 Clubs

Club files:

- `src/features/clubs/screens/ClubsHomeScreen.tsx`
- `src/features/clubs/screens/ClubDetailScreen.tsx`
- `src/features/clubs/hooks/useClubs.ts`
- `src/features/clubs/stores/useClubAdminStore.ts`
- `src/features/clubs/utils/permissions.ts`
- `src/features/clubs/components/ClubTabs.tsx`
- `src/features/clubs/components/JoinRequestCard.tsx`

Clubs support:

- club discovery
- club detail
- joining
- media
- member list
- admin permissions
- club announcements and posting flows

### 12.2 Club admin model

The admin model is role-based and supports:

- member
- officer / co-admin style roles
- admin
- owner / president style roles

Permissions are computed in a dedicated utility rather than being scattered across screens.

### 12.3 Campus

Campus files:

- `src/features/campus/screens/CampusHomeScreen.tsx`
- `src/features/campus/screens/CampusFeatureScreen.tsx`
- `src/features/campus/screens/LibrariesScreen.tsx`
- `src/features/campus/hooks/useLibraryHours.ts`
- `src/features/campus/data/libraries.ts`

Campus acts as a utility hub and includes:

- quick access tiles
- clubs entry point
- libraries directory and profile pages
- feature pages for campus services

## 13. Profile System

Profile files:

- `src/features/profile/screens/ProfileHomeScreen.tsx`
- `src/features/profile/screens/EditProfileScreen.tsx`
- `src/features/profile/screens/MyPostsScreen.tsx`
- `src/features/profile/screens/SavedEventsScreen.tsx`
- `src/features/profile/screens/SettingsScreen.tsx`
- `src/features/profile/screens/ConnectionsScreen.tsx`
- `src/features/profile/hooks/useProfile.ts`

Profile is responsible for:

- showing the current user profile
- editing profile data
- showing posts
- showing saved events
- showing connections
- sign out

It connects with both:

- auth/user state
- social graph state

## 14. Services Layer

The `src/services` folder is the client-side gateway to backend and fallback logic.

Important files:

- `auth.ts` - OTP and auth server interactions
- `supabase.ts` - Supabase client configuration
- `search.ts` - search API calls plus local fallback normalization
- `social.ts` - social graph remote interactions
- `mapEvents.ts` - map/event remote interactions
- `profileMedia.ts` - avatar/media upload helpers
- `notifications.ts` - notification-related logic
- `events.ts`, `clubs.ts`, `feed.ts` - feature-specific server access helpers

This layer keeps screen code thinner and lets the app use one consistent place for:

- network calls
- normalization
- remote vs fallback behavior

## 15. Shared and Cross-Cutting Stores

### 15.1 Zustand stores

Important stores:

- `src/features/map/stores/useMapFilterStore.ts`
- `src/shared/stores/useCrossTabNavStore.ts`
- `src/shared/stores/useDemoAppStore.ts`
- `src/features/auth/stores/authStore.ts`
- `src/features/clubs/stores/useClubAdminStore.ts`

### 15.2 What they do

`useCrossTabNavStore`

- passes intent between tabs
- used for map focus and calendar focus handoffs

`useDemoAppStore`

- stores demo-mode mutations and local interactive state
- useful when backend is unavailable

`useMapFilterStore`

- stores map filter settings across navigation

`authStore`

- stores auth-flow UI state like current step / fields

`useClubAdminStore`

- stores mutable club admin demo state

## 16. Data Models

The main shared frontend data shapes live in:

- `src/shared/types/index.ts`

This file defines app-wide entities such as:

- user profile
- event
- club
- post
- media item
- RSVP / social metadata

It is the shared contract between:

- screens
- hooks
- services
- local mock data

## 17. Local Mock and Demo Data

The app includes local data seeds in:

- `src/assets/data/mockEvents.ts`
- `src/assets/data/mockFeed.ts`
- `src/assets/data/mockClubs.ts`
- `src/assets/data/buildings.ts`
- `src/features/social/data/mockSocialGraph.ts`

These are not just placeholders. They serve three useful purposes:

1. make the app feel populated during UI development
2. provide local fallback behavior when backend calls fail
3. allow the product to stay demoable without complete infrastructure

## 18. Supabase Architecture

### 18.1 Why Supabase is central

Supabase is the primary backend platform for xUMD.

It is used for:

- database
- authentication
- storage
- realtime subscriptions
- edge functions

### 18.2 Migrations

Database migrations live in `supabase/migrations`.

Major groups visible in the repo:

- social graph core and recommendation functions
- campus map events and campus locations
- RSVP atomic update functions
- event realtime and cron jobs
- unified search
- auth OTP and onboarding
- calendar sync

### 18.3 Edge functions

Edge functions live in `supabase/functions`.

Main functional groups:

#### Auth

- `request-otp`
- `check-username`
- `search-courses`

#### Feed / social graph

- `get-feed`
- `follow-user`
- `submit-post`
- `get-recommendations`
- `compute-feeds`
- `compute-recommendations`
- `compute-user-interests`
- `get-trending`
- `compute-trending`

#### Search

- `unified-search`
- `search-autocomplete`
- `search-semantic`
- `extract-search-filters`
- `search-events`

#### Map / events

- `get-map-events`
- `get-event-detail`
- `rsvp-event`
- `create-event`
- `report-event`

#### Calendar

- `calendar-feed`

### 18.4 Shared function utilities

Reusable function helpers live in `supabase/functions/_shared`.

These include:

- CORS helpers
- typed errors
- env access
- Supabase service client setup
- OpenAI helpers
- moderation helpers
- Redis helpers
- Meilisearch helpers
- feed and search orchestration helpers
- map helpers

This keeps the edge functions thin and composable.

## 19. Internal Runtime Flows

### 19.1 Auth flow

1. user enters UMD email
2. client calls auth service
3. service calls `request-otp` edge function
4. Supabase Auth sends email OTP
5. user enters OTP
6. client verifies OTP
7. session is stored through Supabase client + AsyncStorage
8. root navigator decides whether onboarding is needed

### 19.2 Search flow

1. user types query
2. frontend debounces input
3. autocomplete uses fast search path
4. full search uses unified search path
5. if backend is available, services call edge functions
6. if backend fails, local search fallback generates safe results
7. user can navigate from search into event, club, profile, or map focus

### 19.3 Map flow

1. map screen fetches event data
2. filters are applied through store + utilities
3. map data is converted into grouped/overlay-ready form
4. CampusMap renders platform-specific map primitives
5. selecting a group/building/route/zone updates local selection state
6. bottom sheets reflect current selection
7. user can jump into detail, directions, or calendar

### 19.4 Feed flow

1. screen requests feed data
2. service tries edge functions
3. fallback logic protects the UI if backend search/feed is incomplete
4. follow/recommendation state is merged with current viewer context
5. media rendering is delegated to the shared gallery/viewer

### 19.5 Calendar flow

1. hook aggregates multiple calendar sources
2. utilities compute layout and conflict information
3. screen renders day/week/month views
4. selecting entries opens detail sheet
5. user can hand off to map or deeper event/club routes

## 20. Web vs Native Behavior

The project is a single codebase, but some behaviors differ by platform.

### 20.1 Shared

- navigation
- most screen logic
- services
- stores
- most UI components

### 20.2 Platform-specific

- map renderer
- certain media and location behaviors
- native plugin usage
- dev-client behavior for native builds

The app is currently optimized to feel good on:

- phone portrait
- tablet widths
- desktop/web widths

## 21. Environment Variables

Common runtime environment variables include:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_MAPBOX_ACCESS_TOKEN`

Backend / function environment variables include:

- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `ANTHROPIC_API_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `MEILISEARCH_HOST`
- `MEILISEARCH_API_KEY`
- moderation-related provider keys

## 22. Build, Run, and Deploy

### 22.1 Local development

Main commands are defined in `package.json`.

Typical usage:

- `npm run web`
- `npm run start`
- `npm run android`
- `npm run ios`

### 22.2 Important note about native builds

Because xUMD uses native modules such as Mapbox, the project is set up for `expo-dev-client` rather than plain Expo Go for full native feature coverage.

### 22.3 EAS

EAS is used for:

- Android builds
- iOS builds
- environment-aware native distribution

## 23. How to Think About the Codebase

The easiest mental model is:

- `App.tsx` boots providers and navigation
- `RootNavigator` decides which high-level flow the user belongs in
- `MainTabs` defines the product shell
- each feature folder owns its screens and feature logic
- `services/` is the bridge to remote systems
- `shared/` contains the reusable foundation
- `supabase/` contains backend behavior and data model evolution

If you are trying to add something new, usually start with this question:

1. is this screen-level UI?
2. is this feature logic?
3. is this shared infrastructure?
4. is this backend logic or schema?

That answer usually tells you where the code should live.

## 24. Suggested Reading Order for New Contributors

If someone is new to the project, the best order is:

1. `package.json`
2. `App.tsx`
3. `src/providers/AppProviders.tsx`
4. `src/navigation/RootNavigator.tsx`
5. `src/navigation/MainTabs.tsx`
6. `src/navigation/types.ts`
7. `src/shared/types/index.ts`
8. `src/services/supabase.ts`
9. feature screen of interest
10. matching feature hook
11. matching service file
12. related edge function or migration if backend-connected

## 25. Current Architectural Strengths

- feature-based folder structure
- clear provider / navigation split
- backend-connected but still demo-safe
- shared design system
- responsive shell for web/tablet
- deep-link aware navigation
- separate map/search/feed/calendar systems rather than one monolith

## 26. Current Architectural Tradeoffs

- some features still mix local mock fallback with real backend mode
- a few older legacy aliases still exist in shared types
- there is no formal automated test suite yet
- some feature areas are more production-ready than others

These are normal for a fast-moving product, but they are useful to know before refactoring.

## 27. Summary

xUMD is a multi-surface campus platform with:

- Expo + React Native frontend
- React Navigation app shell
- shared responsive design system
- Supabase backend
- Mapbox-based campus map
- hybrid search and social graph architecture
- local-safe fallbacks for development and demos

The project is already structured in a way that supports continued scale, as long as new features keep following the same layering:

- feature code in `src/features`
- shared concerns in `src/shared`
- remote integration in `src/services`
- schema and server logic in `supabase`
