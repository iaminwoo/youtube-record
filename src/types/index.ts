export type Video = {
  id: string;
  title: string;
  channelTitle?: string;
  thumbnailUrl?: string;
  youtubeVideoId?: string;
  durationSeconds?: number;
  createdAt: string;
};

export type WatchRecord = {
  id: string;
  videoId: string;
  watchedUntilMinutes: number;
  createdAt: string;
};

export type VideoWithLatestRecord = {
  video: Video;
  latestRecord?: WatchRecord;
};
