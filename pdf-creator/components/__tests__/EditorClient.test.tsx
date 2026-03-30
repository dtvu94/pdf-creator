/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPush = jest.fn();
const mockParams = new Map<string, string | null>();

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => ({ get: (key: string) => mockParams.get(key) ?? null }),
}));

let capturedProps: Record<string, unknown> = {};

jest.mock("@/components/PdfEditor", () => {
  return function MockPdfEditor(props: { initialTemplate: unknown; templateId: string; onBack: () => void }) {
    capturedProps = props;
    return (
      <div data-testid="pdf-editor" data-template={JSON.stringify(props.initialTemplate)} data-template-id={props.templateId}>
        <button onClick={props.onBack}>Back</button>
      </div>
    );
  };
});

jest.mock("@/lib/templates", () => ({
  getTemplateById: (id: string) => ({ id, name: `Fresh ${id}`, pages: [{ id: "p1", elements: [] }] }),
}));

const mockLoadDraft = jest.fn();
const mockClearDraft = jest.fn();

jest.mock("@/lib/useAutoSave", () => ({
  loadDraft: (...args: unknown[]) => mockLoadDraft(...args),
  clearDraft: (...args: unknown[]) => mockClearDraft(...args),
}));

import EditorClient from "../EditorClient";

beforeEach(() => {
  jest.clearAllMocks();
  capturedProps = {};
  mockParams.clear();
  mockLoadDraft.mockReturnValue(null);
});

describe("EditorClient", () => {
  // ── Basic rendering ───────────────────────────────────────────────────────

  it("renders PdfEditor with template ID from URL params", () => {
    mockParams.set("t", "invoice");
    render(<EditorClient />);
    const editor = screen.getByTestId("pdf-editor");
    const template = JSON.parse(editor.getAttribute("data-template")!);
    expect(template.id).toBe("invoice");
    expect(editor.getAttribute("data-template-id")).toBe("invoice");
  });

  it("defaults to 'report' when template param is missing", () => {
    /* no t param — defaults to "report" */;
    render(<EditorClient />);
    const editor = screen.getByTestId("pdf-editor");
    const template = JSON.parse(editor.getAttribute("data-template")!);
    expect(template.id).toBe("report");
  });

  it("passes templateId prop to PdfEditor", () => {
    mockParams.set("t", "invoice");
    render(<EditorClient />);
    expect(capturedProps.templateId).toBe("invoice");
  });

  // ── No draft — no banner ──────────────────────────────────────────────────

  it("does not show banner when no draft exists", () => {
    mockParams.set("t", "report");
    mockLoadDraft.mockReturnValue(null);
    render(<EditorClient />);
    expect(screen.queryByText(/restored from a saved draft/)).toBeNull();
  });

  // ── Draft exists — shows banner and restores ─────────────────────────────

  it("loads draft from storage and shows banner", () => {
    mockParams.set("t", "report");
    const draftTemplate = { id: "report", name: "Draft Report", pages: [{ id: "dp1", elements: [] }] };
    mockLoadDraft.mockReturnValue(draftTemplate);

    render(<EditorClient />);

    // Banner is visible
    expect(screen.getByText(/restored from a saved draft/)).toBeTruthy();
    expect(screen.getByText("Dismiss")).toBeTruthy();
    expect(screen.getByText("Discard draft")).toBeTruthy();

    // PdfEditor received the draft template (not the fresh one)
    const editor = screen.getByTestId("pdf-editor");
    const template = JSON.parse(editor.getAttribute("data-template")!);
    expect(template.name).toBe("Draft Report");
  });

  // ── Dismiss banner ────────────────────────────────────────────────────────

  it("hides banner when Dismiss is clicked (keeps draft)", () => {
    mockParams.set("t", "report");
    mockLoadDraft.mockReturnValue({ id: "report", name: "Draft", pages: [] });

    render(<EditorClient />);
    expect(screen.getByText(/restored from a saved draft/)).toBeTruthy();

    fireEvent.click(screen.getByText("Dismiss"));

    // Banner gone
    expect(screen.queryByText(/restored from a saved draft/)).toBeNull();
    // clearDraft was NOT called (draft is kept)
    expect(mockClearDraft).not.toHaveBeenCalled();
  });

  // ── Discard draft ─────────────────────────────────────────────────────────

  it("clears draft and reloads fresh template when Discard is clicked", () => {
    mockParams.set("t", "invoice");
    mockLoadDraft.mockReturnValue({ id: "invoice", name: "Draft Invoice", pages: [] });

    render(<EditorClient />);

    // Initially shows draft
    let template = JSON.parse(screen.getByTestId("pdf-editor").getAttribute("data-template")!);
    expect(template.name).toBe("Draft Invoice");

    fireEvent.click(screen.getByText("Discard draft"));

    // Banner gone
    expect(screen.queryByText(/restored from a saved draft/)).toBeNull();
    // clearDraft was called
    expect(mockClearDraft).toHaveBeenCalledWith("invoice");
    // PdfEditor now has the fresh template
    template = JSON.parse(screen.getByTestId("pdf-editor").getAttribute("data-template")!);
    expect(template.name).toBe("Fresh invoice");
  });

  // ── Back clears draft ─────────────────────────────────────────────────────

  it("clears draft and navigates to / when Back is clicked", () => {
    mockParams.set("t", "report");
    mockLoadDraft.mockReturnValue(null);

    render(<EditorClient />);
    fireEvent.click(screen.getByText("Back"));

    expect(mockClearDraft).toHaveBeenCalledWith("report");
    expect(mockPush).toHaveBeenCalledWith("/");
  });

  it("clears draft on Back even when draft was loaded", () => {
    mockParams.set("t", "report");
    mockLoadDraft.mockReturnValue({ id: "report", name: "Draft", pages: [] });

    render(<EditorClient />);
    fireEvent.click(screen.getByText("Back"));

    expect(mockClearDraft).toHaveBeenCalledWith("report");
    expect(mockPush).toHaveBeenCalledWith("/");
  });
});
