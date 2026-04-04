# xUMD Social Graph Deployment Notes

## 1. Database
- Run `supabase/migrations/20260404_twitter_like_social_graph.sql`.
- This creates the public social graph tables, vector indexes, storage bucket rules, and a compatibility `profiles` view.

## 2. Edge Functions
Deploy these functions after setting the env vars from `.env.example`:
- `submit-post`
- `get-feed`
- `get-recommendations`
- `get-trending`
- `follow-user`
- `compute-user-interests`
- `compute-recommendations`
- `compute-trending`
- `compute-feeds`

## 3. Scheduling
Recommended cron cadence:
- `compute-trending`: every 5 minutes
- `compute-feeds`: every 15 minutes
- `compute-user-interests`: every 6 hours
- `compute-recommendations`: every 2 hours

## 4. Search
- Create Meilisearch indexes: `users`, `posts`
- The current edge functions already push documents into those indexes when env vars are set.

## 5. Media
- Posts upload into the private `social-media` bucket.
- The feed functions sign stored media paths before returning them to the client.
- The React Native app still uses the existing local composer fallback until device-side upload/base64 packaging is wired for media submissions.

## 6. Client Mode
- If `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_ANON_KEY` are present, Feed/Profile/Connections will use the backend-backed hybrid hooks.
- If they are missing, the app falls back to the local demo social/feed data.