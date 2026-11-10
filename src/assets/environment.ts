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

function makeTrunkGeometry(seed: number, height: number, baseRadius: number, topRadius: number): THREE.BufferGeometry {
  const random = seeded(seed);
  const radial = 20;
  const rings = 24;
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const dark = new THREE.Color('#453022');
  const mid = new THREE.Color('#704c32');
  const light = new THREE.Color('#926b48');

  for (let ring = 0; ring <= rings; ring++) {
    const t = ring / rings;
    const y = t * height;
    const taper = THREE.MathUtils.lerp(baseRadius, topRadius, Math.pow(t, 0.78));
    const flare = t < 0.22 ? (1 - t / 0.22) * 0.21 : 0;
    const centerX = Math.sin(t * 2.4 + seed) * 0.12 * t;
    const centerZ = Math.cos(t * 1.7 + seed * 0.17) * 0.09 * t;
    for (let side = 0; side <= radial; side++) {
      const angle = (side / radial) * Math.PI * 2;
      const grain = Math.sin(angle * 6 + ring * 0.31 + seed) * 0.045
        + Math.sin(angle * 13 - ring * 0.16) * 0.018
        + (random() - 0.5) * 0.018;
      const radius = taper + flare + grain;
      positions.push(centerX + Math.cos(angle) * radius, y, centerZ + Math.sin(angle) * radius);
      const stripe = 0.5 + 0.5 * Math.sin(angle * 7 + seed * 0.4);
      const vertical = THREE.MathUtils.smoothstep(t, 0.05, 0.72) * 0.18;
      const color = dark.clone().lerp(mid, 0.42 + stripe * 0.35 + vertical).lerp(light, Math.max(0, grain) * 1.8);
      colors.push(color.r, color.g, color.b);
    }
  }

  for (let ring = 0; ring < rings; ring++) {
    for (let side = 0; side < radial; side++) {
      const a = ring * (radial + 1) + side;
      const b = a + radial + 1;
      indices.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function makeCanopyGeometry(seed: number, narrow = false): THREE.BufferGeometry {
  const random = seeded(seed);
  const source = new THREE.IcosahedronGeometry(1, 2);
  const sourcePositions = source.getAttribute('position');
  const sourceIndex = source.getIndex();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const deep = new THREE.Color('#274d30');
  const forest = new THREE.Color('#3e6b3b');
  const sunlit = new THREE.Color('#75964d');
  const clumpCount = narrow ? 18 : 25;

  for (let clump = 0; clump < clumpCount; clump++) {
    const angle = random() * Math.PI * 2;
    const heightProgress = random();
    const height = 5.0 + heightProgress * (narrow ? 4.5 : 2.7);
    const radius = random() * (narrow ? (2.0 * (1 - heightProgress) + 0.18) : 2.35);
    const center = new THREE.Vector3(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    const scaleX = (narrow ? 0.85 : 1.0) * (0.85 + random() * 0.5);
    const scaleY = 0.78 + random() * 0.52;
    const scaleZ = (narrow ? 0.85 : 1.05) * (0.8 + random() * 0.5);
    const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(random() * 0.35, random() * 6.28, random() * 0.35));
    const offset = positions.length / 3;

    for (let i = 0; i < sourcePositions.count; i++) {
      const vertex = new THREE.Vector3(
        sourcePositions.getX(i) * scaleX,
        sourcePositions.getY(i) * scaleY,
        sourcePositions.getZ(i) * scaleZ,
      );
      vertex.x *= 1 + Math.sin(vertex.y * 3.5 + angle) * 0.07;
      vertex.z *= 1 + Math.cos(vertex.y * 4.0 + angle) * 0.06;
      vertex.applyQuaternion(rotation).add(center);
      positions.push(vertex.x, vertex.y, vertex.z);
      const upward = THREE.MathUtils.clamp(sourcePositions.getY(i) * 0.55 + 0.45 + random() * 0.12, 0, 1);
      const color = deep.clone().lerp(forest, 0.45 + random() * 0.25).lerp(sunlit, upward * 0.46);
      colors.push(color.r, color.g, color.b);
    }

    if (sourceIndex) {
      for (let i = 0; i < sourceIndex.count; i++) indices.push(sourceIndex.getX(i) + offset);
    }
  }

  source.dispose();
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

function setInstanceLine(mesh: THREE.InstancedMesh, index: number, start: THREE.Vector3, end: THREE.Vector3): void {
  const direction = end.clone().sub(start);
  const dummy = new THREE.Object3D();
  dummy.position.copy(start).add(end).multiplyScalar(0.5);
  dummy.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  dummy.scale.set(1, direction.length(), 1);
  dummy.updateMatrix();
  mesh.setMatrixAt(index, dummy.matrix);
}

export function createOakTree(seed = 101): THREE.Group {
  const random = seeded(seed);
  const tree = new THREE.Group();
  tree.name = 'Eterna_Oak_01';
  addMesh(tree, makeTrunkGeometry(seed, 6.2, 0.62, 0.19), palette.bark);

  const branchMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.035, 0.19, 1, 9, 2), palette.barkLight, 7);
  const rootMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.055, 0.25, 1, 9, 2), palette.barkLight, 6);
  for (let i = 0; i < 7; i++) {
    const angle = (i / 7) * Math.PI * 2 + random() * 0.35;
    const start = new THREE.Vector3(Math.cos(angle) * 0.12, 3.25 + random() * 1.65, Math.sin(angle) * 0.12);
    const end = new THREE.Vector3(Math.cos(angle) * (1.9 + random() * 0.65), 5.1 + random() * 1.45, Math.sin(angle) * (1.9 + random() * 0.65));
    setInstanceLine(branchMesh, i, start, end);
  }
  branchMesh.instanceMatrix.needsUpdate = true;
  branchMesh.castShadow = true;
  branchMesh.receiveShadow = true;
  tree.add(branchMesh);

  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    const start = new THREE.Vector3(0, 0.78, 0);
    const end = new THREE.Vector3(Math.cos(angle) * (0.82 + random() * 0.3), 0.08, Math.sin(angle) * (0.82 + random() * 0.3));
    setInstanceLine(rootMesh, i, start, end);
  }
  rootMesh.instanceMatrix.needsUpdate = true;
  rootMesh.castShadow = true;
  rootMesh.receiveShadow = true;
  tree.add(rootMesh);

  const crown = addMesh(tree, makeCanopyGeometry(seed), palette.leaf);
  crown.name = 'Layered_Oak_Crown';
  tree.userData.assetId = 'eterna.environment.willowmere.oak.01';
  tree.userData.authoring = 'Original Eterna procedural mesh asset';
  return tree;
}

