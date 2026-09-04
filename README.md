# NEAT Flappy Bill

Fifty eagles learn to keep the bill in the air, using the **same art and physics** as the public [White House Arcade Flappy Bill](https://www.whitehouse.gov/arcade/flappy-bill/) game.

Open `index.html` (or any static server). The 256×224 stage is the official pixel playfield: sky gradient, sun, clouds, DC skyline, cherry/elm trees, fluted columns, eagle frames, and the 5×7 score font.

## What is official vs what is ours

| Official (from whitehouse.gov) | This trainer |
|---|---|
| Pixel sprites (eagles, monuments, trees, column caps) | 50 birds at once |
| Sky, parallax skyline, flag poles, grass | Real NEAT (add node / add connection) |
| Column look + scroll/gap ramp | Live neural-net diagram |
| Gravity, flap, hitboxes | Turbo 1–24× |

The original minified IIFE is saved at `vendor/flappy-bill-game.original.js` (extracted 2026-09-03). `official-render.js` is that renderer, exposed so the flock can share one world.

## Controls

- **Turbo** — simulate extra steps per frame
- **Pause / New population** — freeze or restart evolution

Brains see `DX, Y, TOP, BOT, VY` and output `FLAP`.
