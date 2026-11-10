# Eterna — Asset Licence Register

## Original project assets
The initial Willowmere refinement assets are original procedural mesh assets authored in src/assets/environment.ts. They have no third-party source dependency. Their origin and asset IDs are recorded in public/assets/manifest.json.

## Researched candidates (not bundled)
- Quaternius Medieval Village Pack — CC0; 44 FBX/OBJ/Blend models. Useful for modular props, but review the low-poly style against the target before adopting. https://quaternius.com/packs/medievalvillage.html
- Kenney Fantasy Town Kit — CC0; 160 pieces, version 2.0. Useful for modular settlement support. https://kenney.nl/assets/fantasy-town-kit
- Poly Haven — CC0 models, PBR textures and HDRIs. Preferred surface-reference source; apply Eterna palette/material direction rather than importing photorealism indiscriminately. https://polyhaven.com/license
- Kay Lousberg Forest Nature Pack — listed as CC0 with a large free forest set; verify exact included pack terms when obtaining files. https://kaylousberg.com/game-assets/forest-nature-pack

These candidates are recorded for evaluation only. No third-party model or texture from these packs is currently bundled in Eterna.

## Required for every future external asset
Record the asset name, filename, creator, original source URL, exact licence and version, attribution text, modifications and date checked. Preserve any licence file included with the pack. Do not assume a free download grants redistribution rights or permission to remove attribution.

## Vegetation tool and asset research
- Blender Sapling Tree Gen 1.0.0 — official Blender Extension. Blender 5.2+; 29 presets; editable Geometry Nodes tree construction, leaves, blossoms, armature and wind. Extension licence: GPL-3.0-or-later. Not bundled into Eterna. https://extensions.blender.org/add-ons/sapling-tree-gen/
- Quaternius Stylized Nature MegaKit — 116 nature models (trees, plants, flowers, rocks, grass and bushes), CC0 1.0, glTF/FBX/OBJ/Blend. Candidate only; not downloaded or bundled because the pack's Ghibli-inspired look needs a selective art-direction review. https://quaternius.itch.io/stylized-nature-megakit
- Weber & Penn, “Creation and Rendering of Realistic Trees,” SIGGRAPH 1995. Used as technical reference for growth hierarchy, branch variation and scale-aware rendering. https://courses.cs.duke.edu/cps124/fall01/resources/p119-weber.pdf

Current 0.3.0 vegetation is original Eterna procedural content. No Blizzard assets, extracted game content or third-party model files are included.
