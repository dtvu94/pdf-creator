/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { WizardResult } from "../types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PdfAStep } = require("../PdfAStep");

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

describe("PdfAStep", () => {
  it("renders with default version and conformance", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    expect(screen.getByText("PDF/A — Archival Format")).toBeTruthy();
    expect(screen.getByText(/PDF\/A-2a/)).toBeTruthy();
  });

  it("initializes resultRef.pdfA on mount", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    expect(resultRef.current.pdfA).toEqual({ part: 2, conformance: "A" });
  });

  it("does not overwrite existing pdfA on mount", () => {
    const resultRef = makeResultRef();
    resultRef.current.pdfA = { part: 3, conformance: "B" };
    render(<PdfAStep resultRef={resultRef} />);
    expect(resultRef.current.pdfA).toEqual({ part: 3, conformance: "B" });
  });

  it("updates resultRef when version changes", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    const selects = screen.getAllByRole("combobox");
    // First select is version
    fireEvent.change(selects[0], { target: { value: "3" } });
    expect(resultRef.current.pdfA).toEqual({ part: 3, conformance: "A" });
    expect(screen.getByText(/PDF\/A-3a/)).toBeTruthy();
  });

  it("updates resultRef when conformance changes", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    const selects = screen.getAllByRole("combobox");
    // Second select is conformance
    fireEvent.change(selects[1], { target: { value: "B" } });
    expect(resultRef.current.pdfA).toEqual({ part: 2, conformance: "B" });
    expect(screen.getByText(/PDF\/A-2b/)).toBeTruthy();
  });

  it("downgrades conformance U to B when switching to PDF/A-1", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    const selects = screen.getAllByRole("combobox");
    // Set conformance to U
    fireEvent.change(selects[1], { target: { value: "U" } });
    expect(resultRef.current.pdfA?.conformance).toBe("U");
    // Switch to PDF/A-1 — U is not supported, should downgrade to B
    fireEvent.change(selects[0], { target: { value: "1" } });
    expect(resultRef.current.pdfA).toEqual({ part: 1, conformance: "B" });
    expect(screen.getByText(/PDF\/A-1b/)).toBeTruthy();
  });

  it("keeps conformance B when switching to PDF/A-1", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[1], { target: { value: "B" } });
    fireEvent.change(selects[0], { target: { value: "1" } });
    expect(resultRef.current.pdfA).toEqual({ part: 1, conformance: "B" });
  });

  it("keeps conformance A when switching to PDF/A-1", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    // Default is A — switch to PDF/A-1 (A is valid for PDF/A-1)
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "1" } });
    expect(resultRef.current.pdfA).toEqual({ part: 1, conformance: "A" });
  });

  it("shows version hints", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    // Default PDF/A-2 hint
    expect(screen.getByText(/Based on PDF 1.7/)).toBeTruthy();
  });

  it("shows conformance hints", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    // Default A hint
    expect(screen.getByText(/strictest level/)).toBeTruthy();
  });

  it("renders all version options", () => {
    const resultRef = makeResultRef();
    const { container } = render(<PdfAStep resultRef={resultRef} />);
    expect(container.textContent).toContain("PDF/A-1");
    expect(container.textContent).toContain("PDF/A-2");
    expect(container.textContent).toContain("PDF/A-3");
  });

  it("renders info box explaining options", () => {
    const resultRef = makeResultRef();
    render(<PdfAStep resultRef={resultRef} />);
    expect(screen.getByText(/What do these options mean/)).toBeTruthy();
  });
});
