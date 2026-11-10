# Eterna

**Eterna** is an original browser-based fantasy RPG project, built around a single-hero, command-driven adventure and a stylized-realism art direction inspired by classic fantasy strategy and RPG games.

The first playable region is **Willowmere**, a frontier settlement on the edge of the Greenward.

> This is an independent project. It does not include Blizzard code, extracted game files, models, textures, maps, audio, or interface assets.

## Current development foundation

- TypeScript, Three.js and Vite.
- Perspective, elevated follow camera with smooth hero tracking, middle-mouse orbit and wheel zoom.
- Warcraft-inspired point-and-click controls: select the hero with left click, right-click terrain to move, and use the minimap to issue movement orders.
- Procedural terrain, forest canopy clusters, timber cottages, a ruined watch, a pond, a road, ground cover and rock scatter.
- Original procedural placeholder geometry. Production-ready art assets will be introduced through a documented asset pipeline.

## Requirements

- Node.js 22.12 or newer.
- npm 10 or newer.
- A desktop browser with WebGL 2 support enabled.

## Run locally

```bash
npm install
npm run dev
```

Open the URL printed by Vite (normally `http://localhost:5173`).

## Validate and build

```bash
npm run typecheck
npm run build
npm run preview
```

The production site is emitted to `dist/` and can be hosted as a static site on Cloudflare Pages.

## Cloudflare Pages

- Framework preset: Vite (or None with the same settings)
- Build command: `npm run build`
- Build output directory: `dist`
- Root directory: `/`
- Production branch: `main`

See [DEPLOYMENT.md](DEPLOYMENT.md) for the deployment checklist.

## Project structure

```text
src/
  main.ts
  style.css
  game/
    camera.ts
    controls.ts
    hero.ts
    world.ts
    types.ts
public/
  archive/
  assets/
docs/
  ART_BIBLE.md
  ASSET_LICENCES.md
  GAME_DESIGN.md
  ROADMAP.md
  TECH_DESIGN.md
```

## Development principles

1. Keep rendering, world simulation, hero control, camera and interface systems separate.
2. Prefer authored, reusable GLB assets for production characters and landmarks; procedural meshes are for blockouts and repeatable environment dressing.
3. Record every external asset's source, creator, licence, modification and attribution in `docs/ASSET_LICENCES.md` before use.
4. Never include extracted Blizzard assets, game files, maps, audio or interface textures.
5. Preserve stable builds and use feature branches for experiments.
