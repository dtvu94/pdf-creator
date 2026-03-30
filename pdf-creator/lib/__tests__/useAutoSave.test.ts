/** @jest-environment jsdom */
import { renderHook, act } from "@testing-library/react";
import { draftKey, loadDraft, clearDraft, useAutoSave } from "../useAutoSave";
import type { Template } from "@/types/template";

const TEMPLATE: Template = {
  name: "Test",
  pageSize: "A4",
  pages: [{ id: "p1", elements: [] }],
  styles: { primaryColor: "#000" },
} as Template;

beforeEach(() => {
  localStorage.clear();
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

// ── draftKey ─────────────────────��──────────────────���───────────────────────

describe("draftKey", () => {
  it("returns prefixed key", () => {
    expect(draftKey("report")).toBe("pdf-creator-draft:report");
  });
});

// ── loadDraft ─────────────────���──────────────────────────────────────���──────

describe("loadDraft", () => {
  it("returns null when no draft exists", () => {
    expect(loadDraft("report")).toBeNull();
  });

  it("returns parsed template when draft exists", () => {
    localStorage.setItem("pdf-creator-draft:report", JSON.stringify(TEMPLATE));
    const draft = loadDraft("report");
    expect(draft).not.toBeNull();
    expect(draft!.name).toBe("Test");
    expect(draft!.pages).toHaveLength(1);
  });

  it("returns null when stored value is invalid JSON", () => {
    localStorage.setItem("pdf-creator-draft:report", "not-json{{{");
    expect(loadDraft("report")).toBeNull();
  });
});

// ── clearDraft ─────────────────────���────────────────────────────────────────

describe("clearDraft", () => {
  it("removes draft from localStorage", () => {
    localStorage.setItem("pdf-creator-draft:report", JSON.stringify(TEMPLATE));
    clearDraft("report");
    expect(localStorage.getItem("pdf-creator-draft:report")).toBeNull();
  });

  it("does nothing when no draft exists", () => {
    clearDraft("nonexistent");
    // No error
  });
});

// ── useAutoSave ─────────────────────────���───────────────────────────────────

describe("useAutoSave", () => {
  it("does NOT save on initial render", () => {
    renderHook(() => useAutoSave("report", TEMPLATE));
    jest.advanceTimersByTime(1000);
    expect(localStorage.getItem("pdf-creator-draft:report")).toBeNull();
  });

  it("saves to localStorage after debounce when template changes", () => {
    const { rerender } = renderHook(
      ({ id, tpl }) => useAutoSave(id, tpl),
      { initialProps: { id: "report", tpl: TEMPLATE } },
    );

    // Change template (triggers non-first render)
    const updated = { ...TEMPLATE, name: "Updated" };
    rerender({ id: "report", tpl: updated });

    // Before debounce — not saved yet
    expect(localStorage.getItem("pdf-creator-draft:report")).toBeNull();

    // After debounce
    act(() => { jest.advanceTimersByTime(900); });
    const saved = JSON.parse(localStorage.getItem("pdf-creator-draft:report")!);
    expect(saved.name).toBe("Updated");
  });

  it("debounces rapid changes (only last value is saved)", () => {
    const { rerender } = renderHook(
      ({ id, tpl }) => useAutoSave(id, tpl),
      { initialProps: { id: "report", tpl: TEMPLATE } },
    );

    // Multiple rapid changes
    rerender({ id: "report", tpl: { ...TEMPLATE, name: "V1" } as Template });
    act(() => { jest.advanceTimersByTime(200); });
    rerender({ id: "report", tpl: { ...TEMPLATE, name: "V2" } as Template });
    act(() => { jest.advanceTimersByTime(200); });
    rerender({ id: "report", tpl: { ...TEMPLATE, name: "V3" } as Template });

    // Wait for debounce
    act(() => { jest.advanceTimersByTime(900); });
    const saved = JSON.parse(localStorage.getItem("pdf-creator-draft:report")!);
    expect(saved.name).toBe("V3");
  });

  it("clears pending timer on unmount", () => {
    const { rerender, unmount } = renderHook(
      ({ id, tpl }) => useAutoSave(id, tpl),
      { initialProps: { id: "report", tpl: TEMPLATE } },
    );

    // Trigger a save
    rerender({ id: "report", tpl: { ...TEMPLATE, name: "WillNotSave" } as Template });

    // Unmount before debounce fires
    unmount();
    act(() => { jest.advanceTimersByTime(1000); });

    // Should NOT have saved
    expect(localStorage.getItem("pdf-creator-draft:report")).toBeNull();
  });

  it("handles localStorage.setItem throwing (storage full)", () => {
    const { rerender } = renderHook(
      ({ id, tpl }) => useAutoSave(id, tpl),
      { initialProps: { id: "report", tpl: TEMPLATE } },
    );

    // Mock setItem to throw
    const origSetItem = Storage.prototype.setItem;
    Storage.prototype.setItem = () => { throw new Error("QuotaExceededError"); };

    rerender({ id: "report", tpl: { ...TEMPLATE, name: "Full" } as Template });
    act(() => { jest.advanceTimersByTime(900); });

    // Should not crash
    Storage.prototype.setItem = origSetItem;
  });

  it("cleanup runs safely when timer has already fired", () => {
    const { rerender, unmount } = renderHook(
      ({ id, tpl }) => useAutoSave(id, tpl),
      { initialProps: { id: "report", tpl: TEMPLATE } },
    );

    // Trigger a save and let the debounce fire
    rerender({ id: "report", tpl: { ...TEMPLATE, name: "Saved" } as Template });
    act(() => { jest.advanceTimersByTime(900); });
    expect(JSON.parse(localStorage.getItem("pdf-creator-draft:report")!).name).toBe("Saved");

    // Now unmount — cleanup runs but timer already fired (timerRef.current may be non-null but expired)
    unmount();
    // Should not crash
  });
});
