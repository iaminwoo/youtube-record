"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoPickerModal } from "@/components/VideoPickerModal";
import { formatWatchTime } from "@/lib/date";
import { createWatchRecord, deleteVideoAndWatchRecords, getLatestWatchRecordForVideo, getVideo, getVideosWithLatestRecords, updateVideoDuration } from "@/lib/storage";
import { getYouTubeVideoDetails } from "@/lib/youtubeSearch";
import type { Video, VideoWithLatestRecord, WatchRecord } from "@/types";

export function RecordPageClient() {
  const router = useRouter(); const searchParams = useSearchParams();
  const initialVideoId = searchParams.get("videoId") ?? undefined;
  const [videos, setVideos] = useState<VideoWithLatestRecord[]>([]); const [selectedVideo, setSelectedVideo] = useState<Video | undefined>(); const [latestRecord, setLatestRecord] = useState<WatchRecord | undefined>(); const [manualHours, setManualHours] = useState<string | undefined>(); const [manualMinutes, setManualMinutes] = useState<string | undefined>(); const [isPickerOpen, setIsPickerOpen] = useState(false); const [isDeleteSheetOpen, setIsDeleteSheetOpen] = useState(false); const [isSaving, setIsSaving] = useState(false); const [error, setError] = useState(""); const [isLoading, setIsLoading] = useState(true);
  const hours = manualHours ?? ""; const minutes = manualMinutes ?? "";
  const validTime = /^\d+$/.test(hours) && /^\d+$/.test(minutes) && Number(hours) >= 0 && Number(minutes) >= 0 && Number(minutes) <= 59;

  useEffect(() => {
    let isCurrent = true;
    void Promise.all([getVideosWithLatestRecords(), initialVideoId ? getVideo(initialVideoId) : Promise.resolve(undefined), initialVideoId ? getLatestWatchRecordForVideo(initialVideoId) : Promise.resolve(undefined)])
      .then(([items, video, record]) => { if (!isCurrent) return; setVideos(items); setSelectedVideo(video); setLatestRecord(record); })
      .catch((requestError) => { if (isCurrent) setError(requestError instanceof Error ? requestError.message : "기록을 불러오지 못했습니다."); })
      .finally(() => { if (isCurrent) setIsLoading(false); });
    return () => { isCurrent = false; };
  }, [initialVideoId]);

  useEffect(() => {
    if (!selectedVideo?.youtubeVideoId || selectedVideo.durationSeconds !== undefined) return;
    let isCurrent = true;
    void getYouTubeVideoDetails(selectedVideo.youtubeVideoId)
      .then(async (details) => {
        if (!isCurrent || details.durationSeconds === null) return;
        const updated = await updateVideoDuration(selectedVideo.id, details.durationSeconds);
        if (isCurrent && updated) setSelectedVideo(updated);
      })
      .catch(() => undefined);
    return () => { isCurrent = false; };
  }, [selectedVideo?.durationSeconds, selectedVideo?.id, selectedVideo?.youtubeVideoId]);

  async function selectVideo(video: Video) {
    setError(""); setSelectedVideo(video); setLatestRecord(undefined); setManualHours(undefined); setManualMinutes(undefined);
    try { setLatestRecord(await getLatestWatchRecordForVideo(video.id)); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "지난 기록을 불러오지 못했습니다."); }
  }
  async function saveRecord() {
    if (!selectedVideo || !validTime || isSaving) return;
    setIsSaving(true); setError("");
    try { await createWatchRecord(selectedVideo.id, Number(hours) * 60 + Number(minutes)); router.push("/"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "기록을 저장하지 못했습니다."); } finally { setIsSaving(false); }
  }
  async function deleteVideo() {
    if (!selectedVideo || isSaving) return;
    setIsSaving(true); setError("");
    try { await deleteVideoAndWatchRecords(selectedVideo.id); router.push("/"); } catch (requestError) { setError(requestError instanceof Error ? requestError.message : "영상을 삭제하지 못했습니다."); setIsDeleteSheetOpen(false); } finally { setIsSaving(false); }
  }

  return <main className="app-shell record-page"><header className="record-header"><button type="button" className="back-button" onClick={() => router.back()} aria-label="뒤로가기">←</button><h1>기록 추가</h1><span /></header><div className="record-content">
    {isLoading ? <p className="search-hint">기록을 불러오는 중...</p> : <><section><p className="section-label">영상</p>{selectedVideo ? <button type="button" className="selected-video" onClick={() => setIsPickerOpen(true)}><div className="record-thumbnail" aria-hidden="true" style={selectedVideo.thumbnailUrl ? { backgroundImage: `url("${selectedVideo.thumbnailUrl}")` } : undefined}>{selectedVideo.thumbnailUrl ? null : <span>▶</span>}</div><span className="selected-video-details"><span className="channel-title">{selectedVideo.channelTitle ?? "채널 정보 없음"}</span><strong>{selectedVideo.title}</strong><span>지난 기록</span><span>{formatWatchTime(latestRecord?.watchedUntilMinutes ?? 0)}까지</span></span></button> : <button type="button" className="choose-video" onClick={() => setIsPickerOpen(true)}><span>영상 선택하기</span><span aria-hidden="true">›</span></button>}</section>
    {selectedVideo && <section className="minutes-section"><p className="section-label">어디까지 봤나요?</p><div className="time-input-wrap"><label><input id="hours" className="time-input" inputMode="numeric" pattern="[0-9]*" value={hours} onChange={(event) => setManualHours(event.target.value.replace(/[^0-9]/g, ""))} aria-label="시간" autoFocus /><span>시간</span></label><label><input id="minutes" className="time-input" inputMode="numeric" pattern="[0-9]*" value={minutes} onChange={(event) => setManualMinutes(event.target.value.replace(/[^0-9]/g, ""))} aria-label="분" /><span>분</span></label></div></section>}</>}
    {error && <p className="search-error" role="alert">{error}</p>}
  </div><div className="save-area"><button type="button" className="primary-button" disabled={!selectedVideo || !validTime || isSaving} onClick={() => void saveRecord()}>{isSaving ? "저장 중..." : "저장"}</button><button type="button" className="delete-button" disabled={!selectedVideo || isSaving} onClick={() => setIsDeleteSheetOpen(true)}>기록 삭제</button></div>{isPickerOpen && <VideoPickerModal videos={videos} onClose={() => setIsPickerOpen(false)} onSelect={selectVideo} />}{isDeleteSheetOpen && selectedVideo && <div className="modal-backdrop" role="presentation" onMouseDown={() => setIsDeleteSheetOpen(false)}><section className="bottom-sheet delete-sheet" role="dialog" aria-modal="true" aria-labelledby="delete-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" /><div className="sheet-heading"><h2 id="delete-title">기록 삭제</h2><button type="button" className="close-button" onClick={() => setIsDeleteSheetOpen(false)} aria-label="닫기">×</button></div><p className="delete-description">이 영상을 삭제하면 관련된 모든 시청 기록도 함께 삭제됩니다. 삭제한 기록은 되돌릴 수 없어요.</p><div className="delete-actions"><button type="button" className="outline-button" disabled={isSaving} onClick={() => setIsDeleteSheetOpen(false)}>취소</button><button type="button" className="danger-button" disabled={isSaving} onClick={() => void deleteVideo()}>{isSaving ? "삭제 중..." : "삭제하기"}</button></div></section></div>}</main>;
}
