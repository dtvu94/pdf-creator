import { POST } from "../route";

/* ── Mock all heavy dependencies ──────────────────────────────────────────── */

jest.mock("@react-pdf/renderer", () => ({
  renderToBuffer: jest.fn(),
}));

jest.mock("@/lib/serverPdfRenderer", () => ({
  PdfDocument: () => null,
}));

jest.mock("@/lib/serverImageConvert", () => ({
  convertTemplateImages: jest.fn((t: unknown) => Promise.resolve(t)),
}));

jest.mock("@/lib/serverChartRenderer", () => ({
  renderCharts: jest.fn((t: unknown) => Promise.resolve(t)),
}));

jest.mock("@/lib/fontRegistry.server", () => ({
  registerFontsServer: jest.fn(() => []),
}));

jest.mock("@/lib/placeholders", () => ({
  applyValues: jest.fn((t: unknown) => t),
  applyAutoRows: jest.fn((t: unknown) => t),
  collectAutoTables: jest.fn(() => []),
}));

jest.mock("@/lib/utils", () => ({
  parseTableData: jest.fn(() => ({ rows: [["a", "b"]] })),
}));

jest.mock("@/lib/pdfaService", () => ({
  convertToPdfA: jest.fn((buf: Buffer) => Promise.resolve(buf)),
  encryptPdf: jest.fn((buf: Buffer) => Promise.resolve(buf)),
  signPdf: jest.fn((buf: Buffer) => Promise.resolve(buf)),
}));

/* ── Get mocked module references ────────────────────────────────────────── */

import { renderToBuffer } from "@react-pdf/renderer";
import { registerFontsServer } from "@/lib/fontRegistry.server";
import { applyValues, collectAutoTables, applyAutoRows } from "@/lib/placeholders";
import { parseTableData } from "@/lib/utils";
import { convertToPdfA, encryptPdf, signPdf } from "@/lib/pdfaService";
import { renderCharts } from "@/lib/serverChartRenderer";

const mockedRenderToBuffer = renderToBuffer as jest.Mock;
const mockedRegisterFontsServer = registerFontsServer as jest.Mock;
const mockedApplyValues = applyValues as jest.Mock;
const mockedCollectAutoTables = collectAutoTables as jest.Mock;
const mockedApplyAutoRows = applyAutoRows as jest.Mock;
const mockedParseTableData = parseTableData as jest.Mock;
const mockedConvertToPdfA = convertToPdfA as jest.Mock;
const mockedEncryptPdf = encryptPdf as jest.Mock;
const mockedSignPdf = signPdf as jest.Mock;
const mockedRenderCharts = renderCharts as jest.Mock;

/* ── Helpers ──────────────────────────────────────────────────────────────── */

const MINIMAL_TEMPLATE = { pages: [{ id: "p1", elements: [] }] };

function makeFormData(
  overrides: Record<string, string | File | Blob> = {}
): FormData {
  const fd = new FormData();
  if (!("template" in overrides)) {
    fd.append("template", JSON.stringify(MINIMAL_TEMPLATE));
  }
  for (const [k, v] of Object.entries(overrides)) fd.append(k, v);
  return fd;
}

function makeRequest(body: FormData): Request {
  return new Request("http://localhost/api/generate-pdf", {
    method: "POST",
    body,
  });
}

beforeEach(() => {
  jest.restoreAllMocks();
  mockedRenderToBuffer.mockResolvedValue(Buffer.from("fake-pdf"));
  mockedConvertToPdfA.mockImplementation((buf: Buffer) => Promise.resolve(buf));
  mockedEncryptPdf.mockImplementation((buf: Buffer) => Promise.resolve(buf));
  mockedSignPdf.mockImplementation((buf: Buffer) => Promise.resolve(buf));
  mockedRegisterFontsServer.mockReturnValue([]);
  mockedApplyValues.mockImplementation((t: unknown) => t);
  mockedApplyAutoRows.mockImplementation((t: unknown) => t);
  mockedCollectAutoTables.mockReturnValue([]);
  mockedParseTableData.mockReturnValue({ rows: [["a", "b"]] });
});

/* ── Tests ────────────────────────────────────────────────────────────────── */

