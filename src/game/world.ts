import * as THREE from 'three';
import type { WorldLandmark, WorldScene } from './types';
import {
  createFenceRun,
  createLanternPost,
  createMossyBoulder,
  createOakTree,
  createSpruceTree,
  createVillageWell,
  createWillowmereCottage,
} from '../assets/environment';

const HALF = 48;

function randomSource(seed: number): () => number {
  let value = seed >>> 0;
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

export function terrainHeight(x: number, z: number): number {
  return 0.22 * Math.sin(x * 0.105) * Math.cos(z * 0.09)
    + 0.12 * Math.sin(z * 0.19 + x * 0.07)
    + 0.055 * Math.cos(x * 0.31 - z * 0.18);
}

function makeTerrain(): THREE.Mesh<THREE.BufferGeometry, THREE.MeshStandardMaterial> {
  const segments = 150;
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const low = new THREE.Color('#4d6339');
  const mid = new THREE.Color('#6f8b4b');
  const high = new THREE.Color('#8e9a60');
  const edge = new THREE.Color('#3d5136');

  for (let iz = 0; iz <= segments; iz++) {
    for (let ix = 0; ix <= segments; ix++) {
      const x = (ix / segments) * HALF * 2 - HALF;
      const z = (iz / segments) * HALF * 2 - HALF;
      const height = terrainHeight(x, z);
      positions.push(x, height, z);

      const blend = THREE.MathUtils.smoothstep(height, -0.18, 0.22);
      const color = low.clone()
        .lerp(mid, blend)
        .lerp(high, THREE.MathUtils.smoothstep(height, 0.19, 0.39) * 0.35);

      const perimeter = THREE.MathUtils.smoothstep(Math.max(Math.abs(x), Math.abs(z)), 38, 48);
      const patch = 0.025 * Math.sin(x * 0.38) * Math.cos(z * 0.31);
      color.lerp(edge, perimeter * 0.65);
      color.multiplyScalar(1 + patch);
      colors.push(color.r, color.g, color.b);
      uvs.push((ix / segments) * 16, (iz / segments) * 16);

      if (ix < segments && iz < segments) {
        const a = iz * (segments + 1) + ix;
        const b = a + 1;
        const c = a + segments + 1;
        const d = c + 1;
        indices.push(a, c, b, b, c, d);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();

  const terrain = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.96 }),
  );
  terrain.receiveShadow = true;
  terrain.name = 'Eterna_Terrain_Willowmere';
  return terrain;
}

function createRoadRibbon(scene: THREE.Scene): void {
  const controlPoints = [
    new THREE.Vector3(-1.2, 0, -48),
    new THREE.Vector3(-1.3, 0, -34),
    new THREE.Vector3(-0.5, 0, -22),
    new THREE.Vector3(0.8, 0, -12),
    new THREE.Vector3(2.0, 0, -2),
    new THREE.Vector3(1.5, 0, 8),
    new THREE.Vector3(0.2, 0, 18),
    new THREE.Vector3(-1.2, 0, 29),
    new THREE.Vector3(-3.8, 0, 48),
  ];
  const curve = new THREE.CatmullRomCurve3(controlPoints, false, 'catmullrom', 0.45);
  const segments = 150;
  const halfWidth = 1.95;
  const positions: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const roadDark = new THREE.Color('#806244');
  const roadLight = new THREE.Color('#a4875e');

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const point = curve.getPointAt(t);
    const tangent = curve.getTangentAt(t).normalize();
    const side = new THREE.Vector3(tangent.z, 0, -tangent.x).normalize();
    for (let edge = 0; edge < 2; edge++) {
      const direction = edge === 0 ? -1 : 1;
      const x = point.x + side.x * halfWidth * direction;
      const z = point.z + side.z * halfWidth * direction;
      const edgeFade = edge === 0 ? 0.92 : 1.0;
      positions.push(x, terrainHeight(x, z) + 0.075, z);
      const color = roadDark.clone().lerp(roadLight, 0.38 + 0.14 * Math.sin(t * 80 + edge));
      color.multiplyScalar(edgeFade);
      colors.push(color.r, color.g, color.b);
      uvs.push(edge, t * 18);
    }
    if (i < segments) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const road = new THREE.Mesh(
    geometry,
    new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, side: THREE.DoubleSide }),
  );
  road.receiveShadow = true;
  road.name = 'Kingroad_Dirt_Ribbon';
  scene.add(road);
}

