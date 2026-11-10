# Blender vegetation authoring reference

Eterna's browser runtime does not require Blender to generate the current 0.3.0 procedural vegetation. For later hero assets and production vegetation, Blender is the preferred sculpting/authoring tool, with GLB as the handoff format.

## Recommended optional extension: Sapling Tree Gen 1.0.0

Official listing: https://extensions.blender.org/add-ons/sapling-tree-gen/

The current 1.0.0 extension requires Blender 5.2 or newer and provides:
- 29 presets across broadleaf, conifer and other species.
- Editable live Geometry Nodes tree objects.
- Branch structure with adjustable growth hierarchy, branching variation and pruning.
- Leaves and blossoms.
- Armature or node-based wind support.
- Make Mesh to bake the tree into an exportable mesh.

The extension is GPL-3.0-or-later and is not bundled into Eterna. It is an optional authoring tool, not a runtime dependency.

### Install
1. Open Blender.
2. Go to Edit → Preferences → Get Extensions.
3. Search for **Sapling Tree Gen**.
4. Install version 1.0.0 or newer.
5. Check for updates in the Extensions panel when a new version is released.

## Eterna authoring recipe

For a new broadleaf tree, create at least three silhouette variants rather than one tree duplicated at different scales:
- Old oak: heavy trunk, broad buttress roots, low lateral limbs and a broken/uneven crown.
- Young oak: slimmer trunk, higher branching, lighter crown.
- Wind-shaped oak: visible directional bias, uneven crown and a few broken branch tips.

For conifers:
- Avoid identical branch whorls; vary height and azimuth.
- Use drooping lower limbs and a stronger apical leader.
- Keep the upper crown narrow and allow silhouette irregularity.

### Before GLB export
- Apply transforms and work in metres.
- Ground-contact origin; Y up; forward local -Z.
- Use named materials: M_Bark, M_Leaf, M_Needle, M_Wood.
- Bake branch geometry but preserve the original editable Blender file outside the runtime asset folder.
- Use separate LOD meshes and simple collision proxies.
- Export glTF 2.0 / GLB with normals, UVs, materials and animations if present.
- Test the exported file in a clean viewer and register its source and licence.

## Optional alternative
Modular Tree (MTree) is another node-based Blender tree generator with L-systems, branch nodes and crown envelopes. It is a useful research alternative, but Eterna's immediate authoring recommendation is Sapling Tree Gen 1.0.0 because its current release explicitly supports Blender 5.2+ and leaf/wind export workflows.

Official listing: https://extensions.blender.org/add-ons/modular-tree/
