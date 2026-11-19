[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/kazamisao/gta6-cover-art-01/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/kazamisao/gta6-cover-art-01/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

# Vice Nights

Vice Nights is a browser cover maker that turns your photos into a multi-panel, GTA VI-style key-art poster. Pick a layout, drop a photo into each panel, tune the zoom and framing, choose a neon grade, type your title — and export a print-ready PNG in one click. Everything renders on a local canvas, offline, with no uploads and no network calls.

Built for the make.fun bounty: [Make GTA 6 Cover Art](https://make.fun/bounty/gta6-cover-art-01)

## Run it

```sh
node serve.ts
```

Then open <http://localhost:8080> in your browser.

## Features

- **4 layouts** — hero, diagonal split, triptych, and a 2×2 grid.
- **3 colour grades** — Vice City Sunset, Neon Nights, and Palm Dusk.
- **Per-panel photos** — use the bundled samples or upload your own, with per-panel zoom and horizontal/vertical positioning; one click puts the same photo in every panel.
- **Editable title and subtitle** — the title auto-shrinks to fit, set in the vendored Anton typeface (SIL OFL).
- **3 export sizes** — 1080×1080 (square), 1080×1350 (portrait), and 1920×1080 (wide), exported as PNG.
