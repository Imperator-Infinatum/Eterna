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
- Original placeholder geometry and a documented path toward production art assets.

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