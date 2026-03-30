/**
 * SERVER-ONLY — do not import this file from any "use client" component.
 *
 * This is an intentional duplicate of components/PdfTemplate.tsx.
 * Two separate files are required because Next.js App Router creates a
 * client-reference proxy for every module that appears in the client bundle
 * (even via dynamic import). Once a module is proxied, the server cannot
 * call it directly — it can only be rendered as a React component.
 *
 * components/PdfTemplate.tsx  →  used by ExportPdfButton (client bundle)
 * lib/serverPdfRenderer.tsx   →  used by the API route   (server bundle only)
 */

import { Document, Page, Text, View, Image, Link, Svg, Path, Polygon } from "@react-pdf/renderer";
import type {
  Template,
  TemplatePage,
  TemplateElement,
  TextElement,
  LinkElement,
  DividerElement,
  TableElement,
  ImageElement,
  CardElement,
  ChartElement,
  ShapeElement,
  RepeaterElement,
  RepeaterItem,
  PdfMetadata,
  WatermarkConfig,
} from "@/types/template";
import type { Style } from "@react-pdf/types";
import { registerFontsServer, getDefaultFamily } from "@/lib/fontRegistry.server";

// ─── Element renderers ────────────────────────────────────────────────────────

const SPECIAL_RE = /\{\{(page_number|total_pages)\}\}/;

function textDecorationValue(el: TextElement): "underline" | "line-through" | "none" {
  if (el.underline) return "underline";
  if (el.strikethrough) return "line-through";
  return "none";
}

function adjustedFontSize(el: TextElement): number {
  return (el.superscript || el.subscript) ? el.fontSize * 0.6 : el.fontSize;
}

function verticalOffset(el: TextElement): number {
  if (el.superscript) return -(el.fontSize * 0.3);
  if (el.subscript) return el.fontSize * 0.15;
  return 0;
}

function PdfTextElement({ el }: Readonly<{ el: TextElement }>) {
  const style: Style = {
    position: "absolute",
    left: el.x,
    top: el.y + verticalOffset(el),
    width: el.width,
    fontSize: adjustedFontSize(el),
    fontWeight: el.bold ? "bold" : "normal",
    textDecoration: textDecorationValue(el),
    color: el.color,
    lineHeight: el.lineHeight ?? 1.5,
    textAlign: el.textAlign ?? "left",
    opacity: el.opacity ?? 1,
  };

  const listStyle = el.listStyle ?? "none";

  if (listStyle !== "none") {
    const lines = el.content.split("\n");
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, width: el.width, opacity: el.opacity ?? 1 }}>
        {lines.map((line, i) => (
          <View key={i} style={{ flexDirection: "row", marginBottom: 0 }}>
            <Text style={{
              fontSize: el.fontSize,
              fontWeight: el.bold ? "bold" : "normal",
              color: el.color,
              lineHeight: el.lineHeight ?? 1.5,
              width: el.fontSize,
            }}>
              {listStyle === "bullet" ? "\u2022" : `${i + 1}.`}
            </Text>
            <Text style={{
              fontSize: el.fontSize,
              fontWeight: el.bold ? "bold" : "normal",
              textDecoration: el.underline ? "underline" : "none",
              color: el.color,
              lineHeight: el.lineHeight ?? 1.5,
              flex: 1,
            }}>
              {line}
            </Text>
          </View>
        ))}
      </View>
    );
  }

  if (SPECIAL_RE.test(el.content)) {
    return (
      <Text
        style={style}
        render={({ pageNumber, totalPages }) =>
          el.content
            .replaceAll("{{page_number}}", String(pageNumber))
            .replaceAll("{{total_pages}}", String(totalPages))
        }
      />
    );
  }

  return <Text style={style}>{el.content}</Text>;
}

function PdfLinkElement({ el }: Readonly<{ el: LinkElement }>) {
  return (
    <Link
      src={el.href}
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        fontSize: el.fontSize,
        color: el.color,
        textDecoration: (el.underline ?? true) ? "underline" : "none",
        opacity: el.opacity ?? 1,
      }}
    >
      {el.content}
    </Link>
  );
}

