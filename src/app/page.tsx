"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthGate";
import { VideoCard } from "@/components/VideoCard";
import { getVideosWithLatestRecords } from "@/lib/storage";
import type { VideoWithLatestRecord } from "@/types";

export default function Home() {
  const { signOut } = useAuth();
  const [videos, setVideos] = useState<VideoWithLatestRecord[] | undefined>();
  const [error, setError] = useState("");

  useEffect(() => {
    let isCurrent = true;
    void getVideosWithLatestRecords()
      .then((items) => { if (isCurrent) setVideos(items); })
      .catch((requestError) => { if (isCurrent) setError(requestError instanceof Error ? requestError.message : "영상을 불러오지 못했습니다."); });
    return () => { isCurrent = false; };
  }, []);

  return <main className="app-shell home-page">
    <header className="home-header"><h1>시청중인 영상</h1><div className="header-actions"><Link href="/record" className="add-link"><span aria-hidden="true">+</span>기록 추가</Link><button type="button" className="signout-button" onClick={() => void signOut()}>로그아웃</button></div></header>
    {videos === undefined ? <section className="empty-state"><p>영상을 불러오는 중...</p></section> : error ? <section className="empty-state"><p>{error}</p><span>잠시 후 다시 시도해주세요.</span></section> : videos.length === 0 ? <section className="empty-state"><p>아직 기록된 영상이 없어요.</p><span>같이 보고 있는 영상을 추가해보세요.</span><Link href="/record" className="primary-button">첫 기록 추가</Link></section> : <section className="video-list" aria-label="최근 시청 영상">{videos.map((item) => <VideoCard key={item.video.id} {...item} />)}</section>}
  </main>;
}
