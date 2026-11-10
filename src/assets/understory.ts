import * as THREE from 'three';

const grassWindTime = { value: 0 };

export function updateUnderstoryWind(time: number): void {
  grassWindTime.value = time;
}

function createGrassMaterial(): THREE.MeshStandardMaterial {
  const material = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, roughness: 0.96 });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.eternaGrassWindTime = grassWindTime;
    shader.vertexShader = shader.vertexShader.replace(
      '#include <common>',
      '#include <common>\nuniform float eternaGrassWindTime;',
    );
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      '#include <begin_vertex>\n#ifdef USE_INSTANCING\nfloat eternaGrassPhase = instanceMatrix[3].x * 0.73 + instanceMatrix[3].z * 0.64;\n#else\nfloat eternaGrassPhase = 0.0;\n#endif\nfloat eternaGrassWave = sin(eternaGrassWindTime * 0.00125 + eternaGrassPhase + position.y * 2.7);\ntransformed.x += eternaGrassWave * 0.11 * position.y * position.y;\ntransformed.z += cos(eternaGrassWindTime * 0.00091 + eternaGrassPhase) * 0.045 * position.y * position.y;',
    );
  };
  material.customProgramCacheKey = () => 'eterna-instanced-grass-wind-v1';
  return material;
}

class Random {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number { this.state = (this.state * 1664525 + 1013904223) >>> 0; return this.state / 4294967296; }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  int(min: number, max: number): number { return Math.floor(this.range(min, max + 1)); }
}

const UP = new THREE.Vector3(0, 1, 0);

function bladeGeometry(width = 0.09, height = 0.65, bend = 0.12): THREE.BufferGeometry {
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const rows = 5;
  const planes = [0, Math.PI / 3, (Math.PI * 2) / 3];

  // Three curved ribbons cross at the root, giving each instanced blade a small 3D tuft silhouette.
  for (const angle of planes) {
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const planeOffset = positions.length / 3;
    for (let row = 0; row <= rows; row++) {
      const t = row / rows;
      const rowWidth = width * Math.pow(1 - t, 0.82);
      const centerX = bend * t * t;
      const centerZ = 0.12 * Math.sin(t * Math.PI) * bend;
      for (const side of [-1, 1]) {
        const localX = centerX + side * rowWidth;
        const localZ = centerZ;
        const x = localX * cos + localZ * sin;
        const z = -localX * sin + localZ * cos;
        positions.push(x, height * t, z);
        const shade = 0.78 + 0.2 * t + side * 0.025 + (planes.indexOf(angle) * 0.018);
        colors.push(0.76 * shade, 0.91 * shade, 0.56 * shade);
      }
      if (row < rows) {
        const vi = planeOffset + row * 2;
        indices.push(vi, vi + 1, vi + 2, vi + 1, vi + 3, vi + 2);
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeLeafGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, -0.12, 0.28, 0, -0.18, 0.56, 0.008, 0, 1, 0.055,
    0.18, 0.56, 0.008, 0.12, 0.28, 0, 0, 0.46, 0.045,
  ], 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute([
    0.76, 0.88, 0.65, 0.78, 0.92, 0.66, 0.7, 0.88, 0.58,
    0.9, 0.97, 0.74, 0.7, 0.88, 0.58, 0.78, 0.92, 0.66, 0.98, 1.0, 0.82,
  ], 3));
  geometry.setIndex([0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0, 6]);
  geometry.computeVertexNormals();
  return geometry;
}

function makeFern(seed: number): THREE.Group {
  const random = new Random(seed);
  const geometry = new THREE.BufferGeometry();
  const positions: number[] = [];
  const colors: number[] = [];
  const indices: number[] = [];
  const addLeaf = (base: THREE.Vector3, direction: THREE.Vector3, length: number, width: number, color: THREE.Color): void => {
    const dir = direction.clone().normalize();
    const side = new THREE.Vector3(-dir.z, 0.12 + random.range(-0.08, 0.08), dir.x).normalize();
    const tip = base.clone().addScaledVector(dir, length);
    const middle = base.clone().lerp(tip, 0.52).add(new THREE.Vector3(0, 0.025, 0));
    const offset = positions.length / 3;
    const points = [base, middle.clone().addScaledVector(side, width), tip, middle.clone().addScaledVector(side, -width), middle.clone().add(new THREE.Vector3(0, 0.035, 0))];
    for (const point of points) {
      positions.push(point.x, point.y, point.z);
      colors.push(color.r, color.g, color.b);
    }
    indices.push(offset, offset + 1, offset + 4, offset + 1, offset + 2, offset + 4, offset + 2, offset + 3, offset + 4, offset + 3, offset, offset + 4);
  };

  const dark = new THREE.Color('#315c38');
  const light = new THREE.Color('#6f9148');
  for (let frond = 0; frond < 7; frond++) {
    const angle = (frond / 7) * Math.PI * 2 + random.range(-0.3, 0.3);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const length = random.range(0.72, 1.35);
    const rise = random.range(0.42, 0.88);
    const stemCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.08, 0),
      radial.clone().multiplyScalar(length * 0.35).add(new THREE.Vector3(0, rise * 0.55, 0)),
      radial.clone().multiplyScalar(length * 0.72).add(new THREE.Vector3(0, rise * 0.88, 0)),
      radial.clone().multiplyScalar(length).add(new THREE.Vector3(0, rise, 0)),
    ]);
    const stemOffset = positions.length / 3;
    for (let sample = 0; sample <= 14; sample++) {
      const st = sample / 14;
      const stemPoint = stemCurve.getPoint(st);
      const stemSide = new THREE.Vector3(-radial.z, 0, radial.x).multiplyScalar(0.018 * (1 - st * 0.5));
      for (const sideSign of [-1, 1]) {
        const v = stemPoint.clone().addScaledVector(stemSide, sideSign);
        positions.push(v.x, v.y, v.z);
        const stemColor = dark.clone().lerp(light, st * 0.24);
        colors.push(stemColor.r, stemColor.g, stemColor.b);
      }
      if (sample < 14) {
        const vi = stemOffset + sample * 2;
        indices.push(vi, vi + 1, vi + 2, vi + 1, vi + 3, vi + 2);
      }
    }
    for (let i = 0; i < 15; i++) {
      const t = 0.08 + (i / 15) * 0.87;
      const point = stemCurve.getPoint(t);
      const tangent = stemCurve.getTangent(t).normalize();
      const side = new THREE.Vector3(-tangent.z, 0, tangent.x).normalize();
      const taper = Math.sin(Math.PI * t);
      for (const sign of [-1, 1]) {
        const pinnaDirection = tangent.clone().multiplyScalar(0.35)
          .addScaledVector(side, sign * random.range(0.68, 1.0))
          .add(new THREE.Vector3(0, random.range(0.08, 0.32), 0));
        addLeaf(point.clone().addScaledVector(side, sign * 0.025), pinnaDirection,
          random.range(0.18, 0.34) * taper + 0.06, random.range(0.055, 0.09) * taper + 0.02,
          dark.clone().lerp(light, random.range(0.15, 0.8)));
      }
    }
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  const frondMesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, roughness: 0.92 }));
  frondMesh.castShadow = true;
  frondMesh.receiveShadow = true;
  const fern = new THREE.Group();
  fern.name = 'Eterna_Woodland_Fern';
  fern.add(frondMesh);
  return fern;
}

