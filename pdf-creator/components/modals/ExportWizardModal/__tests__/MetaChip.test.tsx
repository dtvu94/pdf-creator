/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import { MetaChip } from "../MetaChip";

describe("MetaChip", () => {
  it("renders label and value", () => {
    const { container } = render(<MetaChip label="Size" value="200 x 100" />);
    expect(container.textContent).toContain("Size");
    expect(container.textContent).toContain("200 x 100");
  });

  it("renders with highlight", () => {
    const { container } = render(<MetaChip label="Status" value="Warning" highlight />);
    expect(container.textContent).toContain("Warning");
  });

  it("renders without highlight (default)", () => {
    const { container } = render(<MetaChip label="Status" value="OK" />);
    expect(container.textContent).toContain("OK");
  });
});
