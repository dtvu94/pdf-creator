/** @jest-environment jsdom */
import React from "react";
import { render } from "@testing-library/react";
import Home from "../page";

jest.mock("@/components/TemplateGallery", () => {
  return function MockTemplateGallery() {
    return <div data-testid="template-gallery">TemplateGallery</div>;
  };
});

describe("Home page", () => {
  it("renders TemplateGallery", () => {
    const { getByTestId } = render(<Home />);
    expect(getByTestId("template-gallery")).toBeTruthy();
  });
});
