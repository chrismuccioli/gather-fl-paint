import { useRef, useCallback, useState } from "react";
import { GatherPlugin } from "../gather-sdk";
import type { DriveFile, Plot } from "../gather-sdk";

export function useGather() {
  const sdkRef = useRef<GatherPlugin | null>(null);
  const [connected, setConnected] = useState(false);

  /** Initialise the SDK (call once on mount). */
  const init = useCallback(() => {
    try {
      const sdk = new GatherPlugin();
      sdkRef.current = sdk;
      setConnected(true);
    } catch {
      // Running outside Gather — standalone mode
      setConnected(false);
    }
  }, []);

  /** Open the Gather plot picker. */
  const pickPlot = useCallback(
    async (opts?: { mode?: "input" | "output"; title?: string }): Promise<Plot | null> => {
      if (!sdkRef.current) return null;
      try {
        return await sdkRef.current.pickPlot(opts);
      } catch {
        return null;
      }
    },
    []
  );

  /** List image files in a plot. */
  const listImages = useCallback(
    async (plotId: string): Promise<DriveFile[]> => {
      if (!sdkRef.current) return [];
      try {
        const files = await sdkRef.current.listFiles(plotId);
        return files.filter((f) => f.mimeType.startsWith("image/"));
      } catch {
        return [];
      }
    },
    []
  );

  /** Proxy an image URL through the Gather host (for Google Drive thumbnails). */
  const proxyImageUrl = useCallback(
    async (url: string): Promise<string | null> => {
      if (!sdkRef.current) return null;
      try {
        return await sdkRef.current.proxyImageUrl(url);
      } catch {
        return null;
      }
    },
    []
  );

  /** Upload a PNG to a Gather plot via postMessage. */
  const uploadToPlot = useCallback(
    async (dataUrl: string, fileName: string, plotId: string): Promise<void> => {
      if (!sdkRef.current) throw new Error("SDK not initialized");
      await sdkRef.current.uploadFile(plotId, fileName, dataUrl);
    },
    []
  );

  return { init, connected, pickPlot, listImages, proxyImageUrl, uploadToPlot };
}
