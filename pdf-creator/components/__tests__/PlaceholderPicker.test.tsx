/** @jest-environment jsdom */
import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import PlaceholderPicker from "../PlaceholderPicker";

describe("PlaceholderPicker", () => {
  const baseProps = {
    existingPlaceholders: [] as string[],
    onInsert: jest.fn(),
  };

  beforeEach(() => jest.clearAllMocks());

  it("renders button without crashing", () => {
    render(<PlaceholderPicker {...baseProps} />);
    expect(screen.getByText("Placeholder")).toBeTruthy();
  });

  it("opens panel on click", () => {
    render(<PlaceholderPicker {...baseProps} />);
    fireEvent.click(screen.getByText("Placeholder"));
    expect(screen.getByText("New placeholder")).toBeTruthy();
    expect(screen.getByText("Special")).toBeTruthy();
  });

  it("is disabled when disabled prop is true", () => {
    render(<PlaceholderPicker {...baseProps} disabled />);
    fireEvent.click(screen.getByText("Placeholder"));
    // Panel should NOT open
    expect(screen.queryByText("New placeholder")).toBeNull();
  });

  it("shows special placeholders", () => {
    render(<PlaceholderPicker {...baseProps} />);
    fireEvent.click(screen.getByText("Placeholder"));
    expect(screen.getByText("Current Page")).toBeTruthy();
    expect(screen.getByText("Total Pages")).toBeTruthy();
  });

  it("inserts special placeholder on click", () => {
    const onInsert = jest.fn();
    render(<PlaceholderPicker {...baseProps} onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Placeholder"));
    fireEvent.click(screen.getByText("Current Page"));
    expect(onInsert).toHaveBeenCalledWith("page_number");
  });

  it("shows existing placeholders", () => {
    render(<PlaceholderPicker existingPlaceholders={["my_field"]} onInsert={jest.fn()} />);
    fireEvent.click(screen.getByText("Placeholder"));
    expect(screen.getByText("In this template")).toBeTruthy();
    expect(screen.getByText("{{my_field}}")).toBeTruthy();
  });

  it("inserts existing placeholder on click", () => {
    const onInsert = jest.fn();
    render(<PlaceholderPicker existingPlaceholders={["my_field"]} onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Placeholder"));
    fireEvent.click(screen.getByText("{{my_field}}"));
    expect(onInsert).toHaveBeenCalledWith("my_field");
  });

  it("inserts new custom placeholder", () => {
    const onInsert = jest.fn();
    render(<PlaceholderPicker {...baseProps} onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Placeholder"));
    const input = screen.getByPlaceholderText("placeholder_name");
    fireEvent.change(input, { target: { value: "custom_field" } });
    fireEvent.click(screen.getByText("Insert"));
    expect(onInsert).toHaveBeenCalledWith("custom_field");
  });

  it("inserts new placeholder on Enter", () => {
    const onInsert = jest.fn();
    render(<PlaceholderPicker {...baseProps} onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Placeholder"));
    const input = screen.getByPlaceholderText("placeholder_name");
    fireEvent.change(input, { target: { value: "enter_field" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onInsert).toHaveBeenCalledWith("enter_field");
  });

  it("does not insert empty placeholder", () => {
    const onInsert = jest.fn();
    render(<PlaceholderPicker {...baseProps} onInsert={onInsert} />);
    fireEvent.click(screen.getByText("Placeholder"));
    fireEvent.click(screen.getByText("Insert"));
    expect(onInsert).not.toHaveBeenCalled();
  });

  it("closes on outside click", () => {
    render(
      <div>
        <div data-testid="outside">Outside</div>
        <PlaceholderPicker {...baseProps} />
      </div>
    );
    fireEvent.click(screen.getByText("Placeholder"));
    expect(screen.getByText("New placeholder")).toBeTruthy();
    // Click outside
    fireEvent.mouseDown(screen.getByTestId("outside"));
    expect(screen.queryByText("New placeholder")).toBeNull();
  });

  it("toggles panel closed on second click", () => {
    render(<PlaceholderPicker {...baseProps} />);
    fireEvent.click(screen.getByText("Placeholder"));
    expect(screen.getByText("New placeholder")).toBeTruthy();
    fireEvent.click(screen.getByText("Placeholder"));
    expect(screen.queryByText("New placeholder")).toBeNull();
  });
});
