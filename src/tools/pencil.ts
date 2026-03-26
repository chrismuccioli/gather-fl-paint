import type { ToolHandlers, Point, ToolContext } from "../types";

let lastPt: Point | null = null;

function drawLine(ctx: CanvasRenderingContext2D, from: Point, to: Point, color: string, size: number) {
  ctx.strokeStyle = color;
  ctx.lineWidth = size;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}

export const pencilTool: ToolHandlers = {
  onPointerDown(pt: Point, tc: ToolContext) {
    lastPt = pt;
    // Draw a single dot
    tc.ctx.fillStyle = tc.color;
    tc.ctx.beginPath();
    tc.ctx.arc(pt.x, pt.y, tc.size / 2, 0, Math.PI * 2);
    tc.ctx.fill();
  },
  onPointerMove(pt: Point, tc: ToolContext) {
    if (lastPt) {
      drawLine(tc.ctx, lastPt, pt, tc.color, tc.size);
    }
    lastPt = pt;
  },
  onPointerUp() {
    lastPt = null;
  },
};
