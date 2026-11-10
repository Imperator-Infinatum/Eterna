# Eterna

Eterna is an original browser-based fantasy RPG built around a single-hero, command-driven adventure. The first playable region is **Willowmere**, a frontier settlement on the edge of the Greenward.

This independent project does not include Blizzard code, extracted game files, models, textures, maps, audio or interface assets.

## Stack
- TypeScript, Three.js and Vite.
- glTF / GLB for authored 3D assets.
- Cloudflare Workers Builds for Git-connected deployment and static asset delivery.

## Current foundation
- Elevated perspective follow camera with smooth tracking, middle-mouse orbit and wheel zoom.
- Warcraft-inspired point-and-click movement: left-click to select the hero, right-click terrain to move, and use the minimap for movement orders.
- Procedural terrain, forest canopies, timber cottages, a ruined watch, pond, road and rock scatter.
- Original detailed procedural Willowmere assets, runtime-generated surface materials, continuously blended organic oak and spruce architecture, individual leaf/needle meshes, plus instanced 3D grasses, fern fronds, shrubs and wildflowers: layered oak and spruce models, timber cottage with instanced roof shingles, stone foundations, well, fences, lanterns and mossy boulders.
- A GLB import helper, asset manifest and automated licence/provenance audit.
- The art benchmark and production asset pipeline are documented in docs/ASSET_REVIEW.md, docs/ASSET_PIPELINE.md and docs/VEGETATION_PIPELINE.md.

## Run locally
Requires Node.js 22.12+ and npm 10+.

    npm install
    npm run dev

Open the URL printed by Vite, normally http://localhost:5173.

## Validate and build
    npm run typecheck
    npm run build
    npm run preview

The production site is emitted to dist/.

## Cloudflare
This repository is currently configured for Cloudflare Workers Builds using Wrangler's Vite integration. See DEPLOYMENT.md for the exact dashboard settings and automatic configuration flow.

Current art foundation: **0.3.2 — Vegetation Visibility Repair**. The Willowmere forest uses unified tree surfaces, individual foliage geometry, layered understorey and seeded forest stands.
