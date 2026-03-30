/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import type { Template } from "@/types/template";

const mockToBlob = jest.fn(() => Promise.resolve(new Blob(["pdf content"])));
const mockPdf = jest.fn(() => ({ toBlob: mockToBlob }));

// Mock @react-pdf/renderer
jest.mock("@react-pdf/renderer", () => ({
  pdf: (...args: unknown[]) => mockPdf(...args),
  Document: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
  Page: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
  View: (props: { children: React.ReactNode }) => <div>{props.children}</div>,
  Text: (props: { children: React.ReactNode }) => <span>{props.children}</span>,
  // eslint-disable-next-line @next/next/no-img-element
  Image: () => <img alt="img" />,
  Link: (props: { children: React.ReactNode }) => <a>{props.children}</a>,
  Font: { register: jest.fn() },
  StyleSheet: { create: (s: unknown) => s },
  Svg: (props: { children: React.ReactNode }) => <svg>{props.children}</svg>,
  Path: () => <path />,
  Polygon: () => <polygon />,
}));

const mockExtractPlaceholders = jest.fn(() => []);
const mockCollectAutoTables = jest.fn(() => []);
const mockCollectCharts = jest.fn(() => []);
const mockCollectRepeaters = jest.fn(() => []);

jest.mock("@/lib/placeholders", () => ({
  extractPlaceholders: (...args: unknown[]) => mockExtractPlaceholders(...args),
  applyValues: jest.fn((t: unknown) => t),
  collectAutoTables: (...args: unknown[]) => mockCollectAutoTables(...args),
  applyAutoRows: jest.fn((t: unknown) => t),
  collectCharts: (...args: unknown[]) => mockCollectCharts(...args),
  applyChartImages: jest.fn((t: unknown) => t),
  collectRepeaters: (...args: unknown[]) => mockCollectRepeaters(...args),
  applyRepeaterItems: jest.fn((t: unknown) => t),
}));

jest.mock("@/lib/fontRegistry", () => ({
  registerFontsClient: jest.fn(),
  getDefaultFamily: jest.fn(() => "Roboto"),
}));

jest.mock("@/components/PdfTemplate", () => ({
  PdfDocument: () => <div>Mock PDF</div>,
}));

const wizardCallbacks: { onExport: ((result: Record<string, unknown>) => void) | null } = { onExport: null };

jest.mock("@/components/modals/ExportWizardModal", () => {
  const MockWizard = ({ onCancel, onExport }: { onCancel: () => void; onExport: (r: Record<string, unknown>) => void }) => {
    // Store callback in mutable object (not reassigning an outer variable)
    Object.assign(wizardCallbacks, { onExport });
    return (
      <div data-testid="wizard">
        <button onClick={onCancel}>Cancel Wizard</button>
        <button onClick={() => onExport({
          placeholderValues: {},
          resolvedRows: new Map(),
          chartImages: new Map(),
          repeaterItems: new Map(),
          metadata: { fileName: "test.pdf", title: "Test" },
        })}>Export</button>
      </div>
    );
  };
  MockWizard.displayName = "ExportWizardModal";
  return {
    __esModule: true,
    default: MockWizard,
  };
});

// eslint-disable-next-line @typescript-eslint/no-require-imports
const ExportPdfButton = require("../ExportPdfButton").default;

const minimalTemplate: Template = {
  name: "Test",
  pages: [
    { id: "p1", elements: [] },
  ],
  styles: { primaryColor: "#000" },
};

const templateWithUploadedFonts: Template = {
  ...minimalTemplate,
  fonts: [
    {
      family: "CustomFont",
      faces: [
        { weight: "normal", style: "normal", source: "uploaded", ref: "custom-normal-normal" },
      ],
    },
  ],
};

