import * as THREE from 'three';
import { createOakTree, createSpruceTree } from '../src/assets/organic-trees.ts';

interface MeshReport {
  species: string;
  barkVertices: number;
  barkTriangles: number;
  bounds: [number, number, number];
  yMin: number;
  yMax: number;
  invalidPositions: number;
  invalidNormals: number;
  nonDegenerateTriangles: number;
  leafInstances: number;
}

function inspectTree(species: 'oak' | 'spruce', tree: THREE.Group): MeshReport {
  const bark = tree.children.find((child) => child.name.startsWith('Unified_')) as THREE.Mesh | undefined;
  if (!bark || !(bark.geometry instanceof THREE.BufferGeometry)) {
    throw new Error(`${species}: missing unified bark mesh`);
  }
  const geometry = bark.geometry;
  const positions = geometry.getAttribute('position');
  const normals = geometry.getAttribute('normal');
  const index = geometry.index;
  if (!positions || !normals || !index) throw new Error(`${species}: bark mesh is missing position, normal or index data`);

  geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  if (!bounds) throw new Error(`${species}: bark mesh has no bounds`);

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

  const foliage = tree.children.find((child) => child instanceof THREE.InstancedMesh && child.name.includes('Leaves') || child instanceof THREE.InstancedMesh && child.name.includes('Needles')) as THREE.InstancedMesh | undefined;
  const report: MeshReport = {
    species,
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
    leafInstances: foliage?.count ?? 0,
  };

  console.log(`[vegetation:audit] ${species}: ${JSON.stringify(report)}`);
  if (report.barkVertices < 1000 || report.barkTriangles < 1000 || nonDegenerateTriangles < 1000) {
    throw new Error(`${species}: generated bark mesh is empty or unexpectedly sparse`);
  }
  if (report.bounds[1] < 5 || report.bounds[0] < 1 || report.bounds[2] < 1) {
    throw new Error(`${species}: bark mesh bounds are implausible`);
  }
  if (invalidPositions > 0 || invalidNormals > 0) {
    throw new Error(`${species}: bark mesh contains non-finite vertex data`);
  }
  if (report.leafInstances < 100) throw new Error(`${species}: foliage instance budget was not populated`);
  return report;
}

const oak = inspectTree('oak', createOakTree(101));
const spruce = inspectTree('spruce', createSpruceTree(203));
console.log(`[vegetation:audit] PASS: oak ${oak.barkTriangles.toLocaleString()} triangles; spruce ${spruce.barkTriangles.toLocaleString()} triangles.`);
