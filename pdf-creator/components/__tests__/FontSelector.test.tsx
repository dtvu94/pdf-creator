/** @jest-environment jsdom */
import React from "react";
import { render, fireEvent } from "@testing-library/react";

jest.mock("@/lib/templates", () => ({
  SUPPORTED_FONT_FAMILIES: ["Open Sans", "Roboto", "Arial"] as const,
  DEFAULT_FONT_FAMILY: "Roboto",
}));

import FontSelector from "../FontSelector";

describe("FontSelector", () => {
  it("renders all font family options", () => {
    const onChange = jest.fn();
    const { getAllByRole } = render(
      <FontSelector onChange={onChange} />
    );
    const options = getAllByRole("option");
    expect(options).toHaveLength(3);
    expect(options.map((o) => o.textContent)).toEqual([
      "Open Sans",
      "Roboto",
      "Arial",
    ]);
  });

  it("uses provided value as current selection", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <FontSelector value="Arial" onChange={onChange} />
    );
    const select = getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Arial");
  });

  it("defaults to DEFAULT_FONT_FAMILY when no value provided", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <FontSelector onChange={onChange} />
    );
    const select = getByRole("combobox") as HTMLSelectElement;
    expect(select.value).toBe("Roboto");
  });

  it("calls onChange when selection changes", () => {
    const onChange = jest.fn();
    const { getByRole } = render(
      <FontSelector onChange={onChange} />
    );
    fireEvent.change(getByRole("combobox"), { target: { value: "Arial" } });
    expect(onChange).toHaveBeenCalledWith("Arial");
  });
});