function makeShrub(seed: number): THREE.Group {
  const random = new Random(seed);
  const shrub = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: '#65462f', roughness: 0.95 });
  const leafMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, side: THREE.DoubleSide, roughness: 0.92 });
  const leaf = makeLeafGeometry();
  const anchors: THREE.Vector3[] = [];
  const count = random.int(5, 7);
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + random.range(-0.5, 0.5);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const height = random.range(0.95, 1.8);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.1, 0),
      radial.clone().multiplyScalar(0.26).add(new THREE.Vector3(0, height * 0.48, 0)),
      radial.clone().multiplyScalar(0.57).add(new THREE.Vector3(0, height * 0.8, 0)),
      radial.clone().multiplyScalar(random.range(0.7, 1.05)).add(new THREE.Vector3(0, height, 0)),
    ]);
    const stem = new THREE.Mesh(new THREE.TubeGeometry(curve, 8, 0.035, 6, false), wood);
    stem.castShadow = true;
    shrub.add(stem);
    anchors.push(curve.getPoint(0.7), curve.getPoint(1));
  }

  const leaves = new THREE.InstancedMesh(leaf, leafMaterial, 180);
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const palette = ['#315b36', '#416f3d', '#527f43', '#688d4a', '#7c9951'].map((v) => new THREE.Color(v));
  let index = 0;
  for (const anchor of anchors) {
    const cluster = random.int(7, 12);
    for (let i = 0; i < cluster && index < leaves.count; i++) {
      const direction = new THREE.Vector3(random.range(-1, 1), random.range(0.05, 1), random.range(-1, 1)).normalize();
      dummy.position.copy(anchor).add(new THREE.Vector3(random.range(-0.2, 0.2), random.range(-0.15, 0.17), random.range(-0.2, 0.2)));
      dummy.quaternion.setFromUnitVectors(UP, direction);
      dummy.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(UP, random.range(0, Math.PI * 2)));
      const size = random.range(0.22, 0.4);
      dummy.scale.set(size * 0.9, size, size * 0.2);
      dummy.updateMatrix();
      leaves.setMatrixAt(index, dummy.matrix);
      leaves.setColorAt(index, palette[random.int(0, palette.length - 1)]);
      index++;
    }
  }
  leaves.count = index;
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  shrub.add(leaves);
  shrub.userData.assetId = 'eterna.vegetation.willowmere.woodland-shrub';
  return shrub;
}

