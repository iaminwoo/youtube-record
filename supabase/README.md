# YouTube Supabase schema

This app will use the shared `personal-db` Supabase project. Its database is intended for multiple small personal apps, so this migration creates only YouTube-app objects and uses the `youtube_` prefix throughout.

## Migration

Run [001_youtube_initial_schema.sql](migrations/001_youtube_initial_schema.sql) with the Supabase CLI, or paste it into the Supabase Dashboard **SQL Editor** and run it once. It creates:

- `public.youtube_videos` — video title, channel title, thumbnail URL, unique YouTube video ID, optional duration in seconds, and creation timestamp.
- `public.youtube_watch_records` — append-only watch positions in minutes, linked to a video with `on delete cascade`.

The database uses `uuid` IDs, which map naturally to the current string IDs in the TypeScript app.

## Constraints and indexes

- Video titles are required and cannot be blank.
- `youtube_video_id` is unique when present, preventing duplicate YouTube videos while allowing legacy/manual rows with no ID.
- `duration_seconds` and `watched_until_minutes` cannot be negative.
- `youtube_watch_records(video_id, created_at desc)` supports finding a video's latest record.
- `youtube_watch_records(created_at desc)` supports ordering the home list by recent viewing activity.
- Deleting a `youtube_videos` row cascades to its related watch records.

## RLS

RLS is enabled only on these two `youtube_` tables. No policy is created for `anon`, so anonymous users cannot read or write them.

The shared couple account signs in through Supabase Auth, and the `authenticated` role can:

- read, insert, update, and delete `youtube_videos` (update is required for duration backfill; delete supports the existing delete-video action);
- read and insert `youtube_watch_records`.

There are intentionally no direct update or delete policies for watch records. The current app only appends records; deleting a video uses the foreign-key cascade to remove its records. There is no `user_id` column because the app deliberately uses one shared Auth account rather than per-user data separation.

These policies apply only to `youtube_videos` and `youtube_watch_records`; they do not grant access to, modify, or depend on tables for other apps in `personal-db`.

## Dashboard checklist

1. Create or confirm the shared Supabase Auth account that this app will use.
2. Run the migration in SQL Editor (or via the Supabase CLI) against `personal-db`.
3. Later, when the Next.js/Auth integration is implemented, add these values to the app's local environment file:

   ```text
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   ```

Do not place a service-role key in a `NEXT_PUBLIC_` variable or browser code.
