/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import PagePreview from "../PagePreview";

describe("PagePreview", () => {
  it("renders with accent color", () => {
    const { container } = render(<PagePreview accentColor="#1E40AF" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders multiple line elements", () => {
    const { container } = render(<PagePreview accentColor="#FF0000" />);
    // The component renders an accent bar + 5 lines = 6 child divs inside the wrapper
    const wrapper = container.firstChild as HTMLElement;
    expect(wrapper.children.length).toBe(6);
  });
});