function createPond(scene: THREE.Scene, x: number, z: number): THREE.Mesh {
  const y = terrainHeight(x, z) + 0.12;
  const bankMaterial = new THREE.MeshStandardMaterial({ color: '#8c8968', roughness: 1 });
  const waterMaterial = new THREE.MeshPhysicalMaterial({
    color: '#477f7a',
    roughness: 0.19,
    metalness: 0.1,
    clearcoat: 0.86,
    clearcoatRoughness: 0.18,
    transparent: true,
    opacity: 0.93,
  });

  const bank = new THREE.Mesh(new THREE.CircleGeometry(7.35, 72), bankMaterial);
  bank.rotation.x = -Math.PI / 2;
  bank.position.set(x, y - 0.055, z);
  bank.receiveShadow = true;
  scene.add(bank);

  const water = new THREE.Mesh(new THREE.CircleGeometry(6.72, 72), waterMaterial);
  water.rotation.x = -Math.PI / 2;
  water.position.set(x, y + 0.025, z);
  water.name = 'Mirror_Pool_Water';
  scene.add(water);

  const rippleMaterial = new THREE.MeshBasicMaterial({
    color: '#c5d9bd',
    transparent: true,
    opacity: 0.13,
    side: THREE.DoubleSide,
    depthWrite: false,
  });
  for (let i = 0; i < 4; i++) {
    const ripple = new THREE.Mesh(
      new THREE.RingGeometry(1.55 + i * 1.2, 1.6 + i * 1.2, 72),
      rippleMaterial,
    );
    ripple.rotation.x = -Math.PI / 2;
    ripple.position.set(x + (i - 1.5) * 0.48, y + 0.055 + i * 0.002, z + (i % 2 ? 0.65 : -0.55));
    scene.add(ripple);
  }
  return water;
}

function addAssetAt(
  scene: THREE.Scene,
  template: THREE.Object3D,
  x: number,
  z: number,
  scale: number,
  rotation: number,
): THREE.Object3D {
  const instance = template.clone(true);
  instance.position.set(x, terrainHeight(x, z), z);
  instance.scale.setScalar(scale);
  instance.rotation.y = rotation;
  scene.add(instance);
  return instance;
}

function placeVegetation(scene: THREE.Scene, random: () => number): void {
  const oakTemplates = [createOakTree(101), createOakTree(117), createOakTree(139)];
  const spruceTemplates = [createSpruceTree(203), createSpruceTree(227)];
  let placed = 0;
  let attempts = 0;

  while (placed < 78 && attempts < 600) {
    attempts++;
    const x = random() * 88 - 44;
    const z = random() * 88 - 44;
    const roadCenter = 0.1 + z * -0.055;
    const roadClear = Math.abs(x - roadCenter) < 4.6;
    const villageClear = x > -18 && x < 21 && z > -39 && z < -11;
    const pondClear = Math.hypot(x + 20.5, z + 13.4) < 10.5;
    const spawnClear = Math.hypot(x, z) < 5.8;
    if (roadClear || villageClear || pondClear || spawnClear) continue;

    const useSpruce = random() > 0.61;
    const templates = useSpruce ? spruceTemplates : oakTemplates;
    const template = templates[Math.floor(random() * templates.length)];
    const scale = useSpruce ? 0.84 + random() * 0.32 : 0.78 + random() * 0.38;
    addAssetAt(scene, template, x, z, scale, random() * Math.PI * 2);
    placed++;
  }
}

function placeVillageProps(scene: THREE.Scene, random: () => number): void {
  const well = createVillageWell(419);
  well.position.set(1.5, terrainHeight(1.5, -24) - 0.03, -24);
  well.scale.setScalar(0.88);
  scene.add(well);

  const fenceA = createFenceRun(8.5);
  fenceA.position.set(-15.5, terrainHeight(-15.5, -23), -23);
  fenceA.rotation.y = 0.22;
  scene.add(fenceA);

  const fenceB = createFenceRun(6.2);
  fenceB.position.set(17, terrainHeight(17, -28), -28);
  fenceB.rotation.y = -0.12;
  scene.add(fenceB);

  const lanternTemplate = createLanternPost();
  for (const [x, z, rotation] of [[-3.4, -8, 0.1], [2.8, 10, -0.08], [-1.7, 25, 0.12]] as const) {
    const lantern = lanternTemplate.clone(true);
    lantern.position.set(x, terrainHeight(x, z), z);
    lantern.rotation.y = rotation;
    scene.add(lantern);
  }

  const boulderTemplates = [
    createMossyBoulder(503, 0.9),
    createMossyBoulder(509, 1.1),
    createMossyBoulder(521, 0.65),
    createMossyBoulder(523, 0.8),
  ];
  for (let i = 0; i < 22; i++) {
    const usePond = random() > 0.38;
    let x: number;
    let z: number;
    if (usePond) {
      const angle = random() * Math.PI * 2;
      const radius = 7.1 + random() * 1.8;
      x = -20.5 + Math.cos(angle) * radius;
      z = -13.4 + Math.sin(angle) * radius;
    } else {
      x = random() * 76 - 38;
      z = random() * 76 - 38;
    }
    const template = boulderTemplates[Math.floor(random() * boulderTemplates.length)];
    const rock = template.clone(true);
    rock.position.set(x, terrainHeight(x, z) + 0.15, z);
    const scale = 0.7 + random() * 0.55;
    rock.scale.multiplyScalar(scale);
    scene.add(rock);
  }
}

