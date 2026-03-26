import { useState, useEffect, useCallback, useRef } from "react";
import type { ToolId, Point, StickerDef } from "./types";
import type { DriveFile } from "@gather/plugin-sdk";
import { useCanvas } from "./hooks/useCanvas";
import { useLayers } from "./hooks/useLayers";
import { useGather } from "./hooks/useGather";

import TitleBar from "./components/TitleBar";
import MenuBar from "./components/MenuBar";
import Toolbar from "./components/Toolbar";
import Canvas from "./components/Canvas";
import LayerPanel from "./components/LayerPanel";
import ColorPalette from "./components/ColorPalette";
import StatusBar from "./components/StatusBar";
import ImagePicker from "./components/ImagePicker";
import SaveDialog, { type SaveState } from "./components/SaveDialog";
import TextInputDialog from "./components/TextInputDialog";

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_WIDTH = 800;
const DEFAULT_HEIGHT = 600;

const STICKERS: StickerDef[] = [
  { id: "daisy", name: "Daisy", src: "/stickers/daisy.svg" },
  { id: "rose", name: "Rose", src: "/stickers/rose.svg" },
  { id: "tulip", name: "Tulip", src: "/stickers/tulip.svg" },
  { id: "sunflower", name: "Sunflower", src: "/stickers/sunflower.svg" },
  { id: "cherry-blossom", name: "Cherry Blossom", src: "/stickers/cherry-blossom.svg" },
  { id: "lavender", name: "Lavender", src: "/stickers/lavender.svg" },
];

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export default function App() {
  // Canvas dimensions
  const [canvasWidth, setCanvasWidth] = useState(DEFAULT_WIDTH);
  const [canvasHeight, setCanvasHeight] = useState(DEFAULT_HEIGHT);

  // Tool state
  const [activeTool, setActiveTool] = useState<ToolId>("pencil");
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(2);
  const [activeSticker, setActiveSticker] = useState<string>("cherry-blossom");

  // UI state
  const [layersVisible, setLayersVisible] = useState(true);
  const [cursor, setCursor] = useState<Point | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1);

  // Image picker state
  const [imagePickerOpen, setImagePickerOpen] = useState(false);
  const [imagePickerFiles, setImagePickerFiles] = useState<DriveFile[]>([]);
  const [imagePickerLoading, setImagePickerLoading] = useState(false);

  // Text input dialog state
  const [textDialogOpen, setTextDialogOpen] = useState(false);
  const textCallbackRef = useRef<((text: string) => void) | null>(null);

  // Move tool: capture initial offset and layer ID at drag start
  const moveStartOffset = useRef<{ x: number; y: number } | null>(null);
  const moveLayerIdRef = useRef<string | null>(null);

  // Save dialog state
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const savePlotIdRef = useRef<string | null>(null);

  // Hooks
  const {
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
  } = useLayers(canvasWidth, canvasHeight);

  const { canvasRef, scratchRef, composite, exportPng } = useCanvas();
  const { init: initGather, connected, pickPlot, listImages, proxyImageUrl, uploadToPlot } = useGather();

  // Initialise Gather SDK on mount
  useEffect(() => {
    initGather();
  }, [initGather]);

  // Create an initial blank layer
  const initialised = useRef(false);
  useEffect(() => {
    if (!initialised.current) {
      initialised.current = true;
      addLayer("Background");
    }
  }, [addLayer]);

  // Keep canvas size in sync
  useEffect(() => {
    canvasSize.current = { width: canvasWidth, height: canvasHeight };
  }, [canvasWidth, canvasHeight, canvasSize]);

  // Re-composite when layer data changes
  useEffect(() => {
    composite(layers);
  }, [composite, layers]);

  // ------ Menu handlers ------

  const handleNewFile = useCallback(() => {
    clearAll();
    setFileName("");
    setCanvasWidth(DEFAULT_WIDTH);
    setCanvasHeight(DEFAULT_HEIGHT);
    // Add fresh background layer after a tick (state needs to settle)
    setTimeout(() => addLayer("Background"), 0);
  }, [clearAll, addLayer]);

  const handleOpenFromPlot = useCallback(async () => {
    if (!connected) {
      alert("Not connected to Gather. Running in standalone mode.");
      return;
    }
    const plot = await pickPlot({ title: "Open image from plot" });
    if (!plot) return;

    setImagePickerLoading(true);
    setImagePickerOpen(true);
    const files = await listImages(plot.id);
    setImagePickerFiles(files);
    setImagePickerLoading(false);
  }, [connected, pickPlot, listImages]);

  const handleImageSelected = useCallback(
    async (file: DriveFile) => {
      setImagePickerOpen(false);
      setLoading(true);
      setFileName(file.name);

      // Load image via proxied high-res thumbnail
      const imgUrl = file.thumbnailLink
        ? file.thumbnailLink.replace(/=s\d+/, "=s1600")
        : file.webContentLink ?? "";

      if (!imgUrl) {
        setLoading(false);
        return;
      }

      try {
        // Proxy the image through the Gather host to avoid auth issues
        const dataUrl = await proxyImageUrl(imgUrl);
        if (!dataUrl) {
          alert("Failed to load image.");
          setLoading(false);
          return;
        }

        const img = new Image();
        img.onload = () => {
          const w = img.naturalWidth;
          const h = img.naturalHeight;
          setCanvasWidth(w);
          setCanvasHeight(h);
          clearAll();

          const bgCanvas = document.createElement("canvas");
          bgCanvas.width = w;
          bgCanvas.height = h;
          const ctx = bgCanvas.getContext("2d")!;
          ctx.drawImage(img, 0, 0);

          setTimeout(() => {
            addLayerWithCanvas("Background: " + file.name, bgCanvas, {
              locked: true,
            });
            setLoading(false);
          }, 0);
        };
        img.onerror = () => {
          alert("Failed to load image.");
          setLoading(false);
        };
        img.src = dataUrl;
      } catch {
        alert("Failed to load image.");
        setLoading(false);
      }
    },
    [clearAll, addLayerWithCanvas, proxyImageUrl]
  );

  const handleSaveToPlot = useCallback(async () => {
    if (!connected) {
      await handleSaveLocal();
      return;
    }

    const plot = await pickPlot({
      mode: "output",
      title: "Save to plot",
    });
    if (!plot) return;
    savePlotIdRef.current = plot.id;

    // Open the save dialog for naming
    const defaultName = fileName
      ? fileName.replace(/\.[^.]+$/, "") + "_edited.png"
      : "flpaint_export.png";
    setFileName(defaultName);
    setSaveState("naming");
    setSaveDialogOpen(true);
  }, [connected, pickPlot, fileName]);

  const handleSaveConfirm = useCallback(
    async (saveName: string) => {
      setSaveState("saving");
      try {
        const blob = await exportPng(layers, canvasWidth, canvasHeight);
        // Convert blob to data URL for postMessage upload
        const dataUrl = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error("Failed to read blob"));
          reader.readAsDataURL(blob);
        });

        const plotId = savePlotIdRef.current;
        if (!plotId) throw new Error("No plot selected");

        await uploadToPlot(dataUrl, saveName, plotId);
        setSaveState("done");
        setFileName(saveName);
        setTimeout(() => {
          setSaveDialogOpen(false);
          setSaveState("idle");
        }, 1500);
      } catch (err) {
        setSaveError(String(err));
        setSaveState("error");
      }
    },
    [exportPng, layers, canvasWidth, canvasHeight, uploadToPlot]
  );

  const handleSaveLocal = useCallback(async () => {
    const blob = await exportPng(layers, canvasWidth, canvasHeight);
    const name = fileName
      ? fileName.replace(/\.[^.]+$/, "") + "_edited.png"
      : "flpaint_export.png";

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportPng, layers, canvasWidth, canvasHeight, fileName]);

  const handleUndo = useCallback(() => {
    // Simple undo: remove the topmost non-locked layer
    const topLayer = [...layers].reverse().find((l) => !l.locked);
    if (topLayer) removeLayer(topLayer.id);
  }, [layers, removeLayer]);

  const handleResize = useCallback(() => {
    const wStr = prompt("Width:", String(canvasWidth));
    if (!wStr) return;
    const hStr = prompt("Height:", String(canvasHeight));
    if (!hStr) return;
    const w = parseInt(wStr, 10);
    const h = parseInt(hStr, 10);
    if (w > 0 && h > 0 && w <= 4096 && h <= 4096) {
      setCanvasWidth(w);
      setCanvasHeight(h);
      resizeAll(w, h);
    }
  }, [canvasWidth, canvasHeight, resizeAll]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <TitleBar fileName={fileName} />
      <MenuBar
        onNewFile={handleNewFile}
        onOpenFromPlot={handleOpenFromPlot}
        onSaveToPlot={handleSaveToPlot}
        onSaveLocal={handleSaveLocal}
        onUndo={handleUndo}
        onFlatten={flattenAll}
        onResize={handleResize}
        onToggleLayers={() => setLayersVisible((v) => !v)}
        layersVisible={layersVisible}
      />

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Toolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          brushSize={brushSize}
          onBrushSizeChange={setBrushSize}
          stickers={STICKERS}
          activeSticker={activeSticker}
          onStickerChange={setActiveSticker}
        />

        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", position: "relative" }}>
          {loading && (
            <div className="loading-overlay">
              <div className="loading-spinner">
                <span className="loading-hourglass">⏳</span>
                <span>Loading…</span>
              </div>
            </div>
          )}
          <Canvas
            width={canvasWidth}
            height={canvasHeight}
            canvasRef={canvasRef}
            scratchRef={scratchRef}
            layers={layers}
            activeTool={activeTool}
            color={color}
            brushSize={brushSize}
            activeSticker={activeSticker}
            zoom={zoom}
            onZoomChange={setZoom}
            composite={composite}
            addLayerWithCanvas={addLayerWithCanvas}
            onCursorMove={setCursor}
            activeLayerId={activeLayerId}
            onRequestText={(cb) => {
              textCallbackRef.current = cb;
              setTextDialogOpen(true);
            }}
            onSelectLayerAt={(pt) => {
              // Hit-test: find the topmost layer with a non-transparent pixel at pt
              for (let i = layers.length - 1; i >= 0; i--) {
                const layer = layers[i];
                if (!layer.visible) continue;
                const lx = pt.x - layer.offsetX;
                const ly = pt.y - layer.offsetY;
                if (lx < 0 || ly < 0 || lx >= layer.canvas.width || ly >= layer.canvas.height) continue;
                const ctx = layer.canvas.getContext("2d")!;
                const pixel = ctx.getImageData(lx, ly, 1, 1).data;
                if (pixel[3] > 10) {
                  setActiveLayerId(layer.id);
                  // Capture offset + layer ID so drag works on first click
                  moveStartOffset.current = { x: layer.offsetX, y: layer.offsetY };
                  moveLayerIdRef.current = layer.id;
                  return;
                }
              }
            }}
            onMoveStart={() => {
              // Fallback: if hit-test didn't fire, capture from active layer
              if (!moveStartOffset.current && activeLayerId) {
                const layer = layers.find((l) => l.id === activeLayerId);
                if (layer) {
                  moveStartOffset.current = { x: layer.offsetX, y: layer.offsetY };
                  moveLayerIdRef.current = activeLayerId;
                }
              }
            }}
            onMoveOffset={(dx, dy) => {
              const lid = moveLayerIdRef.current;
              if (lid && moveStartOffset.current) {
                const layer = layers.find((l) => l.id === lid);
                if (layer && !layer.locked) {
                  setLayerOffset(
                    lid,
                    moveStartOffset.current.x + dx,
                    moveStartOffset.current.y + dy
                  );
                }
              }
            }}
          />
        </div>

        {layersVisible && (
          <LayerPanel
            layers={layers}
            activeLayerId={activeLayerId}
            onSelect={setActiveLayerId}
            onToggleVisibility={toggleVisibility}
            onRemove={removeLayer}
            onMove={moveLayer}
            onOpacityChange={setOpacity}
            onFlatten={flattenAll}
            onAddLayer={() => addLayer("New Layer")}
          />
        )}
      </div>

      <ColorPalette color={color} onColorChange={setColor} />
      <StatusBar
        cursor={cursor}
        canvasSize={{ width: canvasWidth, height: canvasHeight }}
        activeTool={activeTool}
        zoom={zoom}
      />

      {/* Image picker modal */}
      <ImagePicker
        open={imagePickerOpen}
        files={imagePickerFiles}
        loading={imagePickerLoading}
        proxyImageUrl={proxyImageUrl}
        onSelect={handleImageSelected}
        onCancel={() => setImagePickerOpen(false)}
      />

      {/* Text input dialog */}
      <TextInputDialog
        open={textDialogOpen}
        color={color}
        fontSize={Math.max(14, brushSize * 6)}
        onConfirm={(text) => {
          setTextDialogOpen(false);
          if (textCallbackRef.current) {
            textCallbackRef.current(text);
            textCallbackRef.current = null;
          }
          composite(layers);
        }}
        onCancel={() => {
          setTextDialogOpen(false);
          textCallbackRef.current = null;
        }}
      />

      {/* Save dialog */}
      <SaveDialog
        open={saveDialogOpen}
        state={saveState}
        defaultName={
          fileName
            ? fileName.replace(/\.[^.]+$/, "") + "_edited.png"
            : "flpaint_export.png"
        }
        errorMessage={saveError}
        onSave={handleSaveConfirm}
        onCancel={() => {
          setSaveDialogOpen(false);
          setSaveState("idle");
        }}
      />
    </div>
  );
}
