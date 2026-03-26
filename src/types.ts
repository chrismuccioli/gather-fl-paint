// ---------------------------------------------------------------------------
// FLPaint types
// ---------------------------------------------------------------------------

export type ToolId =
  | "pencil"
  | "eraser"
  | "spray"
  | "text"
  | "sticker"
  | "fill"
  | "line"
  | "move";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  opacity: number; // 0–1
  canvas: HTMLCanvasElement; // offscreen canvas for this layer
  locked: boolean; // background layer is locked
  offsetX: number;
  offsetY: number;
}

export interface Point {
  x: number;
  y: number;
}

export interface ToolContext {
  /** The layer canvas to draw on */
  ctx: CanvasRenderingContext2D;
  color: string;
  size: number;
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
}

export interface ToolHandlers {
  onPointerDown(pt: Point, tc: ToolContext): void;
  onPointerMove(pt: Point, tc: ToolContext): void;
  onPointerUp(pt: Point, tc: ToolContext): void;
}

export interface StickerDef {
  id: string;
  name: string;
  src: string; // path to SVG
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  thumbnailLink?: string;
  webViewLink?: string;
  webContentLink?: string;
  modifiedTime: string;
}

export interface Plot {
  id: string;
  name: string;
  driveFolderId: string;
}
