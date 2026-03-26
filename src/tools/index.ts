import type { ToolId, ToolHandlers } from "../types";
import { pencilTool } from "./pencil";
import { eraserTool } from "./eraser";
import { sprayTool } from "./spray";
import { createTextTool } from "./text";
import { fillTool } from "./fill";
import { lineTool } from "./line";
import { createMoveTool } from "./select";
import { createStickerTool } from "./sticker";

export interface ToolCallbacks {
  stickerId: string | null;
  requestText: (callback: (text: string) => void) => void;
  onMoveOffset: (dx: number, dy: number) => void;
}

export function getToolHandlers(
  toolId: ToolId,
  callbacks: ToolCallbacks
): ToolHandlers {
  switch (toolId) {
    case "pencil":
      return pencilTool;
    case "eraser":
      return eraserTool;
    case "spray":
      return sprayTool;
    case "text":
      return createTextTool(callbacks.requestText);
    case "fill":
      return fillTool;
    case "line":
      return lineTool;
    case "move":
      return createMoveTool(callbacks.onMoveOffset);
    case "sticker":
      return createStickerTool(callbacks.stickerId);
  }
}
