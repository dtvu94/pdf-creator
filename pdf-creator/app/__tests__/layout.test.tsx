/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";

// Mock CSS import
jest.mock("../globals.css", () => ({}));

// Import after mock
import RootLayout from "../layout";

// Suppress console error about rendering <html> inside a <div>
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});
afterAll(() => {
  (console.error as jest.Mock).mockRestore();
});

describe("RootLayout", () => {
  it("renders children", () => {
    const { getByText } = render(
      <RootLayout>
        <div>Child content</div>
      </RootLayout>
    );
    expect(getByText("Child content")).toBeTruthy();
  });

  it("renders body content", () => {
    const { container } = render(
      <RootLayout>
        <span>Test</span>
      </RootLayout>
    );
    expect(container.querySelector("span")).toBeTruthy();
  });
});
