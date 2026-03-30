/**
 * Unit tests for lib/pdfaService.ts
 *
 * All three exported functions (convertToPdfA, encryptPdf, signPdf) talk to an
 * external HTTP service.  We mock `global.fetch` so every code-path in the
 * module is exercised without network access.
 */

import { convertToPdfA, encryptPdf, signPdf } from "../pdfaService";

// ─── helpers ────────────────────────────────────────────────────────────────

const PDF_BUF = Buffer.from("fake-pdf-bytes");
const PDF_B64 = PDF_BUF.toString("base64");

/** Build a successful Response whose `.json()` returns `body`. */
function okResponse(body: unknown): Response {
  return {
    ok: true,
    status: 200,
    json: () => Promise.resolve(body),
  } as unknown as Response;
}

/** Build a failed Response (non-2xx). */
function errorResponse(status: number, body?: unknown): Response {
  return {
    ok: false,
    status,
    json: body !== undefined
      ? () => Promise.resolve(body)
      : () => Promise.reject(new Error("not json")),
  } as unknown as Response;
}

/** Grab the parsed JSON body from the most recent `fetch` call. */
function lastRequestBody(): Record<string, unknown> {
  const calls = (global.fetch as jest.Mock).mock.calls;
  const lastCall = calls[calls.length - 1];
  return JSON.parse(lastCall[1].body as string);
}

// ─── setup / teardown ───────────────────────────────────────────────────────

const originalFetch = global.fetch;

beforeEach(() => {
  global.fetch = jest.fn();
});

afterAll(() => {
  global.fetch = originalFetch;
});

// ═══════════════════════════════════════════════════════════════════════════
//  convertToPdfA
// ═══════════════════════════════════════════════════════════════════════════

describe("convertToPdfA", () => {
  const RESULT_B64 = Buffer.from("pdfa-result").toString("base64");

  it("sends correct request with default options", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await convertToPdfA(PDF_BUF);

    expect(global.fetch).toHaveBeenCalledTimes(1);
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/convert-to-pdfa");
    expect(init.method).toBe("POST");
    expect(init.headers["Content-Type"]).toBe("application/json");

    const body = lastRequestBody();
    expect(body.pdf).toBe(PDF_B64);
    expect(body.part).toBe(2);
    expect(body.conformance).toBe("B");
    expect(body.title).toBe("");
    expect(body.author).toBe("");
  });

  it("sends custom options when provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await convertToPdfA(PDF_BUF, {
      part: 3,
      conformance: "A",
      title: "My Doc",
      author: "Alice",
    });

    const body = lastRequestBody();
    expect(body.part).toBe(3);
    expect(body.conformance).toBe("A");
    expect(body.title).toBe("My Doc");
    expect(body.author).toBe("Alice");
  });

  it("returns decoded Buffer on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    const result = await convertToPdfA(PDF_BUF);
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe("pdfa-result");
  });

  it("throws with server error message on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(500, { error: "Internal failure" }),
    );

    await expect(convertToPdfA(PDF_BUF)).rejects.toThrow("Internal failure");
  });

  it("throws generic message when error response is not JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(502),
    );

    await expect(convertToPdfA(PDF_BUF)).rejects.toThrow(
      "PDF/A conversion failed",
    );
  });

  it("throws generic message when error JSON has no error field", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(400, { detail: "bad input" }),
    );

    await expect(convertToPdfA(PDF_BUF)).rejects.toThrow(
      "PDF/A conversion failed",
    );
  });

  it("propagates fetch network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(convertToPdfA(PDF_BUF)).rejects.toThrow("ECONNREFUSED");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  encryptPdf
// ═══════════════════════════════════════════════════════════════════════════

describe("encryptPdf", () => {
  const RESULT_B64 = Buffer.from("encrypted-result").toString("base64");

  it("sends correct request with default options", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await encryptPdf(PDF_BUF, { userPassword: "secret" });

    const body = lastRequestBody();
    expect(body.pdf).toBe(PDF_B64);
    expect(body.userPassword).toBe("secret");
    expect(body.ownerPassword).toBe("secret"); // defaults to userPassword
    expect(body.keyLength).toBe(128);
    expect(body.permissions).toBe(4);
  });

  it("sends custom options when provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await encryptPdf(PDF_BUF, {
      userPassword: "user",
      ownerPassword: "owner",
      keyLength: 256,
      permissions: 12,
    });

    const body = lastRequestBody();
    expect(body.userPassword).toBe("user");
    expect(body.ownerPassword).toBe("owner");
    expect(body.keyLength).toBe(256);
    expect(body.permissions).toBe(12);
  });

  it("posts to /api/encrypt endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await encryptPdf(PDF_BUF, { userPassword: "pw" });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/encrypt");
  });

  it("returns decoded Buffer on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    const result = await encryptPdf(PDF_BUF, { userPassword: "pw" });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe("encrypted-result");
  });

  it("throws with server error message on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(500, { error: "Encryption blew up" }),
    );

    await expect(
      encryptPdf(PDF_BUF, { userPassword: "pw" }),
    ).rejects.toThrow("Encryption blew up");
  });

  it("throws generic message when error response is not JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(errorResponse(502));

    await expect(
      encryptPdf(PDF_BUF, { userPassword: "pw" }),
    ).rejects.toThrow("PDF encryption failed");
  });

  it("throws generic message when error JSON has no error field", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(400, { message: "something" }),
    );

    await expect(
      encryptPdf(PDF_BUF, { userPassword: "pw" }),
    ).rejects.toThrow("PDF encryption failed");
  });

  it("propagates fetch network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("socket hang up"),
    );

    await expect(
      encryptPdf(PDF_BUF, { userPassword: "pw" }),
    ).rejects.toThrow("socket hang up");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  signPdf
