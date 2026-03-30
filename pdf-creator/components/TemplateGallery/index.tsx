"use client";

import { useRouter } from "next/navigation";
import { TEMPLATE_REGISTRY } from "@/lib/templates";
import BlankCard from "./BlankCard";
import TemplateCard from "./TemplateCard";

export default function TemplateGallery() {
  const router = useRouter();

  const open = (id: string) => router.push(`/editor?t=${id}`);

  return (
    <div style={{ minHeight: "100vh" }} className="bg-slate-100 font-system">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="gallery-header">
        <span style={{ color: "#F1F5F9", fontWeight: 700, fontSize: 15 }}>📄 PDF Creator</span>
        <div className="flex-1" />
        <button onClick={() => open("blank")} className="gallery-new-btn">
          + New template
        </button>
      </div>

      {/* ── Body ───────────────────────────────────────────────────────────── */}
      <div className="gallery-body">
        <h1 style={{ fontSize: 20, fontWeight: 700, color: "#1E293B", marginBottom: 4, marginTop: 0 }}>
          Choose a template
        </h1>
        <p style={{ fontSize: 13, color: "#64748B", marginBottom: 28, marginTop: 0 }}>
          Select an existing template to open in the editor, or start from scratch.
        </p>

        <div className="gallery-grid">
          {TEMPLATE_REGISTRY.map((info) => (
            <TemplateCard key={info.id} info={info} onOpen={() => open(info.id)} />
          ))}
          <BlankCard onOpen={() => open("blank")} />
        </div>
      </div>
    </div>
  );
}
