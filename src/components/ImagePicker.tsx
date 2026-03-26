import { useState, useEffect } from "react";
import type { DriveFile } from "@gather/plugin-sdk";

interface ImagePickerProps {
  open: boolean;
  files: DriveFile[];
  loading: boolean;
  proxyImageUrl: (url: string) => Promise<string | null>;
  onSelect: (file: DriveFile) => void;
  onCancel: () => void;
}

function ProxiedThumb({ url, proxyImageUrl }: { url: string; proxyImageUrl: (url: string) => Promise<string | null> }) {
  const [src, setSrc] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    proxyImageUrl(url).then((dataUrl) => {
      if (!cancelled && dataUrl) setSrc(dataUrl);
    });
    return () => { cancelled = true; };
  }, [url, proxyImageUrl]);

  if (!src) {
    return (
      <div style={{ width: "100%", aspectRatio: "1", background: "#eee", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, color: "#999" }}>
        Loading…
      </div>
    );
  }
  return <img src={src} alt="" />;
}

export default function ImagePicker({
  open,
  files,
  loading,
  proxyImageUrl,
  onSelect,
  onCancel,
}: ImagePickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (!open) return null;

  const selected = files.find((f) => f.id === selectedId) ?? null;

  return (
    <div className="modal-overlay" onMouseDown={onCancel}>
      <div className="modal-window" onMouseDown={(e) => e.stopPropagation()}>
        <div className="modal-title-bar">
          <span>📂 Open Image</span>
        </div>

        <div className="modal-body">
          {loading && (
            <div className="loading-spinner" style={{ padding: 24 }}>
              <span className="loading-hourglass">⏳</span>
              <span>Loading images…</span>
            </div>
          )}

          {!loading && files.length === 0 && (
            <div style={{ textAlign: "center", padding: 24, color: "#808080" }}>
              No images found in this plot.
            </div>
          )}

          {!loading && files.length > 0 && (
            <div className="image-grid">
              {files.map((file) => {
                const thumbUrl = file.thumbnailLink
                  ? file.thumbnailLink.replace(/=s\d+/, "=s200")
                  : null;
                return (
                  <div
                    key={file.id}
                    className={`image-grid-item ${selectedId === file.id ? "selected" : ""}`}
                    onMouseDown={() => setSelectedId(file.id)}
                    onDoubleClick={() => onSelect(file)}
                  >
                    {thumbUrl ? (
                      <ProxiedThumb url={thumbUrl} proxyImageUrl={proxyImageUrl} />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          aspectRatio: "1",
                          background: "#eee",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: 24,
                        }}
                      >
                        🖼
                      </div>
                    )}
                    <div className="image-grid-item-name">{file.name}</div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="win-btn" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="win-btn"
            disabled={!selected}
            onClick={() => selected && onSelect(selected)}
          >
            Open
          </button>
        </div>
      </div>
    </div>
  );
}
