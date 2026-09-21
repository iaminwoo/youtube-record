import type { YouTubeSearchResult } from "@/lib/youtubeSearch";

type YouTubeApiResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: { title?: string; channelTitle?: string; thumbnails?: { high?: { url?: string }; medium?: { url?: string }; default?: { url?: string } } };
  }>;
  error?: { message?: string };
};

function decodeHtmlEntities(value: string) {
  const namedEntities: Record<string, string> = { amp: "&", quot: '"', apos: "'", lt: "<", gt: ">", nbsp: " " };
  return value.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
    const normalized = String(code).toLowerCase();
    const numericValue = normalized.startsWith("#x") ? Number.parseInt(normalized.slice(2), 16) : normalized.startsWith("#") ? Number.parseInt(normalized.slice(1), 10) : undefined;
    if (numericValue !== undefined) return Number.isSafeInteger(numericValue) && numericValue >= 0 && numericValue <= 0x10ffff ? String.fromCodePoint(numericValue) : entity;
    return namedEntities[normalized] ?? entity;
  });
}

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q")?.trim();
  if (!query) return Response.json({ error: "검색어를 입력해주세요." }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return Response.json({ error: "YouTube API 키가 설정되지 않았습니다." }, { status: 503 });

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  Object.entries({ part: "snippet", type: "video", q: query, maxResults: "8", regionCode: "KR", relevanceLanguage: "ko", key: apiKey }).forEach(([key, value]) => url.searchParams.set(key, value));

  let response: Response;
  try {
    response = await fetch(url, { cache: "no-store" });
  } catch {
    return Response.json({ error: "YouTube에 연결하지 못했습니다. 잠시 후 다시 시도해주세요." }, { status: 502 });
  }

  const payload = (await response.json().catch(() => null)) as YouTubeApiResponse | null;
  if (!response.ok) {
    const error = response.status === 403 ? "YouTube API 할당량 또는 API 키 권한을 확인해주세요." : payload?.error?.message ?? "YouTube 검색에 실패했습니다.";
    return Response.json({ error }, { status: response.status });
  }

  const results: YouTubeSearchResult[] = (payload?.items ?? []).flatMap((item) => {
    const videoId = item.id?.videoId;
    const title = item.snippet?.title;
    const thumbnailUrl = item.snippet?.thumbnails?.high?.url ?? item.snippet?.thumbnails?.medium?.url ?? item.snippet?.thumbnails?.default?.url;
    if (!videoId || !title || !thumbnailUrl) return [];
    return [{ videoId, title: decodeHtmlEntities(title), channelTitle: decodeHtmlEntities(item.snippet?.channelTitle ?? ""), thumbnailUrl }];
  });

  return Response.json(results);
}
