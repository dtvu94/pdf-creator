import type { Template, TemplatePage, TemplateElement } from "@/types/template";
import type { Section } from "./types";

export function getSectionElements(section: Section, page?: TemplatePage): TemplateElement[] {
  if (!page) return [];
  if (section === "header") return page.header?.elements ?? [];
  if (section === "footer") return page.footer?.elements ?? [];
  return page.elements ?? [];
}

export function updateSectionElements(
  t: Template,
  pageIdx: number,
  section: Section,
  updater: (els: TemplateElement[]) => TemplateElement[]
): Template {
  return {
    ...t,
    pages: t.pages.map((p, pi) => {
      if (pi !== pageIdx) return p;
      if (section === "header" && p.header)
        return { ...p, header: { ...p.header, elements: updater(p.header.elements) } };
      if (section === "footer" && p.footer)
        return { ...p, footer: { ...p.footer, elements: updater(p.footer.elements) } };
      return { ...p, elements: updater(p.elements) };
    }),
  };
}

export function reorderZIndex(
  els: TemplateElement[],
  targetId: string,
  direction: "up" | "down" | "top" | "bottom"
): TemplateElement[] {
  const idx = els.findIndex((e) => e.id === targetId);
  if (idx === -1) return els;
  const arr = [...els];
  const [item] = arr.splice(idx, 1);
  switch (direction) {
    case "up":
      arr.splice(Math.min(idx + 1, arr.length), 0, item);
      break;
    case "down":
      arr.splice(Math.max(idx - 1, 0), 0, item);
      break;
    case "top":
      arr.push(item);
      break;
    case "bottom":
      arr.unshift(item);
      break;
  }
  return arr;
}

export function computeAlignment(
  els: TemplateElement[],
  selectedIds: Set<string>,
  alignment: "left" | "center" | "right" | "top" | "middle" | "bottom" | "distribute-h" | "distribute-v"
): TemplateElement[] {
  const selectedEls = els.filter((e) => selectedIds.has(e.id));
  if (selectedEls.length < 2) return els;

  const getW = (el: TemplateElement) => (el as { width?: number }).width ?? 100;
  const getH = (el: TemplateElement) => (el as { height?: number }).height ?? 40;

  let updates: Map<string, { x?: number; y?: number }>;

  switch (alignment) {
    case "left": {
      const minX = Math.min(...selectedEls.map((e) => e.x));
      updates = new Map(selectedEls.map((e) => [e.id, { x: minX }]));
      break;
    }
    case "right": {
      const maxRight = Math.max(...selectedEls.map((e) => e.x + getW(e)));
      updates = new Map(selectedEls.map((e) => [e.id, { x: maxRight - getW(e) }]));
      break;
    }
    case "center": {
      const minX = Math.min(...selectedEls.map((e) => e.x));
      const maxRight = Math.max(...selectedEls.map((e) => e.x + getW(e)));
      const cx = (minX + maxRight) / 2;
      updates = new Map(selectedEls.map((e) => [e.id, { x: Math.round(cx - getW(e) / 2) }]));
      break;
    }
    case "top": {
      const minY = Math.min(...selectedEls.map((e) => e.y));
      updates = new Map(selectedEls.map((e) => [e.id, { y: minY }]));
      break;
    }
    case "bottom": {
      const maxBottom = Math.max(...selectedEls.map((e) => e.y + getH(e)));
      updates = new Map(selectedEls.map((e) => [e.id, { y: maxBottom - getH(e) }]));
      break;
    }
    case "middle": {
      const minY = Math.min(...selectedEls.map((e) => e.y));
      const maxBottom = Math.max(...selectedEls.map((e) => e.y + getH(e)));
      const cy = (minY + maxBottom) / 2;
      updates = new Map(selectedEls.map((e) => [e.id, { y: Math.round(cy - getH(e) / 2) }]));
      break;
    }
    case "distribute-h": {
      const sorted = [...selectedEls].sort((a, b) => a.x - b.x);
      const first = sorted[0].x;
      const last = sorted[sorted.length - 1].x + getW(sorted[sorted.length - 1]);
      const totalWidth = sorted.reduce((s, e) => s + getW(e), 0);
      const gap = (last - first - totalWidth) / Math.max(1, sorted.length - 1);
      let cx = first;
      updates = new Map();
      for (const e of sorted) {
        updates.set(e.id, { x: Math.round(cx) });
        cx += getW(e) + gap;
      }
      break;
    }
    case "distribute-v": {
      const sorted = [...selectedEls].sort((a, b) => a.y - b.y);
      const first = sorted[0].y;
      const last = sorted[sorted.length - 1].y + getH(sorted[sorted.length - 1]);
      const totalHeight = sorted.reduce((s, e) => s + getH(e), 0);
      const gap = (last - first - totalHeight) / Math.max(1, sorted.length - 1);
      let cy = first;
      updates = new Map();
      for (const e of sorted) {
        updates.set(e.id, { y: Math.round(cy) });
        cy += getH(e) + gap;
      }
      break;
    }
    default:
      return els;
  }

  return els.map((el) => {
    const upd = updates.get(el.id);
    if (!upd) return el;
    return { ...el, ...upd };
  });
}
