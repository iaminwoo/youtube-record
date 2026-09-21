import { Suspense } from "react";
import { RecordPageClient } from "@/components/RecordPageClient";

export default function RecordPage() {
  return <Suspense fallback={<main className="app-shell record-page" />}><RecordPageClient /></Suspense>;
}