export function createSpruceTree(seed = 203): THREE.Group {
  const tree = new THREE.Group();
  tree.name = 'Eterna_Spruce_01';
  addMesh(tree, makeTrunkGeometry(seed, 10.8, 0.43, 0.08), palette.bark);
  const canopy = addMesh(tree, makeCanopyGeometry(seed, true), palette.pine);
  canopy.name = 'Layered_Spruce_Crown';
  tree.userData.assetId = 'eterna.environment.willowmere.spruce.01';
  tree.userData.authoring = 'Original Eterna procedural mesh asset';
  return tree;
}

function roofTileRows(parent: THREE.Object3D, side: -1 | 1, seed: number): void {
  const random = seeded(seed);
  const tileGeometry = new THREE.BoxGeometry(0.52, 0.085, 0.46);
  const count = 7 * 13;
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9 });
  const tiles = new THREE.InstancedMesh(tileGeometry, material, count);
  tiles.castShadow = true;
  tiles.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const baseZ = -3.34;
  let index = 0;

  for (let row = 0; row < 7; row++) {
    for (let column = 0; column < 13; column++) {
      const xAbs = 0.42 + row * 0.59;
      const x = side * xAbs;
      const y = 6.38 - xAbs * 0.49;
      const z = baseZ + column * 0.56 + (row % 2) * 0.18;
      dummy.position.set(x, y + 0.10, z);
      dummy.rotation.set(0, 0, side * -0.455);
      dummy.updateMatrix();
      tiles.setMatrixAt(index, dummy.matrix);
      const shade = 0.84 + random() * 0.28;
      tiles.setColorAt(index, new THREE.Color().setRGB(0.56 * shade, 0.28 * shade, 0.20 * shade));
      index++;
    }
  }
  tiles.count = index;
  tiles.instanceMatrix.needsUpdate = true;
  if (tiles.instanceColor) tiles.instanceColor.needsUpdate = true;
  parent.add(tiles);
}

