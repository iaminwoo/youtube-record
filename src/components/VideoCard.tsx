import Link from "next/link";
import { formatRecordDate, formatWatchTime } from "@/lib/date";
import type { VideoWithLatestRecord } from "@/types";

export function VideoCard({ video, latestRecord }: VideoWithLatestRecord) {
  const progress = latestRecord && video.durationSeconds && video.durationSeconds > 0 ? Math.min(Math.max((latestRecord.watchedUntilMinutes * 60) / video.durationSeconds, 0), 1) : null;
  return <Link href={`/record?videoId=${encodeURIComponent(video.id)}`} className="video-card">
    <div className="thumbnail-placeholder" aria-hidden="true" style={video.thumbnailUrl ? { backgroundImage: `url("${video.thumbnailUrl}")` } : undefined}>{video.thumbnailUrl ? null : <span>▶</span>}</div>
    <div className="video-card-body"><div className="card-topline"><p className="channel-title">{video.channelTitle ?? "채널 정보 없음"}</p><span className="card-date">{formatRecordDate(latestRecord?.createdAt ?? video.createdAt)}</span></div><p className="video-title">{video.title}</p>{latestRecord ? <div className="video-meta watch-status">{formatWatchTime(latestRecord.watchedUntilMinutes)}까지 시청</div> : <span className="video-meta watch-status">아직 시청 기록이 없어요</span>}{progress !== null && <div className="watch-progress" aria-label="시청 진행률"><span style={{ width: `${progress * 100}%` }} /></div>}</div>
    <span className="card-arrow" aria-hidden="true">›</span>
  </Link>;
}
