import { useState } from "react";

export type SaveState = "idle" | "naming" | "saving" | "done" | "error";

interface SaveDialogProps {
  open: boolean;
  state: SaveState;
  defaultName: string;
  errorMessage?: string;
  onSave: (fileName: string) => void;
  onCancel: () => void;
}

export default function SaveDialog({
  open,
  state,
  defaultName,
  errorMessage,
  onSave,
  onCancel,
}: SaveDialogProps) {
  const [name, setName] = useState(defaultName);

  if (!open) return null;

  // Reset name when dialog opens with a new default
  if (state === "naming" && name !== defaultName && !name) {
    setName(defaultName);
  }

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div
        className="modal-window"
        style={{ minWidth: 360 }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-title-bar">
          <span>💾 Save to Plot</span>
        </div>

        <div className="modal-body" style={{ padding: 12 }}>
          {state === "naming" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <label style={{ fontSize: 13 }}>File name:</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && name.trim()) onSave(name.trim());
                }}
                autoFocus
                style={{
                  fontFamily: "var(--win-font)",
                  fontSize: 13,
                  padding: "3px 6px",
                  border: "2px solid",
                  borderColor: "var(--win-dark) var(--win-white) var(--win-white) var(--win-dark)",
                  outline: "none",
                  width: "100%",
                }}
              />
            </div>
          )}

          {state === "saving" && (
            <div
              className="loading-spinner"
              style={{ padding: 16 }}
            >
              <span className="loading-hourglass">⏳</span>
              <span>Saving to plot…</span>
            </div>
          )}

          {state === "done" && (
            <div style={{ textAlign: "center", padding: 16, fontSize: 13 }}>
              ✅ Saved successfully!
            </div>
          )}

          {state === "error" && (
            <div style={{ textAlign: "center", padding: 16, fontSize: 13, color: "#c00" }}>
              ❌ {errorMessage || "Failed to save."}
            </div>
          )}
        </div>

        <div className="modal-footer">
          {state === "naming" && (
            <>
              <button className="win-btn" onClick={onCancel}>
                Cancel
              </button>
              <button
                className="win-btn"
                disabled={!name.trim()}
                onClick={() => name.trim() && onSave(name.trim())}
              >
                Save
              </button>
            </>
          )}
          {(state === "done" || state === "error") && (
            <button className="win-btn" onClick={onCancel}>
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