export function createWorld(): WorldScene {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b8c3a7');
  scene.fog = new THREE.FogExp2('#b8c3a7', 0.0082);

  const hemisphere = new THREE.HemisphereLight('#edf0d8', '#46573b', 2.0);
  scene.add(hemisphere);

  const sunlight = new THREE.DirectionalLight('#ffe2b0', 3.0);
  sunlight.position.set(-28, 48, 22);
  sunlight.castShadow = true;
  sunlight.shadow.mapSize.set(2048, 2048);
  sunlight.shadow.camera.left = -56;
  sunlight.shadow.camera.right = 56;
  sunlight.shadow.camera.top = 56;
  sunlight.shadow.camera.bottom = -56;
  sunlight.shadow.bias = -0.0002;
  scene.add(sunlight);

  const fill = new THREE.DirectionalLight('#b9d8d9', 0.72);
  fill.position.set(30, 18, -35);
  scene.add(fill);

  const terrain = makeTerrain();
  scene.add(terrain);
  createRoadRibbon(scene);

  const cottagePlacements: Array<[number, number, number, number]> = [
    [-10.5, -25.5, 0.94, 0.12],
    [9.0, -32.0, 0.82, -0.24],
    [15.0, -17.5, 0.88, 0.42],
  ];
  for (let i = 0; i < cottagePlacements.length; i++) {
    const [x, z, scale, rotation] = cottagePlacements[i];
    const cottage = createWillowmereCottage(311 + i * 17);
    cottage.position.set(x, terrainHeight(x, z) - 0.03, z);
    cottage.scale.setScalar(scale);
    cottage.rotation.y = rotation;
    scene.add(cottage);
  }

  const water = createPond(scene, -20.5, -13.4);
  const random = randomSource(0xE7E2A);
  placeVegetation(scene, random);
  placeVillageProps(scene, random);

  const landmarks: WorldLandmark[] = [
    { name: 'Willowmere', x: 0, z: -26, kind: 'camp' },
    { name: 'Mirror Pool', x: -20.5, z: -13.4, kind: 'water' },
    { name: 'Old Watch', x: 26, z: 25, kind: 'ruin' },
    { name: 'Kingroad', x: 0, z: 0, kind: 'road' },
  ];

  const ruinMaterial = new THREE.MeshStandardMaterial({ color: '#a19a84', roughness: 0.98 });
  for (const x of [23, 28, 33]) {
    const pillar = new THREE.Mesh(new THREE.BoxGeometry(1.1, 7, 1.1), ruinMaterial);
    pillar.position.set(x, terrainHeight(x, 25) + 3.5, 25);
    pillar.rotation.z = (x - 28) * 0.018;
    pillar.castShadow = true;
    pillar.receiveShadow = true;
    scene.add(pillar);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(11, 0.62, 0.72), ruinMaterial);
  lintel.position.set(28, terrainHeight(28, 25) + 7.1, 25);
  lintel.rotation.z = 0.015;
  lintel.castShadow = true;
  lintel.receiveShadow = true;
  scene.add(lintel);

  const brokenColumn = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.62, 2.2, 10), ruinMaterial);
  brokenColumn.position.set(35.5, terrainHeight(35.5, 26) + 1.05, 26);
  brokenColumn.rotation.z = 0.26;
  brokenColumn.castShadow = true;
  scene.add(brokenColumn);

  const oldWatchBrazier = new THREE.Group();
  const brazierStone = new THREE.MeshStandardMaterial({ color: '#8f876f', roughness: 0.98 });
  const brazierMetal = new THREE.MeshStandardMaterial({ color: '#555c58', metalness: 0.48, roughness: 0.5 });
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.52, 0.7, 0.58, 9), brazierStone);
  base.position.y = 0.29;
  oldWatchBrazier.add(base);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.3, 8), brazierMetal);
  stem.position.y = 1.17;
  oldWatchBrazier.add(stem);
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.17, 0.45, 8, 1, true), brazierMetal);
  bowl.position.y = 1.9;
  oldWatchBrazier.add(bowl);
  const flame = new THREE.Mesh(
    new THREE.ConeGeometry(0.22, 0.75, 7),
    new THREE.MeshBasicMaterial({ color: '#f4a446' }),
  );
  flame.position.y = 2.38;
  oldWatchBrazier.add(flame);
  oldWatchBrazier.position.set(28, terrainHeight(28, 22) - 0.02, 22);
  scene.add(oldWatchBrazier);

  return {
    scene,
    terrain,
    landmarks,
    heightAt: terrainHeight,
    update(time: number) {
      water.position.y = terrainHeight(-20.5, -13.4) + 0.12 + Math.sin(time * 0.0007) * 0.018;
      flame.scale.y = 0.92 + Math.sin(time * 0.012) * 0.12;
      flame.rotation.y = Math.sin(time * 0.009) * 0.18;
    },
  };
}
