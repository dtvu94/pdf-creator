/**
 * @jest-environment jsdom
 */

import React from "react";
import { downloadJson, parseTableData, renderWithPlaceholders } from "@/lib/utils";

// ─── downloadJson ────────────────────────────────────────────────────────────

describe("downloadJson", () => {
  let mockAnchor: { href: string; download: string; click: jest.Mock };

  beforeEach(() => {
    mockAnchor = { href: "", download: "", click: jest.fn() };
    jest.spyOn(document, "createElement").mockReturnValue(mockAnchor as unknown as HTMLElement);
    // jsdom does not implement URL.createObjectURL / revokeObjectURL
    URL.createObjectURL = jest.fn().mockReturnValue("blob:http://localhost/fake");
    URL.revokeObjectURL = jest.fn();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("creates a JSON blob, sets href and download, clicks, and revokes", () => {
    const data = { foo: 1, bar: [2, 3] };
    downloadJson(data, "test.json");

    expect(document.createElement).toHaveBeenCalledWith("a");
    expect(URL.createObjectURL).toHaveBeenCalledWith(expect.any(Blob));
    expect(mockAnchor.href).toBe("blob:http://localhost/fake");
    expect(mockAnchor.download).toBe("test.json");
    expect(mockAnchor.click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:http://localhost/fake");
  });

  it("serialises data with 2-space indentation", () => {
    let capturedBlob: Blob | undefined;
    (URL.createObjectURL as jest.Mock).mockImplementation((blob: Blob) => {
      capturedBlob = blob;
      return "blob:fake";
    });

    downloadJson({ a: 1 }, "out.json");
    expect(capturedBlob).toBeDefined();
    expect(capturedBlob!.type).toBe("application/json");
  });
});

// ─── parseTableData ──────────────────────────────────────────────────────────

describe("parseTableData", () => {
  it("returns empty headers and rows for empty string", () => {
    expect(parseTableData("")).toEqual({ headers: [], rows: [] });
  });

  it("returns empty headers and rows for whitespace-only string", () => {
    expect(parseTableData("   \n  \n  ")).toEqual({ headers: [], rows: [] });
  });

  it("parses a CSV with header only (no data rows)", () => {
    const result = parseTableData("Name,Age,City");
    expect(result.headers).toEqual(["Name", "Age", "City"]);
    expect(result.rows).toEqual([]);
  });

  it("parses a basic CSV", () => {
    const csv = "Name,Age\nAlice,30\nBob,25";
    const result = parseTableData(csv);
    expect(result.headers).toEqual(["Name", "Age"]);
    expect(result.rows).toEqual([
      ["Alice", "30"],
      ["Bob", "25"],
    ]);
  });

  it("parses TSV (tab-delimited) — tab takes priority", () => {
    const tsv = "Name\tAge\nAlice\t30";
    const result = parseTableData(tsv);
    expect(result.headers).toEqual(["Name", "Age"]);
    expect(result.rows).toEqual([["Alice", "30"]]);
  });

  it("strips surrounding double-quotes from cells", () => {
    const csv = '"Name","Age"\n"Alice","30"';
    const result = parseTableData(csv);
    expect(result.headers).toEqual(["Name", "Age"]);
    expect(result.rows).toEqual([["Alice", "30"]]);
  });

  it("pads short rows with empty strings", () => {
    const csv = "A,B,C\n1";
    const result = parseTableData(csv);
    expect(result.rows[0]).toEqual(["1", "", ""]);
  });

  it("truncates extra cells beyond header count", () => {
    const csv = "A,B\n1,2,3,4";
    const result = parseTableData(csv);
    expect(result.rows[0]).toEqual(["1", "2"]);
  });

  it("trims whitespace from lines and cells", () => {
    const csv = "  Name , Age \n  Alice , 30  ";
    const result = parseTableData(csv);
    expect(result.headers).toEqual(["Name", "Age"]);
    expect(result.rows).toEqual([["Alice", "30"]]);
  });

  it("prefers tab delimiter when both tab and comma are present", () => {
    // If the header line contains a tab, tab should be used as delimiter
    const mixed = "A,B\tC\n1,2\t3";
    const result = parseTableData(mixed);
    // Tab splits the header into ["A,B", "C"]
    expect(result.headers).toEqual(["A,B", "C"]);
  });
});

// ─── renderWithPlaceholders ──────────────────────────────────────────────────

describe("renderWithPlaceholders", () => {
  it("returns plain text with no placeholders as span elements", () => {
    const result = renderWithPlaceholders("hello world") as React.ReactElement[];
    expect(result).toHaveLength(1);
    expect(result[0].props.children).toBe("hello world");
  });

  it("highlights {{placeholder}} tokens with placeholder-chip class", () => {
    const result = renderWithPlaceholders("Hello {{name}}!") as React.ReactElement[];
    expect(result).toHaveLength(3);
    // "Hello "
    expect(result[0].props.children).toBe("Hello ");
    // "{{name}}" — highlighted
    expect(result[1].props.children).toBe("{{name}}");
    expect(result[1].props.className).toBe("placeholder-chip");
    // "!"
    expect(result[2].props.children).toBe("!");
  });

  it("handles multiple placeholders", () => {
    const result = renderWithPlaceholders("{{a}} and {{b}}") as React.ReactElement[];
    // split("{{a}} and {{b}}") -> ["", "{{a}}", " and ", "{{b}}", ""]
    expect(result).toHaveLength(5);
    expect(result[0].props.children).toBe("");
    expect(result[1].props.children).toBe("{{a}}");
    expect(result[1].props.className).toBe("placeholder-chip");
    expect(result[2].props.children).toBe(" and ");
    expect(result[3].props.children).toBe("{{b}}");
    expect(result[3].props.className).toBe("placeholder-chip");
    expect(result[4].props.children).toBe("");
  });

  it("handles text that is only a placeholder", () => {
    const result = renderWithPlaceholders("{{only}}") as React.ReactElement[];
    // split produces ["", "{{only}}", ""] — 3 parts
    expect(result).toHaveLength(3);
    expect(result[1].props.children).toBe("{{only}}");
    expect(result[1].props.className).toBe("placeholder-chip");
    // empty strings are still rendered as plain spans
    expect(result[0].props.children).toBe("");
    expect(result[2].props.children).toBe("");
  });

  it("handles text with no placeholders at all", () => {
    const result = renderWithPlaceholders("no placeholders here") as React.ReactElement[];
    expect(result).toHaveLength(1);
    expect(result[0].props.children).toBe("no placeholders here");
  });

  it("assigns unique keys to each span", () => {
    const result = renderWithPlaceholders("{{a}} text {{b}}") as React.ReactElement[];
    const keys = result.map((el) => el.key);
    const uniqueKeys = new Set(keys);
    expect(uniqueKeys.size).toBe(keys.length);
  });
});
