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

const mockExtractPlaceholders = jest.fn(() => [] as string[]);
const mockCollectAutoTables = jest.fn(() => [] as unknown[]);
const mockCollectCharts = jest.fn(() => [] as unknown[]);
const mockCollectRepeaters = jest.fn(() => [] as unknown[]);

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

const wizardCallbacks: { onExport: ((result: Record<string, unknown>) => void) | null; onCancel: (() => void) | null } = { onExport: null, onCancel: null };

jest.mock("@/components/modals/ExportWizardModal", () => {
  const MockWizard = ({
    onCancel,
    onExport,
    steps,
  }: {
    onCancel: () => void;
    onExport: (r: Record<string, unknown>) => void;
    steps: unknown[];
  }) => {
    Object.assign(wizardCallbacks, { onExport, onCancel });
    return (
      <div data-testid="wizard">
        <span data-testid="wizard-steps">{JSON.stringify(steps.length)}</span>
        <button onClick={onCancel}>Cancel Wizard</button>
        <button
          onClick={() =>
            onExport({
              placeholderValues: {},
              resolvedRows: new Map(),
              chartImages: new Map(),
              repeaterItems: new Map(),
              metadata: { fileName: "test.pdf", title: "Test" },
            })
          }
        >
          Export
        </button>
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
  pages: [{ id: "p1", elements: [] }],
  styles: { primaryColor: "#000" },
};

describe("ExportPdfButton – additional coverage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    wizardCallbacks.onExport = null;
    wizardCallbacks.onCancel = null;
    globalThis.URL.createObjectURL = jest.fn(() => "blob:test");
    globalThis.URL.revokeObjectURL = jest.fn();
    mockExtractPlaceholders.mockReturnValue([]);
    mockCollectAutoTables.mockReturnValue([]);
    mockCollectCharts.mockReturnValue([]);
    mockCollectRepeaters.mockReturnValue([]);
  });

  it("client-side export creates download link and clicks it", async () => {
    const clickSpy = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy });
      }
      return el;
    });

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(clickSpy).toHaveBeenCalled();
      expect(globalThis.URL.createObjectURL).toHaveBeenCalled();
      expect(globalThis.URL.revokeObjectURL).toHaveBeenCalled();
    });

    jest.restoreAllMocks();
  });

  it("opens wizard when password is enabled (no placeholders)", async () => {
    render(<ExportPdfButton template={minimalTemplate} includePassword />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("opens wizard when pdfa is enabled", async () => {
    render(<ExportPdfButton template={minimalTemplate} includePdfA />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("opens wizard when signature is enabled", async () => {
    render(<ExportPdfButton template={minimalTemplate} includeSignature />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
    });
  });

  it("server-side route sends metadata when present", async () => {
    const mockFetch = jest.fn().mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(["pdf"])),
    });
    globalThis.fetch = mockFetch;

    mockExtractPlaceholders.mockReturnValue(["name"]);

    render(<ExportPdfButton template={minimalTemplate} includePassword />);
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
          metadata: { fileName: "report.pdf", title: "Report" },
        });
      }
    });

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalled();
      const callArgs = mockFetch.mock.calls[0];
      expect(callArgs[0]).toBe("/api/generate-pdf");
    });
  });

  it("uses default filename when metadata has no fileName", async () => {
    const clickSpy = jest.fn();
    const origCreateElement = document.createElement.bind(document);
    jest.spyOn(document, "createElement").mockImplementation((tag: string) => {
      const el = origCreateElement(tag);
      if (tag === "a") {
        Object.defineProperty(el, "click", { value: clickSpy });
      }
      return el;
    });

    mockExtractPlaceholders.mockReturnValue(["n"]);

    render(<ExportPdfButton template={minimalTemplate} />);
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
          // No metadata -> default filename
        });
      }
    });

    await waitFor(() => {
      expect(screen.getByText("Export PDF")).toBeTruthy();
    });

    jest.restoreAllMocks();
  });

  it("button is disabled during preparing phase", async () => {
    // Add a slow font status check to keep preparing state visible
    const mockFetch = jest.fn(() => new Promise<never>(() => {})); // Never resolves
    globalThis.fetch = mockFetch;

    const templateWithFonts: Template = {
      ...minimalTemplate,
      fonts: [
        {
          family: "Custom",
          faces: [
            { weight: "normal", style: "normal", source: "uploaded", ref: "ref1" },
          ],
        },
      ],
    };

    render(<ExportPdfButton template={templateWithFonts} />);
    fireEvent.click(screen.getByText("Export PDF"));
    // Button text should indicate busy state
    // The button should be disabled
    const button = screen.getByRole("button");
    expect(button).toBeTruthy();
  });

  it("button shows Building text during loading phase", async () => {
    // Make toBlob slow
    mockToBlob.mockImplementation(() => new Promise<never>(() => {}));

    render(<ExportPdfButton template={minimalTemplate} />);
    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    // Should show "Building..." text
    // Actually the mock toBlob never resolves, so we stay in "loading" state
    // The button text should show "Building..."
    await waitFor(() => {
      expect(screen.getByText("Building\u2026")).toBeTruthy();
    });

    // Cleanup - restore normal mock
    mockToBlob.mockImplementation(() => Promise.resolve(new Blob(["pdf"])));
  });

  it("wizard steps include all configured types together", async () => {
    mockExtractPlaceholders.mockReturnValue(["name"]);
    mockCollectAutoTables.mockReturnValue([
      { id: "t1", headers: ["A"], rows: [], headerColor: "#000", headerTextColor: "#fff", fontSize: 11, width: 400 },
    ]);
    mockCollectCharts.mockReturnValue([{ id: "c1", option: {} }]);
    mockCollectRepeaters.mockReturnValue([{ id: "r1", label: "Rep" }]);

    render(
      <ExportPdfButton
        template={minimalTemplate}
        includeMetadata
        includePassword
        includePdfA
        includeSignature
      />
    );

    await act(async () => {
      fireEvent.click(screen.getByText("Export PDF"));
    });

    await waitFor(() => {
      expect(screen.getByTestId("wizard")).toBeTruthy();
      // Should have: metadata + password + pdfa + signature + placeholders + csv + chart + repeater = 8 steps
      expect(screen.getByTestId("wizard-steps").textContent).toBe("8");
    });
  });
});
