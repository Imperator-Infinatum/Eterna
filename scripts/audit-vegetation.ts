import * as THREE from 'three';
import { readFile } from 'node:fs/promises';
import { createOakTree, createSpruceTree } from '../src/assets/organic-trees.ts';

interface MeshReport {
  species: string;
  seed: number;
  barkVertices: number;
  barkTriangles: number;
  bounds: [number, number, number];
  yMin: number;
  yMax: number;
  invalidPositions: number;
  invalidNormals: number;
  nonDegenerateTriangles: number;
  leafInstances: number;
  foliagePrimitiveCount: number;
  leafAnchors: number;
  upperCrownInstances: number;
  occupiedCanopySectors: number;
  minFoliageY: number;
  maxFoliageY: number;
  branchOriginsBelowThreshold: number;
}

function inspectTree(species: 'oak' | 'spruce', seed: number, tree: THREE.Group): MeshReport {
  const bark = tree.children.find((child) => child.name.startsWith('Unified_')) as THREE.Mesh | undefined;
  if (!bark || !(bark.geometry instanceof THREE.BufferGeometry)) {
    throw new Error(`${species} seed ${seed}: missing unified bark mesh`);
  }
  const geometry = bark.geometry;
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const index = geometry.index;
  if (!positions || !normals || !index) throw new Error(`${species} seed ${seed}: bark mesh is missing position, normal or index data`);

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) throw new Error(`${species} seed ${seed}: bark mesh has no bounds`);

  let invalidPositions = 0;
  let invalidNormals = 0;
  for (let i = 0; i < positions.count; i++) {
    if (![positions.getX(i), positions.getY(i), positions.getZ(i)].every(Number.isFinite)) invalidPositions++;
    if (![normals.getX(i), normals.getY(i), normals.getZ(i)].every(Number.isFinite)) invalidNormals++;
  }

  let nonDegenerateTriangles = 0;
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  for (let i = 0; i + 2 < index.count; i += 3) {
    a.fromBufferAttribute(positions, index.getX(i));
    b.fromBufferAttribute(positions, index.getX(i + 1));
    c.fromBufferAttribute(positions, index.getX(i + 2));
    if (b.sub(a).cross(c.sub(a)).lengthSq() > 1e-12) nonDegenerateTriangles++;
  }

  const foliage = tree.children.find((child) => child instanceof THREE.InstancedMesh) as THREE.InstancedMesh | undefined;
  if (!foliage) throw new Error(`${species} seed ${seed}: missing instanced foliage`);
  const treeHeight = Number(tree.userData.treeHeight);
  const branchOriginHeights = Array.isArray(tree.userData.branchOriginHeights)
    ? tree.userData.branchOriginHeights as number[]
    : [];
  if (branchOriginHeights.length < 5) throw new Error(`${species} seed ${seed}: missing branch-origin metadata`);
  const lowThreshold = treeHeight * (species === 'oak' ? 0.4 : 0.25);
  const branchOriginsBelowThreshold = branchOriginHeights.filter((height) => height < lowThreshold).length;

  const matrix = new THREE.Matrix4();
  let upperCrownInstances = 0;
  let minFoliageY = Infinity;
  let maxFoliageY = -Infinity;
  const sectors = new Set<number>();
  for (let i = 0; i < foliage.count; i++) {
    foliage.getMatrixAt(i, matrix);
    const e = matrix.elements;
    const x = e[12];
    const y = e[13];
    const z = e[14];
    minFoliageY = Math.min(minFoliageY, y);
    maxFoliageY = Math.max(maxFoliageY, y);
    if (y >= treeHeight * 0.68) upperCrownInstances++;
    if (y >= treeHeight * 0.54 && Math.hypot(x, z) >= 1.15) {
      const angle = Math.atan2(z, x);
      const sector = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 8) % 8;
      sectors.add(sector);
    }
  }

  const report: MeshReport = {
    species,
    seed,
    barkVertices: positions.count,
    barkTriangles: index.count / 3,
    bounds: [
      bounds.max.x - bounds.min.x,
      bounds.max.y - bounds.min.y,
      bounds.max.z - bounds.min.z,
    ],
    yMin: bounds.min.y,
    yMax: bounds.max.y,
    invalidPositions,
    invalidNormals,
    nonDegenerateTriangles,
    leafInstances: foliage.count,
    foliagePrimitiveCount: Number(tree.userData.foliagePrimitiveCount ?? foliage.count),
    leafAnchors: Number(tree.userData.leafAnchorCount ?? 0),
    upperCrownInstances,
    occupiedCanopySectors: sectors.size,
    minFoliageY,
    maxFoliageY,
    branchOriginsBelowThreshold,
  };

  console.log(`[vegetation:audit] ${species} seed ${seed}: ${JSON.stringify(report)}`);
  if (report.barkVertices < 1000 || report.barkTriangles < 1000 || nonDegenerateTriangles < 1000) {
    throw new Error(`${species} seed ${seed}: generated bark mesh is empty or unexpectedly sparse`);
  }
  if (report.bounds[1] < 5 || report.bounds[0] < 1 || report.bounds[2] < 1) {
    throw new Error(`${species} seed ${seed}: bark mesh bounds are implausible`);
  }
  if (invalidPositions > 0 || invalidNormals > 0) {
    throw new Error(`${species} seed ${seed}: bark mesh contains non-finite vertex data`);
  }
  const minimumFoliage = species === 'oak' ? 5500 : 750;
  if (report.leafInstances < minimumFoliage) {
    throw new Error(`${species} seed ${seed}: foliage instance count is below the species budget`);
  }
  if (branchOriginsBelowThreshold > 1) {
    throw new Error(`${species} seed ${seed}: too many scaffold branches originate in the clear-bole zone`);
  }
  const minimumUpper = species === 'oak' ? 800 : 140;
  const minimumSectors = species === 'oak' ? 6 : 5;
  if (upperCrownInstances < minimumUpper || sectors.size < minimumSectors) {
    throw new Error(`${species} seed ${seed}: canopy does not adequately cover upper crown sectors`);
  }
  if (maxFoliageY < treeHeight * 0.78 || minFoliageY < 0.2) {
    throw new Error(`${species} seed ${seed}: foliage vertical coverage is implausible`);
  }
  return report;
}

const oakSeeds = [101, 173, 251, 311];
const spruceSeeds = [203, 277, 331];
const reports: MeshReport[] = [];
for (const seed of oakSeeds) reports.push(inspectTree('oak', seed, createOakTree(seed)));
for (const seed of spruceSeeds) reports.push(inspectTree('spruce', seed, createSpruceTree(seed)));

console.log(`[vegetation:audit] PASS: ${reports.length} production tree templates satisfy bark integrity, clear-bole and canopy coverage checks.`);

const requiredBarkMaps = [
  'public/assets/textures/bark/Bark012_1K_AO.jpg',
  'public/assets/textures/bark/Bark012_1K_Roughness.jpg',
  'public/assets/textures/bark/Bark012_source.json',
];
for (const path of requiredBarkMaps) {
  const file = await readFile(new URL('../' + path, import.meta.url));
  if (file.byteLength < 100) throw new Error(`Bark material asset is missing or empty: ${path}`);
  console.log(`[vegetation:audit] material asset OK: ${path} (${file.byteLength.toLocaleString()} bytes)`);
}
console.log('[vegetation:audit] PASS: CC0 bark PBR support maps are present.');
