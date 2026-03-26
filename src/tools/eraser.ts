import type { ToolHandlers, Point, ToolContext } from "../types";

let lastPt: Point | null = null;

function eraseLine(ctx: CanvasRenderingContext2D, from: Point, to: Point, size: number) {
  ctx.save();
  ctx.globalCompositeOperation = "destination-out";
  ctx.strokeStyle = "rgba(0,0,0,1)";
  ctx.lineWidth = size * 4; // Eraser is larger than pencil
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

export const eraserTool: ToolHandlers = {
  onPointerDown(pt: Point, tc: ToolContext) {
    lastPt = pt;
    tc.ctx.save();
    tc.ctx.globalCompositeOperation = "destination-out";
    tc.ctx.beginPath();
    tc.ctx.arc(pt.x, pt.y, (tc.size * 4) / 2, 0, Math.PI * 2);
    tc.ctx.fill();
    tc.ctx.restore();
  },
  onPointerMove(pt: Point, tc: ToolContext) {
    if (lastPt) {
      eraseLine(tc.ctx, lastPt, pt, tc.size);
    }
    lastPt = pt;
  },
  onPointerUp() {
    lastPt = null;
  },
};
