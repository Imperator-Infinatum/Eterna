import * as THREE from 'three';
import { createOrganicBarkMaterial, createOrganicLeafMaterial } from './environment';

interface TubeSegment {
  a: THREE.Vector3;
  b: THREE.Vector3;
  radiusA: number;
  radiusB: number;
  blend: number;
}

interface LeafAnchor {
  position: THREE.Vector3;
  tangent: THREE.Vector3;
  strength: number;
}

interface GridSpec {
  min: THREE.Vector3;
  step: THREE.Vector3;
  nx: number;
  ny: number;
  nz: number;
}

interface OrganicTreeOptions {
  species: 'oak' | 'spruce';
  seed: number;
  height: number;
  bounds: number;
  leafCount: number;
}

const UP = new THREE.Vector3(0, 1, 0);

class Random {
  private state: number;
  constructor(seed: number) { this.state = seed >>> 0; }
  next(): number {
    this.state = (this.state * 1664525 + 1013904223) >>> 0;
    return this.state / 4294967296;
  }
  range(min: number, max: number): number { return min + (max - min) * this.next(); }
  sign(): number { return this.next() > 0.5 ? 1 : -1; }
  int(min: number, max: number): number { return Math.floor(this.range(min, max + 1)); }
}

function smoothMin(a: number, b: number, k: number): number {
  if (a > 20) return b;
  const h = Math.max(k - Math.abs(a - b), 0) / k;
  return Math.min(a, b) - h * h * k * 0.25;
}

function curveFrom(points: THREE.Vector3[]): THREE.CatmullRomCurve3 {
  return new THREE.CatmullRomCurve3(points, false, 'catmullrom', 0.48);
}

function addTube(
  segments: TubeSegment[],
  points: THREE.Vector3[],
  radiusBase: number,
  radiusTip: number,
  divisions: number,
  blend = 0.17,
): THREE.CatmullRomCurve3 {
  const curve = curveFrom(points);
  let previous = curve.getPoint(0);
  for (let i = 1; i <= divisions; i++) {
    const t0 = (i - 1) / divisions;
    const t1 = i / divisions;
    const current = curve.getPoint(t1);
    const taper0 = Math.pow(1 - t0, 0.83);
    const taper1 = Math.pow(1 - t1, 0.83);
    const r0 = radiusTip + (radiusBase - radiusTip) * taper0;
    const r1 = radiusTip + (radiusBase - radiusTip) * taper1;
    segments.push({
      a: previous.clone(),
      b: current.clone(),
      radiusA: r0,
      radiusB: r1,
      blend: Math.max(blend, (r0 + r1) * 0.22),
    });
    previous = current;
  }
  return curve;
}

