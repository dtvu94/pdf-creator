/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent, act } from "@testing-library/react";
import type { WizardResult } from "../types";

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { SignatureStep } = require("../SignatureStep");

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

describe("SignatureStep", () => {
  it("renders all fields", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);
    expect(screen.getByText("Digital Signature")).toBeTruthy();
    expect(screen.getByText("Choose File")).toBeTruthy();
    expect(screen.getByText("No file selected")).toBeTruthy();
    expect(screen.getByPlaceholderText("Enter keystore password")).toBeTruthy();
    expect(screen.getByPlaceholderText("e.g. Document approval")).toBeTruthy();
    expect(screen.getByPlaceholderText("e.g. Ho Chi Minh City, Vietnam")).toBeTruthy();
    expect(screen.getByPlaceholderText("e.g. signer@example.com")).toBeTruthy();
  });

  it("becomes ready when both keystore and password are provided", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={setReady} />);

    // Upload keystore file via mock FileReader
    const fileContent = "keystore-data";
    const file = new File([fileContent], "keystore.p12", { type: "application/octet-stream" });
    const originalFileReader = globalThis.FileReader;
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as (() => void) | null,
      result: "data:application/octet-stream;base64,a2V5c3RvcmU=",
    };
    globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    act(() => { if (mockFileReader.onload) mockFileReader.onload(); });
    globalThis.FileReader = originalFileReader;

    // Enter password
    fireEvent.change(screen.getByPlaceholderText("Enter keystore password"), { target: { value: "mypass" } });
    expect(setReady).toHaveBeenCalledWith(true);
    expect(resultRef.current.signature).toBeDefined();
    expect(resultRef.current.signature!.keystorePassword).toBe("mypass");
  });

  it("is not ready when only password is provided", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={setReady} />);
    fireEvent.change(screen.getByPlaceholderText("Enter keystore password"), { target: { value: "mypass" } });
    expect(setReady).toHaveBeenCalledWith(false);
    expect(resultRef.current.signature).toBeUndefined();
  });

  it("updates optional fields", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);
    fireEvent.change(screen.getByPlaceholderText("e.g. Document approval"), { target: { value: "Approval" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. Ho Chi Minh City, Vietnam"), { target: { value: "HCMC" } });
    fireEvent.change(screen.getByPlaceholderText("e.g. signer@example.com"), { target: { value: "test@test.com" } });
  });

  it("Choose File button triggers hidden file input", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    const clickSpy = jest.spyOn(fileInput, "click");
    fireEvent.click(screen.getByText("Choose File"));
    expect(clickSpy).toHaveBeenCalled();
    clickSpy.mockRestore();
  });

  it("does nothing when no file is selected", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={setReady} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [] } });
    expect(screen.getByText("No file selected")).toBeTruthy();
  });

  it("does nothing when files is null", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: null } });
    expect(screen.getByText("No file selected")).toBeTruthy();
  });

  it("shows file name after upload", () => {
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={jest.fn()} />);

    const file = new File(["data"], "mycert.p12", { type: "application/octet-stream" });
    const originalFileReader = globalThis.FileReader;
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as (() => void) | null,
      result: "data:application/octet-stream;base64,ZGF0YQ==",
    };
    globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [file] } });
    act(() => { if (mockFileReader.onload) mockFileReader.onload(); });
    globalThis.FileReader = originalFileReader;

    expect(screen.getByText("mycert.p12")).toBeTruthy();
  });

  it("sets optional fields to undefined when empty", () => {
    const setReady = jest.fn();
    const resultRef = makeResultRef();
    render(<SignatureStep resultRef={resultRef} setReady={setReady} />);

    // Upload keystore
    const originalFileReader = globalThis.FileReader;
    const mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null as (() => void) | null,
      result: "data:application/octet-stream;base64,a2V5",
    };
    globalThis.FileReader = jest.fn(() => mockFileReader) as unknown as typeof FileReader;
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    fireEvent.change(fileInput, { target: { files: [new File(["k"], "k.p12")] } });
    act(() => { if (mockFileReader.onload) mockFileReader.onload(); });
    globalThis.FileReader = originalFileReader;

    // Enter password
    fireEvent.change(screen.getByPlaceholderText("Enter keystore password"), { target: { value: "pass" } });

    expect(resultRef.current.signature?.reason).toBeUndefined();
    expect(resultRef.current.signature?.location).toBeUndefined();
    expect(resultRef.current.signature?.contactInfo).toBeUndefined();
  });
});
