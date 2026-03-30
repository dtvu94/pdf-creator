/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import type { WizardResult } from "../types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { PasswordStep } = require("../PasswordStep");

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

describe("PasswordStep", () => {
  it("renders password fields", () => {
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={jest.fn()} />);
    expect(screen.getByText("Password Protection")).toBeTruthy();
  });

  it("sets ready when passwords match and are non-empty", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={setReady} />);
    const inputs = screen.getAllByDisplayValue("");
    fireEvent.change(inputs[0], { target: { value: "abc" } });
    fireEvent.change(inputs[1], { target: { value: "abc" } });
    expect(setReady).toHaveBeenCalledWith(true);
    expect(resultRef.current.password).toBe("abc");
  });

  it("sets not ready when passwords are empty", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={setReady} />);
    expect(setReady).toHaveBeenCalledWith(false);
  });

  it("shows mismatch error when passwords differ", () => {
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={jest.fn()} />);
    const inputs = screen.getAllByDisplayValue("");
    fireEvent.change(inputs[0], { target: { value: "abc" } });
    fireEvent.change(inputs[1], { target: { value: "xyz" } });
    expect(screen.getByText("Passwords do not match.")).toBeTruthy();
  });

  it("clears password from resultRef when invalid", () => {
    const resultRef = makeResultRef();
    render(<PasswordStep resultRef={resultRef} setReady={jest.fn()} />);
    const inputs = screen.getAllByDisplayValue("");
    // Set matching passwords first
    fireEvent.change(inputs[0], { target: { value: "abc" } });
    fireEvent.change(inputs[1], { target: { value: "abc" } });
    expect(resultRef.current.password).toBe("abc");
    // Now make them mismatch
    fireEvent.change(inputs[1], { target: { value: "xyz" } });
    expect(resultRef.current.password).toBeUndefined();
  });
});