export function createWillowmereCottage(seed = 311): THREE.Group {
  const random = seeded(seed);
  const house = new THREE.Group();
  house.name = 'Eterna_Willowmere_Timber_Cottage';

  const foundation = addMesh(house, new THREE.BoxGeometry(7.9, 0.78, 6.5), palette.stone, new THREE.Vector3(0, 0.39, 0));
  foundation.castShadow = true;

  const stoneColors = ['#777568', '#8e8978', '#a19a82', '#6d6c61'];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 9; i++) {
      const stone = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.42 + random() * 0.15, 1),
        new THREE.MeshStandardMaterial({ color: stoneColors[Math.floor(random() * stoneColors.length)], roughness: 0.98 }),
      );
      stone.position.set(-3.55 + i * 0.88, 0.34 + row * 0.32, 3.26 + (row % 2) * 0.04);
      stone.scale.set(1.08, 0.55, 0.72);
      stone.castShadow = true;
      stone.receiveShadow = true;
      house.add(stone);
    }
  }

  addMesh(house, new THREE.BoxGeometry(7.35, 3.85, 5.95), palette.plaster, new THREE.Vector3(0, 2.68, 0));

  const gable = new THREE.BufferGeometry();
  gable.setAttribute('position', new THREE.Float32BufferAttribute([
    -3.68, 4.58, -2.98, 3.68, 4.58, -2.98, 0, 6.55, -2.98,
    3.68, 4.58, 2.98, -3.68, 4.58, 2.98, 0, 6.55, 2.98,
  ], 3));
  gable.setIndex([0, 1, 2, 3, 4, 5]);
  gable.computeVertexNormals();
  addMesh(house, gable, palette.plaster);

  const roofLeft = addMesh(house, new THREE.BoxGeometry(5.25, 0.22, 7.0), palette.roof, new THREE.Vector3(-2.32, 5.38, 0));
  roofLeft.rotation.z = 0.455;
  const roofRight = addMesh(house, new THREE.BoxGeometry(5.25, 0.22, 7.0), palette.roof, new THREE.Vector3(2.32, 5.38, 0));
  roofRight.rotation.z = -0.455;
  roofTileRows(house, -1, seed + 1);
  roofTileRows(house, 1, seed + 2);

  const beamPositions: Array<[number, number, number, number, number, number]> = [
    [-3.66, 2.65, 3.08, 0.23, 4.05, 0.22], [3.66, 2.65, 3.08, 0.23, 4.05, 0.22],
    [-2.45, 2.65, 3.08, 0.17, 4.05, 0.18], [2.45, 2.65, 3.08, 0.17, 4.05, 0.18],
    [0, 2.65, 3.08, 0.17, 4.05, 0.18],
    [0, 4.54, 3.08, 7.42, 0.2, 0.2],
    [-1.82, 4.15, 3.12, 3.6, 0.15, 0.16],
    [1.82, 4.15, 3.12, 3.6, 0.15, 0.16],
  ];
  for (const [x, y, z, sx, sy, sz] of beamPositions) {
    addMesh(house, new THREE.BoxGeometry(sx, sy, sz), palette.timber, new THREE.Vector3(x, y, z));
  }

  for (const side of [-1, 1]) {
    const windowX = side * 2.05;
    addMesh(house, new THREE.BoxGeometry(1.28, 1.42, 0.14), palette.timber, new THREE.Vector3(windowX, 2.95, 3.09));
    addMesh(house, new THREE.BoxGeometry(0.98, 1.12, 0.08), palette.glass, new THREE.Vector3(windowX, 2.98, 3.19));
    addMesh(house, new THREE.BoxGeometry(0.13, 1.12, 0.11), palette.timber, new THREE.Vector3(windowX, 2.98, 3.25));
    addMesh(house, new THREE.BoxGeometry(0.98, 0.13, 0.11), palette.timber, new THREE.Vector3(windowX, 2.98, 3.25));
    for (const shutter of [-1, 1]) {
      addMesh(house, new THREE.BoxGeometry(0.29, 1.2, 0.12), palette.roofAccent, new THREE.Vector3(windowX + shutter * 0.78, 2.95, 3.17));
      for (let slat = 0; slat < 4; slat++) {
        addMesh(house, new THREE.BoxGeometry(0.25, 0.045, 0.14), palette.timber, new THREE.Vector3(windowX + shutter * 0.78, 2.53 + slat * 0.28, 3.25));
      }
    }
  }

  addMesh(house, new THREE.BoxGeometry(1.42, 2.55, 0.23), palette.timber, new THREE.Vector3(0, 1.75, 3.1));
  addMesh(house, new THREE.BoxGeometry(1.12, 2.25, 0.08), new THREE.MeshStandardMaterial({ color: '#76492d', roughness: 0.88 }), new THREE.Vector3(0, 1.72, 3.24));
  addMesh(house, new THREE.SphereGeometry(0.08, 12, 10), palette.iron, new THREE.Vector3(0.43, 1.8, 3.32));
  addMesh(house, new THREE.BoxGeometry(1.72, 0.16, 0.32), palette.timber, new THREE.Vector3(0, 3.05, 3.18));

  for (const side of [-1, 1]) {
    const rafter = addMesh(house, new THREE.BoxGeometry(0.18, 3.4, 0.2), palette.timber, new THREE.Vector3(side * 2.0, 5.3, -3.42));
    rafter.rotation.z = side * 0.455;
    const endRafter = addMesh(house, new THREE.BoxGeometry(0.18, 3.4, 0.2), palette.timber, new THREE.Vector3(side * 2.0, 5.3, 3.42));
    endRafter.rotation.z = side * 0.455;
  }

  const chimney = addMesh(house, new THREE.BoxGeometry(0.78, 2.15, 0.82), palette.stone, new THREE.Vector3(2.35, 6.45, -1.55));
  chimney.rotation.z = 0.03;
  addMesh(house, new THREE.BoxGeometry(1.0, 0.18, 1.02), palette.timber, new THREE.Vector3(2.35, 7.52, -1.55));

  const lantern = new THREE.Group();
  lantern.position.set(-1.25, 3.35, 3.28);
  addMesh(lantern, new THREE.BoxGeometry(0.28, 0.48, 0.24), palette.warmGlow, new THREE.Vector3(0, 0, 0));
  addMesh(lantern, new THREE.BoxGeometry(0.42, 0.08, 0.38), palette.iron, new THREE.Vector3(0, 0.28, 0));
  addMesh(lantern, new THREE.ConeGeometry(0.25, 0.22, 4), palette.iron, new THREE.Vector3(0, 0.46, 0));
  house.add(lantern);

  house.userData.assetId = 'eterna.environment.willowmere.cottage.01';
  house.userData.authoring = 'Original Eterna procedural mesh asset';
  return house;
}

