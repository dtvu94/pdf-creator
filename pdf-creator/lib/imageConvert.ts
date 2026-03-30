/**
 * CLIENT-ONLY — do not import this file from any server-only module.
 *
 * Converts an SVG data URL or .svg URL to a PNG data URL using the browser
 * Canvas API. Non-SVG sources are returned unchanged.
 */

export function isSvgSrc(src: string): boolean {
  if (src.startsWith("data:")) return src.startsWith("data:image/svg");
  return /\.svg(\?.*)?$/i.test(src);
}

export function svgToPng(src: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // SVGs without explicit width/height report naturalWidth = 0.
      const w = img.naturalWidth || 512;
      const h = img.naturalHeight || 512;
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("Canvas 2D not available")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/png"));
    };
    img.onerror = () => reject(new Error("Failed to load SVG for conversion"));
    img.src = src;
  });
}

/** Returns a PNG data URL. Passes through non-SVG sources unchanged. */
export async function ensurePngSrc(src: string): Promise<string> {
  if (!isSvgSrc(src)) return src;
  return svgToPng(src);
}
