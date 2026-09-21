import type { YouTubeVideoDetails } from "@/lib/youtubeSearch";
import { parseYouTubeDuration } from "@/lib/youtubeDuration";

type YouTubeVideoResponse = { items?: Array<{ contentDetails?: { duration?: string } }>; error?: { message?: string } };

export async function GET(request: Request) {
  const videoId = new URL(request.url).searchParams.get("id")?.trim();
  if (!videoId) return Response.json({ error: "영상 ID가 필요합니다." }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return Response.json({ error: "YouTube API 키가 설정되지 않았습니다." }, { status: 503 });

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  Object.entries({ part: "contentDetails", id: videoId, key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));
  let response: Response;
  try { response = await fetch(url, { cache: "no-store" }); } catch { return Response.json({ error: "YouTube에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 }); }

  const payload = (await response.json().catch(() => null)) as YouTubeVideoResponse | null;
  if (!response.ok) {
    const error = response.status === 403 ? "YouTube API 할당량 또는 API 키 권한을 확인해주세요." : payload?.error?.message ?? "영상 정보를 불러오지 못했습니다.";
    return Response.json({ error }, { status: response.status });
  }

  const duration = payload?.items?.[0]?.contentDetails?.duration;
  const details: YouTubeVideoDetails = { videoId, durationSeconds: duration ? parseYouTubeDuration(duration) : null };
  return Response.json(details);
}
