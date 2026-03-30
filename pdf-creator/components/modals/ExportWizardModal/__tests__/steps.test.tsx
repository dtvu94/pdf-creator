/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { WizardStep, WizardResult } from "../types";
import type { TableElement, RepeaterElement } from "@/types/template";

// Mock echarts
jest.mock("echarts", () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    getDataURL: jest.fn(() => "data:image/png;base64,abc"),
  })),
}));

// Mock FontUploadList
jest.mock("../../FontUploadList", () => ({
  FontUploadList: ({ missingFonts }: { missingFonts: unknown[] }) => (
    <div data-testid="font-upload-list">Fonts: {missingFonts.length}</div>
  ),
}));

// Mock @/lib/utils
jest.mock("@/lib/utils", () => ({
  downloadJson: jest.fn(),
  parseTableData: jest.fn(() => ({ headers: ["A", "B"], rows: [["1", "2"]] })),
  renderWithPlaceholders: jest.fn((t: string) => t),
  btnStyle: jest.fn(() => ({})),
}));

// Mock @/lib/placeholders
jest.mock("@/lib/placeholders", () => ({
  extractPlaceholders: jest.fn(() => []),
}));

function makeResultRef(): React.RefObject<WizardResult> {
  return {
    current: {
      placeholderValues: {},
      resolvedRows: new Map(),
      chartImages: new Map(),
      repeaterItems: new Map(),
    },
  } as React.RefObject<WizardResult>;
}

describe("WizardStepper", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { WizardStepper, getNextButtonLabel } = require("../WizardStepper");

  const steps: WizardStep[] = [
    { id: "s1", label: "Step 1", type: "placeholders", placeholders: [] },
    { id: "s2", label: "Step 2", type: "metadata" },
    { id: "s3", label: "Step 3", type: "password" },
  ];

  it("renders all steps", () => {
    const { container } = render(<WizardStepper steps={steps} currentStep={0} />);
    expect(container.textContent).toContain("Step 1");
    expect(container.textContent).toContain("Step 2");
    expect(container.textContent).toContain("Step 3");
  });

  it("shows checkmark for completed steps", () => {
    const { container } = render(<WizardStepper steps={steps} currentStep={2} />);
    // Steps 0 and 1 should be completed (checkmark)
    expect(container.textContent).toContain("\u2713");
  });

  it("shows step number for active and pending steps", () => {
    const { container } = render(<WizardStepper steps={steps} currentStep={0} />);
    expect(container.textContent).toContain("1");
    expect(container.textContent).toContain("2");
  });

  describe("getNextButtonLabel", () => {
    it("returns processing message when processing", () => {
      expect(getNextButtonLabel(true, "Working...", false)).toBe("Working...");
    });

    it("returns default processing message when no custom message", () => {
      expect(getNextButtonLabel(true, "", false)).toBe("Processing\u2026");
    });

    it("returns Export PDF for last step", () => {
      expect(getNextButtonLabel(false, "", true)).toBe("Export PDF");
    });

    it("returns Next arrow for non-last step", () => {
      expect(getNextButtonLabel(false, "", false)).toBe("Next \u2192");
    });
  });
});

describe("MetaChip", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MetaChip } = require("../MetaChip");

  it("renders label and value", () => {
    const { container } = render(<MetaChip label="Size" value="200 x 100" />);
    expect(container.textContent).toContain("Size");
    expect(container.textContent).toContain("200 x 100");
  });

  it("renders with highlight", () => {
    const { container } = render(<MetaChip label="Status" value="Warning" highlight />);
    expect(container.textContent).toContain("Warning");
  });

  it("renders without highlight", () => {
    const { container } = render(<MetaChip label="Status" value="OK" highlight={false} />);
    expect(container.textContent).toContain("OK");
  });
});

describe("FontsStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FontsStep } = require("../FontsStep");

  it("renders without crashing", () => {
    const missingFonts = [
      {
        family: "CustomFont",
        faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-normal-normal" }],
      },
    ];
    const { container } = render(
      <FontsStep missingFonts={missingFonts} setReady={jest.fn()} />
    );
    expect(container.textContent).toContain("Missing Fonts");
  });
});

