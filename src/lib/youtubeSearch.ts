export type YouTubeSearchResult = { videoId: string; title: string; channelTitle: string; thumbnailUrl: string };
export type YouTubeVideoDetails = { videoId: string; durationSeconds: number | null };

export async function searchYouTube(query: string): Promise<YouTubeSearchResult[]> {
  const trimmedQuery = query.trim();
  if (!trimmedQuery) throw new Error("검색어를 입력해주세요.");

  let response: Response;
  try {
    response = await fetch(`/api/youtube/search?q=${encodeURIComponent(trimmedQuery)}`);
  } catch {
    throw new Error("네트워크 연결을 확인한 뒤 다시 검색해주세요.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message = typeof payload === "object" && payload && "error" in payload && typeof payload.error === "string" ? payload.error : "YouTube 검색에 실패했습니다.";
    throw new Error(message);
  }
  if (!Array.isArray(payload)) throw new Error("검색 결과를 불러오지 못했습니다.");
  return payload as YouTubeSearchResult[];
}

export async function getYouTubeVideoDetails(videoId: string): Promise<YouTubeVideoDetails> {
  let response: Response;
  try {
    response = await fetch(`/api/youtube/video?id=${encodeURIComponent(videoId)}`);
  } catch {
    throw new Error("영상 정보를 불러오지 못했습니다.");
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok || !payload || typeof payload !== "object" || !("videoId" in payload) || !("durationSeconds" in payload)) {
    throw new Error("영상 정보를 불러오지 못했습니다.");
  }
  return payload as YouTubeVideoDetails;
}
