"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Template } from "@/types/template";

const STORAGE_PREFIX = "pdf-creator-draft:";
const DEBOUNCE_MS = 800;

/** Returns the localStorage key for a given template/editor session. */
export function draftKey(templateId: string): string {
  return `${STORAGE_PREFIX}${templateId}`;
}

/** Load a saved draft from localStorage. Returns null if none exists or parsing fails. */
export function loadDraft(templateId: string): Template | null {
  try {
    const raw = localStorage.getItem(draftKey(templateId));
    if (!raw) return null;
    return JSON.parse(raw) as Template;
  } catch {
    return null;
  }
}

/** Remove a saved draft from localStorage. */
export function clearDraft(templateId: string): void {
  localStorage.removeItem(draftKey(templateId));
}

/**
 * Auto-saves the template to localStorage whenever it changes (debounced).
 * Skips the initial render so the fresh/loaded template isn't immediately written.
 */
export function useAutoSave(templateId: string, template: Template): void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstRender = useRef(true);

  const save = useCallback(() => {
    try {
      localStorage.setItem(draftKey(templateId), JSON.stringify(template));
    } catch {
      // Storage full or unavailable — silently ignore
    }
  }, [templateId, template]);

  useEffect(() => {
    // Skip writing on the very first render (the template is either fresh or just restored)
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (timerRef.current) clearTimeout(timerRef.current);
    const timer = setTimeout(save, DEBOUNCE_MS);
    timerRef.current = timer;

    return () => { clearTimeout(timer); };
  }, [save]);
}
