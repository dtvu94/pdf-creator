import { POST } from "../route";

jest.mock("fs", () => ({
  mkdirSync: jest.fn(),
  readdirSync: jest.fn(() => []),
  unlinkSync: jest.fn(),
  writeFileSync: jest.fn(),
}));

import fs from "fs";

const mockedFs = fs as jest.Mocked<typeof fs>;

function makeFormData(fields: Record<string, string | File>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  return fd;
}

function makeRequest(body: FormData): Request {
  return new Request("http://localhost/api/fonts", { method: "POST", body });
}

function fontFile(name = "myfont.ttf"): File {
  return new File([new Uint8Array([0, 1, 2])], name, {
    type: "application/octet-stream",
  });
}

beforeEach(() => jest.clearAllMocks());

describe("POST /api/fonts", () => {
  it("uploads a valid font and returns a ref", async () => {
    const fd = makeFormData({
      family: "My Font",
      weight: "normal",
      style: "normal",
      file: fontFile("myfont.ttf"),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual({ ref: "my-font-normal-normal" });
    expect(mockedFs.mkdirSync).toHaveBeenCalledWith("/tmp/pdf-creator-fonts", {
      recursive: true,
    });
    expect(mockedFs.writeFileSync).toHaveBeenCalledWith(
      "/tmp/pdf-creator-fonts/my-font-normal-normal.ttf",
      expect.any(Buffer)
    );
  });

  it("returns 400 when fields are missing", async () => {
    const fd = makeFormData({ family: "X" });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Required fields/);
  });

  it("returns 400 for invalid weight", async () => {
    const fd = makeFormData({
      family: "F",
      weight: "heavy",
      style: "normal",
      file: fontFile(),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/weight/);
  });

  it("returns 400 for invalid style", async () => {
    const fd = makeFormData({
      family: "F",
      weight: "bold",
      style: "oblique",
      file: fontFile(),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/style/);
  });

  it("returns 400 when file is not a File instance", async () => {
    const fd = makeFormData({
      family: "F",
      weight: "normal",
      style: "normal",
      file: "not-a-file",
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/file must be a file upload/);
  });

  it("returns 400 for unsupported extension", async () => {
    const fd = makeFormData({
      family: "F",
      weight: "normal",
      style: "normal",
      file: fontFile("font.woff2"),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Unsupported font format/);
  });

  it("removes existing files for the same ref before writing", async () => {
    mockedFs.readdirSync.mockReturnValue(
      ["my-font-normal-normal.otf"] as unknown as ReturnType<typeof fs.readdirSync>
    );
    const fd = makeFormData({
      family: "My Font",
      weight: "normal",
      style: "normal",
      file: fontFile("myfont.ttf"),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedFs.unlinkSync).toHaveBeenCalledWith(
      "/tmp/pdf-creator-fonts/my-font-normal-normal.otf"
    );
  });

  it("returns 400 for non-formdata request", async () => {
    const req = new Request("http://localhost/api/fonts", {
      method: "POST",
      body: "hello",
      headers: { "Content-Type": "text/plain" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/multipart/);
  });
});
