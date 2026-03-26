import { useState, useCallback, useRef } from "react";
import type { Layer } from "../types";

let nextLayerId = 1;

function createOffscreenCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

export function useLayers(initialWidth: number, initialHeight: number) {
  const canvasSize = useRef({ width: initialWidth, height: initialHeight });
  const [layers, setLayers] = useState<Layer[]>([]);
  const [activeLayerId, setActiveLayerId] = useState<string | null>(null);

  /** Create a new blank layer and return its ID. */
  const addLayer = useCallback(
    (name: string, opts?: { locked?: boolean }): string => {
      const id = `layer_${nextLayerId++}`;
      const canvas = createOffscreenCanvas(
        canvasSize.current.width,
        canvasSize.current.height
      );
      const layer: Layer = {
        id,
        name,
        visible: true,
        opacity: 1,
        canvas,
        locked: opts?.locked ?? false,
        offsetX: 0,
        offsetY: 0,
      };
      setLayers((prev) => [...prev, layer]);
      setActiveLayerId(id);
      return id;
    },
    []
  );

  /** Add a layer with an already-drawn canvas (for background image). */
  const addLayerWithCanvas = useCallback(
    (name: string, canvas: HTMLCanvasElement, opts?: { locked?: boolean }): string => {
      const id = `layer_${nextLayerId++}`;
      const layer: Layer = {
        id,
        name,
        visible: true,
        opacity: 1,
        canvas,
        locked: opts?.locked ?? false,
        offsetX: 0,
        offsetY: 0,
      };
      setLayers((prev) => [...prev, layer]);
      setActiveLayerId(id);
      return id;
    },
    []
  );

  const removeLayer = useCallback(
    (id: string) => {
      setLayers((prev) => {
        const filtered = prev.filter((l) => l.id !== id);
        return filtered;
      });
      setActiveLayerId((prevActive) => {
        if (prevActive === id) {
          // Select the layer above or below
          const idx = layers.findIndex((l) => l.id === id);
          const newActive = layers[idx - 1]?.id ?? layers[idx + 1]?.id ?? null;
          return newActive;
        }
        return prevActive;
      });
    },
    [layers]
  );

  const toggleVisibility = useCallback((id: string) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, visible: !l.visible } : l))
    );
  }, []);

  const setOpacity = useCallback((id: string, opacity: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, opacity } : l))
    );
  }, []);

  const setLayerOffset = useCallback((id: string, x: number, y: number) => {
    setLayers((prev) =>
      prev.map((l) => (l.id === id ? { ...l, offsetX: x, offsetY: y } : l))
    );
  }, []);

  const moveLayer = useCallback((id: string, direction: "up" | "down") => {
    setLayers((prev) => {
      const idx = prev.findIndex((l) => l.id === id);
      if (idx < 0) return prev;
      const target = direction === "up" ? idx + 1 : idx - 1;
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[idx], next[target]] = [next[target], next[idx]];
      return next;
    });
  }, []);

  const flattenAll = useCallback(() => {
    if (layers.length === 0) return;
    const { width, height } = canvasSize.current;
    const merged = createOffscreenCanvas(width, height);
    const ctx = merged.getContext("2d")!;
    for (const layer of layers) {
      if (!layer.visible) continue;
      ctx.globalAlpha = layer.opacity;
      ctx.drawImage(layer.canvas, layer.offsetX, layer.offsetY);
    }
    ctx.globalAlpha = 1;

    const id = `layer_${nextLayerId++}`;
    setLayers([
      {
        id,
        name: "Flattened",
        visible: true,
        opacity: 1,
        canvas: merged,
        locked: false,
        offsetX: 0,
        offsetY: 0,
      },
    ]);
    setActiveLayerId(id);
  }, [layers]);

  const clearAll = useCallback(() => {
    setLayers([]);
    setActiveLayerId(null);
  }, []);

  /** Resize all layer canvases (preserves existing content). */
  const resizeAll = useCallback(
    (newWidth: number, newHeight: number) => {
      canvasSize.current = { width: newWidth, height: newHeight };
      setLayers((prev) =>
        prev.map((layer) => {
          const newCanvas = createOffscreenCanvas(newWidth, newHeight);
          const ctx = newCanvas.getContext("2d")!;
          ctx.drawImage(layer.canvas, layer.offsetX, layer.offsetY);
          return { ...layer, canvas: newCanvas, offsetX: 0, offsetY: 0 };
        })
      );
    },
    []
  );

  const activeLayer = layers.find((l) => l.id === activeLayerId) ?? null;

  return {
    layers,
    activeLayer,
    activeLayerId,
    setActiveLayerId,
    addLayer,
    addLayerWithCanvas,
    removeLayer,
    toggleVisibility,
    setOpacity,
    setLayerOffset,
    moveLayer,
    flattenAll,
    clearAll,
    resizeAll,
    canvasSize,
  };
}