function buildOakSkeleton(seed: number, height: number): { segments: TubeSegment[]; leaves: LeafAnchor[] } {
  const random = new Random(seed);
  const segments: TubeSegment[] = [];
  const leaves: LeafAnchor[] = [];
  const trunkControls = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(random.range(-0.13, 0.13), height * 0.17, random.range(-0.11, 0.11)),
    new THREE.Vector3(random.range(-0.25, 0.25), height * 0.36, random.range(-0.2, 0.2)),
    new THREE.Vector3(random.range(-0.3, 0.32), height * 0.58, random.range(-0.28, 0.28)),
    new THREE.Vector3(random.range(-0.4, 0.4), height * 0.79, random.range(-0.34, 0.34)),
    new THREE.Vector3(random.range(-0.48, 0.48), height, random.range(-0.4, 0.4)),
  ];
  const trunk = addTube(segments, trunkControls, 0.74, 0.115, 28, 0.26);

  // Buttress roots start inside the trunk and flatten into the soil.
  const rootCount = random.int(6, 8);
  for (let i = 0; i < rootCount; i++) {
    const angle = (i / rootCount) * Math.PI * 2 + random.range(-0.34, 0.34);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const tangent = new THREE.Vector3(-radial.z, 0, radial.x);
    const length = random.range(2.05, 3.35);
    const sweep = random.range(-0.42, 0.42);
    const points = [
      radial.clone().multiplyScalar(0.05).setY(random.range(0.42, 0.88)),
      radial.clone().multiplyScalar(length * 0.22).addScaledVector(tangent, sweep * 0.12).setY(0.38),
      radial.clone().multiplyScalar(length * 0.55).addScaledVector(tangent, sweep * 0.5).setY(0.12),
      radial.clone().multiplyScalar(length * 0.83).addScaledVector(tangent, sweep).setY(-0.08),
      radial.clone().multiplyScalar(length).addScaledVector(tangent, sweep * 1.2).setY(-0.19),
    ];
    addTube(segments, points, random.range(0.36, 0.51), 0.035, 11, 0.24);
  }

  // Primary limbs originate at staggered heights and never share a repeated radial pattern.
  const primaryCount = random.int(7, 9);
  const heights = Array.from({ length: primaryCount }, () => random.range(height * 0.29, height * 0.77)).sort((a, b) => a - b);
  const phase = random.range(0, Math.PI * 2);

  for (let i = 0; i < primaryCount; i++) {
    const h = heights[i];
    const t = h / height;
    const origin = trunk.getPoint(t);
    const tangent = trunk.getTangent(t).normalize();
    const angle = phase + i * 2.399963 + random.range(-0.58, 0.58);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-radial.z, 0, radial.x);
    const length = random.range(2.25, 3.9) * (1.1 - t * 0.28);
    const rise = random.range(0.42, 1.5) - Math.max(0, t - 0.58) * 1.2;
    const bend = random.range(-0.62, 0.62);
    const start = origin.clone().addScaledVector(radial, random.range(0.12, 0.32));
    const primaryPoints = [
      start,
      start.clone().addScaledVector(radial, length * 0.28).addScaledVector(tangent, 0.28),
      start.clone().addScaledVector(radial, length * 0.68).addScaledVector(side, bend).add(new THREE.Vector3(0, rise * 0.72, 0)),
      start.clone().addScaledVector(radial, length).addScaledVector(side, bend * 1.4).add(new THREE.Vector3(0, rise, 0)),
    ];
    const primary = addTube(segments, primaryPoints, random.range(0.24, 0.31), 0.045, 10, 0.19);

    const secondaryCount = random.int(3, 5);
    for (let j = 0; j < secondaryCount; j++) {
      const attachT = random.range(0.3, 0.91);
      const attach = primary.getPoint(attachT);
      const primaryTangent = primary.getTangent(attachT).normalize();
      const spin = random.range(0, Math.PI * 2);
      const spread = radial.clone().multiplyScalar(random.range(0.45, 0.85))
        .add(side.clone().multiplyScalar(Math.sin(spin) * 0.65))
        .add(new THREE.Vector3(0, random.range(0.22, 0.85), 0))
        .normalize();
      const secondaryLength = random.range(0.82, 1.85) * (0.7 + attachT * 0.34);
      const secondarySide = new THREE.Vector3(-spread.z, 0, spread.x);
      const secondaryPoints = [
        attach.clone().addScaledVector(primaryTangent, 0.02),
        attach.clone().addScaledVector(spread, secondaryLength * 0.36).add(new THREE.Vector3(0, 0.18, 0)),
        attach.clone().addScaledVector(spread, secondaryLength * 0.74).addScaledVector(secondarySide, random.range(-0.32, 0.32)).add(new THREE.Vector3(0, 0.3, 0)),
        attach.clone().addScaledVector(spread, secondaryLength).add(new THREE.Vector3(0, random.range(0.18, 0.58), 0)),
      ];
      const secondary = addTube(segments, secondaryPoints, random.range(0.105, 0.15), 0.022, 7, 0.115);

      // Fine twigs fork asymmetrically from the secondary limb.
      const twigCount = random.int(2, 3);
      for (let k = 0; k < twigCount; k++) {
        const twigT = random.range(0.55, 0.96);
        const twigOrigin = secondary.getPoint(twigT);
        const twigTangent = secondary.getTangent(twigT).normalize();
        const twigSpin = random.range(0, Math.PI * 2);
        const twigDirection = spread.clone()
          .addScaledVector(secondarySide, Math.sin(twigSpin) * 0.65)
          .add(new THREE.Vector3(0, random.range(0.35, 0.9), 0))
          .normalize();
        const twigLength = random.range(0.38, 0.95);
        const twigPoints = [
          twigOrigin,
          twigOrigin.clone().addScaledVector(twigDirection, twigLength * 0.42).addScaledVector(twigTangent, 0.08),
          twigOrigin.clone().addScaledVector(twigDirection, twigLength * 0.82),
          twigOrigin.clone().addScaledVector(twigDirection, twigLength),
        ];
        const twig = addTube(segments, twigPoints, 0.055, 0.008, 5, 0.06);
        const leafPos = twig.getPoint(0.94);
        const leafDir = twig.getTangent(0.92).normalize();
        leaves.push({ position: leafPos, tangent: leafDir, strength: random.range(0.85, 1.15) });
      }

      const leafPos = secondary.getPoint(0.93);
      leaves.push({ position: leafPos, tangent: secondary.getTangent(0.9).normalize(), strength: random.range(0.7, 1.05) });
    }

    // Small leaf sprays partially reveal the twig network instead of hiding it in one blob.
    const crownPos = primary.getPoint(0.92);
    leaves.push({ position: crownPos, tangent: primary.getTangent(0.9).normalize(), strength: random.range(0.55, 0.85) });
  }

  return { segments, leaves };
}

