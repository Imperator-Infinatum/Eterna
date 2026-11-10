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

## First texture pass (0.2.1)

The environment kit now includes deterministic 256px procedural DataTexture maps for bark grain, leaf mottling, plaster, timber grain, stone, terracotta roof seams and ground breakup. Custom trunk/canopy geometry has UVs. The road and terrain retain vertex-colour gradients, while material maps introduce finer surface variation. These textures are original runtime-generated maps, not external image files.

## Review cadence
At the end of every environment/character asset milestone, capture the same camera positions and review close, medium and far distances against Warcraft III: Reforged and relevant World of Warcraft zones. Record strengths, gaps, performance and the next concrete asset changes. Do not claim equivalence to a reference title; the comparison is a quality-direction tool.


## 0.3.0 — Organic forest vegetation pass

### Warcraft / WoW benchmark comparison
| Visual criterion | Eterna 0.3.0 change | Remaining gap |
|---|---|---|
| Tree silhouette | Separate broadleaf and conifer growth profiles with seed-based variation | More species and authored silhouette studies |
| Trunk-to-branch transitions | A single smooth-union surface for trunk, branch junctions, twigs and roots | Hand-sculpted bark folds, knot scars and larger branch collars |
| Buttress roots | Unequal roots with randomized spread, taper and buried tips | More terrain-conforming roots and exposed root topology |
| Canopy | Individual curved leaf meshes and narrow conifer needles; no spherical canopy blobs | Hand-painted leaf atlas, more leaf species and stronger translucency |
| Forest floor | Instanced 3D grass, fern pinnae, shrubs and wildflowers | More seasonal variants, litter, moss and biome-specific ground materials |
| Motion | Subtle leaf/grass shader wind and tree sway | Branch-level secondary motion and gust response |
| Performance | Tree templates share geometry; ground cover uses InstancedMesh | LOD0/1/2 assets, impostors and screen-space density control |

### Acceptance notes
- Branching is seed-driven: origins and spacing are irregular, not copied from one radial template.
- The trunk and branch network are polygonized as a continuous surface using a tapered-segment signed-distance field with smooth union and marching tetrahedra.
- The root flare is generated from the same field and is therefore joined to the trunk surface rather than assembled from separate cylinders.
- Leaf blades, spruce needles and ground-cover blades are actual meshes, not green spheres.
- Asset manifest, strict TypeScript and production build are required before merge.

This is a structural and rendering-quality milestone, not the final sculpted art pass. The tree surface still needs close-range visual inspection and future authored bark/leaf textures. The player-facing visual acceptance review should be repeated after Cloudflare publishes the new build.


## 0.3.1 — Forest stand and terrain polish

- Increased oak mesh bounds and sampling resolution so long secondary branches and terminal twig envelopes are less likely to be clipped.
- Changed forest placement from a uniform random sprinkle into six seeded irregular stands with species bias. The seeded test placement reaches 72 trees in 135 attempts.
- Retained clear space along the Kingroad, around Willowmere, at the Mirror Pool and at the player spawn.
- Added another oak growth seed and another spruce seed to reduce the repetition rate across the 72-tree forest.
- Increased grass patch density and introduced finer multi-frequency terrain undulation while preserving the road and village level relationships.

The next review should specifically look for canopy overlap that hides the trunk silhouette, roots appearing to float on local slopes, buildings intersecting ground undulation, and excessive visual clutter near the path.


## 0.3.2 — Visibility and distribution repair

The 0.3.1 playtest screenshot exposed an important failure: vegetation silhouettes read as detached shrubs and spiky strands, with tree trunks and upper crown structure too weak to identify mature trees.

Changes in this repair:
- Leaf instance budget is distributed evenly over all branch/canopy anchors. The previous sequential allocation could exhaust the oak budget before upper branch anchors were processed.
- Added foliage anchors along secondary limbs and primary crown branches, not just at a subset of terminal positions.
- Increased broadleaf cluster scale and spread to improve canopy continuity at gameplay distance.
- Increased the minimum visible trunk, root and branch radii, and raised the organic mesh sampling resolution so secondary limbs are not lost as sub-voxel details.
- Bark is double-sided, has a clearer stylized brown value range, disables potentially incorrect frustum culling for this generated surface, and records vertex/triangle/bounds diagnostics.
- Grass geometry is now made of three crossed curved ribbons per instance rather than one flat ribbon, and the patch density/capacity is increased.

The screenshot review has not yet been repeated after this repair. Acceptance requires a new close/gameplay/far browser capture showing unmistakable trunk-to-branch continuity, readable tree species, and fuller 3D ground cover. This repair should not be described as visually accepted until that playtest is complete.


## 0.3.3 — Tree bark polygonizer repair (root cause verified)

The 0.3.2 screenshot still showed no trunks. A new headless geometry audit generated the oak and spruce meshes and exposed the exact defect in the marching-tetrahedra polygonizer.

