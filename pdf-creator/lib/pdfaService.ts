/**
 * Client for the pdfa-generator Java microservice.
 *
 * The service URL defaults to http://localhost:8090 and can be overridden
 * with the PDFA_SERVICE_URL environment variable.
 */

const BASE_URL = process.env.PDFA_SERVICE_URL ?? "http://localhost:8090";

export interface PdfAOptions {
  /** PDF/A part: 1, 2, or 3 (default 2) */
  part?: number;
  /** Conformance level: "A", "B", or "U" (default "B") */
  conformance?: string;
  /** Document title for XMP metadata */
  title?: string;
  /** Document author for XMP metadata */
  author?: string;
}

export interface SignOptions {
  /** PKCS12 or JKS keystore as a Buffer */
  keystore: Buffer;
  /** Keystore password */
  keystorePassword: string;
  /** Keystore type: "PKCS12" or "JKS" (default "PKCS12") */
  keystoreType?: string;
  /** Key alias (uses first entry if omitted) */
  alias?: string;
  /** Signature reason */
  reason?: string;
  /** Signature location */
  location?: string;
  /** Signer contact info */
  contactInfo?: string;
}

/**
 * Convert a PDF buffer to PDF/A via the pdfa-generator service.
 */
export async function convertToPdfA(pdfBuffer: Buffer, options: PdfAOptions = {}): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/api/convert-to-pdfa`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pdf: pdfBuffer.toString("base64"),
      part: options.part ?? 2,
      conformance: options.conformance ?? "B",
      title: options.title ?? "",
      author: options.author ?? "",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "PDF/A conversion failed" }));
    throw new Error((body as { error?: string }).error ?? "PDF/A conversion failed");
  }

  const data = (await res.json()) as { pdf: string; success: boolean };
  return Buffer.from(data.pdf, "base64");
}

export interface EncryptOptions {
  /** Password required to open the PDF */
  userPassword: string;
  /** Password for full access (defaults to userPassword) */
  ownerPassword?: string;
  /** Encryption key length: 128 or 256 (default 256) */
  keyLength?: number;
  /** Permission bitfield — 4 = allow printing only (default) */
  permissions?: number;
}

/**
 * Encrypt a PDF buffer with password protection via the pdfa-generator service.
 */
export async function encryptPdf(pdfBuffer: Buffer, options: EncryptOptions): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/api/encrypt`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pdf: pdfBuffer.toString("base64"),
      userPassword: options.userPassword,
      ownerPassword: options.ownerPassword ?? options.userPassword,
      keyLength: options.keyLength ?? 128,
      permissions: options.permissions ?? 4,
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "PDF encryption failed" }));
    throw new Error((body as { error?: string }).error ?? "PDF encryption failed");
  }

  const data = (await res.json()) as { pdf: string; success: boolean };
  return Buffer.from(data.pdf, "base64");
}

/**
 * Digitally sign a PDF buffer via the pdfa-generator service.
 */
export async function signPdf(pdfBuffer: Buffer, options: SignOptions): Promise<Buffer> {
  const res = await fetch(`${BASE_URL}/api/sign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pdf: pdfBuffer.toString("base64"),
      keystore: options.keystore.toString("base64"),
      keystorePassword: options.keystorePassword,
      keystoreType: options.keystoreType ?? "PKCS12",
      alias: options.alias ?? "",
      reason: options.reason ?? "",
      location: options.location ?? "",
      contactInfo: options.contactInfo ?? "",
    }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: "PDF signing failed" }));
    throw new Error((body as { error?: string }).error ?? "PDF signing failed");
  }

  const data = (await res.json()) as { pdf: string; success: boolean };
  return Buffer.from(data.pdf, "base64");
}