export function createVillageWell(seed = 419): THREE.Group {
  const random = seeded(seed);
  const well = new THREE.Group();
  well.name = 'Eterna_Willowmere_Well';
  const stoneMaterial = new THREE.MeshStandardMaterial({ color: '#918c79', roughness: 0.98, side: THREE.DoubleSide });
  const timberMaterial = new THREE.MeshStandardMaterial({ color: '#563822', roughness: 0.92 });
  const waterMaterial = new THREE.MeshStandardMaterial({ color: '#477f7b', roughness: 0.3, metalness: 0.08 });
  addMesh(well, new THREE.CylinderGeometry(1.05, 1.18, 0.85, 14, 1, true), stoneMaterial, new THREE.Vector3(0, 0.65, 0));
  addMesh(well, new THREE.CircleGeometry(0.98, 32), waterMaterial, new THREE.Vector3(0, 0.69, 0), false).rotation.x = -Math.PI / 2;
  for (const side of [-1, 1]) {
    addMesh(well, new THREE.BoxGeometry(0.18, 2.45, 0.2), timberMaterial, new THREE.Vector3(side * 0.9, 1.9, 0));
  }
  addMesh(well, new THREE.BoxGeometry(2.35, 0.16, 0.22), timberMaterial, new THREE.Vector3(0, 3.0, 0));
  const roof = addMesh(well, new THREE.ConeGeometry(1.5, 1.15, 4), new THREE.MeshStandardMaterial({ color: '#6e3f31', roughness: 0.92 }), new THREE.Vector3(0, 3.55, 0));
  roof.rotation.y = Math.PI / 4;
  const roller = addMesh(well, new THREE.CylinderGeometry(0.11, 0.11, 1.8, 10), timberMaterial, new THREE.Vector3(0, 1.9, 0));
  roller.rotation.z = Math.PI / 2;
  const bucket = addMesh(well, new THREE.CylinderGeometry(0.24, 0.18, 0.36, 10), timberMaterial, new THREE.Vector3(0, 1.05, 0.52 + random() * 0.06));
  bucket.rotation.x = 0.08;
  well.userData.assetId = 'eterna.environment.willowmere.well.01';
  return well;
}

