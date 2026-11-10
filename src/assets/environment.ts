import * as THREE from 'three';

export interface EnvironmentPalette {
  bark: THREE.MeshStandardMaterial;
  barkLight: THREE.MeshStandardMaterial;
  leaf: THREE.MeshStandardMaterial;
  pine: THREE.MeshStandardMaterial;
  plaster: THREE.MeshStandardMaterial;
  timber: THREE.MeshStandardMaterial;
  stone: THREE.MeshStandardMaterial;
  roof: THREE.MeshStandardMaterial;
  roofAccent: THREE.MeshStandardMaterial;
  iron: THREE.MeshStandardMaterial;
  glass: THREE.MeshStandardMaterial;
  warmGlow: THREE.MeshStandardMaterial;
}

function createPalette(): EnvironmentPalette {
  return {
    bark: new THREE.MeshStandardMaterial({ color: '#62442d', roughness: 0.94, vertexColors: true }),
    barkLight: new THREE.MeshStandardMaterial({ color: '#876044', roughness: 0.92 }),
    leaf: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.91, vertexColors: true }),
    pine: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.94, vertexColors: true }),
    plaster: new THREE.MeshStandardMaterial({ color: '#c0aa7e', roughness: 0.96 }),
    timber: new THREE.MeshStandardMaterial({ color: '#50331f', roughness: 0.9 }),
    stone: new THREE.MeshStandardMaterial({ color: '#8c8876', roughness: 0.98 }),
    roof: new THREE.MeshStandardMaterial({ color: '#714235', roughness: 0.9 }),
    roofAccent: new THREE.MeshStandardMaterial({ color: '#9a5b42', roughness: 0.88 }),
    iron: new THREE.MeshStandardMaterial({ color: '#59615d', metalness: 0.58, roughness: 0.48 }),
    glass: new THREE.MeshStandardMaterial({ color: '#4f7c80', emissive: '#1c3733', emissiveIntensity: 0.35, roughness: 0.3 }),
    warmGlow: new THREE.MeshStandardMaterial({ color: '#f4b957', emissive: '#ff9c36', emissiveIntensity: 2.2, roughness: 0.35 }),
  };
}

const palette = createPalette();

function addMesh(
  parent: THREE.Object3D,
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  position = new THREE.Vector3(),
  castShadow = true,
): THREE.Mesh {
  const object = new THREE.Mesh(geometry, material);
  object.position.copy(position);
  object.castShadow = castShadow;
  object.receiveShadow = true;
  parent.add(object);
  return object;
}

function seeded(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}