// ═══════════════════════════════════════════════════════════════════════════

describe("signPdf", () => {
  const KEYSTORE_BUF = Buffer.from("fake-keystore");
  const KEYSTORE_B64 = KEYSTORE_BUF.toString("base64");
  const RESULT_B64 = Buffer.from("signed-result").toString("base64");

  it("sends correct request with default options", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await signPdf(PDF_BUF, {
      keystore: KEYSTORE_BUF,
      keystorePassword: "pass",
    });

    const body = lastRequestBody();
    expect(body.pdf).toBe(PDF_B64);
    expect(body.keystore).toBe(KEYSTORE_B64);
    expect(body.keystorePassword).toBe("pass");
    expect(body.keystoreType).toBe("PKCS12");
    expect(body.alias).toBe("");
    expect(body.reason).toBe("");
    expect(body.location).toBe("");
    expect(body.contactInfo).toBe("");
  });

  it("sends custom options when provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await signPdf(PDF_BUF, {
      keystore: KEYSTORE_BUF,
      keystorePassword: "pass",
      keystoreType: "JKS",
      alias: "mykey",
      reason: "Approved",
      location: "Hanoi",
      contactInfo: "admin@example.com",
    });

    const body = lastRequestBody();
    expect(body.keystoreType).toBe("JKS");
    expect(body.alias).toBe("mykey");
    expect(body.reason).toBe("Approved");
    expect(body.location).toBe("Hanoi");
    expect(body.contactInfo).toBe("admin@example.com");
  });

  it("posts to /api/sign endpoint", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    await signPdf(PDF_BUF, {
      keystore: KEYSTORE_BUF,
      keystorePassword: "pw",
    });

    const [url] = (global.fetch as jest.Mock).mock.calls[0];
    expect(url).toContain("/api/sign");
  });

  it("returns decoded Buffer on success", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    const result = await signPdf(PDF_BUF, {
      keystore: KEYSTORE_BUF,
      keystorePassword: "pw",
    });
    expect(Buffer.isBuffer(result)).toBe(true);
    expect(result.toString()).toBe("signed-result");
  });

  it("throws with server error message on non-ok response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(500, { error: "Bad keystore" }),
    );

    await expect(
      signPdf(PDF_BUF, { keystore: KEYSTORE_BUF, keystorePassword: "pw" }),
    ).rejects.toThrow("Bad keystore");
  });

  it("throws generic message when error response is not JSON", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(errorResponse(502));

    await expect(
      signPdf(PDF_BUF, { keystore: KEYSTORE_BUF, keystorePassword: "pw" }),
    ).rejects.toThrow("PDF signing failed");
  });

  it("throws generic message when error JSON has no error field", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      errorResponse(400, { info: "wrong" }),
    );

    await expect(
      signPdf(PDF_BUF, { keystore: KEYSTORE_BUF, keystorePassword: "pw" }),
    ).rejects.toThrow("PDF signing failed");
  });

  it("propagates fetch network errors", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(
      new Error("ETIMEDOUT"),
    );

    await expect(
      signPdf(PDF_BUF, { keystore: KEYSTORE_BUF, keystorePassword: "pw" }),
    ).rejects.toThrow("ETIMEDOUT");
  });

  it("base64-encodes the keystore buffer in the request body", async () => {
    (global.fetch as jest.Mock).mockResolvedValue(
      okResponse({ pdf: RESULT_B64, success: true }),
    );

    const ks = Buffer.from([0x00, 0x01, 0x02, 0xff]);
    await signPdf(PDF_BUF, { keystore: ks, keystorePassword: "pw" });

    const body = lastRequestBody();
    expect(body.keystore).toBe(ks.toString("base64"));
  });
});
