import type { ToolHandlers, Point, ToolContext } from "../types";

let pendingCallback: ((text: string) => void) | null = null;

/**
 * Creates a text tool that calls requestText instead of prompt().
 * requestText should open a dialog; the callback stamps the text onto the canvas.
 */
export function createTextTool(
  requestText: (callback: (text: string) => void) => void
): ToolHandlers {
  return {
    onPointerDown(pt: Point, tc: ToolContext) {
      pendingCallback = (text: string) => {
        if (!text) return;
        const fontSize = Math.max(14, tc.size * 6);
        tc.ctx.font = `${fontSize}px "VT323", "Courier New", monospace`;
        tc.ctx.fillStyle = tc.color;
        tc.ctx.textBaseline = "top";
        tc.ctx.fillText(text, pt.x, pt.y);
      };
      requestText(pendingCallback);
    },
    onPointerMove() {},
    onPointerUp() {},
  };
}
