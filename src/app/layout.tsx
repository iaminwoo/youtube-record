import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AuthGate } from "@/components/AuthGate";

export const metadata: Metadata = { title: "같이 보기", description: "같이 보는 영상의 시청 위치 기록" };

export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="ko"><body><AuthGate>{children}</AuthGate></body></html>;
}
