import type { ToolHandlers, Point, ToolContext } from "../types";

let startPt: Point | null = null;
let snapshot: ImageData | null = null;

export const lineTool: ToolHandlers = {
  onPointerDown(pt: Point, tc: ToolContext) {
    startPt = pt;
    // Save current state so we can redraw preview
    snapshot = tc.ctx.getImageData(0, 0, tc.width, tc.height);
  },
  onPointerMove(pt: Point, tc: ToolContext) {
    if (!startPt || !snapshot) return;
    // Restore and draw preview line
    tc.ctx.putImageData(snapshot, 0, 0);
    tc.ctx.strokeStyle = tc.color;
    tc.ctx.lineWidth = tc.size;
    tc.ctx.lineCap = "round";
    tc.ctx.beginPath();
    tc.ctx.moveTo(startPt.x, startPt.y);
    tc.ctx.lineTo(pt.x, pt.y);
    tc.ctx.stroke();
  },
  onPointerUp(pt: Point, tc: ToolContext) {
    if (!startPt) return;
    // Restore and draw final line
    if (snapshot) tc.ctx.putImageData(snapshot, 0, 0);
    tc.ctx.strokeStyle = tc.color;
    tc.ctx.lineWidth = tc.size;
    tc.ctx.lineCap = "round";
    tc.ctx.beginPath();
    tc.ctx.moveTo(startPt.x, startPt.y);
    tc.ctx.lineTo(pt.x, pt.y);
    tc.ctx.stroke();
    startPt = null;
    snapshot = null;
  },
};
