import { POST } from "../route";

jest.mock("fs", () => ({
  readdirSync: jest.fn(),
  statSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

import fs from "fs";

const mockedFs = fs as jest.Mocked<typeof fs>;

const HOUR = 60 * 60 * 1000;

function makeRequest(headers: Record<string, string> = {}): Request {
  return new Request("http://localhost/api/fonts/cleanup", {
    method: "POST",
    headers,
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  delete process.env.CRON_SECRET;
});

describe("POST /api/fonts/cleanup", () => {
  it("deletes files older than 24 hours", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["old-font.ttf", "new-font.otf"] as unknown as ReturnType<typeof fs.readdirSync>
    );
    const now = Date.now();
    mockedFs.statSync.mockImplementation((filePath) => {
      const p = String(filePath);
      if (p.includes("old-font")) {
        return { mtimeMs: now - 25 * HOUR } as fs.Stats;
      }
      return { mtimeMs: now - 1 * HOUR } as fs.Stats;
    });

    const res = await POST(makeRequest());
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.deleted).toBe(1);
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith(
      "/tmp/pdf-creator-fonts/old-font.ttf"
    );
    expect(mockedFs.unlinkSync).toHaveBeenCalledTimes(1);
  });

  it("keeps recent files", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["recent.ttf"] as unknown as ReturnType<typeof fs.readdirSync>
    );
    mockedFs.statSync.mockReturnValue({ mtimeMs: Date.now() - HOUR } as fs.Stats);

    const res = await POST(makeRequest());
    const json = await res.json();
    expect(json.deleted).toBe(0);
    expect(mockedFs.unlinkSync).not.toHaveBeenCalled();
  });

  it("requires auth when CRON_SECRET is set", async () => {
    process.env.CRON_SECRET = "my-secret";
    mockedFs.readdirSync.mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);

    const res = await POST(
      makeRequest({ Authorization: "Bearer my-secret" })
    );
    expect(res.status).toBe(200);
  });

  it("returns 401 when unauthorized", async () => {
    process.env.CRON_SECRET = "my-secret";

    const res = await POST(makeRequest({ Authorization: "Bearer wrong" }));
    expect(res.status).toBe(401);
    expect((await res.json()).error).toBe("Unauthorized.");
  });

  it("returns 401 when auth header is missing", async () => {
    process.env.CRON_SECRET = "my-secret";

    const res = await POST(makeRequest());
    expect(res.status).toBe(401);
  });

  it("returns deleted: 0 when directory does not exist", async () => {
    mockedFs.readdirSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const res = await POST(makeRequest());
    const json = await res.json();
    expect(json.deleted).toBe(0);
  });

  it("handles empty directory", async () => {
    mockedFs.readdirSync.mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);

    const res = await POST(makeRequest());
    const json = await res.json();
    expect(json.deleted).toBe(0);
  });
});
