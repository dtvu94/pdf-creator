/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

jest.mock("../../FontUploadList", () => ({
  FontUploadList: ({ missingFonts, onAllDoneChange }: { missingFonts: unknown[]; onAllDoneChange?: (v: boolean) => void }) => (
    <div data-testid="font-upload-list">
      Fonts: {missingFonts.length}
      <button onClick={() => onAllDoneChange?.(true)}>MarkDone</button>
    </div>
  ),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { FontsStep } = require("../FontsStep");

describe("FontsStep", () => {
  it("renders with missing fonts info", () => {
    const missingFonts = [
      { family: "CustomFont", faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-ref" }] },
    ];
    render(<FontsStep missingFonts={missingFonts} setReady={jest.fn()} />);
    expect(screen.getByText("Missing Fonts")).toBeTruthy();
    expect(screen.getByTestId("font-upload-list")).toBeTruthy();
  });

  it("calls setReady when fonts are uploaded", () => {
    const setReady = jest.fn();
    const missingFonts = [
      { family: "CustomFont", faces: [{ weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-ref" }] },
    ];
    render(<FontsStep missingFonts={missingFonts} setReady={setReady} />);
    fireEvent.click(screen.getByText("MarkDone"));
    expect(setReady).toHaveBeenCalledWith(true);
  });
});
