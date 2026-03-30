/**
 * SERVER-ONLY — do not import this file from any "use client" component.
 *
 * Converts SVG data URLs inside a Template to PNG data URLs using sharp,
 * so react-pdf can render every image element correctly.
 */

import sharp from "sharp";
import type { Template, TemplateElement, CompressionConfig } from "@/types/template";

function isSvgDataUrl(src: string): boolean {
  return src.startsWith("data:image/svg");
}

function isDataUrl(src: string): boolean {
  return src.startsWith("data:image/");
}

async function convertSrc(src: string, compression?: CompressionConfig): Promise<string> {
  const quality = compression?.imageQuality ?? 90;
  const dpi = compression?.imageDpi ?? 0;
  const needsCompress = quality < 90 || dpi > 0;

  if (isSvgDataUrl(src)) {
    const b64 = src.split(",")[1];
    let pipeline = sharp(Buffer.from(b64, "base64"));
    if (dpi > 0) pipeline = pipeline.withMetadata({ density: dpi });
    const png = await pipeline.png({ quality: Math.min(quality, 100) }).toBuffer();
    return "data:image/png;base64," + png.toString("base64");
  }

  if (needsCompress && isDataUrl(src)) {
    const b64 = src.split(",")[1];
    let pipeline = sharp(Buffer.from(b64, "base64"));
    if (dpi > 0) pipeline = pipeline.withMetadata({ density: dpi });
    const jpeg = await pipeline.jpeg({ quality, mozjpeg: true }).toBuffer();
    return "data:image/jpeg;base64," + jpeg.toString("base64");
  }

  return src;
}

async function convertElements(els: TemplateElement[], compression?: CompressionConfig): Promise<TemplateElement[]> {
  return Promise.all(
    els.map(async (el) =>
      el.type === "image" && el.src
        ? { ...el, src: await convertSrc(el.src, compression) }
        : el
    )
  );
}

/**
 * Walks every page (body, header, footer) and converts any SVG image src
 * to a PNG data URL. When compression settings are provided, also re-encodes
 * raster images as JPEG with the specified quality.
 * Returns a new Template object; the original is not mutated.
 */
export async function convertTemplateImages(template: Template): Promise<Template> {
  const compression = template.compression;
  const pages = await Promise.all(
    template.pages.map(async (page) => ({
      ...page,
      elements: await convertElements(page.elements, compression),
      header: page.header
        ? { ...page.header, elements: await convertElements(page.header.elements, compression) }
        : page.header,
      footer: page.footer
        ? { ...page.footer, elements: await convertElements(page.footer.elements, compression) }
        : page.footer,
    }))
  );
  return { ...template, pages };
}
