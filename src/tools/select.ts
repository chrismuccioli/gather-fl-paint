import type { ToolHandlers, Point, ToolContext } from "../types";

let dragStart: Point | null = null;
let startOffset: Point | null = null;
let onOffsetChange: ((dx: number, dy: number) => void) | null = null;

export function createMoveTool(
  offsetCallback: (dx: number, dy: number) => void
): ToolHandlers {
  return {
    onPointerDown(pt: Point, _tc: ToolContext) {
      dragStart = pt;
      startOffset = { x: 0, y: 0 };
      onOffsetChange = offsetCallback;
    },
    onPointerMove(pt: Point) {
      if (!dragStart || !startOffset || !onOffsetChange) return;
      const dx = pt.x - dragStart.x;
      const dy = pt.y - dragStart.y;
      onOffsetChange(startOffset.x + dx, startOffset.y + dy);
    },
    onPointerUp() {
      dragStart = null;
      startOffset = null;
      onOffsetChange = null;
    },
  };
}
