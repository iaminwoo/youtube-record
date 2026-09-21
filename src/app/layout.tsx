import { AuthGate } from "@/components/AuthGate";
import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "시청기록",
  description: "유튜브 시청기록",

  manifest: "/manifest.json",

  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },

  appleWebApp: {
    capable: true,
    title: "시청기록",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#fffdfa",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <AuthGate>{children}</AuthGate>
      </body>
    </html>
  );
}
