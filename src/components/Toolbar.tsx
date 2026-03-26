import type { ToolId, StickerDef } from "../types";

const TOOLS: { id: ToolId; icon: string; title: string }[] = [
  { id: "move", icon: "🖐", title: "Move" },
  { id: "pencil", icon: "✏️", title: "Pencil" },
  { id: "spray", icon: "💨", title: "Spray Can" },
  { id: "text", icon: "A", title: "Text" },
  { id: "line", icon: "╲", title: "Line" },
  { id: "sticker", icon: "🌸", title: "Sticker" },
];

const SIZES = [1, 2, 4, 8];

interface ToolbarProps {
  activeTool: ToolId;
  onToolChange: (tool: ToolId) => void;
  brushSize: number;
  onBrushSizeChange: (size: number) => void;
  stickers: StickerDef[];
  activeSticker: string | null;
  onStickerChange: (id: string) => void;
}

export default function Toolbar({
  activeTool,
  onToolChange,
  brushSize,
  onBrushSizeChange,
  stickers,
  activeSticker,
  onStickerChange,
}: ToolbarProps) {
  return (
    <div className="toolbar">
      <div className="toolbar-grid">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            className={`tool-btn ${activeTool === tool.id ? "active" : ""}`}
            title={tool.title}
            onMouseDown={() => onToolChange(tool.id)}
          >
            {tool.icon}
          </button>
        ))}
      </div>

      {/* Brush size picker */}
      <div className="toolbar-size">
        {SIZES.map((size) => (
          <div
            key={size}
            className={`toolbar-size-option ${brushSize === size ? "active" : ""}`}
            onMouseDown={() => onBrushSizeChange(size)}
          >
            <div
              className="size-line"
              style={{ height: Math.max(1, size) }}
            />
          </div>
        ))}
      </div>

      {/* Sticker palette (visible when sticker tool is active) */}
      {activeTool === "sticker" && (
        <div className="sticker-picker">
          {stickers.map((s) => (
            <button
              key={s.id}
              className={`sticker-btn ${activeSticker === s.id ? "active" : ""}`}
              title={s.name}
              onMouseDown={() => onStickerChange(s.id)}
            >
              {s.id === "daisy" && "🌼"}
              {s.id === "rose" && "🌹"}
              {s.id === "tulip" && "🌷"}
              {s.id === "sunflower" && "🌻"}
              {s.id === "cherry-blossom" && "🌸"}
              {s.id === "lavender" && "💐"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
