import type { YouTubeSearchResult } from "@/lib/youtubeSearch";
import { getSupabaseClient } from "@/lib/supabase/client";
import type { Video, VideoWithLatestRecord, WatchRecord } from "@/types";

type VideoRow = { id: string; title: string; channel_title: string | null; thumbnail_url: string | null; youtube_video_id: string | null; duration_seconds: number | null; created_at: string };
type WatchRecordRow = { id: string; video_id: string; watched_until_minutes: number; created_at: string };
const toVideo = (row: VideoRow): Video => ({ id: row.id, title: row.title, ...(row.channel_title ? { channelTitle: row.channel_title } : {}), ...(row.thumbnail_url ? { thumbnailUrl: row.thumbnail_url } : {}), ...(row.youtube_video_id ? { youtubeVideoId: row.youtube_video_id } : {}), ...(row.duration_seconds === null ? {} : { durationSeconds: row.duration_seconds }), createdAt: row.created_at });
const toRecord = (row: WatchRecordRow): WatchRecord => ({ id: row.id, videoId: row.video_id, watchedUntilMinutes: row.watched_until_minutes, createdAt: row.created_at });
function fail(error: { message: string; code?: string } | null) { if (error) { console.error("Supabase request failed:", error); throw Object.assign(new Error("데이터 요청에 실패했습니다. 잠시 후 다시 시도해주세요."), { code: error.code }); } }

export async function getVideos() { const { data, error } = await getSupabaseClient().from("youtube_videos").select("*").order("created_at", { ascending: false }); fail(error); return (data as VideoRow[]).map(toVideo); }
export async function getVideo(id: string) { const { data, error } = await getSupabaseClient().from("youtube_videos").select("*").eq("id", id).maybeSingle(); fail(error); return data ? toVideo(data as VideoRow) : undefined; }
export async function findVideoByYouTubeId(id: string) { const { data, error } = await getSupabaseClient().from("youtube_videos").select("*").eq("youtube_video_id", id).maybeSingle(); fail(error); return data ? toVideo(data as VideoRow) : undefined; }
export async function createVideoFromYouTubeResult(result: YouTubeSearchResult, durationSeconds?: number) {
  const existing = await findVideoByYouTubeId(result.videoId); if (existing) return existing;
  const { data, error } = await getSupabaseClient().from("youtube_videos").insert({ title: result.title, channel_title: result.channelTitle, thumbnail_url: result.thumbnailUrl, youtube_video_id: result.videoId, ...(durationSeconds === undefined ? {} : { duration_seconds: durationSeconds }) }).select("*").single();
  if (error?.code === "23505") { const duplicate = await findVideoByYouTubeId(result.videoId); if (duplicate) return duplicate; }
  fail(error); return toVideo(data as VideoRow);
}
export async function updateVideoDuration(id: string, durationSeconds: number) { const { data, error } = await getSupabaseClient().from("youtube_videos").update({ duration_seconds: durationSeconds }).eq("id", id).select("*").maybeSingle(); fail(error); return data ? toVideo(data as VideoRow) : undefined; }
export async function getWatchRecords() { const { data, error } = await getSupabaseClient().from("youtube_watch_records").select("*").order("created_at", { ascending: false }); fail(error); return (data as WatchRecordRow[]).map(toRecord); }
export async function createWatchRecord(videoId: string, minutes: number) { const { data, error } = await getSupabaseClient().from("youtube_watch_records").insert({ video_id: videoId, watched_until_minutes: minutes }).select("*").single(); fail(error); return toRecord(data as WatchRecordRow); }
export async function deleteVideoAndWatchRecords(id: string) { const { error } = await getSupabaseClient().from("youtube_videos").delete().eq("id", id); fail(error); }
export async function getLatestWatchRecordForVideo(id: string) { const { data, error } = await getSupabaseClient().from("youtube_watch_records").select("*").eq("video_id", id).order("created_at", { ascending: false }).limit(1).maybeSingle(); fail(error); return data ? toRecord(data as WatchRecordRow) : undefined; }
export async function getVideosWithLatestRecords(): Promise<VideoWithLatestRecord[]> { const [videos, records] = await Promise.all([getVideos(), getWatchRecords()]); const latest = new Map<string, WatchRecord>(); records.forEach((record) => { if (!latest.has(record.videoId)) latest.set(record.videoId, record); }); return videos.map((video) => ({ video, latestRecord: latest.get(video.id) })).sort((a, b) => (b.latestRecord?.createdAt ?? b.video.createdAt).localeCompare(a.latestRecord?.createdAt ?? a.video.createdAt)); }
