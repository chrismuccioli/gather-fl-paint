import { useRef, useEffect } from "react";
import type { Layer } from "../types";

interface LayerPanelProps {
  layers: Layer[];
  activeLayerId: string | null;
  onSelect: (id: string) => void;
  onToggleVisibility: (id: string) => void;
  onRemove: (id: string) => void;
  onMove: (id: string, dir: "up" | "down") => void;
  onOpacityChange: (id: string, opacity: number) => void;
  onFlatten: () => void;
  onAddLayer: () => void;
}

/** Tiny canvas thumbnail of a layer. */
function LayerThumb({ layer }: { layer: Layer }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d")!;
    ctx.clearRect(0, 0, c.width, c.height);
    // Checkerboard to indicate transparency
    for (let y = 0; y < c.height; y += 4) {
      for (let x = 0; x < c.width; x += 4) {
        ctx.fillStyle = (x + y) % 8 === 0 ? "#fff" : "#ddd";
        ctx.fillRect(x, y, 4, 4);
      }
    }
    ctx.drawImage(layer.canvas, 0, 0, c.width, c.height);
  }, [layer, layer.canvas]);

  return (
    <canvas
      ref={ref}
      width={32}
      height={24}
      className="layer-item-thumb"
    />
  );
}

export default function LayerPanel({
  layers,
  activeLayerId,
  onSelect,
  onToggleVisibility,
  onRemove,
  onMove,
  onOpacityChange,
  onFlatten,
  onAddLayer,
}: LayerPanelProps) {
  const activeLayer = layers.find((l) => l.id === activeLayerId);

  return (
    <div className="layer-panel">
      <div className="layer-panel-header">
        <span>Layers</span>
        <span style={{ fontSize: 10, fontWeight: "normal" }}>
          {layers.length}
        </span>
      </div>

      {/* Opacity slider for active layer */}
      {activeLayer && (
        <div className="layer-opacity">
          <span>Opacity:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={Math.round(activeLayer.opacity * 100)}
            onChange={(e) =>
              onOpacityChange(activeLayer.id, Number(e.target.value) / 100)
            }
          />
          <span style={{ minWidth: 28, textAlign: "right" }}>
            {Math.round(activeLayer.opacity * 100)}%
          </span>
        </div>
      )}

      {/* Layer list (reversed — top layer first, like Photoshop) */}
      <div className="layer-panel-list">
        {[...layers].reverse().map((layer) => (
          <div
            key={layer.id}
            className={`layer-item ${layer.id === activeLayerId ? "active" : ""}`}
            onMouseDown={() => onSelect(layer.id)}
          >
            {/* Visibility toggle */}
            <button
              className="layer-item-btn"
              title={layer.visible ? "Hide" : "Show"}
              onMouseDown={(e) => {
                e.stopPropagation();
                onToggleVisibility(layer.id);
              }}
            >
              {layer.visible ? "👁" : "—"}
            </button>

            {/* Thumbnail */}
            <LayerThumb layer={layer} />

            {/* Name */}
            <span className="layer-item-name">
              {layer.locked ? "🔒 " : ""}
              {layer.name}
            </span>

            {/* Delete */}
            {!layer.locked && (
              <button
                className="layer-item-btn"
                title="Delete layer"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  onRemove(layer.id);
                }}
              >
                🗑
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Actions */}
      <div className="layer-panel-actions">
        <button onMouseDown={onAddLayer}>＋ New</button>
        <button
          onMouseDown={() => {
            if (activeLayerId) onMove(activeLayerId, "up");
          }}
        >
          ▲
        </button>
        <button
          onMouseDown={() => {
            if (activeLayerId) onMove(activeLayerId, "down");
          }}
        >
          ▼
        </button>
        <button onMouseDown={onFlatten}>Flatten</button>
      </div>
    </div>
  );
}
