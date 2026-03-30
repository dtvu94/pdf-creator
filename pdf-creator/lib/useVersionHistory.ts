"use client";

import { useState, useCallback } from "react";
import type { Template } from "@/types/template";

const STORAGE_PREFIX = "pdf-creator-versions:";
const MAX_VERSIONS = 50;

export interface TemplateVersion {
  id: string;
  label: string;
  timestamp: string;
  template: Template;
}

function storageKey(templateId: string): string {
  return `${STORAGE_PREFIX}${templateId}`;
}

function loadVersions(templateId: string): TemplateVersion[] {
  try {
    const raw = localStorage.getItem(storageKey(templateId));
    if (!raw) return [];
    return JSON.parse(raw) as TemplateVersion[];
  } catch {
    return [];
  }
}

function persistVersions(templateId: string, versions: TemplateVersion[]): void {
  try {
    localStorage.setItem(storageKey(templateId), JSON.stringify(versions));
  } catch {
    // Storage full — silently ignore
  }
}

export function useVersionHistory(templateId: string) {
  const [versions, setVersions] = useState<TemplateVersion[]>(() => loadVersions(templateId));

  const saveVersion = useCallback((template: Template, label?: string) => {
    const version: TemplateVersion = {
      id: `v-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      label: label || `Version ${versions.length + 1}`,
      timestamp: new Date().toISOString(),
      template: JSON.parse(JSON.stringify(template)),
    };
    const updated = [version, ...versions].slice(0, MAX_VERSIONS);
    setVersions(updated);
    persistVersions(templateId, updated);
    return version;
  }, [templateId, versions]);

  const deleteVersion = useCallback((versionId: string) => {
    const updated = versions.filter((v) => v.id !== versionId);
    setVersions(updated);
    persistVersions(templateId, updated);
  }, [templateId, versions]);

  const clearVersions = useCallback(() => {
    setVersions([]);
    localStorage.removeItem(storageKey(templateId));
  }, [templateId]);

  return { versions, saveVersion, deleteVersion, clearVersions };
}
