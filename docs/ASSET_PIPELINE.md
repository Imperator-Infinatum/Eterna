# Eterna — Asset Production and Import Pipeline

## 1. Art target first
Every asset begins with a reference sheet and a short brief: gameplay role, silhouette, scale, material key, colour family, close/medium/far readability and expected LODs. Do not model from a single attractive screenshot; compare multiple views and use the target game's own screenshots as a visual benchmark, not as a source of reusable assets.

## 2. Preferred source format
Use glTF 2.0 / GLB for runtime models. Three.js recommends glTF because it is designed for transmission and supports meshes, materials, textures, skins, skeletons and animation. Runtime loading uses the official GLTFLoader add-on.

## 3. Asset structure
- `public/assets/models/`: approved runtime GLB files.
- `public/assets/textures/`: texture maps used by runtime models.
- `public/assets/manifest.json`: provenance, author, licence, attribution and usage notes.
- `src/assets/`: loaders, shared materials, procedural asset authoring and catalog code.
- `docs/ASSET_REVIEW.md`: visual comparison and milestone reviews.

Every imported file needs a stable asset ID. Do not place unregistered models in the runtime asset directory.

## 4. Blender source and export standard
- Work in metres; apply object transforms before export.
- Origin at ground contact for props and buildings, and at the character root for actors.
- Forward convention: character/model forward is local -Z; Y is up.
- Use consistent material names: `M_Wood_*`, `M_Stone_*`, `M_Foliage_*`, `M_Metal_*`, `M_Cloth_*`.
- Pack textures for GLB delivery where appropriate.
- Export glTF 2.0 with materials, normals, UVs and animations when present.
- Include LODs as separate named nodes or a documented runtime LOD record.
- Keep collision meshes separate and clearly named; do not render them.
- Inspect the exported GLB in a clean viewer before accepting it.

## 5. Working budgets
These are initial web-game budgets, not universal rules:
- hero: 15k–35k triangles at LOD0; 2K texture set where justified.
- major building: 8k–25k triangles at LOD0; 1K–2K texture set.
- medium props: 1k–8k triangles; 512–1K texture set.
- background vegetation: repeated meshes should be instanced; use shared atlases/materials where visual quality allows.
- LOD1 target: around 45–60% of LOD0 triangles; LOD2 target: around 10–20%.
- prefer fewer shared materials and texture atlases over dozens of unique material instances.

## 6. Runtime import
`src/assets/asset-loader.ts` loads GLB files through Three.js GLTFLoader, enables shadow flags on meshes, and loads the asset manifest. The manifest audit runs as `npm run asset:audit`.

## 7. Licensing and provenance
- Record the exact licence shown for the individual asset or pack version.
- Preserve included licence files and creator attribution instructions.
- Record source URL, creator, download date, modifications and any restrictions.
- A free download does not automatically mean CC0, redistribution rights or permission to remove attribution.
- For assets under non-commercial terms, check that the intended use remains non-commercial; do not rely solely on a promise that the game is free to download.
- Never include extracted commercial-game models, textures, maps, audio, animations or UI artwork.

## 8. Review gates
1. Provenance and licence approved.
2. Scale and silhouette approved.
3. Material and colour treatment approved.
4. LOD and performance checked at gameplay camera distances.
5. Asset is added to the manifest and passes the automated audit.


## Vegetation production pipeline
See [VEGETATION_PIPELINE.md](VEGETATION_PIPELINE.md) for the organic tree growth/meshing method, foliage and ground-cover construction, performance budgets, visual acceptance checks and Blender authoring references. Runtime meshes are original procedural assets; external packs remain candidates until individually approved and recorded in the asset register.
