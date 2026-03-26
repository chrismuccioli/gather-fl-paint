# 🌸 FLPaint

A retro MS Paint-style image editor that runs as a **Gather plugin**. Open images from your plots, draw on them with classic 90s tools, manage layers like Photoshop, stamp flower stickers everywhere, and save back to Gather.

## Features

- **Classic MS Paint tools** — Pencil, Eraser, Spray Can, Text, Line, Fill Bucket
- **Flower stickers** 🌼🌹🌷🌻🌸💐 — stamp 'em anywhere
- **Layer panel** — Photoshop-style layers with visibility, opacity, reorder, and delete
- **Gather integration** — open images from plots, save edited images back
- **Retro Windows 95 UI** — beveled borders, silver chrome, pixel font, the works

## Quick Start

```bash
npm install
npm run dev
```

This starts a dev server on `http://localhost:3001`.

## Install in Gather

1. Start the dev server (`npm run dev`)
2. In your Gather workspace, go to **Settings → Plugins → Install Plugin**
3. Paste the manifest URL: `http://localhost:3001/gather-plugin.json`
4. FLPaint appears in your sidebar under **Plugins**

## Manifest

The `gather-plugin.json` file at the project root is the plugin manifest:

```json
{
  "name": "FLPaint",
  "icon": "paint-brush",
  "entryUrl": "http://localhost:3001",
  "scopes": ["plots:read", "files:read", "files:write"],
  "version": "0.1.0"
}
```

For production, change `entryUrl` to your deployed URL.

## Standalone Mode

FLPaint also works outside Gather — just open `http://localhost:3001` directly. The Gather integration features (open from plot, save to plot) will be disabled, but all drawing tools work.

## Build

```bash
npm run build
```

Output goes to `dist/`. Deploy to Vercel, Netlify, GitHub Pages, or anywhere static.

## License

MIT