describe("ExportPdfButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wizardCallbacks.onExport = null;
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();
    mockExtractPlaceholders.mockReturnValue([]);
    mockCollectAutoTables.mockReturnValue([]);
    mockCollectCharts.mockReturnValue([]);
    mockCollectRepeaters.mockReturnValue([]);
  });

  it("renders Export PDF button", () => {
    render(<ExportPdfButton template={minimalTemplate} />);
    expect(screen.getByText("Export PDF")).toBeTruthy();
  });

  it("generates PDF directly when no wizard steps needed", async () => {
    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByText("Export PDF")).toBeTruthy();
    });
  });

  it("renders with metadata, password, pdfA and signature flags", () => {
    render(
      <ExportPdfButton
        template={minimalTemplate}
        includeMetadata={true}
        includePassword={true}
        includePdfA={true}
        includeSignature={true}
      />
    );
    expect(screen.getByText("Export PDF")).toBeTruthy();
  });

  it("opens wizard when there are placeholders", async () => {
    mockExtractPlaceholders.mockReturnValue(["name", "date"]);

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("opens wizard when includeMetadata is true", async () => {
    render(<ExportPdfButton template={minimalTemplate} includeMetadata={true} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("closes wizard on cancel", async () => {
    mockExtractPlaceholders.mockReturnValue(["name"]);

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Cancel Wizard"));
    });

    expect(screen.queryByTestId("wizard")).toBeNull();
  });

  it("generates PDF via wizard export", async () => {
    mockExtractPlaceholders.mockReturnValue(["name"]);

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(screen.getByText("Export"));
    });

    await waitFor(() => {
      expect(screen.getByText("Export PDF")).toBeTruthy();
    });
  });

  it("shows error when PDF generation fails", async () => {
    mockToBlob.mockRejectedValueOnce(new Error("Generation failed"));

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByText("Export failed")).toBeTruthy();
      expect(screen.getByText("Generation failed")).toBeTruthy();
    });
  });

  it("dismisses error when close button clicked", async () => {
    mockToBlob.mockRejectedValueOnce(new Error("Failure"));

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByText("Export failed")).toBeTruthy();
    });

    fireEvent.click(screen.getByText("\u00d7"));
    expect(screen.queryByText("Export failed")).toBeNull();
  });

  it("shows error for non-Error thrown values", async () => {
    mockToBlob.mockRejectedValueOnce("string error");

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByText("An unexpected error occurred.")).toBeTruthy();
    });
  });

  it("uses server-side route when password is provided", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["pdf"])),
    });
    globalThis.fetch = mockFetch;

    mockExtractPlaceholders.mockReturnValue(["name"]);

    render(<ExportPdfButton template={minimalTemplate} includePassword={true} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });

    // Call wizard onExport with password
    await act(async () => {
      if (wizardCallbacks.onExport) {
        wizardCallbacks.onExport({
          placeholderValues: {},
          resolvedRows: new Map(),
          chartImages: new Map(),
          repeaterItems: new Map(),
          password: "secret123",
        });
      }
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/generate-pdf", expect.objectContaining({ method: "POST" }));
    });
  });

  it("handles server-side route error", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: "Server error" }),
    });
    globalThis.fetch = mockFetch;

    mockExtractPlaceholders.mockReturnValue(["name"]);

    render(<ExportPdfButton template={minimalTemplate} includePassword={true} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });

    await act(async () => {
      if (wizardCallbacks.onExport) {
        wizardCallbacks.onExport({
          placeholderValues: {},
          resolvedRows: new Map(),
          chartImages: new Map(),
          repeaterItems: new Map(),
          password: "secret",
        });
      }
    });

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeTruthy();
    });
  });

  it("handles server-side route error with non-JSON body", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: false,
      json: () => Promise.reject(new Error("not json")),
    });
    globalThis.fetch = mockFetch;

    mockExtractPlaceholders.mockReturnValue(["name"]);

    render(<ExportPdfButton template={minimalTemplate} includePassword={true} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });

    await act(async () => {
      if (wizardCallbacks.onExport) {
        wizardCallbacks.onExport({
          placeholderValues: {},
          resolvedRows: new Map(),
          chartImages: new Map(),
          repeaterItems: new Map(),
          password: "sec",
        });
      }
    });

    await waitFor(() => {
      expect(screen.getByText("PDF generation failed.")).toBeTruthy();
    });
  });

  it("checks uploaded fonts for missing files", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ missing: ["custom-normal-normal"] }),
    });
    globalThis.fetch = mockFetch;

    render(<ExportPdfButton template={templateWithUploadedFonts} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      // Should have opened wizard due to missing fonts step
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("handles font status API failure gracefully", async () => {
    const mockFetch = jest.fn().mockRejectedValue(new Error("Network error"));
    globalThis.fetch = mockFetch;

    render(<ExportPdfButton template={templateWithUploadedFonts} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    // Should proceed without error (no wizard steps = direct generate)
    await waitFor(() => {
      expect(screen.getByText("Export PDF")).toBeTruthy();
    });
  });

  it("does not add font step when no fonts are missing", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ missing: [] }),
    });
    globalThis.fetch = mockFetch;

    render(<ExportPdfButton template={templateWithUploadedFonts} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    // No wizard steps should mean direct generation
    await waitFor(() => {
      expect(screen.getByText("Export PDF")).toBeTruthy();
    });
  });

  it("collects auto tables, charts, and repeaters as wizard steps", async () => {
    mockCollectAutoTables.mockReturnValue([{ id: "table1", headers: ["A"] }]);
    mockCollectCharts.mockReturnValue([{ id: "chart1", option: {} }]);
    mockCollectRepeaters.mockReturnValue([{ id: "rep1", label: "Repeater 1" }]);

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("sends pdfA and signature data to server route", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["pdf"])),
    });
    globalThis.fetch = mockFetch;

    mockExtractPlaceholders.mockReturnValue(["n"]);

    render(<ExportPdfButton template={minimalTemplate} includePdfA={true} includeSignature={true} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });

    await act(async () => {
      if (wizardCallbacks.onExport) {
        wizardCallbacks.onExport({
          placeholderValues: {},
          resolvedRows: new Map(),
          chartImages: new Map(),
          repeaterItems: new Map(),
          pdfA: { conformance: "2b" },
          signature: { name: "Test" },
          metadata: { fileName: "signed.pdf", title: "Signed" },
        });
      }
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith("/api/generate-pdf", expect.objectContaining({ method: "POST" }));
    });
  });
});
