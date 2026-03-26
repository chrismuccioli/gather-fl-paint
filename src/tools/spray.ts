import type { ToolHandlers, Point, ToolContext } from "../types";

let spraying = false;
let intervalId: ReturnType<typeof setInterval> | null = null;
let currentPt: Point = { x: 0, y: 0 };
let currentTc: ToolContext | null = null;

function spray(pt: Point, tc: ToolContext) {
  const radius = tc.size * 8;
  const density = tc.size * 6;
  tc.ctx.fillStyle = tc.color;

  for (let i = 0; i < density; i++) {
    const angle = Math.random() * Math.PI * 2;
    const r = Math.random() * radius;
    const x = pt.x + Math.cos(angle) * r;
    const y = pt.y + Math.sin(angle) * r;
    tc.ctx.fillRect(x, y, 1, 1);
  }
}

export const sprayTool: ToolHandlers = {
  onPointerDown(pt: Point, tc: ToolContext) {
    spraying = true;
    currentPt = pt;
    currentTc = tc;
    spray(pt, tc);

    // Continuous spray while held
    intervalId = setInterval(() => {
      if (spraying && currentTc) {
        spray(currentPt, currentTc);
      }
    }, 50);
  },
  onPointerMove(pt: Point, tc: ToolContext) {
    currentPt = pt;
    currentTc = tc;
    if (spraying) {
      spray(pt, tc);
    }
  },
  onPointerUp() {
    spraying = false;
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
    }
    currentTc = null;
  },
};