function buildSpruceSkeleton(seed: number, height: number): { segments: TubeSegment[]; leaves: LeafAnchor[] } {
  const random = new Random(seed);
  const segments: TubeSegment[] = [];
  const leaves: LeafAnchor[] = [];
  const trunkControls = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(random.range(-0.06, 0.06), height * 0.23, random.range(-0.05, 0.05)),
    new THREE.Vector3(random.range(-0.14, 0.14), height * 0.53, random.range(-0.1, 0.1)),
    new THREE.Vector3(random.range(-0.17, 0.17), height * 0.79, random.range(-0.15, 0.15)),
    new THREE.Vector3(random.range(-0.2, 0.2), height, random.range(-0.18, 0.18)),
  ];
  const trunk = addTube(segments, trunkControls, 0.47, 0.055, 26, 0.19);

  const rootCount = random.int(5, 7);
  for (let i = 0; i < rootCount; i++) {
    const angle = (i / rootCount) * Math.PI * 2 + random.range(-0.4, 0.4);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const length = random.range(1.2, 2.0);
    addTube(segments, [
      radial.clone().multiplyScalar(0.05).setY(0.45),
      radial.clone().multiplyScalar(length * 0.36).setY(0.26),
      radial.clone().multiplyScalar(length * 0.72).setY(0.05),
      radial.clone().multiplyScalar(length).setY(-0.12),
    ], random.range(0.23, 0.32), 0.025, 8, 0.16);
  }

  // Irregular whorls: each height, angle and limb length is independently varied.
  const branchBands = random.int(11, 14);
  const phase = random.range(0, Math.PI * 2);
  const bandHeights = Array.from({ length: branchBands }, (_, i) =>
    height * (0.16 + (i / branchBands) * 0.74) + random.range(-0.38, 0.38),
  ).sort((a, b) => a - b);

  for (let i = 0; i < bandHeights.length; i++) {
    const h = bandHeights[i];
    const t = THREE.MathUtils.clamp(h / height, 0.12, 0.94);
    const origin = trunk.getPoint(t);
    const angle = phase + i * 2.399963 + random.range(-0.72, 0.72);
    const radial = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
    const side = new THREE.Vector3(-radial.z, 0, radial.x);
    const crownTaper = Math.pow(1 - t, 0.72);
    const length = random.range(1.25, 2.65) * crownTaper + 0.28;
    const droop = random.range(0.35, 0.95);
    const sweep = random.range(-0.45, 0.45);
    const points = [
      origin.clone().addScaledVector(radial, 0.08),
      origin.clone().addScaledVector(radial, length * 0.34).add(new THREE.Vector3(0, -0.12, 0)),
      origin.clone().addScaledVector(radial, length * 0.73).addScaledVector(side, sweep).add(new THREE.Vector3(0, -droop * 0.65, 0)),
      origin.clone().addScaledVector(radial, length).addScaledVector(side, sweep * 1.35).add(new THREE.Vector3(0, -droop, 0)),
    ];
    const primary = addTube(segments, points, random.range(0.17, 0.22) * (0.7 + crownTaper * 0.3), 0.026, 8, 0.13);

    const secondaryCount = random.int(2, 4);
    for (let j = 0; j < secondaryCount; j++) {
      const attachT = random.range(0.3, 0.92);
      const attach = primary.getPoint(attachT);
      const spin = random.range(0, Math.PI * 2);
      const direction = radial.clone()
        .addScaledVector(side, Math.sin(spin) * 0.7)
        .add(new THREE.Vector3(0, random.range(0.12, 0.4), 0))
        .normalize();
      const secondaryLength = random.range(0.45, 1.1) * crownTaper + 0.18;
      const secondarySide = new THREE.Vector3(-direction.z, 0, direction.x);
      const secondary = addTube(segments, [
        attach,
        attach.clone().addScaledVector(direction, secondaryLength * 0.45).add(new THREE.Vector3(0, -0.08, 0)),
        attach.clone().addScaledVector(direction, secondaryLength * 0.82).addScaledVector(secondarySide, random.range(-0.18, 0.18)),
        attach.clone().addScaledVector(direction, secondaryLength).add(new THREE.Vector3(0, -0.08, 0)),
      ], 0.073, 0.012, 5, 0.07);
      leaves.push({ position: secondary.getPoint(0.94), tangent: secondary.getTangent(0.9).normalize(), strength: random.range(0.8, 1.2) });
    }

    // Dense needles sit along the limbs as overlapping sprays, not spherical canopy puffs.
    for (let k = 1; k <= 4; k++) {
      const tNeedle = 0.34 + k * 0.14 + random.range(-0.035, 0.035);
      const p = primary.getPoint(Math.min(tNeedle, 0.96));
      leaves.push({ position: p, tangent: primary.getTangent(Math.min(tNeedle, 0.96)).normalize(), strength: random.range(0.72, 1.12) });
    }
  }
  return { segments, leaves };
}

