import type { ToolHandlers, Point, ToolContext } from "../types";

const STICKER_EMOJI: Record<string, string> = {
  daisy: "🌼",
  rose: "🌹",
  tulip: "🌷",
  sunflower: "🌻",
  "cherry-blossom": "🌸",
  lavender: "💐",
};

let activeStickerIdRef: string | null = null;

export function createStickerTool(stickerId: string | null): ToolHandlers {
  activeStickerIdRef = stickerId;

  return {
    onPointerDown(pt: Point, tc: ToolContext) {
      if (!activeStickerIdRef) return;
      const emoji = STICKER_EMOJI[activeStickerIdRef] ?? "🌸";
      const size = Math.max(32, tc.size * 12);
      tc.ctx.font = `${size}px serif`;
      tc.ctx.textAlign = "center";
      tc.ctx.textBaseline = "middle";
      tc.ctx.fillText(emoji, pt.x, pt.y);
    },
    onPointerMove() {},
    onPointerUp() {},
  };
}
