-- YouTube watch-record app schema for the shared personal-db Supabase project.
-- All app-specific objects use the youtube_ prefix to avoid collisions.

create table public.youtube_videos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (btrim(title) <> ''),
  channel_title text,
  thumbnail_url text,
  youtube_video_id text unique,
  duration_seconds integer check (duration_seconds is null or duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create table public.youtube_watch_records (
  id uuid primary key default gen_random_uuid(),
  video_id uuid not null references public.youtube_videos(id) on delete cascade,
  watched_until_minutes integer not null check (watched_until_minutes >= 0),
  created_at timestamptz not null default now()
);

-- Supports retrieving one video's newest record.
create index youtube_watch_records_video_id_created_at_desc_idx
  on public.youtube_watch_records (video_id, created_at desc);

-- Supports ordering the home list by recently added watch records.
create index youtube_watch_records_created_at_desc_idx
  on public.youtube_watch_records (created_at desc);

alter table public.youtube_videos enable row level security;
alter table public.youtube_watch_records enable row level security;

create policy youtube_videos_authenticated_select
  on public.youtube_videos for select to authenticated using (true);

create policy youtube_videos_authenticated_insert
  on public.youtube_videos for insert to authenticated with check (true);

-- Required when a selected video's duration_seconds is fetched later.
create policy youtube_videos_authenticated_update
  on public.youtube_videos for update to authenticated using (true) with check (true);

-- Required for the app's "delete video and all related records" action.
create policy youtube_videos_authenticated_delete
  on public.youtube_videos for delete to authenticated using (true);

create policy youtube_watch_records_authenticated_select
  on public.youtube_watch_records for select to authenticated using (true);

create policy youtube_watch_records_authenticated_insert
  on public.youtube_watch_records for insert to authenticated with check (true);