The cube contains eight corner indices (0..7), while each tetrahedron has four local vertices (0..3). The polygonizer was storing cube-corner indices in its inside/outside arrays, then using those values to index a four-element tetrahedron-local ID array. Accesses for cube corners 4..7 therefore returned undefined, producing NaN vertex coordinates, invalid normals and NaN geometry bounds. The browser renderer received an unusable bark surface and culled it; the separate instanced foliage still rendered.

The fix stores tetrahedron-local indices (0..3) in the inside/outside arrays, while mapping each local index to its corresponding cube corner only when building the four-element ID array.

### Verified geometry audit (seed 101 oak, seed 203 spruce)
| Metric | Oak | Spruce |
|---|---:|---:|
| Bark vertices | 20,560 | 15,924 |
| Bark triangles | 41,040 | 31,796 |
| Bounds X × Y × Z | 6.82 × 13.10 × 5.97 m | 4.03 × 12.67 × 4.48 m |
| Invalid positions | 0 | 0 |
| Invalid normals | 0 | 0 |
| Non-degenerate triangles | 40,877 | 31,649 |

The headless audit is now run by `npm run build`. It rejects non-finite geometry, implausible bounds, sparse/degenerate surfaces and missing foliage instances. This directly protects against the specific failure observed in the 0.3.1 and 0.3.2 playtests.

A browser screenshot review is still required to visually accept the repaired trunks and branch unions.


## 0.3.4 — Crown growth and canopy closure

### Screenshot-driven findings
The 0.3.3 capture confirmed the continuous bark surfaces were now visible. It also showed two remaining art-direction issues:
- Some trees had too many scaffold branches originating low on the trunk, weakening the distinction between buttress roots and the clear bole.
- Leaf instances were still distributed as small terminal decorations. The tree had a visible branch structure but did not form a continuous crown when viewed from above.

### Growth-rule changes
- Most oaks keep a clear lower bole; only a minority has one lower scaffold limb. Oak primary branch origins are separated vertically, with a deliberately high crown branch to close the top of the canopy.
- Most spruce variants keep a visible lower trunk; a minority has a low skirt. Branch whorl count and heights vary, and branch spacing is separated.
- Primary and secondary branch lengths, split positions, sweep and curvature have wider ranges.

### Foliage changes
- Oak leaves are now curved, tapered, pointed and slightly cupped meshes with a raised midrib rather than flat seven-point polygons.
- Oak foliage budget increases from 720 to 4,500 individual leaf instances per template.
- Leaf anchors are distributed along the primary scaffold, secondary limbs and terminal twigs. Their positions form compact overlapping clusters rather than isolated terminal sprays.
- Spruce foliage instances are now 3D needle sprays. Each spray contains nine individually modelled tapered needles, distributed along the full bough and secondary branches.
- Oak and spruce upper crowns are explicitly checked for instance count and angular-sector coverage.

### Bark surface refinement
The bark surface map now uses warped longitudinal fibres, broken fissures and mottling, reducing the repeated horizontal striping visible in the first procedural material.

### Regression checks
The production vegetation audit now instantiates every tree seed used by Willowmere and checks:
- no more than one scaffold origin in the designated lower-bole zone;
- finite bark vertices/normals, meaningful bounds and non-degenerate faces;
- minimum foliage budgets;
- upper-crown foliage and coverage across multiple radial sectors.

Visual acceptance still requires a new browser comparison at close, gameplay and top-down/far views. The audit verifies structural distribution and coverage metrics, not artistic quality by itself.


## 0.3.5 — Bark material and canopy refinement

### Bark PBR
- Added ambientCG Bark012 Ambient Occlusion and Roughness maps (1K JPG, CC0 1.0), stored locally in `public/assets/textures/bark/`.
- Eterna retains ownership of the stylized base-colour and height layers: the colour field is generated at 512px with tileable longitudinal plates, warped fibres, broken fissures, knots and fine grain; the height field is generated at 512px and drives the bump response.
- The bark material now uses the CC0 roughness/AO maps plus in-house bump detail, with AO kept deliberately subtle so trunks do not become black or muddy.
- Generated bark UVs also provide `uv2` for AO and receive deterministic per-seed offsets to reduce obvious repeated alignment.

### Oak canopy
- Raised oak foliage budget from 4,500 to 5,800 instanced leaf meshes per template.
- Added branch-level leaf anchors along primary and secondary scaffolds, not only at outer twig tips.
- Reworked the leaf surface into a gently cupped, lobed oak blade with a raised midrib and paired lateral veins integrated into the same geometry.
- Reduced cluster scatter radius slightly while increasing individual leaf length to encourage overlapping canopy coverage.
- Updated the seven-template audit to enforce the new foliage budget and confirm CC0 Bark012 AO/roughness map files are present.

### Performance
The additional 1,300 leaf instances and higher-detail leaf mesh increase geometry cost. We must profile camera-visible tree counts and frame time before a larger forest expansion; the next performance pass should use near/mid/far foliage LOD or per-instance density reduction rather than deleting close-up leaf detail.
