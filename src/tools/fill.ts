import type { ToolHandlers, Point, ToolContext } from "../types";

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function colorsMatch(
  data: Uint8ClampedArray,
  idx: number,
  target: [number, number, number, number]
): boolean {
  return (
    Math.abs(data[idx] - target[0]) < 4 &&
    Math.abs(data[idx + 1] - target[1]) < 4 &&
    Math.abs(data[idx + 2] - target[2]) < 4 &&
    Math.abs(data[idx + 3] - target[3]) < 4
  );
}

export const fillTool: ToolHandlers = {
  onPointerDown(pt: Point, tc: ToolContext) {
    const { ctx, width, height, color } = tc;
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    const startIdx = (pt.y * width + pt.x) * 4;
    const targetColor: [number, number, number, number] = [
      data[startIdx],
      data[startIdx + 1],
      data[startIdx + 2],
      data[startIdx + 3],
    ];

    const [r, g, b] = hexToRgb(color);
    const fillColor: [number, number, number, number] = [r, g, b, 255];

    // Don't fill if target is same as fill color
    if (
      Math.abs(targetColor[0] - fillColor[0]) < 4 &&
      Math.abs(targetColor[1] - fillColor[1]) < 4 &&
      Math.abs(targetColor[2] - fillColor[2]) < 4
    )
      return;

    const stack: [number, number][] = [[pt.x, pt.y]];
    const visited = new Uint8Array(width * height);

    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      if (x < 0 || x >= width || y < 0 || y >= height) continue;

      const idx = (y * width + x) * 4;
      const visitedIdx = y * width + x;

      if (visited[visitedIdx]) continue;
      visited[visitedIdx] = 1;

      if (!colorsMatch(data, idx, targetColor)) continue;

      data[idx] = fillColor[0];
      data[idx + 1] = fillColor[1];
      data[idx + 2] = fillColor[2];
      data[idx + 3] = fillColor[3];

      stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
    }

    ctx.putImageData(imageData, 0, 0);
  },
  onPointerMove() {},
  onPointerUp() {},
};