describe("PlaceholderStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PlaceholderStep } = require("../PlaceholderStep");

  it("renders placeholders", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />
    );
    expect(container.textContent).toContain("{{name}}");
    expect(container.textContent).toContain("{{email}}");
    expect(container.textContent).toContain("2 placeholders found");
  });

  it("renders singular placeholder count", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <PlaceholderStep placeholders={["name"]} resultRef={resultRef} />
    );
    expect(container.textContent).toContain("1 placeholder found");
  });

  it("renders inputs for each placeholder", () => {
    const resultRef = makeResultRef();
    render(
      <PlaceholderStep placeholders={["name"]} resultRef={resultRef} />
    );
    const input = screen.getByPlaceholderText("Value for name");
    expect(input).toBeTruthy();
  });
});

describe("CsvStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { CsvStep } = require("../CsvStep");

  const table: TableElement = {
    id: "tbl1",
    x: 0,
    y: 0,
    type: "table",
    mode: "auto",
    headers: ["Name", "Value"],
    rows: [["Alice", "100"]],
    headerColor: "#1E40AF",
    headerTextColor: "#fff",
    fontSize: 11,
    width: 400,
  };

  it("renders without crashing", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <CsvStep table={table} resultRef={resultRef} />
    );
    expect(container.textContent).toContain("Upload CSV data");
    expect(container.textContent).toContain("Name");
    expect(container.textContent).toContain("Value");
  });

  it("shows existing rows from template", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <CsvStep table={table} resultRef={resultRef} />
    );
    expect(container.textContent).toContain("Alice");
    expect(container.textContent).toContain("100");
  });
});

describe("ChartStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { ChartStep } = require("../ChartStep");

  it("renders with empty option (blank chart)", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <ChartStep
        chart={{ id: "ch1", x: 0, y: 0, type: "chart" as const, width: 200, height: 100, option: {} }}
        active={true}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />
    );
    expect(container.textContent).toContain("ECharts option required");
    expect(container.textContent).toContain("Blank");
  });

  it("renders with pre-configured option", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <ChartStep
        chart={{ id: "ch1", x: 0, y: 0, type: "chart" as const, width: 200, height: 100, option: { type: "bar" } }}
        active={true}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
      />
    );
    expect(container.textContent).toContain("Pre-configured");
  });
});

describe("RepeaterStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { RepeaterStep } = require("../RepeaterStep");

  const repeater: RepeaterElement = {
    id: "rep1",
    x: 0,
    y: 0,
    type: "repeater",
    label: "Sensors",
    dataKey: "sensors",
    width: 500,
    cardWidth: 200,
    cardHeight: 100,
    itemsPerRow: 2,
    gap: 10,
    cardElements: [
      {
        id: "t1",
        x: 0,
        y: 0,
        type: "text" as const,
        content: "{{sensor_name}}",
        fontSize: 12,
        bold: false,
        italic: false,
        underline: false,
        color: "#000",
        width: 100,
      },
    ],
  };

  it("renders without crashing", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    expect(container.textContent).toContain("Sensors");
    expect(container.textContent).toContain("sensors");
    expect(container.textContent).toContain("sensor_name");
  });

  it("shows empty preview when no data entered", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <RepeaterStep
        repeater={repeater}
        resultRef={resultRef}
        registerBeforeNext={jest.fn()}
        setReady={jest.fn()}
        setProcessingMsg={jest.fn()}
      />
    );
    expect(container.textContent).toContain("Parsed items will appear here");
  });
});

describe("MetadataStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { MetadataStep } = require("../MetadataStep");

  it("renders all metadata fields", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <MetadataStep resultRef={resultRef} />
    );
    expect(container.textContent).toContain("PDF Metadata");
    expect(container.textContent).toContain("File Name");
    expect(container.textContent).toContain("Title");
    expect(container.textContent).toContain("Author");
    expect(container.textContent).toContain("Subject");
    expect(container.textContent).toContain("Keywords");
  });

  it("renders load and save buttons", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <MetadataStep resultRef={resultRef} />
    );
    expect(container.textContent).toContain("Load from JSON file");
    expect(container.textContent).toContain("Save as JSON");
  });
});

