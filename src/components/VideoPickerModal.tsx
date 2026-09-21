"use client";

import { useMemo, useState } from "react";
import { createVideoFromYouTubeResult, findVideoByYouTubeId, updateVideoDuration } from "@/lib/storage";
import { getYouTubeVideoDetails, searchYouTube, type YouTubeSearchResult } from "@/lib/youtubeSearch";
import { formatWatchTime } from "@/lib/date";
import type { Video, VideoWithLatestRecord } from "@/types";

type Props = { videos: VideoWithLatestRecord[]; onClose: () => void; onSelect: (video: Video) => void | Promise<void>; };

export function VideoPickerModal({ videos, onClose, onSelect }: Props) {
  const [query, setQuery] = useState(""); const [youtubeResults, setYoutubeResults] = useState<YouTubeSearchResult[] | null>(null); const [isSearching, setIsSearching] = useState(false); const [selectingVideoId, setSelectingVideoId] = useState<string | undefined>(); const [errorMessage, setErrorMessage] = useState<string | undefined>();
  const matches = useMemo(() => videos.filter(({ video }) => video.title.toLowerCase().includes(query.trim().toLowerCase())), [query, videos]);
  async function handleYouTubeSearch() { if (!query.trim()) return; setIsSearching(true); setErrorMessage(undefined); setYoutubeResults(null); try { setYoutubeResults(await searchYouTube(query)); } catch (error) { setErrorMessage(error instanceof Error ? error.message : "YouTube 검색에 실패했습니다."); } finally { setIsSearching(false); } }
  function handleQueryChange(value: string) { setQuery(value); setYoutubeResults(null); setErrorMessage(undefined); }
  async function finishSelection(video: Video) { await onSelect(video); onClose(); }
  async function selectExistingVideo(video: Video) {
    if (selectingVideoId) return;
    setSelectingVideoId(video.id); setErrorMessage(undefined);
    try {
      if (!video.youtubeVideoId || video.durationSeconds !== undefined) { await finishSelection(video); return; }
      const details = await getYouTubeVideoDetails(video.youtubeVideoId);
      const updated = details.durationSeconds === null ? video : await updateVideoDuration(video.id, details.durationSeconds) ?? video;
      await finishSelection(updated);
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "영상을 선택하지 못했습니다."); } finally { setSelectingVideoId(undefined); }
  }
  async function selectYouTubeVideo(result: YouTubeSearchResult) {
    if (selectingVideoId) return;
    setSelectingVideoId(result.videoId); setErrorMessage(undefined);
    try {
      const existing = await findVideoByYouTubeId(result.videoId);
      if (existing) {
        if (existing.durationSeconds === undefined) {
          let selected = existing;
          try { const details = await getYouTubeVideoDetails(result.videoId); if (details.durationSeconds !== null) selected = await updateVideoDuration(existing.id, details.durationSeconds) ?? existing; } catch { /* Duration is optional. */ }
          await finishSelection(selected);
        } else await finishSelection(existing);
        return;
      }
      let durationSeconds: number | undefined;
      try { const details = await getYouTubeVideoDetails(result.videoId); durationSeconds = details.durationSeconds ?? undefined; } catch { /* Duration is optional. */ }
      await finishSelection(await createVideoFromYouTubeResult(result, durationSeconds));
    } catch (error) { setErrorMessage(error instanceof Error ? error.message : "영상을 저장하지 못했습니다."); } finally { setSelectingVideoId(undefined); }
  }
  const isSelecting = (id: string) => selectingVideoId === id;
  return <div className="modal-backdrop" role="presentation" onMouseDown={onClose}><section className="bottom-sheet" role="dialog" aria-modal="true" aria-labelledby="picker-title" onMouseDown={(event) => event.stopPropagation()}><div className="sheet-handle" /><div className="sheet-heading"><h2 id="picker-title">영상 선택</h2><button type="button" className="close-button" onClick={onClose} aria-label="닫기">×</button></div><input className="text-input search-input" value={query} onChange={(event) => handleQueryChange(event.target.value)} placeholder="영상 제목 검색..." autoFocus />
    {!query.trim() && matches.length > 0 && <VideoList videos={matches} isSelecting={isSelecting} onSelect={selectExistingVideo} />}
    {query.trim() && <>{matches.length > 0 ? <VideoList heading="기존 영상" videos={matches} isSelecting={isSelecting} onSelect={selectExistingVideo} /> : <p className="search-hint">등록된 영상에서 찾지 못했어요.</p>}<button type="button" className="youtube-search-button" disabled={isSearching || Boolean(selectingVideoId)} onClick={handleYouTubeSearch}>{isSearching ? "검색 중..." : `YouTube에서 “${query.trim()}” 검색`}</button></>}
    {errorMessage && <p className="search-error" role="alert">{errorMessage}</p>}
    {youtubeResults && <div className="youtube-results"><p className="section-label">YouTube 검색 결과</p>{youtubeResults.length > 0 ? youtubeResults.map((result) => <button key={result.videoId} type="button" className="youtube-result" disabled={Boolean(selectingVideoId)} onClick={() => selectYouTubeVideo(result)}><div className="youtube-thumbnail" style={{ backgroundImage: `url("${result.thumbnailUrl}")` }} /><span><strong>{result.title}</strong><small>{result.channelTitle}</small></span><span className="select-text">{isSelecting(result.videoId) ? "불러오는 중..." : "선택"}</span></button>) : <p className="search-hint">검색 결과가 없어요.</p>}</div>}
  </section></div>;
}

function VideoList({ heading = "최근 영상", videos, isSelecting, onSelect }: { heading?: string; videos: VideoWithLatestRecord[]; isSelecting: (id: string) => boolean; onSelect: (video: Video) => Promise<void>; }) {
  return <div className="picker-list"><p className="section-label">{heading}</p>{videos.map(({ video, latestRecord }) => <button key={video.id} type="button" className="picker-item" disabled={isSelecting(video.id)} onClick={() => void onSelect(video)}><span><small className="channel-title">{video.channelTitle ?? "채널 정보 없음"}</small><strong>{video.title}</strong><small>{latestRecord ? `지난 기록 ${formatWatchTime(latestRecord.watchedUntilMinutes)}` : "아직 시청 기록이 없어요"}</small></span><span className="select-text">{isSelecting(video.id) ? "불러오는 중..." : "선택"}</span></button>)}</div>;
}
