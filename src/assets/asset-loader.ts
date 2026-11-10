import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export type AssetKind = 'procedural' | 'external';

export interface AssetRecord {
  id: string;
  name: string;
  kind: AssetKind;
  creator: string;
  licence: string;
  status: 'approved' | 'candidate' | 'research-only';
  sourceUrl?: string;
  runtimePath?: string;
  authoringPath?: string;
  attribution?: string;
  notes?: string;
}

export interface AssetManifest {
  schemaVersion: number;
  project: string;
  assets: AssetRecord[];
  externalCandidates: AssetRecord[];
}

const gltfLoader = new GLTFLoader();
let manifestPromise: Promise<AssetManifest> | undefined;

export function loadAssetManifest(): Promise<AssetManifest> {
  manifestPromise ??= fetch('/assets/manifest.json')
    .then(async (response) => {
      if (!response.ok) throw new Error(`Unable to load asset manifest: HTTP ${response.status}`);
      const manifest = (await response.json()) as AssetManifest;
      if (manifest.project !== 'Eterna' || !Array.isArray(manifest.assets)) {
        throw new Error('Eterna asset manifest is malformed.');
      }
      return manifest;
    })
    .catch((error: unknown) => {
      manifestPromise = undefined;
      throw error;
    });
  return manifestPromise;
}

export async function loadGLB(url: string): Promise<THREE.Group> {
  const gltf = await gltfLoader.loadAsync(url);
  const root = gltf.scene;
  root.name ||= url.split('/').pop() || 'ImportedGLB';
  root.traverse((node) => {
    if (!(node instanceof THREE.Mesh)) return;
    node.castShadow = true;
    node.receiveShadow = true;
    node.frustumCulled = true;
    node.geometry.computeBoundingSphere();
  });
  root.updateMatrixWorld(true);
  return root;
}

export function cloneModel(source: THREE.Object3D): THREE.Object3D {
  return source.clone(true);
}
