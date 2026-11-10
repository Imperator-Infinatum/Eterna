# Eterna — Vegetation Production Pipeline

## Art target

Eterna's forest direction combines Warcraft III's heroic, instantly readable tree silhouettes and rich colour grouping with World of Warcraft's layered environment composition: massive trunks, interlocking canopies, atmospheric depth, and an understorey that makes the ground feel inhabited.

The target is stylized realism. It is not photorealistic botany, and it is not low-poly geometry assembled from a trunk plus repeated sticks and spheres.

## Structural model: continuous tree architecture

The 0.3.0 oak and spruce generators build a deterministic growth skeleton with seed variation:

1. A curved tapered trunk with subtle drift.
2. Unequal buttress roots that flare from the same trunk base and terminate at different distances/depths.
3. Primary limbs that begin at staggered heights and different azimuths.
4. Secondary limbs that split from varying positions along each primary.
5. Fine terminal twigs with their own curvature and taper.

Each segment has a start and end radius. The generator evaluates a signed-distance field for the tapered branch network and combines it with a smooth-min union. Marching tetrahedra extracts one continuous bark surface. This is the key difference from the previous pass: branch junctions and root flares are part of one mesh, not independent cylinders intersecting at a peg-like join.

Subtle deterministic surface perturbation and vertex colour introduce bark variation, vertical grain, sunlit edges and low-trunk moss colouring. The material system uses the existing Eterna bark surface map.

## Species profiles

### Broadleaf oak
- 12.2 m nominal height, broad irregular crown.
- 7–9 primary limbs from varied elevations.
- 3–5 secondary branches per primary, plus terminal twigs.
- 6–8 buttress roots with unequal lengths, widths and direction.
- Individual curved broadleaf meshes clustered around twig ends; the underlying branch structure remains visible through canopy gaps.

### Spruce
- 12 m nominal height, narrower conical crown.
- 11–14 irregular branch bands, with randomized spacing and azimuth rather than a perfectly repeated radial whorl.
- Drooping primary limbs and varied secondary splits.
- Individual narrow needle meshes distributed along limbs.

Tree templates are generated from deterministic seeds and then reused with scale and rotation variation in the world. This avoids generating the full mesh for every tree instance.

## Forest-floor vegetation

- **Grass:** three curved, tapering 3D blade variants. Blade patches use InstancedMesh and per-instance colour variation. Vertex shader wind uses world position as a phase offset so nearby blades do not move in lockstep.
- **Ferns:** seven asymmetrical fronds per model, each with a central rachis and paired pinnae.
- **Shrubs:** unequal woody stems with instanced individual leaf blades.
- **Wildflowers:** instanced stems, five individual petals and flower centres, with a restrained cream, gold, rose and violet palette.

Scatter is patch-based and leaves roads, building footprints, the pond edge and the hero spawn area readable. Ground cover should add local richness, not become a uniform carpet.

## Motion
- Leaf/needle cards sway with a low-amplitude, spatially varied shader wave.
- Grass blades bend more noticeably at the tip.
- Tree groups receive subtle global sway; this is a visual placeholder until branch-level secondary motion is introduced.
- Wind amplitude remains low enough that tree silhouettes remain readable.

## Performance and LOD targets

These are working web-game budgets, not fixed universal rules:
- Tree templates: 3 broadleaf and 2 conifer seeds per world; repeated trees share geometry and materials.
- Leaves/needles: one InstancedMesh per tree template instance.
- Grass: three shared geometries/materials with InstancedMesh distribution.
- Shrubs and flowers: small template set, instanced foliage/flower parts.
- Target one or two bark/foliage draw calls per tree at LOD0.
- Future LOD1 should preserve trunk, major limbs and silhouette while reducing fine twigs and leaf count.
- Future LOD2 should use a simplified crown/cluster representation; avoid a hard pop by cross-fading or density reduction.
- Add impostors only for distant forest rows after camera-distance profiling.

## Visual review protocol

Every vegetation pass must be checked at:
1. Close zoom: trunk/branch union, roots, bark material, leaf shape and normals.
2. Gameplay zoom: species silhouette, canopy gaps, understorey and path readability.
3. Far zoom: canopy colour masses, biome separation, forest density and landmark visibility.

Compare with Warcraft III Reforged and WoW screenshots taken from similar camera angles. Do not compare a close-up reference with a far-distance Eterna view.

## External resource policy

The Quaternius Stylized Nature MegaKit is a researched CC0 candidate for selective ground-cover/plant comparison; it is not bundled in 0.3.0. The current vegetation pass is authored procedurally for Eterna. Any future imported asset must pass individual licence/provenance review, palette matching, silhouette review and LOD review before it enters the runtime asset directory.

## Primary references

- Weber & Penn, SIGGRAPH 1995, *Creation and Rendering of Realistic Trees*: https://courses.cs.duke.edu/cps124/fall01/resources/p119-weber.pdf
- Blender Sapling Tree Gen 1.0.0 (29 presets, Geometry Nodes, leaves/blossoms, rig and wind; Blender 5.2+): https://extensions.blender.org/add-ons/sapling-tree-gen/
- WoW Elwynn Forest environment composition: https://gamer-guides.com/wow-hardcore/elwynn-forest/
- Warcraft III tree shape and texture variation discussion: https://www.hiveworkshop.com/threads/how-to-change-textures-on-a-tree-or-other-doodad-without-importing-several-models.222212/
- Quaternius Stylized Nature MegaKit (116 CC0 models): https://quaternius.itch.io/stylized-nature-megakit


## Stand composition and terrain
The current Willowmere layout uses six seeded forest stands with species bias and open glades. The road, village footprint, Mirror Pool edge and spawn area are explicit exclusion zones. Tree templates are generated from several seeds and reused as instances to keep mesh authoring cost out of the per-tree placement loop. Terrain uses broad rolling forms plus lower-amplitude cross-slope and local undulation; all scatter positions sample the same height function used by the terrain mesh.


## 0.3.2 visibility repair
The first 0.3.1 gameplay capture showed that tree crowns were reading as isolated shrubs and the grass as thin spikes. The diagnosis and repair focus on visual distribution and silhouette:
- Allocate the fixed leaf instance budget evenly to every branch/crown anchor rather than allowing early lower branches to consume the budget.
- Add leaf anchors along secondary limbs and primary crown branches.
- Increase broadleaf leaf size/spread and gameplay-scale trunk/root/branch radii.
- Raise SDF extraction resolution to preserve fine secondary limbs and recompute smooth surface normals from the final indexed mesh.
- Render bark double-sided and retain the bark map/vertex colour, with stronger brown values and mesh statistics for diagnosing empty or unexpectedly sparse surfaces.
- Build each instanced grass tuft from three crossed curved ribbons, with higher patch density.

The next browser acceptance capture must show a visible continuous trunk, branch unions and root flares, plus a full readable canopy at gameplay distance. Do not mark visual acceptance based on a successful TypeScript/Vite build alone.


## Polygonizer validation and regression test
The signed-distance-field polygonizer uses tetrahedron-local indices (0..3) independently of cube-corner indices (0..7). Never mix the two index spaces. The `scripts/audit-vegetation.ts` test builds a deterministic oak and spruce model and verifies finite positions/normals, plausible bounds, non-degenerate triangles, minimum geometry counts and populated foliage instances. It runs as part of the production build.
