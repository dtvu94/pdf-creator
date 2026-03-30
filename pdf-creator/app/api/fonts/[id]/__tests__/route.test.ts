import { GET } from "../route";

jest.mock("fs", () => ({
  readdirSync: jest.fn(),
  readFileSync: jest.fn(),
}));

import fs from "fs";

const mockedFs = fs as jest.Mocked<typeof fs>;

function makeRequest(id: string): [Request, { params: Promise<{ id: string }> }] {
  return [
    new Request(`http://localhost/api/fonts/${id}`),
    { params: Promise.resolve({ id }) },
  ];
}

beforeEach(() => jest.clearAllMocks());

describe("GET /api/fonts/[id]", () => {
  it("serves a .ttf file with correct MIME type", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["my-font-normal-normal.ttf"] as unknown as ReturnType<typeof fs.readdirSync>
    );
    mockedFs.readFileSync.mockReturnValue(Buffer.from([1, 2, 3]));

    const res = await GET(...makeRequest("my-font-normal-normal"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("font/ttf");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=86400");
  });

  it("serves a .otf file with correct MIME type", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["my-font-bold-italic.otf"] as unknown as ReturnType<typeof fs.readdirSync>
    );
    mockedFs.readFileSync.mockReturnValue(Buffer.from([4, 5, 6]));

    const res = await GET(...makeRequest("my-font-bold-italic"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("font/otf");
  });

  it("returns 404 when file not found", async () => {
    mockedFs.readdirSync.mockReturnValue([] as unknown as ReturnType<typeof fs.readdirSync>);

    const res = await GET(...makeRequest("nonexistent"));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Font not found.");
  });

  it("returns 404 when directory does not exist", async () => {
    mockedFs.readdirSync.mockImplementation(() => {
      throw new Error("ENOENT");
    });

    const res = await GET(...makeRequest("any-font"));
    expect(res.status).toBe(404);
    expect((await res.json()).error).toBe("Font not found.");
  });

  it("uses application/octet-stream for unknown extension", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["myfont.xyz"] as unknown as ReturnType<typeof fs.readdirSync>
    );
    mockedFs.readFileSync.mockReturnValue(Buffer.from([0]));

    const res = await GET(...makeRequest("myfont"));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/octet-stream");
  });
});