function makeGrid(options: OrganicTreeOptions): GridSpec {
  const vertical = options.height + 1.9;
  const horizontal = options.bounds * 2;
  const nx = options.species === 'oak' ? 53 : 47;
  const ny = options.species === 'oak' ? 75 : 77;
  const nz = nx;
  return {
    min: new THREE.Vector3(-options.bounds, -0.78, -options.bounds),
    step: new THREE.Vector3(horizontal / (nx - 1), vertical / (ny - 1), horizontal / (nz - 1)),
    nx, ny, nz,
  };
}

function buildSignedField(segments: TubeSegment[], grid: GridSpec, seed: number): Float32Array {
  const { nx, ny, nz, min, step } = grid;
  const total = nx * ny * nz;
  const field = new Float32Array(total);
  field.fill(40);
  const index = (x: number, y: number, z: number): number => x + y * nx + z * nx * ny;
  const toGrid = (value: number, axis: 'x' | 'y' | 'z'): number =>
    (value - min[axis]) / step[axis];

  for (const segment of segments) {
    const margin = Math.max(segment.blend * 1.8, 0.12);
    const radius = Math.max(segment.radiusA, segment.radiusB) + margin;
    const x0 = Math.max(0, Math.floor(toGrid(Math.min(segment.a.x, segment.b.x) - radius, 'x')));
    const x1 = Math.min(nx - 1, Math.ceil(toGrid(Math.max(segment.a.x, segment.b.x) + radius, 'x')));
    const y0 = Math.max(0, Math.floor(toGrid(Math.min(segment.a.y, segment.b.y) - radius, 'y')));
    const y1 = Math.min(ny - 1, Math.ceil(toGrid(Math.max(segment.a.y, segment.b.y) + radius, 'y')));
    const z0 = Math.max(0, Math.floor(toGrid(Math.min(segment.a.z, segment.b.z) - radius, 'z')));
    const z1 = Math.min(nz - 1, Math.ceil(toGrid(Math.max(segment.a.z, segment.b.z) + radius, 'z')));

    for (let z = z0; z <= z1; z++) {
      const pz = min.z + z * step.z;
      for (let y = y0; y <= y1; y++) {
        const py = min.y + y * step.y;
        let offset = index(x0, y, z);
        for (let x = x0; x <= x1; x++, offset++) {
          const px = min.x + x * step.x;
          const abx = segment.b.x - segment.a.x;
          const aby = segment.b.y - segment.a.y;
          const abz = segment.b.z - segment.a.z;
          const pxA = px - segment.a.x;
          const pyA = py - segment.a.y;
          const pzA = pz - segment.a.z;
          const lengthSq = abx * abx + aby * aby + abz * abz;
          const t = lengthSq > 1e-8
            ? THREE.MathUtils.clamp((pxA * abx + pyA * aby + pzA * abz) / lengthSq, 0, 1)
            : 0;
          const dx = pxA - abx * t;
          const dy = pyA - aby * t;
          const dz = pzA - abz * t;
          const taper = segment.radiusA + (segment.radiusB - segment.radiusA) * t;
          const sdf = Math.sqrt(dx * dx + dy * dy + dz * dz) - taper;
          field[offset] = smoothMin(field[offset], sdf, segment.blend);
        }
      }
    }
  }

  // Fine irregularity breaks the perfect procedural smoothness of the bark without damaging the silhouette.
  for (let z = 1; z < nz - 1; z++) {
    const pz = min.z + z * step.z;
    for (let y = 1; y < ny - 1; y++) {
      const py = min.y + y * step.y;
      for (let x = 1; x < nx - 1; x++) {
        const px = min.x + x * step.x;
        const i = index(x, y, z);
        if (Math.abs(field[i]) < 0.55) {
          const grain = Math.sin(px * 9.3 + seed) * Math.sin(pz * 8.1 - py * 2.4)
            + 0.45 * Math.sin(px * 18.7 - py * 6.2) * Math.cos(pz * 13.4 + seed * 0.3);
          field[i] += grain * 0.012;
        }
      }
    }
  }
  return field;
}