function PdfDividerElement({ el }: Readonly<{ el: DividerElement }>) {
  return (
    <View
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: Math.max(1, el.thickness),
        backgroundColor: el.color,
      }}
    />
  );
}

function PdfTableElement({ el }: Readonly<{ el: TableElement }>) {
  const colWidth = el.width / el.headers.length;

  return (
    <View style={{ position: "absolute", left: el.x, top: el.y, width: el.width }}>
      <View style={{ flexDirection: "row", backgroundColor: el.headerColor }}>
        {el.headers.map((header, i) => (
          <View
            key={`pdf-table-element-header-${i + 1}`}
            style={{
              width: colWidth,
              padding: "4 6",
              borderRight:
                i < el.headers.length - 1
                  ? "1 solid rgba(255,255,255,0.2)"
                  : "none",
            }}
          >
            <Text style={{ fontSize: el.fontSize, fontWeight: "bold", color: el.headerTextColor }}>
              {header}
            </Text>
          </View>
        ))}
      </View>

      {el.rows.map((row, rowIdx) => (
        <View
          key={`pdf-table-element-row-${rowIdx + 1}`}
          style={{
            flexDirection: "row",
            backgroundColor: rowIdx % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
            borderBottom: "1 solid #E2E8F0",
          }}
        >
          {row.map((cell, cellIdx) => (
            <View
              key={`pdf-table-element-row-${rowIdx + 1}-cell-${cellIdx}`}
              style={{
                width: colWidth,
                padding: "4 6",
                borderRight: cellIdx < row.length - 1 ? "1 solid #E2E8F0" : "none",
              }}
            >
              <Text style={{ fontSize: el.fontSize, color: "#374151" }}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PdfTableFlowElement({ el }: Readonly<{ el: TableElement }>) {
  const colWidth = el.width / el.headers.length;

  return (
    <View style={{ marginLeft: el.x, marginTop: el.y, width: el.width }}>
      <View style={{ flexDirection: "row", backgroundColor: el.headerColor }}>
        {el.headers.map((header, i) => (
          <View
            key={`pdf-table-flow-header-${i + 1}`}
            style={{
              width: colWidth,
              padding: "4 6",
              borderRight:
                i < el.headers.length - 1
                  ? "1 solid rgba(255,255,255,0.2)"
                  : "none",
            }}
          >
            <Text style={{ fontSize: el.fontSize, fontWeight: "bold", color: el.headerTextColor }}>
              {header}
            </Text>
          </View>
        ))}
      </View>

      {el.rows.map((row, rowIdx) => (
        <View
          key={`pdf-table-flow-row-${rowIdx + 1}`}
          wrap={false}
          style={{
            flexDirection: "row",
            backgroundColor: rowIdx % 2 === 0 ? "#F8FAFC" : "#FFFFFF",
            borderBottom: "1 solid #E2E8F0",
          }}
        >
          {row.map((cell, cellIdx) => (
            <View
              key={`pdf-table-flow-row-${rowIdx + 1}-cell-${cellIdx + 1}`}
              style={{
                width: colWidth,
                padding: "4 6",
                borderRight: cellIdx < row.length - 1 ? "1 solid #E2E8F0" : "none",
              }}
            >
              <Text style={{ fontSize: el.fontSize, color: "#374151" }}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PdfImageElement({ el }: Readonly<{ el: ImageElement }>) {
  if (el.src) {
    return (
      <View
        style={{
          position: "absolute",
          left: el.x,
          top: el.y,
          width: el.width,
          height: el.height,
        }}
      >
        <Image src={el.src} style={{ width: el.width, height: el.height }} />
      </View>
    );
  }

  return (
    <View
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        backgroundColor: el.bgColor,
        border: "1 solid #94A3B8",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 10, color: "#64748B" }}>{el.label}</Text>
    </View>
  );
}

function PdfChartElement({ el }: Readonly<{ el: ChartElement }>) {
  if (el.renderedImage) {
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, width: el.width, height: el.height }}>
        <Image src={el.renderedImage} style={{ width: el.width, height: el.height }} />
      </View>
    );
  }
  return (
    <View
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        backgroundColor: "#F1F5F9",
        border: "1 dashed #94A3B8",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ fontSize: 10, color: "#64748B" }}>Chart (not rendered)</Text>
    </View>
  );
}

function PdfShapeElement({ el }: Readonly<{ el: ShapeElement }>) {
  const opacity = el.opacity ?? 1;
  const w = el.width;
  const h = el.height;
  const sw = el.strokeWidth;

  if (el.shapeType === "line") {
    return (
      <View
        style={{
          position: "absolute",
          left: el.x,
          top: el.y + h / 2 - Math.max(1, sw) / 2,
          width: w,
          height: Math.max(1, sw),
          backgroundColor: el.strokeColor,
          opacity,
        }}
      />
    );
  }

  if (el.shapeType === "triangle") {
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, opacity }}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <Polygon
            points={`${w / 2},0 ${w},${h} 0,${h}`}
            fill={el.fillColor}
            stroke={sw > 0 ? el.strokeColor : "none"}
            strokeWidth={sw}
          />
        </Svg>
      </View>
    );
  }

  if (el.shapeType === "diamond") {
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, opacity }}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <Polygon
            points={`${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}`}
            fill={el.fillColor}
            stroke={sw > 0 ? el.strokeColor : "none"}
            strokeWidth={sw}
          />
        </Svg>
      </View>
    );
  }

  if (el.shapeType === "arrow") {
    const headW = w * 0.4;
    const bodyH = h * 0.4;
    const bodyTop = (h - bodyH) / 2;
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, opacity }}>
        <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
          <Polygon
            points={`0,${bodyTop} ${w - headW},${bodyTop} ${w - headW},0 ${w},${h / 2} ${w - headW},${h} ${w - headW},${bodyTop + bodyH} 0,${bodyTop + bodyH}`}
            fill={el.fillColor}
            stroke={sw > 0 ? el.strokeColor : "none"}
            strokeWidth={sw}
          />
        </Svg>
      </View>
    );
  }

  if (el.shapeType === "heart") {
    return (
      <View style={{ position: "absolute", left: el.x, top: el.y, opacity }}>
        <Svg width={w} height={h} viewBox="0 0 100 100">
          <Path
            d="M50 90 C25 65, 0 50, 0 30 A25 25 0 0 1 50 30 A25 25 0 0 1 100 30 C100 50, 75 65, 50 90Z"
            fill={el.fillColor}
            stroke={sw > 0 ? el.strokeColor : "none"}
            strokeWidth={sw > 0 ? (sw * 2) : 0}
          />
        </Svg>
      </View>
    );
  }

  // rectangle / circle
  const br = el.shapeType === "circle"
    ? Math.min(w, h) / 2
    : (el.borderRadius ?? 0);

  const borderStyles: Record<string, unknown> = {};
  if (sw > 0) {
    borderStyles.borderWidth = sw;
    borderStyles.borderColor = el.strokeColor;
    borderStyles.borderStyle = "solid";
  }
  if (br > 0) {
    borderStyles.borderTopLeftRadius = br;
    borderStyles.borderTopRightRadius = br;
    borderStyles.borderBottomRightRadius = br;
    borderStyles.borderBottomLeftRadius = br;
  }

  return (
    <View
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: w,
        height: h,
        backgroundColor: el.fillColor,
        ...borderStyles,
        opacity,
      }}
    />
  );
}

