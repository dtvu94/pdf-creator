/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/lib/templates", () => ({
  TEMPLATE_REGISTRY: [
    {
      id: "report",
      name: "Annual Report",
      description: "A sample report template.",
      accentColor: "#1E40AF",
    },
    {
      id: "invoice",
      name: "Invoice",
      description: "A sample invoice template.",
      accentColor: "#0F766E",
    },
  ],
  getTemplateById: jest.fn(),
}));

describe("BlankCard", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const BlankCard = require("../BlankCard").default;

  it("renders without crashing", () => {
    const { container } = render(<BlankCard onOpen={jest.fn()} />);
    expect(container.textContent).toContain("Blank template");
    expect(container.textContent).toContain("Start blank");
  });

  it("calls onOpen when button clicked", () => {
    const onOpen = jest.fn();
    render(<BlankCard onOpen={onOpen} />);
    fireEvent.click(screen.getByText("Start blank"));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe("PagePreview", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PagePreview = require("../PagePreview").default;

  it("renders without crashing", () => {
    const { container } = render(<PagePreview accentColor="#1E40AF" />);
    expect(container.firstChild).toBeTruthy();
  });
});

describe("TemplateCard", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TemplateCard = require("../TemplateCard").default;

  const info = {
    id: "report",
    name: "Annual Report",
    description: "A sample report template.",
    accentColor: "#1E40AF",
  };

  it("renders template info", () => {
    const { container } = render(
      <TemplateCard info={info} onOpen={jest.fn()} />
    );
    expect(container.textContent).toContain("Annual Report");
    expect(container.textContent).toContain("A sample report template.");
  });

  it("calls onOpen when Open template clicked", () => {
    const onOpen = jest.fn();
    render(<TemplateCard info={info} onOpen={onOpen} />);
    fireEvent.click(screen.getByText("Open template"));
    expect(onOpen).toHaveBeenCalled();
  });
});

describe("TemplateGallery", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const TemplateGallery = require("../index").default;

  beforeEach(() => {
    mockPush.mockClear();
  });

  it("renders without crashing", () => {
    const { container } = render(<TemplateGallery />);
    expect(container.textContent).toContain("Choose a template");
    expect(container.textContent).toContain("Annual Report");
    expect(container.textContent).toContain("Invoice");
    expect(container.textContent).toContain("Blank template");
  });

  it("navigates to editor when New template clicked", () => {
    render(<TemplateGallery />);
    fireEvent.click(screen.getByText("+ New template"));
    expect(mockPush).toHaveBeenCalledWith("/editor?t=blank");
  });

  it("navigates to editor when template opened", () => {
    render(<TemplateGallery />);
    const openButtons = screen.getAllByText("Open template");
    fireEvent.click(openButtons[0]);
    expect(mockPush).toHaveBeenCalledWith("/editor?t=report");
  });
});
