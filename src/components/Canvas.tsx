import { useRef, useEffect, useCallback } from "react";
import type { ToolId, ToolHandlers, ToolContext, Point } from "../types";
import type { Layer } from "../types";
import { getToolHandlers, type ToolCallbacks } from "../tools/index";

interface CanvasProps {
  width: number;
  height: number;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  scratchRef: React.MutableRefObject<HTMLCanvasElement | null>;
  layers: Layer[];
  activeTool: ToolId;
  color: string;
  brushSize: number;
  activeSticker: string | null;
  zoom: number;
  onZoomChange: (zoom: number) => void;
  composite: (layers: Layer[]) => void;
  addLayerWithCanvas: (
    name: string,
    canvas: HTMLCanvasElement,
    opts?: { locked?: boolean }
  ) => string;
  onCursorMove: (pt: Point | null) => void;
  onRequestText: (callback: (text: string) => void) => void;
  onMoveStart: () => void;
  onMoveOffset: (dx: number, dy: number) => void;
  onSelectLayerAt: (pt: Point) => void;
  activeLayerId: string | null;
}

const ZOOM_STEPS = [0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4];

export default function Canvas({
  width,
  height,
  canvasRef,
  scratchRef,
  layers,
  activeTool,
  color,
  brushSize,
  activeSticker,
  zoom,
  onZoomChange,
  composite,
  addLayerWithCanvas,
  onCursorMove,
  onRequestText,
  onMoveStart,
  onMoveOffset,
  onSelectLayerAt,
  activeLayerId,
}: CanvasProps) {
  const drawingRef = useRef(false);
  const handlersRef = useRef<ToolHandlers | null>(null);
  const strokeLabelRef = useRef("");
  const isMovingRef = useRef(false);

  // Composite whenever layers change
  useEffect(() => {
    composite(layers);
  }, [layers, composite]);

  const getPoint = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>): Point => {
      const rect = canvasRef.current!.getBoundingClientRect();
      return {
        x: Math.round((e.clientX - rect.left) / zoom),
        y: Math.round((e.clientY - rect.top) / zoom),
      };
    },
    [canvasRef, zoom]
  );

  const makeScratchCtx = useCallback((): ToolContext | null => {
    if (!scratchRef.current) return null;
    const ctx = scratchRef.current.getContext("2d")!;
    return { ctx, color, size: brushSize, width, height };
  }, [scratchRef, color, brushSize, width, height]);

  /** Dummy context for tools that don't draw (move tool). */
  const dummyCtx: ToolContext = { ctx: null as unknown as CanvasRenderingContext2D, color, size: brushSize, width, height };

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      e.preventDefault();
      (e.target as HTMLElement).setPointerCapture(e.pointerId);

      // Move tool operates on the active layer directly — no scratch canvas
      if (activeTool === "move") {
        scratchRef.current = null;
        const clickPt = getPoint(e);
        onSelectLayerAt(clickPt);
        onMoveStart();
      } else {
        // Create a fresh scratch canvas for this stroke
        const scratch = document.createElement("canvas");
        scratch.width = width;
        scratch.height = height;
        scratchRef.current = scratch;
      }

      const toolLabel =
        activeTool === "sticker" && activeSticker
          ? `Sticker: ${activeSticker}`
          : activeTool.charAt(0).toUpperCase() + activeTool.slice(1);
      strokeLabelRef.current = toolLabel;

      const callbacks: ToolCallbacks = {
        stickerId: activeSticker,
        requestText: onRequestText,
        onMoveOffset,
      };
      const handlers = getToolHandlers(activeTool, callbacks);
      handlersRef.current = handlers;
      drawingRef.current = true;
      isMovingRef.current = activeTool === "move";

      const pt = getPoint(e);
      const tc = makeScratchCtx() ?? dummyCtx;
      handlers.onPointerDown(pt, tc);
      composite(layers);
    },
    [activeTool, activeSticker, width, height, scratchRef, getPoint, makeScratchCtx, composite, layers, onRequestText, onMoveStart, onMoveOffset, onSelectLayerAt]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      const pt = getPoint(e);
      onCursorMove(pt);

      if (!drawingRef.current || !handlersRef.current) return;

      // Move tool doesn't need a scratch canvas
      if (isMovingRef.current) {
        handlersRef.current.onPointerMove(pt, dummyCtx);
        composite(layers);
        return;
      }

      if (!scratchRef.current) return;
      handlersRef.current.onPointerMove(pt, makeScratchCtx()!);
      composite(layers);
    },
    [getPoint, makeScratchCtx, dummyCtx, composite, layers, onCursorMove, scratchRef]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!drawingRef.current || !handlersRef.current) return;

      const pt = getPoint(e);

      if (isMovingRef.current) {
        handlersRef.current.onPointerUp(pt, dummyCtx);
        isMovingRef.current = false;
        drawingRef.current = false;
        handlersRef.current = null;
        return;
      }

      if (!scratchRef.current) return;
      handlersRef.current.onPointerUp(pt, makeScratchCtx()!);

      const committedCanvas = scratchRef.current;
      scratchRef.current = null;
      addLayerWithCanvas(strokeLabelRef.current, committedCanvas);

      drawingRef.current = false;
      handlersRef.current = null;
    },
    [getPoint, makeScratchCtx, dummyCtx, scratchRef, addLayerWithCanvas]
  );

  const handlePointerLeave = useCallback(() => {
    onCursorMove(null);
  }, [onCursorMove]);

  const zoomIn = useCallback(() => {
    const next = ZOOM_STEPS.find((z) => z > zoom);
    if (next) onZoomChange(next);
  }, [zoom, onZoomChange]);

  const zoomOut = useCallback(() => {
    const next = [...ZOOM_STEPS].reverse().find((z) => z < zoom);
    if (next) onZoomChange(next);
  }, [zoom, onZoomChange]);

  return (
    <div className="canvas-area">
      <div
        className={`canvas-wrapper ${activeTool === "move" ? "tool-move" : ""}`}
        style={{
          width: width * zoom,
          height: height * zoom,
        }}
      >
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          style={{
            display: "block",
            imageRendering: "auto",
            width: width * zoom,
            height: height * zoom,
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerLeave}
        />
      </div>
      <div className="zoom-controls">
        <button className="zoom-btn" onMouseDown={zoomOut} title="Zoom out">−</button>
        <button className="zoom-btn" onMouseDown={() => onZoomChange(1)} title="Reset zoom" style={{ width: 40, fontSize: 11 }}>
          {Math.round(zoom * 100)}%
        </button>
        <button className="zoom-btn" onMouseDown={zoomIn} title="Zoom in">+</button>
      </div>
    </div>
  );
}
