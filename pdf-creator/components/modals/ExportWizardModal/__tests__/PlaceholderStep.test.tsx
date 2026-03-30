/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act, waitFor } from "@testing-library/react";
import type { WizardResult } from "../types";

jest.mock("@/lib/utils", () => ({
  downloadJson: jest.fn(),
}));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PlaceholderStep } = require("../PlaceholderStep");

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

describe("PlaceholderStep", () => {
  it("renders placeholders with inputs", () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />);
    expect(screen.getByText(/2 placeholders/)).toBeTruthy();
    expect(screen.getByPlaceholderText("Value for name")).toBeTruthy();
    expect(screen.getByPlaceholderText("Value for email")).toBeTruthy();
  });

  it("renders singular placeholder count", () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["x"]} resultRef={resultRef} />);
    expect(screen.getByText(/1 placeholder found/)).toBeTruthy();
  });

  it("updates resultRef when user types", () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    fireEvent.change(screen.getByPlaceholderText("Value for name"), { target: { value: "John" } });
    expect(resultRef.current.placeholderValues.name).toBe("John");
  });

  it("downloads template JSON", () => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { downloadJson } = require("@/lib/utils");
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    fireEvent.click(screen.getByText(/Download template/));
    expect(downloadJson).toHaveBeenCalled();
  });

  it("loads values from JSON file", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />);
    const jsonContent = JSON.stringify({ name: "Jane", email: "jane@example.com" });
    const file = new File([jsonContent], "values.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 50));
    });
    await waitFor(() => {
      expect(screen.getByDisplayValue("Jane")).toBeTruthy();
    });
  });

  it("shows error for invalid JSON file", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    const file = new File(["not json"], "bad.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve("not json") });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 10));
    });
    await waitFor(() => {
      expect(screen.getByText("Invalid JSON file.")).toBeTruthy();
    });
  });

  it("shows error for non-object JSON", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    const jsonContent = JSON.stringify([1, 2, 3]);
    const file = new File([jsonContent], "arr.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 10));
    });
    await waitFor(() => {
      expect(screen.getByText("File must be a JSON object with placeholder keys.")).toBeTruthy();
    });
  });

  it("shows warning for missing keys in loaded JSON", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name", "email"]} resultRef={resultRef} />);
    const jsonContent = JSON.stringify({ name: "Jane" });
    const file = new File([jsonContent], "partial.json", { type: "application/json" });
    Object.defineProperty(file, "text", { value: () => Promise.resolve(jsonContent) });
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [file] } });
      await new Promise((r) => setTimeout(r, 10));
    });
    await waitFor(() => {
      expect(screen.getByText(/Missing keys/)).toBeTruthy();
    });
  });

  it("no-op when no file selected", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: [] } });
    });
    // No crash
  });

  it("no-op when files is null", async () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    await act(async () => {
      fireEvent.change(input, { target: { files: null } });
    });
  });

  it("Load from file button triggers hidden file input", () => {
    const resultRef = makeResultRef();
    render(<PlaceholderStep placeholders={["name"]} resultRef={resultRef} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");
    fireEvent.click(screen.getByText(/Load from file/));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });
});
