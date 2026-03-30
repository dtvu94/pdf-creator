/** @jest-environment jsdom */
import React from "react";
import { render, fireEvent } from "@testing-library/react";

jest.mock("@/lib/templates", () => ({
  PAGE_DIMENSIONS: {
    A4: { width: 595.28, height: 841.89 },
    A3: { width: 841.89, height: 1190.55 },
    A5: { width: 419.53, height: 595.28 },
  } as Record<string, { width: number; height: number }>,
}));

import PageSizeSelector from "../PageSizeSelector";

describe("PageSizeSelector", () => {
  it("renders all page size options", () => {
    const onChange = jest.fn();
    const { getAllByRole } = render(
      <PageSizeSelector onChange={onChange} />
    );
    const options = getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options[0].textContent).toContain("A4");
    expect(options[1].textContent).toContain("A3");
    expect(options[2].textContent).toContain("A5");
  });

  it("defaults to A4 when no value provided", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <PageSizeSelector onChange={onChange} />
    );
    const select = getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("A4");
  });

  it("uses provided value", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <PageSizeSelector value="A3" onChange={onChange} />
    );
    const select = getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("A3");
  });

  it("calls onChange with selected page size", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <PageSizeSelector onChange={onChange} />
    );
    fireEvent.change(getByRole("combobox"), { target: { value: "A5" } });
    expect(onChange).toHaveBeenCalledWith("A5");
  });

  it("displays dimensions for current size", () => {
    const onChange = jest.fn();
    const { container } = render(
      <PageSizeSelector value="A4" onChange={onChange} />
    );
    expect(container.textContent).toContain("595.28");
    expect(container.textContent).toContain("841.89");
  });
});