describe("POST /api/generate-pdf", () => {
  it("returns 400 when template field is missing", async () => {
    const fd = new FormData();
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Missing required field/);
  });

  it("returns 400 for invalid JSON template", async () => {
    const fd = new FormData();
    fd.append("template", "not-json{{{");
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/not valid JSON/);
  });

  it("returns 400 when template has no pages", async () => {
    const fd = new FormData();
    fd.append("template", JSON.stringify({ name: "test" }));
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/missing "pages"/);
  });

  it("generates a PDF for a valid template", async () => {
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("output.pdf");
    expect(mockedRenderToBuffer).toHaveBeenCalled();
  });

  it("applies placeholders when provided", async () => {
    const fd = makeFormData({
      placeholders: JSON.stringify({ name: "Alice" }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedApplyValues).toHaveBeenCalledWith(
      expect.objectContaining({ pages: expect.any(Array) }),
      { name: "Alice" }
    );
  });

  it("processes CSV files for auto tables", async () => {
    mockedCollectAutoTables.mockReturnValue([{ id: "t1" }]);
    const csvFile = new File(["h1,h2\na,b"], "data.csv", {
      type: "text/csv",
    });
    const fd = makeFormData();
    fd.append("csv", csvFile);
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedParseTableData).toHaveBeenCalled();
    expect(mockedApplyAutoRows).toHaveBeenCalled();
  });

  it("uses metadata fileName in Content-Disposition", async () => {
    const fd = makeFormData({
      metadata: JSON.stringify({ fileName: "report.pdf", title: "My Report" }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("report.pdf");
  });

  it("calls encryptPdf when password is provided", async () => {
    const fd = makeFormData();
    fd.append("password", "secret123");
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedEncryptPdf).toHaveBeenCalledWith(expect.any(Buffer), {
      userPassword: "secret123",
    });
  });

  it("calls convertToPdfA when pdfa settings provided", async () => {
    const fd = makeFormData({
      pdfa: JSON.stringify({ part: 2, conformance: "B" }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedConvertToPdfA).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ part: 2, conformance: "B" })
    );
  });

  it("calls signPdf when signature settings provided", async () => {
    const fd = makeFormData({
      signature: JSON.stringify({
        keystoreBase64: Buffer.from("fake-ks").toString("base64"),
        keystorePassword: "pass",
        reason: "Approval",
      }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedSignPdf).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        keystore: expect.any(Buffer),
        keystorePassword: "pass",
        reason: "Approval",
      })
    );
  });

  it("returns 400 for invalid placeholders JSON", async () => {
    const fd = makeFormData({ placeholders: "bad{json" });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/placeholders.*not valid JSON/);
  });

  it("returns 400 for invalid metadata JSON", async () => {
    const fd = makeFormData({ metadata: "{bad" });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/metadata.*not valid JSON/);
  });

  it("returns 500 when renderToBuffer fails", async () => {
    mockedRenderToBuffer.mockRejectedValue(new Error("render boom"));
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/PDF generation failed/);
  });

  it("returns 500 when PDF/A conversion fails", async () => {
    mockedConvertToPdfA.mockRejectedValue(new Error("pdfa boom"));
    const fd = makeFormData({
      pdfa: JSON.stringify({ part: 2, conformance: "B" }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/PDF\/A conversion failed/);
  });

  it("returns 500 when signing fails", async () => {
    mockedSignPdf.mockRejectedValue(new Error("sign boom"));
    const fd = makeFormData({
      signature: JSON.stringify({
        keystoreBase64: "AA==",
        keystorePassword: "p",
      }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/PDF signing failed/);
  });

  it("returns 500 when encryption fails", async () => {
    mockedEncryptPdf.mockRejectedValue(new Error("enc boom"));
    const fd = makeFormData();
    fd.append("password", "pw");
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(500);
    expect((await res.json()).error).toMatch(/PDF encryption failed/);
  });

  it("returns 400 with missing fonts list", async () => {
    mockedRegisterFontsServer.mockReturnValue(["Custom Font"]);
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("missing_fonts");
    expect(json.missingFonts).toEqual(["Custom Font"]);
  });

  it("returns 400 for non-formdata request", async () => {
    const req = new Request("http://localhost/api/generate-pdf", {
      method: "POST",
      body: "plain text",
      headers: { "Content-Type": "text/plain" },
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/multipart/);
  });

  it("returns 400 for invalid pdfa JSON", async () => {
    const fd = makeFormData({ pdfa: "bad{" });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/pdfa.*not valid JSON/);
  });

  it("returns 400 for invalid signature JSON", async () => {
    const fd = makeFormData({ signature: "bad{" });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/signature.*not valid JSON/);
  });

  it("processes template as File upload", async () => {
    const fd = new FormData();
    fd.append(
      "template",
      new File([JSON.stringify(MINIMAL_TEMPLATE)], "t.json", {
        type: "application/json",
      })
    );
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
  });

  /* ── File-object branches for instanceof File ternaries ─────────────── */

  it("reads placeholders from a File object", async () => {
    const content = JSON.stringify({ name: "Bob" });
    const file = new File([content], "vals.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(content),
    });
    const fd = makeFormData();
    fd.set("placeholders", file);
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedApplyValues).toHaveBeenCalledWith(
      expect.objectContaining({ pages: expect.any(Array) }),
      { name: "Bob" }
    );
  });

  it("reads csv from a File object (instanceof File branch)", async () => {
    mockedCollectAutoTables.mockReturnValue([{ id: "t1" }]);
    const content = "h1,h2\nx,y";
    const file = new File([content], "data.csv", { type: "text/csv" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(content),
    });
    const fd = makeFormData();
    fd.append("csv", file);
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedParseTableData).toHaveBeenCalledWith(content);
  });

  it("reads metadata from a File object", async () => {
    const content = JSON.stringify({ fileName: "from-file.pdf" });
    const file = new File([content], "meta.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(content),
    });
    const fd = makeFormData();
    fd.set("metadata", file);
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Disposition")).toContain("from-file.pdf");
  });

  it("reads pdfa settings from a File object", async () => {
    const content = JSON.stringify({ part: 3, conformance: "A" });
    const file = new File([content], "pdfa.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(content),
    });
    const fd = makeFormData();
    fd.set("pdfa", file);
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedConvertToPdfA).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ part: 3, conformance: "A" })
    );
  });

  it("reads signature settings from a File object", async () => {
    const content = JSON.stringify({
      keystoreBase64: "AA==",
      keystorePassword: "p",
      reason: "Test",
    });
    const file = new File([content], "sig.json", { type: "application/json" });
    Object.defineProperty(file, "text", {
      value: () => Promise.resolve(content),
    });
    const fd = makeFormData();
    fd.set("signature", file);
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedSignPdf).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({ keystorePassword: "p", reason: "Test" })
    );
  });

  /* ── Non-Error throw branches (e instanceof Error ? ... : "Unknown") ── */

  it("returns 'Unknown error' when PDF/A conversion throws a non-Error", async () => {
    mockedConvertToPdfA.mockRejectedValue("string-not-error");
    const fd = makeFormData({
      pdfa: JSON.stringify({ part: 2, conformance: "B" }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Unknown error");
  });

  it("returns 'Unknown error' when signing throws a non-Error", async () => {
    mockedSignPdf.mockRejectedValue(42);
    const fd = makeFormData({
      signature: JSON.stringify({
        keystoreBase64: "AA==",
        keystorePassword: "p",
      }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Unknown error");
  });

  it("returns 'Unknown error' when encryption throws a non-Error", async () => {
    mockedEncryptPdf.mockRejectedValue(null);
    const fd = makeFormData();
    fd.append("password", "pw");
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toContain("Unknown error");
  });

  /* ── PDF/A with metadata title & author ────────────────────────────── */

  it("passes metadata title and author to convertToPdfA", async () => {
    const fd = makeFormData({
      pdfa: JSON.stringify({ part: 2, conformance: "B" }),
      metadata: JSON.stringify({ title: "My Title", author: "Jane Doe" }),
    });
    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(mockedConvertToPdfA).toHaveBeenCalledWith(
      expect.any(Buffer),
      expect.objectContaining({
        part: 2,
        conformance: "B",
        title: "My Title",
        author: "Jane Doe",
      })
    );
  });

  it("calls renderCharts during generation", async () => {
    const res = await POST(makeRequest(makeFormData()));
    expect(res.status).toBe(200);
    expect(mockedRenderCharts).toHaveBeenCalledWith(
      expect.objectContaining({ pages: expect.any(Array) })
    );
  });

  it("runs pipeline in correct order: pdfa, sign, encrypt", async () => {
    const callOrder: string[] = [];
    mockedConvertToPdfA.mockImplementation(async (buf: Buffer) => {
      callOrder.push("pdfa");
      return buf;
    });
    mockedSignPdf.mockImplementation(async (buf: Buffer) => {
      callOrder.push("sign");
      return buf;
    });
    mockedEncryptPdf.mockImplementation(async (buf: Buffer) => {
      callOrder.push("encrypt");
      return buf;
    });

    const fd = makeFormData({
      pdfa: JSON.stringify({ part: 2, conformance: "B" }),
      signature: JSON.stringify({
        keystoreBase64: "AA==",
        keystorePassword: "p",
      }),
    });
    fd.append("password", "pw");

    const res = await POST(makeRequest(fd));
    expect(res.status).toBe(200);
    expect(callOrder).toEqual(["pdfa", "sign", "encrypt"]);
  });
});