const ITEM_PH_RE_SERVER = /\{\{([^}]+)\}\}/g;

function substituteItemServer(el: TemplateElement, item: RepeaterItem): TemplateElement {
  const { fields, chartImages = {} } = item;
  const sub = (t: string) =>
    t.replaceAll(ITEM_PH_RE_SERVER, (_, k: string) => fields[k.trim()] ?? `{{${k}}}`);

  if (el.type === "text" || el.type === "heading") {
    return { ...el, content: sub((el as TextElement).content) };
  }
  if (el.type === "card") {
    const c = el as CardElement;
    return { ...c, title: sub(c.title), value: sub(c.value), subtitle: sub(c.subtitle) };
  }
  if (el.type === "chart") {
    const ch = el as ChartElement;
    const img = chartImages[ch.id];
    if (img) return { ...ch, renderedImage: img };
  }
  if (el.type === "table") {
    const t = el as TableElement;
    const headers = t.headers.map(sub);
    let rows = t.rows.map((row) => row.map(sub));
    if (t.rowsDataField && fields[t.rowsDataField]) {
      try {
        const parsed = JSON.parse(fields[t.rowsDataField]) as string[][];
        if (Array.isArray(parsed)) rows = parsed.map((r) => r.map(String));
      } catch { /* keep existing rows */ }
    }
    return { ...t, headers, rows };
  }
  if (el.type === "image") {
    const img = el as ImageElement;
    const label = sub(img.label);
    if (img.srcField && fields[img.srcField]) {
      return { ...img, label, src: fields[img.srcField] };
    }
    return { ...img, label };
  }
  return el;
}

