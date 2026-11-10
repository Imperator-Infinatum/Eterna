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
