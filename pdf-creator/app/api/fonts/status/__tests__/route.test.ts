import { POST } from "../route";

jest.mock("fs", () => ({
  readdirSync: jest.fn(),
}));

import fs from "fs";

const mockedFs = fs as jest.Mocked<typeof fs>;

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/fonts/status", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/fonts/status", () => {
  it("returns empty missing array when all refs are found", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["font-a-normal-normal.ttf", "font-b-bold-italic.otf"] as unknown as ReturnType<typeof fs.readdirSync>
    );

    const res = await POST(
      makeRequest({ refs: ["font-a-normal-normal", "font-b-bold-italic"] })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.missing).toEqual([]);
  });

  it("returns missing refs that are not on disk", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["font-a-normal-normal.ttf"] as unknown as ReturnType<typeof fs.readdirSync>
    );

    const res = await POST(
      makeRequest({ refs: ["font-a-normal-normal", "font-missing"] })
    );
    const json = await res.json();
    expect(json.missing).toEqual(["font-missing"]);
  });

  it("returns 400 for invalid JSON body", async () => {
    const req = new Request("http://localhost/api/fonts/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not json{{{",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/JSON/);
  });

  it("treats all refs as missing when directory does not exist", async () => {
    mockedFs.readdirSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const res = await POST(makeRequest({ refs: ["my-font"] }));
    const json = await res.json();
    expect(json.missing).toEqual(["my-font"]);
  });

  it("handles empty refs array", async () => {
    mockedFs.readdirSync.mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);

    const res = await POST(makeRequest({ refs: [] }));
    const json = await res.json();
    expect(json.missing).toEqual([]);
  });

  it("handles body with no refs field (defaults to empty)", async () => {
    mockedFs.readdirSync.mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);

    const res = await POST(makeRequest({}));
    const json = await res.json();
    expect(json.missing).toEqual([]);
  });
});