function PdfRepeaterElement({ el }: Readonly<{ el: RepeaterElement }>) {
  const items = el.items ?? [];

  if (items.length === 0) {
    return (
      <View
        style={{
          marginLeft: el.x,
          marginTop: el.y,
          width: el.width,
          padding: "10 16",
          backgroundColor: "#EEF2FF",
          border: "1 dashed #6366F1",
          borderRadius: 4,
        }}
      >
        <Text style={{ fontSize: 9, color: "#4338CA" }}>
          Repeater &quot;{el.dataKey}&quot; — no items provided
        </Text>
      </View>
    );
  }

  const rows: RepeaterItem[][] = [];
  for (let i = 0; i < items.length; i += el.itemsPerRow) {
    rows.push(items.slice(i, i + el.itemsPerRow));
  }

  return (
    <View style={{ marginLeft: el.x, marginTop: el.y, width: el.width }}>
      {rows.map((row, rowIdx) => (
        <View
          key={`row-${rowIdx}`}
          wrap={false}
          style={{
            flexDirection: "row",
            marginBottom: rowIdx < rows.length - 1 ? el.gap : 0,
          }}
        >
          {row.map((item, colIdx) => (
            <View
              key={`col-${colIdx}`}
              style={{
                width: el.cardWidth,
                height: el.cardHeight,
                marginRight: colIdx < row.length - 1 ? el.gap : 0,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {el.cardElements.map((cEl) => {
                const resolved = substituteItemServer(cEl, item);
                return <PdfElementDispatcher key={cEl.id} el={resolved} />;
              })}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function PdfCardElement({ el }: Readonly<{ el: CardElement }>) {
  return (
    <View
      style={{
        position: "absolute",
        left: el.x,
        top: el.y,
        width: el.width,
        height: el.height,
        backgroundColor: el.bgColor,
        borderWidth: 1,
        borderColor: el.borderColor,
        borderStyle: "solid",
        borderRadius: 6,
      }}
    >
      {/* Accent top bar */}
      <View style={{ height: 4, backgroundColor: el.accentColor }} />
      {/* Card body */}
      <View style={{ padding: "8 10", flex: 1, justifyContent: "space-between" }}>
        <Text style={{ fontSize: 7, fontWeight: "bold", color: el.accentColor }}>
          {el.title.toUpperCase()}
        </Text>
        <View style={{ flexDirection: "row", alignItems: "flex-end" }}>
          <Text style={{ fontSize: 22, fontWeight: "bold", color: "#1E293B" }}>
            {el.value}
          </Text>
          <Text style={{ fontSize: 9, color: "#64748B", marginLeft: 3, marginBottom: 2 }}>
            {el.unit}
          </Text>
        </View>
        <Text style={{ fontSize: 7, color: "#94A3B8" }}>{el.subtitle}</Text>
      </View>
    </View>
  );
}

function PdfElementInner({ el }: Readonly<{ el: TemplateElement }>) {
  switch (el.type) {
    case "heading":
    case "text":
      return <PdfTextElement el={el} />;
    case "link":
      return <PdfLinkElement el={el} />;
    case "divider":
      return <PdfDividerElement el={el} />;
    case "table":
      return <PdfTableElement el={el} />;
    case "image":
      return <PdfImageElement el={el} />;
    case "card":
      return <PdfCardElement el={el} />;
    case "chart":
      return <PdfChartElement el={el} />;
    case "shape":
      return <PdfShapeElement el={el as ShapeElement} />;
    case "repeater":
      return <PdfRepeaterElement el={el as RepeaterElement} />;
    default:
      return null;
  }
}

function PdfElementDispatcher({ el }: Readonly<{ el: TemplateElement }>) {
  const inner = <PdfElementInner el={el} />;
  if (el.rotation) {
    return <View style={{ transform: `rotate(${el.rotation}deg)` }}>{inner}</View>;
  }
  return inner;
}

function PdfWatermark({ wm }: Readonly<{ wm: WatermarkConfig }>) {
  if (!wm.src) return null;
  return (
    <View
      style={{
        position: "absolute",
        left: wm.x,
        top: wm.y,
        width: wm.width,
        height: wm.height,
        opacity: wm.opacity,
      }}
    >
      <Image src={wm.src} style={{ width: wm.width, height: wm.height }} />
    </View>
  );
}

function PdfPage({
  page,
  pageSize,
  fontFamily,
  watermark,
  pageNumber,
}: Readonly<{ page: TemplatePage; pageSize: string; fontFamily?: string; watermark?: WatermarkConfig; pageNumber: number }>) {
  const showWatermark = watermark?.enabled && watermark.src &&
    (watermark.pages === "all" || watermark.pages.includes(pageNumber));
  const hasSection = page.header != null || page.footer != null;
  const hasFlowElements = page.elements.some(
    (el) => (el.type === "table" && (el as TableElement).mode === "auto") || el.type === "repeater"
  );
  const useFlowLayout = hasSection || hasFlowElements;
  const headerHeight = page.header?.height ?? 0;
  const footerHeight = page.footer?.height ?? 0;

  return (
    <Page
      size={pageSize as "A4"}
      style={{
        position: "relative",
        backgroundColor: "#FFFFFF",
        fontFamily,
        paddingTop: useFlowLayout ? headerHeight : 0,
        paddingBottom: useFlowLayout ? footerHeight : 0,
      }}
      bookmark={page.bookmark || undefined}
    >
      {useFlowLayout ? (
        <>
          {page.header && (
            <View
              fixed
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: headerHeight,
              }}
            >
              {page.header.elements.map((el) => (
                <PdfElementDispatcher key={el.id} el={el} />
              ))}
            </View>
          )}

          {page.footer && (
            <View
              fixed
              style={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: footerHeight,
              }}
            >
              {page.footer.elements.map((el) => (
                <PdfElementDispatcher key={el.id} el={el} />
              ))}
            </View>
          )}

          <View>
            {page.elements.map((el) =>
              el.type === "table" && (el as TableElement).mode === "auto" ? (
                <PdfTableFlowElement key={el.id} el={el as TableElement} />
              ) : el.type === "repeater" ? (
                <PdfRepeaterElement key={el.id} el={el as RepeaterElement} />
              ) : (
                <PdfElementDispatcher key={el.id} el={el} />
              )
            )}
          </View>
        </>
      ) : (
        page.elements.map((el) => <PdfElementDispatcher key={el.id} el={el} />)
      )}
      {/* Watermark rendered after content so a broken image cannot push flow content to the next page */}
      {showWatermark && <PdfWatermark wm={watermark} />}
    </Page>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function PdfDocument({ template, metadata }: Readonly<{ template: Template; metadata?: PdfMetadata }>) {
  registerFontsServer(template.fonts);

  const pageSize   = template.pageSize ?? "A4";
  const fontFamily = getDefaultFamily(template.fontFamily);

  return (
    <Document
      title={metadata?.title ?? template.name}
      author={metadata?.author}
      subject={metadata?.subject}
      keywords={metadata?.keywords}
      creator={metadata?.creator}
      producer={metadata?.producer}
    >
      {template.pages.map((page, idx) => (
        <PdfPage key={page.id} page={page} pageSize={pageSize} fontFamily={fontFamily} watermark={template.watermark} pageNumber={idx + 1} />
      ))}
    </Document>
  );
}
