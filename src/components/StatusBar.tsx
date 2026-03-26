import type { ToolId, Point } from "../types";

interface StatusBarProps {
  cursor: Point | null;
  canvasSize: { width: number; height: number };
  activeTool: ToolId;
  zoom: number;
}

const TOOL_LABELS: Record<ToolId, string> = {
  pencil: "Pencil",
  eraser: "Eraser",
  spray: "Spray Can",
  text: "Text",
  sticker: "Sticker",
  fill: "Fill",
  line: "Line",
  move: "Move",
};

export default function StatusBar({ cursor, canvasSize, activeTool, zoom }: StatusBarProps) {
  return (
    <div className="status-bar">
      <div className="status-bar-cell">
        {cursor ? `${cursor.x}, ${cursor.y}px` : "—"}
      </div>
      <div className="status-bar-cell">
        {canvasSize.width} × {canvasSize.height}
      </div>
      <div className="status-bar-cell">
        {Math.round(zoom * 100)}%
      </div>
      <div className="status-bar-cell" style={{ flex: 1 }}>
        {TOOL_LABELS[activeTool]}
      </div>
    </div>
  );
}
