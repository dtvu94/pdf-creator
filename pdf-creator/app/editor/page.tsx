import { Suspense } from "react";
import EditorClient from "@/components/EditorClient";

export default function EditorPage() {
  return (
    <Suspense fallback={
      <div className="loading-screen">Loading editor…</div>
    }>
      <EditorClient />
    </Suspense>
  );
}
