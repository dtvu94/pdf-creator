"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Template } from "@/types/template";
import PdfEditor from "./PdfEditor";
import { getTemplateById } from "@/lib/templates";
import { loadDraft, clearDraft } from "@/lib/useAutoSave";

export default function EditorClient() {
  const router = useRouter();
  const params = useSearchParams();
  const templateId = params.get("t") ?? "report";
  const shareId = params.get("share");

  // Local state — regular template (draft or built-in)
  const { template: localTemplate, hasDraft } = useMemo(() => {
    const draft = loadDraft(templateId);
    if (draft) return { template: draft, hasDraft: true };
    return { template: getTemplateById(templateId), hasDraft: false };
  }, [templateId]);

  // Shared template loaded from server
  const [sharedTemplate, setSharedTemplate] = useState<Template | null>(null);
  const [shareLoading, setShareLoading] = useState(!!shareId);

  useEffect(() => {
    if (!shareId) return;
    setShareLoading(true);
    fetch(`/api/share/${shareId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.pages && Array.isArray(data.pages)) {
          setSharedTemplate(data as Template);
        }
      })
      .catch(() => { /* fall through to local template */ })
      .finally(() => setShareLoading(false));
  }, [shareId]);

  const initialTemplate = sharedTemplate ?? localTemplate;

  const [showBanner, setShowBanner] = useState(hasDraft && !shareId);
  const [discarded, setDiscarded] = useState(false);

  // If user discards, reload with a fresh template
  const activeTemplate = discarded ? getTemplateById(templateId) : initialTemplate;

  const handleBack = () => {
    clearDraft(templateId);
    router.push("/");
  };

  const handleDiscard = () => {
    clearDraft(templateId);
    setShowBanner(false);
    setDiscarded(true);
  };

  if (shareLoading) {
    return (
      <div className="loading-screen">
        Loading shared template...
      </div>
    );
  }

  return (
    <>
      {showBanner && (
        <div className="draft-banner">
          <span>Your previous work has been restored from a saved draft.</span>
          <button onClick={() => setShowBanner(false)} className="draft-banner-btn">
            Dismiss
          </button>
          <button onClick={handleDiscard} className="draft-banner-btn" style={{ background: "transparent", color: "#BFDBFE", borderColor: "rgba(255,255,255,0.2)" }}>
            Discard draft
          </button>
        </div>
      )}
      <PdfEditor
        key={discarded ? "fresh" : "draft"}
        initialTemplate={activeTemplate}
        templateId={templateId}
        onBack={handleBack}
      />
    </>
  );
}