export function createFenceRun(length = 8): THREE.Group {
  const fence = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#67452a', roughness: 0.95 });
  const posts = Math.ceil(length / 2.2);
  for (let i = 0; i <= posts; i++) {
    const x = (i / posts - 0.5) * length;
    addMesh(fence, new THREE.BoxGeometry(0.2, 1.35, 0.2), wood, new THREE.Vector3(x, 0.68, 0));
    addMesh(fence, new THREE.ConeGeometry(0.14, 0.2, 4), wood, new THREE.Vector3(x, 1.45, 0));
  }
  for (const y of [0.48, 1.04]) {
    addMesh(fence, new THREE.BoxGeometry(length, 0.14, 0.14), wood, new THREE.Vector3(0, y, 0));
  }
  return fence;
}

export function createLanternPost(): THREE.Group {
  const post = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#513820', roughness: 0.93 });
  addMesh(post, new THREE.CylinderGeometry(0.1, 0.17, 3.3, 10), wood, new THREE.Vector3(0, 1.65, 0));
  addMesh(post, new THREE.BoxGeometry(0.9, 0.12, 0.12), wood, new THREE.Vector3(0.3, 3.05, 0));
  addMesh(post, new THREE.BoxGeometry(0.37, 0.48, 0.34), palette.warmGlow, new THREE.Vector3(0.67, 2.78, 0));
  addMesh(post, new THREE.ConeGeometry(0.34, 0.3, 4), palette.iron, new THREE.Vector3(0.67, 3.18, 0));
  post.userData.assetId = 'eterna.environment.willowmere.lantern-post.01';
  return post;
}

export function createMossyBoulder(seed = 503, radius = 1): THREE.Mesh {
  const random = seeded(seed);
  const geometry = new THREE.IcosahedronGeometry(radius, 2);
  const positions = geometry.getAttribute('position');
  const colors: number[] = [];
  const stone = new THREE.Color('#77786b');
  const warm = new THREE.Color('#a09a80');
  const moss = new THREE.Color('#506b3d');
  for (let i = 0; i < positions.count; i++) {
    const y = positions.getY(i) / radius;
    const variation = 0.84 + random() * 0.22;
    const base = stone.clone().lerp(warm, Math.max(0, y) * 0.45).multiplyScalar(variation);
    if (y > 0.45 && random() > 0.5) base.lerp(moss, random() * 0.55);
    colors.push(base.r, base.g, base.b);
  }
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.98, vertexColors: true });
  const rock = new THREE.Mesh(geometry, material);
  rock.castShadow = true;
  rock.receiveShadow = true;
  rock.rotation.set(random() * 0.4, random() * Math.PI * 2, random() * 0.3);
  rock.scale.set(1 + random() * 0.22, 0.72 + random() * 0.36, 0.9 + random() * 0.25);
  rock.userData.assetId = 'eterna.environment.willowmere.mossy-boulder.01';
  return rock;
}