describe("PasswordStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PasswordStep } = require("../PasswordStep");

  it("renders password fields", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <PasswordStep resultRef={resultRef} setReady={jest.fn()} />
    );
    expect(container.textContent).toContain("Password Protection");
    expect(container.textContent).toContain("Password");
    expect(container.textContent).toContain("Confirm Password");
  });

  it("shows mismatch error when passwords differ", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(
      <PasswordStep resultRef={resultRef} setReady={setReady} />
    );
    const inputs = screen.getAllByDisplayValue("");
    // Set password
    fireEvent.change(inputs[0], { target: { value: "abc" } });
    // Set confirm to different value
    fireEvent.change(inputs[1], { target: { value: "xyz" } });
    expect(screen.getByText("Passwords do not match.")).toBeTruthy();
  });
});

describe("PdfAStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { PdfAStep } = require("../PdfAStep");

  it("renders PDF/A settings", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <PdfAStep resultRef={resultRef} />
    );
    expect(container.textContent).toContain("PDF/A");
    expect(container.textContent).toContain("Version");
    expect(container.textContent).toContain("Level");
  });

  it("shows default output summary", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <PdfAStep resultRef={resultRef} />
    );
    expect(container.textContent).toContain("PDF/A-2a");
  });
});

describe("SignatureStep", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { SignatureStep } = require("../SignatureStep");

  it("renders signature fields", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <SignatureStep resultRef={resultRef} setReady={jest.fn()} />
    );
    expect(container.textContent).toContain("Digital Signature");
    expect(container.textContent).toContain("Choose File");
    expect(container.textContent).toContain("Keystore Password");
    expect(container.textContent).toContain("Reason");
    expect(container.textContent).toContain("Location");
    expect(container.textContent).toContain("Contact Info");
  });

  it("shows no file selected initially", () => {
    const resultRef = makeResultRef();
    const { container } = render(
      <SignatureStep resultRef={resultRef} setReady={jest.fn()} />
    );
    expect(container.textContent).toContain("No file selected");
  });
});

describe("ExportWizardModal (index)", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const ExportWizardModal = require("../index").default;

  const steps: WizardStep[] = [
    { id: "ph", label: "Placeholders", type: "placeholders", placeholders: ["name"] },
    { id: "meta", label: "Metadata", type: "metadata" },
  ];

  it("renders without crashing", () => {
    const { container } = render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(container.textContent).toContain("Placeholders");
    expect(container.textContent).toContain("Metadata");
  });

  it("renders Cancel button", () => {
    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Cancel")).toBeTruthy();
  });

  it("calls onCancel when Cancel is clicked", () => {
    const onCancel = jest.fn();
    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={onCancel}
      />
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onCancel).toHaveBeenCalled();
  });

  it("shows Next button on first step", () => {
    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    expect(screen.getByText("Next \u2192")).toBeTruthy();
  });

  it("navigates forward on Next click", () => {
    const { container } = render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText("Next \u2192"));
    // Now on last step, should show Export PDF
    expect(container.textContent).toContain("Export PDF");
  });

  it("shows Back button on second step", () => {
    render(
      <ExportWizardModal
        steps={steps}
        onExport={jest.fn()}
        onCancel={jest.fn()}
      />
    );
    fireEvent.click(screen.getByText("Next \u2192"));
    expect(screen.getByText("\u2190 Back")).toBeTruthy();
  });

  it("renders single step that is always ready (placeholders)", () => {
    const onExport = jest.fn();
    render(
      <ExportWizardModal
        steps={[{ id: "ph", label: "Placeholders", type: "placeholders", placeholders: ["x"] }]}
        onExport={onExport}
        onCancel={jest.fn()}
      />
    );
    // Single step = last step, should show Export PDF
    fireEvent.click(screen.getByText("Export PDF"));
    expect(onExport).toHaveBeenCalled();
  });
});