function edgeKey(a: number, b: number, total: number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return lo * total + hi;
}

function makeOrganicSurface(
  segments: TubeSegment[],
  grid: GridSpec,
  seed: number,
  species: 'oak' | 'spruce',
): THREE.BufferGeometry {
  const { nx, ny, nz, min, step } = grid;
  const field = buildSignedField(segments, grid, seed);
  const total = field.length;
  const idx = (x: number, y: number, z: number): number => x + y * nx + z * nx * ny;
  const gx = new Float32Array(total);
  const gy = new Float32Array(total);
  const gz = new Float32Array(total);

  for (let z = 1; z < nz - 1; z++) for (let y = 1; y < ny - 1; y++) for (let x = 1; x < nx - 1; x++) {
    const i = idx(x, y, z);
    gx[i] = (field[idx(x + 1, y, z)] - field[idx(x - 1, y, z)]) / (2 * step.x);
    gy[i] = (field[idx(x, y + 1, z)] - field[idx(x, y - 1, z)]) / (2 * step.y);
    gz[i] = (field[idx(x, y, z + 1)] - field[idx(x, y, z - 1)]) / (2 * step.z);
  }

  const positions: number[] = [];
  const normals: number[] = [];
  const colors: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];
  const cache = new Map<number, number>();
  const cubeOffsets = [
    [0, 0, 0], [1, 0, 0], [1, 1, 0], [0, 1, 0],
    [0, 0, 1], [1, 0, 1], [1, 1, 1], [0, 1, 1],
  ] as const;
  const tetrahedra = [
    [0, 5, 1, 6], [0, 1, 2, 6], [0, 2, 3, 6],
    [0, 3, 7, 6], [0, 7, 4, 6], [0, 4, 5, 6],
  ] as const;

  const getVertex = (idA: number, idB: number): number => {
    const key = edgeKey(idA, idB, total);
    const cached = cache.get(key);
    if (cached !== undefined) return cached;
    const va = field[idA];
    const vb = field[idB];
    const denominator = va - vb;
    const t = Math.abs(denominator) < 1e-8 ? 0.5 : THREE.MathUtils.clamp(va / denominator, 0, 1);
    const coord = (id: number): [number, number, number] => {
      const x = id % nx;
      const y = Math.floor(id / nx) % ny;
      const z = Math.floor(id / (nx * ny));
      return [x, y, z];
    };
    const ca = coord(idA);
    const cb = coord(idB);
    const x = THREE.MathUtils.lerp(ca[0], cb[0], t);
    const y = THREE.MathUtils.lerp(ca[1], cb[1], t);
    const z = THREE.MathUtils.lerp(ca[2], cb[2], t);
    const px = min.x + x * step.x;
    const py = min.y + y * step.y;
    const pz = min.z + z * step.z;
    const nxv = THREE.MathUtils.lerp(gx[idA], gx[idB], t);
    const nyv = THREE.MathUtils.lerp(gy[idA], gy[idB], t);
    const nzv = THREE.MathUtils.lerp(gz[idA], gz[idB], t);
    const normal = new THREE.Vector3(nxv, nyv, nzv).normalize();

    const barkBase = species === 'oak'
      ? new THREE.Color('#795536')
      : new THREE.Color('#644b35');
    const grain = 0.5 + 0.5 * Math.sin(Math.atan2(pz, px) * 19 + py * 2.6 + seed * 0.07);
    const fleck = 0.5 + 0.5 * Math.sin(px * 12.0 + pz * 7.5 + Math.sin(py * 5));
    const shade = 0.86 + grain * 0.095 + fleck * 0.045;
    barkBase.multiplyScalar(shade);
    if (py < 1.25) {
      const moss = new THREE.Color('#536441');
      const patch = THREE.MathUtils.smoothstep(1.25 - py, 0, 1.05) * (0.16 + 0.18 * (0.5 + 0.5 * Math.sin(px * 6 + pz * 8 + seed)));
      barkBase.lerp(moss, patch);
    } else if (py > 7.0 && grain > 0.83) {
      barkBase.lerp(new THREE.Color('#91704a'), 0.12);
    }

    const vertexIndex = positions.length / 3;
    positions.push(px, py, pz);
    normals.push(normal.x, normal.y, normal.z);
    colors.push(barkBase.r, barkBase.g, barkBase.b);
    uvs.push(px * 0.43 + pz * 0.27, py * 0.24);
    cache.set(key, vertexIndex);
    return vertexIndex;
  };

  const orientTriangle = (a: number, b: number, c: number): void => {
    const ax = positions[a * 3], ay = positions[a * 3 + 1], az = positions[a * 3 + 2];
    const bx = positions[b * 3], by = positions[b * 3 + 1], bz = positions[b * 3 + 2];
    const cx = positions[c * 3], cy = positions[c * 3 + 1], cz = positions[c * 3 + 2];
    const abx = bx - ax, aby = by - ay, abz = bz - az;
    const acx = cx - ax, acy = cy - ay, acz = cz - az;
    const faceX = aby * acz - abz * acy;
    const faceY = abz * acx - abx * acz;
    const faceZ = abx * acy - aby * acx;
    const normalX = normals[a * 3] + normals[b * 3] + normals[c * 3];
    const normalY = normals[a * 3 + 1] + normals[b * 3 + 1] + normals[c * 3 + 1];
    const normalZ = normals[a * 3 + 2] + normals[b * 3 + 2] + normals[c * 3 + 2];
    if (faceX * normalX + faceY * normalY + faceZ * normalZ < 0) indices.push(a, c, b);
    else indices.push(a, b, c);
  };

  const vertexFor = (ids: number[], a: number, b: number): number => getVertex(ids[a], ids[b]);

  for (let z = 0; z < nz - 1; z++) {
    for (let y = 0; y < ny - 1; y++) {
      for (let x = 0; x < nx - 1; x++) {
        const cubeIds = cubeOffsets.map(([ox, oy, oz]) => idx(x + ox, y + oy, z + oz));
        let cubeMin = Infinity;
        let cubeMax = -Infinity;
        for (const id of cubeIds) {
          cubeMin = Math.min(cubeMin, field[id]);
          cubeMax = Math.max(cubeMax, field[id]);
        }
        if (cubeMin > 0 || cubeMax < 0) continue;

        for (const tet of tetrahedra) {
          const inside: number[] = [];
          const outside: number[] = [];
          for (const corner of tet) {
            (field[cubeIds[corner]] < 0 ? inside : outside).push(corner);
          }
          if (inside.length === 0 || inside.length === 4) continue;
          const ids = [0, 0, 0, 0];
          for (let i = 0; i < 4; i++) {
            ids[i] = cubeIds[tet[i]];
          }

          if (inside.length === 1) {
            const a = inside[0];
            const v0 = vertexFor(ids, a, outside[0]);
            const v1 = vertexFor(ids, a, outside[1]);
            const v2 = vertexFor(ids, a, outside[2]);
            orientTriangle(v0, v1, v2);
          } else if (inside.length === 3) {
            const a = outside[0];
            const v0 = vertexFor(ids, a, inside[0]);
            const v1 = vertexFor(ids, a, inside[1]);
            const v2 = vertexFor(ids, a, inside[2]);
            orientTriangle(v0, v1, v2);
          } else {
            const a = inside[0], b = inside[1], c = outside[0], d = outside[1];
            const v0 = vertexFor(ids, a, c);
            const v1 = vertexFor(ids, a, d);
            const v2 = vertexFor(ids, b, c);
            const v3 = vertexFor(ids, b, d);
            orientTriangle(v0, v1, v2);
            orientTriangle(v1, v3, v2);
          }
        }
      }
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeBoundingSphere();
  geometry.computeBoundingBox();
  return geometry;
}

function makeBroadleafGeometry(): THREE.BufferGeometry {
  const positions = [
    0, 0, 0,
    -0.22, 0.28, 0.0,
    -0.3, 0.56, 0.012,
    0, 1, 0.08,
    0.3, 0.56, 0.012,
    0.22, 0.28, 0.0,
    0, 0.47, 0.055,
  ];
  const indices = [0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0, 6];
  const colors = [
    0.74, 0.88, 0.62,
    0.82, 0.94, 0.68,
    0.72, 0.9, 0.58,
    0.9, 0.97, 0.72,
    0.72, 0.9, 0.58,
    0.82, 0.94, 0.68,
    0.96, 1.0, 0.79,
  ];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 0, 0.28, 0.28, 0.1, 0.56, 0.5, 1, 0.9, 0.56, 0.72, 0.28, 0.5, 0.47], 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeNeedleGeometry(): THREE.BufferGeometry {
  const positions = [
    0, 0, 0,
    -0.07, 0.3, 0.015,
    -0.03, 0.68, 0.045,
    0, 1, 0.075,
    0.03, 0.68, 0.045,
    0.07, 0.3, 0.015,
    0, 0.46, 0.055,
  ];
  const indices = [0, 1, 6, 1, 2, 6, 2, 3, 6, 3, 4, 6, 4, 5, 6, 5, 0, 6];
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute([1,1,1, 0.9,0.96,0.82, 0.82,0.92,0.76, 0.9,0.97,0.82, 0.82,0.92,0.76, 0.9,0.96,0.82, 1,1,0.9], 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 0, 0.2, 0.3, 0.4, 0.68, 0.5, 1, 0.6, 0.68, 0.8, 0.3, 0.5, 0.46], 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function makeLeafInstances(
  anchors: LeafAnchor[],
  seed: number,
  species: 'oak' | 'spruce',
  maxLeaves: number,
): THREE.InstancedMesh {
  const random = new Random(seed ^ 0x9e3779b9);
  const geometry = species === 'oak' ? makeBroadleafGeometry() : makeNeedleGeometry();
  const material = createOrganicLeafMaterial();
  material.roughness = species === 'oak' ? 0.88 : 0.94;

  const estimate = anchors.reduce((sum, anchor) => sum + (species === 'oak' ? 12 : 9) * anchor.strength, 0);
  const count = Math.max(1, Math.min(maxLeaves, Math.floor(estimate)));
  const leaves = new THREE.InstancedMesh(geometry, material, count);
  leaves.name = species === 'oak' ? 'Individual_Broadleaf_Leaves' : 'Individual_Spruce_Needles';
  leaves.castShadow = true;
  leaves.receiveShadow = true;
  const dummy = new THREE.Object3D();
  const colors = species === 'oak'
    ? ['#315a36', '#416c39', '#527e40', '#638b48', '#78964f', '#466b3b']
    : ['#234c35', '#2c603d', '#3b7044', '#4b7c49', '#5d8950'];
  const colorObjects = colors.map((color) => new THREE.Color(color));
  let index = 0;

  for (const anchor of anchors) {
    const clusterSize = species === 'oak'
      ? Math.max(7, Math.floor(random.range(9, 16) * anchor.strength))
      : Math.max(6, Math.floor(random.range(7, 12) * anchor.strength));
    const baseDirection = anchor.tangent.clone().normalize();
    const outward = new THREE.Vector3(anchor.position.x, random.range(0.12, 0.48), anchor.position.z).normalize();
    for (let i = 0; i < clusterSize && index < count; i++) {
      const azimuth = random.range(0, Math.PI * 2);
      const elevation = species === 'oak' ? random.range(-0.1, 0.95) : random.range(-0.8, 0.25);
      const around = new THREE.Vector3(Math.cos(azimuth), elevation, Math.sin(azimuth)).normalize();
      const direction = baseDirection.clone().multiplyScalar(0.42)
        .addScaledVector(outward, 0.34)
        .addScaledVector(around, 0.62)
        .normalize();
      const position = anchor.position.clone()
        .addScaledVector(direction, random.range(0.05, species === 'oak' ? 0.28 : 0.22))
        .add(new THREE.Vector3(random.range(-0.12, 0.12), random.range(-0.1, 0.18), random.range(-0.12, 0.12)));

      const up = species === 'oak'
        ? direction
        : direction.clone().add(new THREE.Vector3(0, -0.2, 0)).normalize();
      dummy.position.copy(position);
      dummy.quaternion.setFromUnitVectors(UP, up);
      dummy.quaternion.multiply(new THREE.Quaternion().setFromAxisAngle(UP, random.range(0, Math.PI * 2)));
      if (species === 'oak') {
        const length = random.range(0.28, 0.52);
        dummy.scale.set(length * random.range(0.8, 1.3), length, length * 0.2);
      } else {
        const length = random.range(0.36, 0.72);
        dummy.scale.set(length * random.range(0.22, 0.42), length, length * 0.11);
      }
      dummy.updateMatrix();
      leaves.setMatrixAt(index, dummy.matrix);
      const tint = colorObjects[random.int(0, colorObjects.length - 1)].clone();
      tint.multiplyScalar(random.range(0.88, 1.12));
      leaves.setColorAt(index, tint);
      index++;
    }
  }

  leaves.count = index;
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  return leaves;
}

export function createOrganicTree(options: OrganicTreeOptions): THREE.Group {
  const skeleton = options.species === 'oak'
    ? buildOakSkeleton(options.seed, options.height)
    : buildSpruceSkeleton(options.seed, options.height);
  const grid = makeGrid(options);
  const barkGeometry = makeOrganicSurface(skeleton.segments, grid, options.seed, options.species);
  const barkMaterial = createOrganicBarkMaterial();
  const bark = new THREE.Mesh(barkGeometry, barkMaterial);
  bark.name = options.species === 'oak' ? 'Unified_Oak_Trunk_Branch_Root_Surface' : 'Unified_Spruce_Trunk_Branch_Surface';
  bark.castShadow = true;
  bark.receiveShadow = true;

  const group = new THREE.Group();
  group.name = options.species === 'oak' ? 'Eterna_Organic_Broadleaf_Oak' : 'Eterna_Organic_Spruce';
  group.add(bark);
  group.add(makeLeafInstances(skeleton.leaves, options.seed, options.species, options.leafCount));
  group.userData.assetId = options.species === 'oak'
    ? 'eterna.vegetation.willowmere.organic-oak'
    : 'eterna.vegetation.willowmere.organic-spruce';
  group.userData.meshConstruction = 'Smooth-union tapered branch SDF with marching tetrahedra; a single continuous bark mesh for trunk, branch junctions and buttress roots.';
  group.userData.foliageConstruction = options.species === 'oak'
    ? 'Individual curved leaf meshes instanced along terminal twigs.'
    : 'Individual tapered needle meshes instanced along irregular conifer whorls.';
  group.userData.seed = options.seed;
  return group;
}

export function createOakTree(seed = 101): THREE.Group {
  return createOrganicTree({
    species: 'oak',
    seed,
    height: 12.2,
    bounds: 5.0,
    leafCount: 720,
  });
}

export function createSpruceTree(seed = 203): THREE.Group {
  return createOrganicTree({
    species: 'spruce',
    seed,
    height: 12.0,
    bounds: 3.8,
    leafCount: 900,
  });
}
