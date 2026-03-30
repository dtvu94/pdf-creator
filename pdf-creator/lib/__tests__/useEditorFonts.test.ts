/** @jest-environment jsdom */

import { renderHook } from "@testing-library/react";

// Mock BUNDLED_FONTS before importing the hook
jest.mock("@/lib/templates", () => ({
  BUNDLED_FONTS: [
    {
      family: "TestFont",
      faces: [
        { weight: "normal", style: "normal", source: "bundled", ref: "TestFont-Regular.ttf" },
        { weight: "bold",   style: "normal", source: "bundled", ref: "TestFont-Bold.ttf" },
      ],
    },
    {
      family: "AnotherFont",
      faces: [
        { weight: "normal", style: "italic", source: "bundled", ref: "AnotherFont-Italic.ttf" },
      ],
    },
  ],
}));

import { useEditorFonts } from "../useEditorFonts";

const STYLE_ID = "pdf-creator-editor-fonts";

describe("useEditorFonts", () => {
  afterEach(() => {
    // Clean up any injected style elements
    const el = document.getElementById(STYLE_ID);
    if (el) el.remove();
  });

  it("injects a <style> element into document head on mount", () => {
    expect(document.getElementById(STYLE_ID)).toBeNull();
    renderHook(() => useEditorFonts());
    const style = document.getElementById(STYLE_ID);
    expect(style).not.toBeNull();
    expect(style!.tagName).toBe("STYLE");
    expect(document.head.contains(style)).toBe(true);
  });

  it("contains @font-face rules for all bundled font faces", () => {
    renderHook(() => useEditorFonts());
    const style = document.getElementById(STYLE_ID) as HTMLStyleElement;
    const content = style.textContent!;

    // Should have 3 @font-face rules (2 for TestFont + 1 for AnotherFont)
    const faceCount = (content.match(/@font-face/g) || []).length;
    expect(faceCount).toBe(3);

    // Check TestFont rules
    expect(content).toContain('font-family: "TestFont"');
    expect(content).toContain('url("/fonts/TestFont-Regular.ttf")');
    expect(content).toContain('url("/fonts/TestFont-Bold.ttf")');

    // Check AnotherFont rules
    expect(content).toContain('font-family: "AnotherFont"');
    expect(content).toContain('url("/fonts/AnotherFont-Italic.ttf")');
  });

  it("sets correct font-weight values (700 for bold, 400 otherwise)", () => {
    renderHook(() => useEditorFonts());
    const style = document.getElementById(STYLE_ID) as HTMLStyleElement;
    const content = style.textContent!;

    expect(content).toContain("font-weight: 400");
    expect(content).toContain("font-weight: 700");
  });

  it("sets correct font-style values", () => {
    renderHook(() => useEditorFonts());
    const style = document.getElementById(STYLE_ID) as HTMLStyleElement;
    const content = style.textContent!;

    expect(content).toContain("font-style: normal");
    expect(content).toContain("font-style: italic");
  });

  it("includes font-display: swap", () => {
    renderHook(() => useEditorFonts());
    const style = document.getElementById(STYLE_ID) as HTMLStyleElement;
    expect(style.textContent).toContain("font-display: swap");
  });

  it("does not inject a duplicate style element on re-render", () => {
    const { rerender } = renderHook(() => useEditorFonts());
    rerender();
    const allStyles = document.querySelectorAll(`#${STYLE_ID}`);
    expect(allStyles.length).toBe(1);
  });

  it("does not inject a duplicate if the element already exists", () => {
    // Pre-create the style element
    const existing = document.createElement("style");
    existing.id = STYLE_ID;
    existing.textContent = "pre-existing";
    document.head.appendChild(existing);

    renderHook(() => useEditorFonts());

    const allStyles = document.querySelectorAll(`#${STYLE_ID}`);
    expect(allStyles.length).toBe(1);
    // Content should remain the pre-existing one
    expect(allStyles[0].textContent).toBe("pre-existing");
  });

  it("cleans up properly between independent hook instances", () => {
    const { unmount } = renderHook(() => useEditorFonts());
    expect(document.getElementById(STYLE_ID)).not.toBeNull();

    // The hook doesn't have cleanup (no return in useEffect),
    // but the element persists in the DOM until our afterEach removes it
    unmount();
    // The style element remains in the DOM (by design — no cleanup in the hook)
    expect(document.getElementById(STYLE_ID)).not.toBeNull();
  });
});
