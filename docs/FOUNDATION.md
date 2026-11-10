# Eterna Foundation Notes

## Art direction
Eterna aims for stylized realism: heroic proportions and readable silhouettes, combined with layered materials, believable light response, crafted surface detail and rich environmental composition. This is an original visual identity, not a reproduction of another game's assets.

Core palette:
- Deep forest: #315A37, #426E3C
- Sunlit foliage: #5D8245, #789452
- Earth and timber: #59402C, #876844
- Warm stone: #9B947E, #B7A17B
- Aged brass: #B58B43, #D8BB6E
- Water: #477F7A

Production assets require a reference sheet, gameplay scale, silhouette check, material key, LOD plan and licence record.

## Technical design
TypeScript provides application and gameplay code; Three.js provides rendering, scene graph, camera and materials; Vite provides development and production bundling; glTF/GLB is the preferred interchange format. Cloudflare Workers Builds and Wrangler deploy the Vite application as a Worker with static assets.

Runtime boundaries:
- src/main.ts: app composition, renderer, resize and update loop.
- src/game/camera.ts: perspective follow camera and orbit input.
- src/game/controls.ts: selection and screen-to-world picking.
- src/game/hero.ts: player representation and movement.
- src/game/world.ts: terrain, environment and landmarks.
- src/style.css: HUD and responsive layout.

Keep world coordinates in metre-like units, with Y up. Keep pathfinding, combat, animation, interactions, quests, inventory, save data and world streaming in separate modules.

## Game design
Eterna is a single-player browser-based fantasy open-world RPG. The player controls one hero in a continuous 3D world. Its command-driven interaction is inspired by classic strategy-game hero controls, adapted for exploration and RPG progression.

Experience pillars:
1. Explore a handcrafted world.
2. Read the world at a glance.
3. Control one consequential hero.
4. Discover through places, people and objects.

Willowmere is the first playable environment and a scale, camera, art and interaction testbed. Its landmarks include the settlement, an old road, a mirror pool and a ruined watch.

## Asset licensing
No third-party production assets are included in the initial foundation. Procedural placeholder geometry and original code are used for the current world blockout. Before adding an external asset, record its name, creator, URL, exact licence, attribution, modifications and verification date. Check each asset individually and do not include extracted commercial-game files or assets.