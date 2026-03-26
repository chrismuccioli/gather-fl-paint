import { useState, useEffect } from "react";

interface TextInputDialogProps {
  open: boolean;
  color: string;
  fontSize: number;
  onConfirm: (text: string) => void;
  onCancel: () => void;
}

export default function TextInputDialog({
  open,
  color,
  fontSize,
  onConfirm,
  onCancel,
}: TextInputDialogProps) {
  const [text, setText] = useState("");

  // Reset when dialog opens
  useEffect(() => {
    if (open) setText("");
  }, [open]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div
        className="modal-window"
        style={{ minWidth: 340 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-title-bar">
          <span>A Text</span>
        </div>

        <div className="modal-body" style={{ padding: 12 }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <label style={{ fontSize: 13 }}>Enter text:</label>
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && text.trim()) onConfirm(text);
              }}
              autoFocus
              style={{
                fontFamily: "var(--win-font)",
                fontSize: 13,
                padding: "3px 6px",
                border: "2px solid",
                borderColor:
                  "var(--win-dark) var(--win-white) var(--win-white) var(--win-dark)",
                outline: "none",
                width: "100%",
              }}
            />

            {/* Preview */}
            <div
              style={{
                border: "1px solid var(--win-dark)",
                background: "#fff",
                padding: 8,
                minHeight: 40,
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: '"VT323", "Courier New", monospace',
                  fontSize: Math.max(14, fontSize),
                  color,
                }}
              >
                {text || "Preview…"}
              </span>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="win-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="win-btn"
            disabled={!text.trim()}
            onClick={() => text.trim() && onConfirm(text)}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}