function makeFlowerPetal(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, 0, -0.42, 0.42, 0, 0, 1, 0.035, 0.42, 0.42, 0, 0, 0.48, 0.045,
  ], 3));
  geometry.setIndex([0, 1, 4, 1, 2, 4, 2, 3, 4, 3, 0, 4]);
  geometry.computeVertexNormals();
  return geometry;
}

function makeFlowers(scene: THREE.Scene, heightAt: (x: number, z: number) => number, random: Random): void {
  const flowerCount = 148;
  const petalsPerFlower = 5;
  const stemGeometry = new THREE.CylinderGeometry(0.018, 0.025, 0.42, 5);
  const petalGeometry = makeFlowerPetal();
  const centerGeometry = new THREE.SphereGeometry(0.075, 8, 6);
  const stemMaterial = new THREE.MeshStandardMaterial({ color: '#52713d', roughness: 0.95 });
  const petalMaterial = new THREE.MeshStandardMaterial({ color: '#ffffff', side: THREE.DoubleSide, roughness: 0.88 });
  const centerMaterial = new THREE.MeshStandardMaterial({ color: '#e3b84f', roughness: 0.78 });
  const stems = new THREE.InstancedMesh(stemGeometry, stemMaterial, flowerCount);
  const petals = new THREE.InstancedMesh(petalGeometry, petalMaterial, flowerCount * petalsPerFlower);
  const centers = new THREE.InstancedMesh(centerGeometry, centerMaterial, flowerCount);
  stems.castShadow = petals.castShadow = centers.castShadow = true;
  stems.receiveShadow = petals.receiveShadow = centers.receiveShadow = true;
  const petalTints = ['#f2d7a0', '#d9c3e8', '#e7c2bd', '#f6e8cf', '#d8cf8d'].map((c) => new THREE.Color(c));
  const dummy = new THREE.Object3D();
  let usedFlowers = 0;
  let usedPetals = 0;

  for (let i = 0; i < flowerCount; i++) {
    const x = random.range(-40, 40);
    const z = random.range(-40, 40);
    const roadCenter = 0.1 + z * -0.055;
    const roadClear = Math.abs(x - roadCenter) < 3.4;
    const villageClear = Math.hypot(x + 10.5, z + 25.5) < 6.8 || Math.hypot(x - 9, z + 32) < 6.8 || Math.hypot(x - 15, z + 17.5) < 6.8;
    const pondClear = Math.hypot(x + 20.5, z + 13.4) < 7.8;
    if (roadClear || villageClear || pondClear || Math.hypot(x, z) < 5.5) continue;

    const h = heightAt(x, z);
    const flowerHeight = random.range(0.28, 0.55);
    dummy.position.set(x, h + flowerHeight * 0.5, z);
    dummy.rotation.set(random.range(-0.05, 0.05), random.range(0, Math.PI * 2), random.range(-0.05, 0.05));
    dummy.scale.setScalar(flowerHeight / 0.42);
    dummy.updateMatrix();
    stems.setMatrixAt(usedFlowers, dummy.matrix);

    const flowerCenter = new THREE.Vector3(x, h + flowerHeight, z);
    dummy.position.copy(flowerCenter);
    dummy.scale.setScalar(random.range(0.65, 0.95));
    dummy.updateMatrix();
    centers.setMatrixAt(usedFlowers, dummy.matrix);

    const petalTint = petalTints[random.int(0, petalTints.length - 1)];
    for (let p = 0; p < petalsPerFlower; p++) {
      const angle = (p / petalsPerFlower) * Math.PI * 2 + random.range(-0.12, 0.12);
      const direction = new THREE.Vector3(Math.cos(angle), random.range(0.08, 0.35), Math.sin(angle)).normalize();
      dummy.position.copy(flowerCenter).addScaledVector(direction, 0.018);
      dummy.quaternion.setFromUnitVectors(UP, direction);
      dummy.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(UP, random.range(-0.2, 0.2)));
      const size = random.range(0.1, 0.16);
      dummy.scale.set(size, size * 1.2, size * 0.35);
      dummy.updateMatrix();
      petals.setMatrixAt(usedPetals, dummy.matrix);
      petals.setColorAt(usedPetals, petalTint);
      usedPetals++;
    }
    usedFlowers++;
  }

  stems.count = usedFlowers;
  centers.count = usedFlowers;
  petals.count = usedPetals;
  stems.instanceMatrix.needsUpdate = true;
  centers.instanceMatrix.needsUpdate = true;
  petals.instanceMatrix.needsUpdate = true;
  if (petals.instanceColor) petals.instanceColor.needsUpdate = true;
  scene.add(stems, petals, centers);
}

