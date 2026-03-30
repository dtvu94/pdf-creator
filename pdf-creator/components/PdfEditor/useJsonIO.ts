import type { Template, TemplateFont } from "@/types/template";
import type { HistoryControls } from "@/lib/useHistory";
import { downloadJson } from "@/lib/utils";
import type { Section } from "./types";

interface UseJsonIOParams {
  template: Template;
  setTemplate: HistoryControls<Template>["set"];
  setSelectedIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActivePage: React.Dispatch<React.SetStateAction<number>>;
  setActiveSection: React.Dispatch<React.SetStateAction<Section>>;
  setLoadMissingFonts: React.Dispatch<React.SetStateAction<TemplateFont[]>>;
}

export function useJsonIO(params: UseJsonIOParams) {
  const {
    template,
    setTemplate,
    setSelectedIds,
    setActivePage,
    setActiveSection,
    setLoadMissingFonts,
  } = params;

  const saveJSON = () => downloadJson(template, "template.json");

  const loadJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const loaded: Template = JSON.parse(text);
      setTemplate(loaded);
      setSelectedIds(new Set());
      setActivePage(0);
      setActiveSection("body");

      const uploadedFonts = (loaded.fonts ?? []).filter((f) =>
        f.faces.some((fc) => fc.source === "uploaded"),
      );
      if (uploadedFonts.length > 0) {
        const refs = uploadedFonts.flatMap((f) =>
          f.faces.filter((fc) => fc.source === "uploaded").map((fc) => fc.ref),
        );
        try {
          const res = await fetch("/api/fonts/status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refs }),
          });
          const data = (await res.json()) as { missing: string[] };
          if (data.missing.length > 0) {
            const missingSet = new Set(data.missing);
            setLoadMissingFonts(
              uploadedFonts
                .map((f) => ({
                  ...f,
                  faces: f.faces.filter(
                    (fc) => fc.source === "uploaded" && missingSet.has(fc.ref),
                  ),
                }))
                .filter((f) => f.faces.length > 0),
            );
          }
        } catch {
          /* network error — skip */
        }
      }
    } catch {
      alert("Invalid JSON file");
    } finally {
      e.target.value = "";
    }
  };

  const copyTemplateToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(template, null, 2));
      alert("Template JSON copied to clipboard");
    } catch {
      alert("Failed to copy to clipboard");
    }
  };

  const pasteTemplateFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const loaded: Template = JSON.parse(text);
      if (!loaded.pages || !Array.isArray(loaded.pages)) {
        alert("Clipboard does not contain a valid template (missing pages)");
        return;
      }
      setTemplate(loaded);
      setSelectedIds(new Set());
      setActivePage(0);
      setActiveSection("body");
    } catch {
      alert("Failed to paste — clipboard does not contain valid template JSON");
    }
  };

  const shareAsUrl = async () => {
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(template),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(`Share failed: ${err.error ?? "Unknown error"}`);
        return;
      }
      const { id } = (await res.json()) as { id: string };
      const url = `${window.location.origin}${window.location.pathname}?share=${id}`;
      await navigator.clipboard.writeText(url);
      alert("Shareable URL copied to clipboard");
    } catch {
      alert("Failed to generate shareable URL");
    }
  };

  return { saveJSON, loadJSON, copyTemplateToClipboard, pasteTemplateFromClipboard, shareAsUrl };
}
