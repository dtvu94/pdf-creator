export type Section = "body" | "header" | "footer";

export interface DragState {
  elId: string;
  pageIdx: number;
  section: Section;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  scale: number;
}

export interface ResizeState {
  elId: string;
  pageIdx: number;
  section: Section;
  handle: string;
  startX: number;
  startY: number;
  origX: number;
  origY: number;
  origW: number;
  origH: number;
  scale: number;
}
