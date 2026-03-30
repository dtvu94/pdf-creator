"use client";

import type { TemplatePage, PageSize } from "@/types/template";
import { getPageDimensions } from "@/lib/templates";
import ElementView from "../ElementView";

const THUMB_W = 100;
const NOOP = () => { /* thumbnail elements are non-interactive */ };

interface PageThumbnailProps {
  page: TemplatePage;
  pageSize?: PageSize;
  fontFamily: string;
}

export default function PageThumbnail({
  page,
  pageSize,
  fontFamily,
}: Readonly<PageThumbnailProps>) {
  const { width: pageW, height: pageH } = getPageDimensions(pageSize);
  const scale = THUMB_W / pageW;
  const thumbH = pageH * scale;
  const headerH = (page.header?.height ?? 0) * scale;
  const footerH = (page.footer?.height ?? 0) * scale;
  const bodyH = thumbH - headerH - footerH;

  return (
    <div
      style={{
        width: THUMB_W,
        height: thumbH,
        background: "#fff",
        borderRadius: 2,
        overflow: "hidden",
        position: "relative",
        pointerEvents: "none",
      }}
    >
      {/* Header section */}
      {page.header && headerH > 0 && (
        <div style={{ position: "absolute", top: 0, left: 0, width: THUMB_W, height: headerH, background: "#F8FAFC", borderBottom: "0.5px solid #E2E8F0" }}>
          <div style={{ position: "relative", width: THUMB_W, height: headerH }}>
            {page.header.elements.map((el) => (
              <ElementView
                key={el.id}
                el={el}
                selected={false}
                scale={scale}
                fontFamily={fontFamily}
                viewMode="pan"
                onSelect={NOOP}
                onDragStart={NOOP}
                onResizeStart={NOOP}
              />
            ))}
          </div>
        </div>
      )}

      {/* Body section */}
      <div style={{ position: "absolute", top: headerH, left: 0, width: THUMB_W, height: bodyH, overflow: "hidden" }}>
        <div style={{ position: "relative", width: THUMB_W, height: bodyH }}>
          {page.elements.map((el) => (
            <ElementView
              key={el.id}
              el={el}
              selected={false}
              scale={scale}
              fontFamily={fontFamily}
              viewMode="pan"
              onSelect={() => undefined}
              onDragStart={() => undefined}
              onResizeStart={() => undefined}
            />
          ))}
        </div>
      </div>

      {/* Footer section */}
      {page.footer && footerH > 0 && (
        <div style={{ position: "absolute", bottom: 0, left: 0, width: THUMB_W, height: footerH, background: "#F8FAFC", borderTop: "0.5px solid #E2E8F0" }}>
          <div style={{ position: "relative", width: THUMB_W, height: footerH }}>
            {page.footer.elements.map((el) => (
              <ElementView
                key={el.id}
                el={el}
                selected={false}
                scale={scale}
                fontFamily={fontFamily}
                viewMode="pan"
                onSelect={NOOP}
                onDragStart={NOOP}
                onResizeStart={NOOP}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
