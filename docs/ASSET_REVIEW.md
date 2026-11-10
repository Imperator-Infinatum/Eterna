# Eterna — Visual Benchmark and Asset Review

## Benchmark references

### Warcraft III: Reforged
Blizzard's current description emphasizes bold silhouettes, strong unit identity and stylized charm, with stronger environmental verticality, dynamic lighting, fog and day/night transitions. The production benchmark is not photorealism; it is a readable fantasy world with carefully controlled exaggeration and materially richer presentation.

Reference: https://news.blizzard.com/en-gb/article/24298590/warcraft-iii-reforged-forsaken-kingdom-deep-dive-recap

### World of Warcraft
Use the Warcraft visual family as a reference for readable regional identity: architecture that belongs to its biome, distinct vegetation silhouettes, landmarks that organize travel, and colour palettes that make zones recognizable from a distance.

### Reforged production-art comparison
Lemon Sky's Warcraft III: Reforged portfolio documents concept art, UI/UX redesign, environment models and character models built from scratch with references to Warcraft III and World of Warcraft. It is a useful reference for how detail and world-building were added without abandoning the original shapes.

Reference: https://lemonsky.artstation.com/projects/8B3Xbw

## Eterna before this pass
- Trees used a trunk plus a small set of smooth, sphere-like canopy blobs.
- Cottage walls, roof and trim were simple blockout shapes.
- Terrain had a readable base colour but little authored surface variation.
- The village had too few meaningful props and architectural sub-shapes.

## First refinement target
- Trees: tapered and irregular trunks, buttress roots, visible branch hierarchy, layered crowns, varied species and density.
- Buildings: stone foundations, timber framing, roof planes with individual shingles, window assemblies, shutters, doors, chimneys and lanterns.
- Props: wells, fences, road lanterns, boulders, stumps, woodpiles and signs.
- Materials: separate roughness/metalness response and coherent colour families; later imported assets must be re-materialed if their palettes do not fit Eterna.
- Composition: keep the path and landmarks readable while increasing the density of secondary forms.

## Acceptance review checklist
- At the normal camera distance, the hero, cottage and tree silhouettes remain distinct.
- At close zoom, the viewer sees secondary forms rather than featureless blocks.
- At far zoom, broad colour groupings and landmarks remain readable.
- Wood, stone, foliage, roof and metal read as different materials.
- The village does not become visually noisy: roads, entrances and interactable space stay clear.
- Repeated assets share geometry/materials or use instancing where possible.

## Review cadence
At the end of every environment/character asset milestone, capture the same camera positions and review close, medium and far distances against Warcraft III: Reforged and relevant World of Warcraft zones. Record strengths, gaps, performance and the next concrete asset changes. Do not claim equivalence to a reference title; the comparison is a quality-direction tool.
