import { useRef, useCallback } from "react";
import type { Layer } from "../types";

export function useCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /** Optional scratch canvas drawn on top during an active stroke. */
  const scratchRef = useRef<HTMLCanvasElement | null>(null);

  /** Composite all layers (+ optional scratch) onto the visible canvas. */
  const composite = useCallback((layers: Layer[]) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw white background
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, layer.offsetX, layer.offsetY);
    }

    // Draw the in-progress scratch canvas on top
    if (scratchRef.current) {
      ctx.globalAlpha = 1;
      ctx.drawImage(scratchRef.current, 0, 0);
    }

    ctx.globalAlpha = 1;
  }, []);

  /** Export the composited canvas as a PNG Blob. */
  const exportPng = useCallback(
    (layers: Layer[], width: number, height: number): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        const offscreen = document.createElement("canvas");
        offscreen.width = width;
        offscreen.height = height;
        const ctx = offscreen.getContext("2d")!;

        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, width, height);

        for (const layer of layers) {
          if (!layer.visible) continue;
          ctx.globalAlpha = layer.opacity;
          ctx.drawImage(layer.canvas, layer.offsetX, layer.offsetY);
        }
        ctx.globalAlpha = 1;

        offscreen.toBlob((blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to export canvas"));
        }, "image/png");
      });
    },
    []
  );

  return { canvasRef, scratchRef, composite, exportPng };
}
