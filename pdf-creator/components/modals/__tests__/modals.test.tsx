/** @jest-environment jsdom */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({}),
  })
) as jest.Mock;

describe("FontUploadList", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { FontUploadList } = require("../FontUploadList");

  const missingFonts = [
    {
      family: "CustomFont",
      faces: [
        { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-normal-normal" },
        { weight: "bold" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-bold-normal" },
      ],
    },
  ];

  it("renders missing font faces", () => {
    const { container } = render(
      <FontUploadList missingFonts={missingFonts} />
    );
    expect(container.textContent).toContain("CustomFont");
    expect(container.textContent).toContain("Regular");
    expect(container.textContent).toContain("Bold");
  });

  it("renders Upload buttons for each face", () => {
    render(<FontUploadList missingFonts={missingFonts} />);
    const uploadButtons = screen.getAllByText("Upload");
    expect(uploadButtons).toHaveLength(2);
  });

  it("calls onAllDoneChange callback", () => {
    const onAllDoneChange = jest.fn();
    render(
      <FontUploadList missingFonts={missingFonts} onAllDoneChange={onAllDoneChange} />
    );
    // Initially not all done
    expect(onAllDoneChange).toHaveBeenCalledWith(false);
  });

  it("filters out bundled faces", () => {
    const fonts = [
      {
        family: "BundledFont",
        faces: [
          { weight: "normal" as const, style: "normal" as const, source: "bundled" as const, ref: "bundled.ttf" },
        ],
      },
    ];
    const { container } = render(<FontUploadList missingFonts={fonts} />);
    // No Upload buttons since bundled faces are filtered out
    expect(container.querySelectorAll("button").length).toBe(0);
  });

  it("shows Italic label for italic faces", () => {
    const fonts = [
      {
        family: "TestFont",
        faces: [
          { weight: "normal" as const, style: "italic" as const, source: "uploaded" as const, ref: "test-normal-italic" },
          { weight: "bold" as const, style: "italic" as const, source: "uploaded" as const, ref: "test-bold-italic" },
        ],
      },
    ];
    const { container } = render(<FontUploadList missingFonts={fonts} />);
    expect(container.textContent).toContain("Regular Italic");
    expect(container.textContent).toContain("Bold Italic");
  });
});

describe("MissingFontsModal", () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const MissingFontsModal = require("../MissingFontsModal").default;

  const missingFonts = [
    {
      family: "CustomFont",
      faces: [
        { weight: "normal" as const, style: "normal" as const, source: "uploaded" as const, ref: "custom-normal-normal" },
      ],
    },
  ];

  it("renders without crashing", () => {
    const { container } = render(
      <MissingFontsModal
        missingFonts={missingFonts}
        onResolved={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    expect(container.textContent).toContain("Missing Fonts");
  });

  it("renders Continue without fonts button", () => {
    render(
      <MissingFontsModal
        missingFonts={missingFonts}
        onResolved={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    expect(screen.getByText("Continue without fonts")).toBeTruthy();
  });

  it("calls onDismiss when dismiss button clicked", () => {
    const onDismiss = jest.fn();
    render(
      <MissingFontsModal
        missingFonts={missingFonts}
        onResolved={jest.fn()}
        onDismiss={onDismiss}
      />
    );
    fireEvent.click(screen.getByText("Continue without fonts"));
    expect(onDismiss).toHaveBeenCalled();
  });

  it("renders Continue button (disabled by default)", () => {
    render(
      <MissingFontsModal
        missingFonts={missingFonts}
        onResolved={jest.fn()}
        onDismiss={jest.fn()}
      />
    );
    const continueBtn = screen.getByText("Continue");
    expect(continueBtn).toBeTruthy();
    expect((continueBtn as HTMLButtonElement).disabled).toBe(true);
  });
});