export function createUnderstory(
  scene: THREE.Scene,
  heightAt: (x: number, z: number) => number,
  seed = 0x51ed,
): void {
  const random = new Random(seed);
  const grassGeometries = [
    bladeGeometry(0.065, 0.48, 0.1),
    bladeGeometry(0.08, 0.72, -0.16),
    bladeGeometry(0.055, 0.58, 0.22),
  ];
  const grassInstances = grassGeometries.map((geometry, i) => {
    const material = createGrassMaterial();
    const mesh = new THREE.InstancedMesh(geometry, material, 2600);
    mesh.name = 'Eterna_Grass_Blade_Variant_' + (i + 1);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  });
  const grassColors = ['#496b37', '#5f7c40', '#78914b', '#8b9952', '#3f6239'].map((c) => new THREE.Color(c));
  const dummies = [new THREE.Object3D(), new THREE.Object3D(), new THREE.Object3D()];
  const used = [0, 0, 0];

  for (let patch = 0; patch < 420; patch++) {
    const cx = random.range(-43, 43);
    const cz = random.range(-43, 43);
    const roadCenter = 0.1 + cz * -0.055;
    const roadClear = Math.abs(cx - roadCenter) < 3.6;
    const villageClear = Math.hypot(cx + 10.5, cz + 25.5) < 6.8 || Math.hypot(cx - 9, cz + 32) < 6.8 || Math.hypot(cx - 15, cz + 17.5) < 6.8;
    const pondClear = Math.hypot(cx + 20.5, cz + 13.4) < 7.8;
    const spawnClear = Math.hypot(cx, cz) < 5.5;
    if (roadClear || villageClear || pondClear || spawnClear) continue;

    const blades = random.int(10, 20);
    for (let i = 0; i < blades; i++) {
      const variant = random.int(0, 2);
      const index = used[variant];
      if (index >= grassInstances[variant].count) continue;
      const x = cx + random.range(-1.15, 1.15);
      const z = cz + random.range(-1.15, 1.15);
      const y = heightAt(x, z);
      const dummy = dummies[variant];
      dummy.position.set(x, y + 0.015, z);
      dummy.rotation.set(random.range(-0.12, 0.12), random.range(0, Math.PI * 2), random.range(-0.12, 0.12));
      const scale = random.range(0.78, 1.48);
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      grassInstances[variant].setMatrixAt(index, dummy.matrix);
      const tint = grassColors[random.int(0, grassColors.length - 1)].clone().multiplyScalar(random.range(0.9, 1.12));
      grassInstances[variant].setColorAt(index, tint);
      used[variant]++;
    }
  }

  for (let i = 0; i < grassInstances.length; i++) {
    grassInstances[i].count = used[i];
    grassInstances[i].instanceMatrix.needsUpdate = true;
    const instanceColor = grassInstances[i].instanceColor;
    if (instanceColor) instanceColor.needsUpdate = true;
    scene.add(grassInstances[i]);
  }

  const fernTemplates = [makeFern(711), makeFern(733), makeFern(761)];
  const shrubTemplates = [makeShrub(811), makeShrub(827), makeShrub(853)];
  let fernsPlaced = 0;
  let shrubsPlaced = 0;
  let attempts = 0;
  while ((fernsPlaced < 34 || shrubsPlaced < 28) && attempts < 500) {
    attempts++;
    const x = random.range(-42, 42);
    const z = random.range(-42, 42);
    const roadCenter = 0.1 + z * -0.055;
    const roadClear = Math.abs(x - roadCenter) < 4.2;
    const villageClear = Math.hypot(x + 10.5, z + 25.5) < 6.8 || Math.hypot(x - 9, z + 32) < 6.8 || Math.hypot(x - 15, z + 17.5) < 6.8;
    const pondClear = Math.hypot(x + 20.5, z + 13.4) < 7.6;
    if (roadClear || villageClear || pondClear || Math.hypot(x, z) < 6) continue;

    const y = heightAt(x, z);
    if (fernsPlaced < 34 && random.next() > 0.38) {
      const fern = fernTemplates[random.int(0, fernTemplates.length - 1)].clone(true);
      fern.position.set(x, y + 0.01, z);
      fern.rotation.y = random.range(0, Math.PI * 2);
      fern.scale.setScalar(random.range(0.72, 1.25));
      scene.add(fern);
      fernsPlaced++;
    } else if (shrubsPlaced < 28) {
      const shrub = shrubTemplates[random.int(0, shrubTemplates.length - 1)].clone(true);
      shrub.position.set(x, y, z);
      shrub.rotation.y = random.range(0, Math.PI * 2);
      shrub.scale.setScalar(random.range(0.68, 1.18));
      scene.add(shrub);
      shrubsPlaced++;
    }
  }

  makeFlowers(scene, heightAt, random);
}
