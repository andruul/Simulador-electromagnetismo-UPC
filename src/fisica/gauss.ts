/**
 * Gauss's Law & Electric Flux Numerical Physics Engine
 * Universidad Popular del Cesar (UPC)
 * 
 * Physical Law:
 *   Φ_E = ∮_S E · dA = Q_enc / ε₀
 * 
 * SI Units:
 *   ε₀ = 8.8541878128e-12 F/m  (Permittivity of free space)
 *   k_e = 1 / (4πε₀) ≈ 8.98755e9 N·m²/C²
 *   Q in Coulombs (C) [UI accepts nC]
 *   E in N/C or V/m
 *   Φ_E in N·m²/C (or V·m)
 */

import type {
  GaussianSurface,
  GaussSurfaceElement,
  GaussCalculation,
  Vector2D,
  Vector3D,
  GaussianShape3D,
  NonUniformFieldParams,
  FaceFluxResult,
  Gauss3DCalculation
} from '../tipos';

export const EPSILON_0 = 8.8541878128e-12; // F/m or C²/(N·m²)
export const COULOMB_KE = 1 / (4 * Math.PI * EPSILON_0); // ≈ 8.9875517923e9 N·m²/C²

export interface ChargeSI {
  id: string;
  x: number; // in meters
  y: number; // in meters
  charge: number; // in Coulombs (e.g. 1e-9 C = 1 nC)
}

/**
 * Calculates 3D electric field at (x, y, z) from charges located in the z=0 plane.
 * E = k_e * ∑ [q_i * (r - r_i) / |r - r_i|³]
 */
export function calculateElectricField3D(
  pos: Vector3D,
  charges: ChargeSI[]
): Vector3D {
  let ex = 0;
  let ey = 0;
  let ez = 0;
  const softening = 1e-7; // meters² to avoid singularity at exact point charge

  for (const c of charges) {
    const dx = pos.x - c.x;
    const dy = pos.y - c.y;
    const dz = pos.z - 0; // charges in z = 0 plane

    const r2 = dx * dx + dy * dy + dz * dz + softening;
    const r = Math.sqrt(r2);
    const r3 = r * r2;

    const factor = (COULOMB_KE * c.charge) / r3;
    ex += factor * dx;
    ey += factor * dy;
    ez += factor * dz;
  }

  return { x: ex, y: ey, z: ez };
}

/**
 * Calculates 2D electric field in the plane (z=0).
 */
export function calculateElectricField2D(
  pos: Vector2D,
  charges: ChargeSI[]
): Vector2D {
  const e3d = calculateElectricField3D({ x: pos.x, y: pos.y, z: 0 }, charges);
  return { x: e3d.x, y: e3d.y };
}

/**
 * Evaluates whether a charge is inside a Gaussian surface.
 */
export function isChargeEnclosed(charge: ChargeSI, surface: GaussianSurface): boolean {
  if (surface.shape === 'circle') {
    const distSq = (charge.x - surface.cx) ** 2 + (charge.y - surface.cy) ** 2;
    return distSq < surface.radius * surface.radius;
  } else {
    const halfW = surface.width / 2;
    const halfH = surface.height / 2;
    return (
      Math.abs(charge.x - surface.cx) < halfW &&
      Math.abs(charge.y - surface.cy) < halfH
    );
  }
}

/**
 * Calculates the exact enclosed charge Q_enc in Coulombs.
 */
export function calculateEnclosedCharge(
  charges: ChargeSI[],
  surface: GaussianSurface
): number {
  let qEnc = 0;
  for (const c of charges) {
    if (isChargeEnclosed(c, surface)) {
      qEnc += c.charge;
    }
  }
  return qEnc;
}

/**
 * Discretizes a 3D sphere using the Fibonacci sphere algorithm (uniform point distribution).
 * Performs numerical integration Φ_E = ∬ E · dA.
 */
export function integrateSphereFlux(
  surface: GaussianSurface,
  charges: ChargeSI[],
  samples: number = 720
): number {
  const R = surface.radius;
  const totalArea = 4 * Math.PI * R * R;
  const dA = totalArea / samples;
  let fluxSum = 0;

  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < samples; i++) {
    const theta = 2 * Math.PI * i / goldenRatio;
    const phi = Math.acos(1 - 2 * (i + 0.5) / samples);

    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);

    const px = surface.cx + R * nx;
    const py = surface.cy + R * ny;
    const pz = 0 + R * nz;

    const E = calculateElectricField3D({ x: px, y: py, z: pz }, charges);
    const EdotN = E.x * nx + E.y * ny + E.z * nz;

    fluxSum += EdotN * dA;
  }

  return fluxSum;
}

/**
 * Discretizes a 3D rectangular cuboid / box (6 faces) centered at (cx, cy, 0).
 * Performs numerical surface integration Φ_E = ∬ E · dA.
 */
export function integrateBoxFlux(
  surface: GaussianSurface,
  charges: ChargeSI[],
  pointsPerSide: number = 14
): number {
  const halfW = surface.width / 2;
  const halfH = surface.height / 2;
  const halfD = Math.min(halfW, halfH); // Depth in z-axis

  let fluxSum = 0;

  // Face definition: [center_fixed_axis, fixed_val, normal_vector, range1, range2]
  const faces: {
    fixedAxis: 'x' | 'y' | 'z';
    fixedVal: number;
    normal: Vector3D;
    uRange: [number, number];
    vRange: [number, number];
    uAxis: 'x' | 'y' | 'z';
    vAxis: 'x' | 'y' | 'z';
  }[] = [
    // +X face
    {
      fixedAxis: 'x',
      fixedVal: surface.cx + halfW,
      normal: { x: 1, y: 0, z: 0 },
      uRange: [surface.cy - halfH, surface.cy + halfH],
      vRange: [-halfD, halfD],
      uAxis: 'y',
      vAxis: 'z'
    },
    // -X face
    {
      fixedAxis: 'x',
      fixedVal: surface.cx - halfW,
      normal: { x: -1, y: 0, z: 0 },
      uRange: [surface.cy - halfH, surface.cy + halfH],
      vRange: [-halfD, halfD],
      uAxis: 'y',
      vAxis: 'z'
    },
    // +Y face
    {
      fixedAxis: 'y',
      fixedVal: surface.cy + halfH,
      normal: { x: 0, y: 1, z: 0 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [-halfD, halfD],
      uAxis: 'x',
      vAxis: 'z'
    },
    // -Y face
    {
      fixedAxis: 'y',
      fixedVal: surface.cy - halfH,
      normal: { x: 0, y: -1, z: 0 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [-halfD, halfD],
      uAxis: 'x',
      vAxis: 'z'
    },
    // +Z face
    {
      fixedAxis: 'z',
      fixedVal: halfD,
      normal: { x: 0, y: 0, z: 1 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [surface.cy - halfH, surface.cy + halfH],
      uAxis: 'x',
      vAxis: 'y'
    },
    // -Z face
    {
      fixedAxis: 'z',
      fixedVal: -halfD,
      normal: { x: 0, y: 0, z: -1 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [surface.cy - halfH, surface.cy + halfH],
      uAxis: 'x',
      vAxis: 'y'
    }
  ];

  for (const face of faces) {
    const uStep = (face.uRange[1] - face.uRange[0]) / pointsPerSide;
    const vStep = (face.vRange[1] - face.vRange[0]) / pointsPerSide;
    const patchArea = uStep * vStep;

    for (let i = 0; i < pointsPerSide; i++) {
      const u = face.uRange[0] + (i + 0.5) * uStep;
      for (let j = 0; j < pointsPerSide; j++) {
        const v = face.vRange[0] + (j + 0.5) * vStep;

        const pos: Vector3D = { x: 0, y: 0, z: 0 };
        pos[face.fixedAxis] = face.fixedVal;
        pos[face.uAxis] = u;
        pos[face.vAxis] = v;

        const E = calculateElectricField3D(pos, charges);
        const EdotN = E.x * face.normal.x + E.y * face.normal.y + E.z * face.normal.z;
        fluxSum += EdotN * patchArea;
      }
    }
  }

  return fluxSum;
}

/**
 * Generates 2D surface elements along the perimeter of the surface
 * for visualization on canvas with their outward normals and local E field.
 */
export function generate2DSurfaceElements(
  surface: GaussianSurface,
  charges: ChargeSI[],
  numSegments: number = 48
): GaussSurfaceElement[] {
  const elements: GaussSurfaceElement[] = [];

  if (surface.shape === 'circle') {
    const dTheta = (2 * Math.PI) / numSegments;
    const dl = surface.radius * dTheta;
    const dA = (4 * Math.PI * surface.radius * surface.radius) / numSegments;

    for (let i = 0; i < numSegments; i++) {
      const angle = i * dTheta;
      const nx = Math.cos(angle);
      const ny = Math.sin(angle);
      const x = surface.cx + surface.radius * nx;
      const y = surface.cy + surface.radius * ny;

      const E = calculateElectricField2D({ x, y }, charges);
      const fluxDensity = E.x * nx + E.y * ny;

      elements.push({
        x,
        y,
        nx,
        ny,
        dl,
        dA,
        ex: E.x,
        ey: E.y,
        fluxDensity
      });
    }
  } else {
    // Rectangle perimeter elements
    const halfW = surface.width / 2;
    const halfH = surface.height / 2;
    const perimeter = 2 * (surface.width + surface.height);
    const segsH = Math.max(6, Math.round((surface.width / perimeter) * numSegments));
    const segsV = Math.max(6, Math.round((surface.height / perimeter) * numSegments));

    const totalArea = 2 * (surface.width * surface.height + surface.width * surface.height + surface.height * surface.height);
    const dA = totalArea / (2 * (segsH + segsV));

    // Top edge (y = cy - halfH, normal = 0, -1)
    const dxTop = surface.width / segsH;
    for (let i = 0; i < segsH; i++) {
      const x = surface.cx - halfW + (i + 0.5) * dxTop;
      const y = surface.cy - halfH;
      const nx = 0;
      const ny = -1;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({
        x, y, nx, ny, dl: dxTop, dA,
        ex: E.x, ey: E.y, fluxDensity: E.x * nx + E.y * ny
      });
    }

    // Right edge (x = cx + halfW, normal = 1, 0)
    const dyRight = surface.height / segsV;
    for (let i = 0; i < segsV; i++) {
      const x = surface.cx + halfW;
      const y = surface.cy - halfH + (i + 0.5) * dyRight;
      const nx = 1;
      const ny = 0;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({
        x, y, nx, ny, dl: dyRight, dA,
        ex: E.x, ey: E.y, fluxDensity: E.x * nx + E.y * ny
      });
    }

    // Bottom edge (y = cy + halfH, normal = 0, 1)
    for (let i = segsH - 1; i >= 0; i--) {
      const x = surface.cx - halfW + (i + 0.5) * dxTop;
      const y = surface.cy + halfH;
      const nx = 0;
      const ny = 1;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({
        x, y, nx, ny, dl: dxTop, dA,
        ex: E.x, ey: E.y, fluxDensity: E.x * nx + E.y * ny
      });
    }

    // Left edge (x = cx - halfW, normal = -1, 0)
    for (let i = segsV - 1; i >= 0; i--) {
      const x = surface.cx - halfW;
      const y = surface.cy - halfH + (i + 0.5) * dyRight;
      const nx = -1;
      const ny = 0;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({
        x, y, nx, ny, dl: dyRight, dA,
        ex: E.x, ey: E.y, fluxDensity: E.x * nx + E.y * ny
      });
    }
  }

  return elements;
}

/**
 * Computes the full Gauss's Law verification:
 *   Φ_theo = Q_enc / ε₀
 *   Φ_num = ∬ E · dA
 *   Error = |Φ_num - Φ_theo| / max(|Φ_theo|, 1e-9)
 */
export function computeGaussLaw(
  surface: GaussianSurface,
  charges: ChargeSI[],
  num2dSegments: number = 48
): GaussCalculation {
  const enclosedCharge = calculateEnclosedCharge(charges, surface);
  const theoreticalFlux = enclosedCharge / EPSILON_0;

  let numericalFlux = 0;
  if (surface.shape === 'circle') {
    numericalFlux = integrateSphereFlux(surface, charges, 720);
  } else {
    numericalFlux = integrateBoxFlux(surface, charges, 14);
  }

  // Calculate error
  let relativeError = 0;
  if (Math.abs(theoreticalFlux) > 1e-5) {
    relativeError = Math.abs((numericalFlux - theoreticalFlux) / theoreticalFlux);
  } else {
    // If theoretical flux is 0 (no enclosed charge), numerical flux should be ~0
    relativeError = Math.abs(numericalFlux);
  }

  const elements = generate2DSurfaceElements(surface, charges, num2dSegments);

  return {
    enclosedCharge,
    theoreticalFlux,
    numericalFlux,
    relativeError,
    elements
  };
}

// =========================================================================
// 3D GAUSS'S LAW ENGINE: NON-UNIFORM FIELDS & CLOSED 3D VOLUMETRIC BODIES
// =========================================================================

/**
 * Evaluates the non-uniform electric field E (in N/C) at any 3D coordinate.
 */
export function evaluateNonUniformField(
  pos: Vector3D,
  params: NonUniformFieldParams,
  center: Vector3D = { x: 0, y: 0, z: 0 }
): Vector3D {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  const dz = pos.z - center.z;

  switch (params.model) {
    case 'linear_x':
      // E = (alpha * x + beta) i
      return {
        x: params.alpha * pos.x + params.beta,
        y: 0,
        z: 0
      };

    case 'quadratic_x':
      // E = (alpha * x^2 + beta) i
      return {
        x: params.alpha * pos.x * pos.x + params.beta,
        y: 0,
        z: 0
      };

    case 'divergent_xyz':
      // E = alpha * x i + beta * y j + gamma * z k
      return {
        x: params.alpha * pos.x,
        y: params.beta * pos.y,
        z: params.gamma * pos.z
      };

    case 'radial_cylinder': {
      // E = alpha * (x i + y j) / r^2 (approximates infinite line of charge)
      const r2 = dx * dx + dy * dy + 1e-6;
      const factor = params.alpha / r2;
      return {
        x: factor * dx,
        y: factor * dy,
        z: params.gamma * dz
      };
    }

    case 'point_charge': {
      // E = (k_e * Q / r^3) * r (Coulomb point charge field at center)
      const qC = params.chargeQ * 1e-9;
      const r2 = dx * dx + dy * dy + dz * dz + 1e-6;
      const r3 = Math.sqrt(r2) * r2;
      const factor = (COULOMB_KE * qC) / r3;
      return {
        x: factor * dx,
        y: factor * dy,
        z: factor * dz
      };
    }

    default:
      return { x: params.alpha, y: 0, z: 0 };
  }
}

/**
 * Theoretical divergence ∇·E at a given point for Divergence Theorem calculations.
 */
export function evaluateFieldDivergence(
  pos: Vector3D,
  params: NonUniformFieldParams
): number {
  switch (params.model) {
    case 'linear_x':
      return params.alpha;
    case 'quadratic_x':
      return 2 * params.alpha * pos.x;
    case 'divergent_xyz':
      return params.alpha + params.beta + params.gamma;
    case 'radial_cylinder':
      return 0; // divergence is 0 everywhere outside the line source
    case 'point_charge':
      return 0; // divergence is 0 everywhere outside origin
    default:
      return 0;
  }
}

/**
 * Numerical integration of flux on each of the 6 faces of a 3D rectangular box/cube.
 */
export function integrateBox3DFaces(
  center: Vector3D,
  size: { lx: number; ly: number; lz: number },
  params: NonUniformFieldParams,
  gridN: number = 16
): FaceFluxResult[] {
  const halfX = size.lx / 2;
  const halfY = size.ly / 2;
  const halfZ = size.lz / 2;

  interface FaceDef {
    id: string;
    name: string;
    normal: Vector3D;
    area: number;
    center: Vector3D;
    uRange: [number, number];
    vRange: [number, number];
    pointAt: (u: number, v: number) => Vector3D;
  }

  const faceDefs: FaceDef[] = [
    {
      id: 'face_px',
      name: 'Cara Derecha (+X)',
      normal: { x: 1, y: 0, z: 0 },
      area: size.ly * size.lz,
      center: { x: center.x + halfX, y: center.y, z: center.z },
      uRange: [center.y - halfY, center.y + halfY],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: center.x + halfX, y: u, z: v })
    },
    {
      id: 'face_nx',
      name: 'Cara Izquierda (−X)',
      normal: { x: -1, y: 0, z: 0 },
      area: size.ly * size.lz,
      center: { x: center.x - halfX, y: center.y, z: center.z },
      uRange: [center.y - halfY, center.y + halfY],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: center.x - halfX, y: u, z: v })
    },
    {
      id: 'face_py',
      name: 'Cara Superior (+Y)',
      normal: { x: 0, y: 1, z: 0 },
      area: size.lx * size.lz,
      center: { x: center.x, y: center.y + halfY, z: center.z },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: u, y: center.y + halfY, z: v })
    },
    {
      id: 'face_ny',
      name: 'Cara Inferior (−Y)',
      normal: { x: 0, y: -1, z: 0 },
      area: size.lx * size.lz,
      center: { x: center.x, y: center.y - halfY, z: center.z },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: u, y: center.y - halfY, z: v })
    },
    {
      id: 'face_pz',
      name: 'Cara Frontal (+Z)',
      normal: { x: 0, y: 0, z: 1 },
      area: size.lx * size.ly,
      center: { x: center.x, y: center.y, z: center.z + halfZ },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.y - halfY, center.y + halfY],
      pointAt: (u, v) => ({ x: u, y: v, z: center.z + halfZ })
    },
    {
      id: 'face_nz',
      name: 'Cara Trasera (−Z)',
      normal: { x: 0, y: 0, z: -1 },
      area: size.lx * size.ly,
      center: { x: center.x, y: center.y, z: center.z - halfZ },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.y - halfY, center.y + halfY],
      pointAt: (u, v) => ({ x: u, y: v, z: center.z - halfZ })
    }
  ];

  return faceDefs.map((face) => {
    const du = (face.uRange[1] - face.uRange[0]) / gridN;
    const dv = (face.vRange[1] - face.vRange[0]) / gridN;
    const dA = du * dv;
    let faceFlux = 0;

    for (let i = 0; i < gridN; i++) {
      const u = face.uRange[0] + (i + 0.5) * du;
      for (let j = 0; j < gridN; j++) {
        const v = face.vRange[0] + (j + 0.5) * dv;
        const pt = face.pointAt(u, v);
        const E = evaluateNonUniformField(pt, params, center);
        const EdotN = E.x * face.normal.x + E.y * face.normal.y + E.z * face.normal.z;
        faceFlux += EdotN * dA;
      }
    }

    return {
      id: face.id,
      name: face.name,
      area: face.area,
      flux: faceFlux,
      normal: face.normal,
      center: face.center,
      fluxDensityAvg: faceFlux / face.area
    };
  });
}

/**
 * Numerical integration of flux on a 3D Cylinder (Top cap, Bottom cap, Lateral mantle).
 */
export function integrateCylinder3DFaces(
  center: Vector3D,
  radius: number,
  height: number,
  params: NonUniformFieldParams,
  radialRings: number = 10,
  angularSteps: number = 32,
  heightSteps: number = 16
): FaceFluxResult[] {
  const halfH = height / 2;
  const capArea = Math.PI * radius * radius;
  const mantleArea = 2 * Math.PI * radius * height;

  // 1. Top Cap (+Z)
  let topFlux = 0;
  const topNormal: Vector3D = { x: 0, y: 0, z: 1 };
  const dR = radius / radialRings;
  const dTheta = (2 * Math.PI) / angularSteps;

  for (let i = 0; i < radialRings; i++) {
    const r = (i + 0.5) * dR;
    const ringArea = ((i + 1) * (i + 1) - i * i) * dR * dR * Math.PI;
    const dSectorA = ringArea / angularSteps;

    for (let j = 0; j < angularSteps; j++) {
      const th = (j + 0.5) * dTheta;
      const pt: Vector3D = {
        x: center.x + r * Math.cos(th),
        y: center.y + r * Math.sin(th),
        z: center.z + halfH
      };
      const E = evaluateNonUniformField(pt, params, center);
      topFlux += (E.z * topNormal.z) * dSectorA;
    }
  }

  // 2. Bottom Cap (-Z)
  let bottomFlux = 0;
  const bottomNormal: Vector3D = { x: 0, y: 0, z: -1 };

  for (let i = 0; i < radialRings; i++) {
    const r = (i + 0.5) * dR;
    const ringArea = ((i + 1) * (i + 1) - i * i) * dR * dR * Math.PI;
    const dSectorA = ringArea / angularSteps;

    for (let j = 0; j < angularSteps; j++) {
      const th = (j + 0.5) * dTheta;
      const pt: Vector3D = {
        x: center.x + r * Math.cos(th),
        y: center.y + r * Math.sin(th),
        z: center.z - halfH
      };
      const E = evaluateNonUniformField(pt, params, center);
      bottomFlux += (E.z * bottomNormal.z) * dSectorA;
    }
  }

  // 3. Curved Mantle (lateral)
  let mantleFlux = 0;
  const dZ = height / heightSteps;
  const dMantleA = (radius * dTheta) * dZ;

  for (let i = 0; i < heightSteps; i++) {
    const z = center.z - halfH + (i + 0.5) * dZ;
    for (let j = 0; j < angularSteps; j++) {
      const th = (j + 0.5) * dTheta;
      const nx = Math.cos(th);
      const ny = Math.sin(th);
      const pt: Vector3D = {
        x: center.x + radius * nx,
        y: center.y + radius * ny,
        z
      };
      const E = evaluateNonUniformField(pt, params, center);
      const EdotN = E.x * nx + E.y * ny;
      mantleFlux += EdotN * dMantleA;
    }
  }

  return [
    {
      id: 'cap_top',
      name: 'Tapa Superior (+Z)',
      area: capArea,
      flux: topFlux,
      normal: topNormal,
      center: { x: center.x, y: center.y, z: center.z + halfH },
      fluxDensityAvg: topFlux / capArea
    },
    {
      id: 'cap_bottom',
      name: 'Tapa Inferior (−Z)',
      area: capArea,
      flux: bottomFlux,
      normal: bottomNormal,
      center: { x: center.x, y: center.y, z: center.z - halfH },
      fluxDensityAvg: bottomFlux / capArea
    },
    {
      id: 'mantle',
      name: 'Manto Lateral Cilíndrico',
      area: mantleArea,
      flux: mantleFlux,
      normal: { x: 1, y: 0, z: 0 }, // Representative outward radial
      center: { x: center.x, y: center.y, z: center.z },
      fluxDensityAvg: mantleFlux / mantleArea
    }
  ];
}

/**
 * Numerical integration of flux on a 3D Regular Tetrahedron.
 * Centered at `center` with scale radius `s`.
 * 4 triangular faces, integrating E · n dA using high-order barycentric sub-triangulation.
 */
export function integrateTetrahedron3DFaces(
  center: Vector3D,
  scale: number,
  params: NonUniformFieldParams,
  subdivN: number = 16
): FaceFluxResult[] {
  const s = scale;
  // 4 canonical vertices of a regular tetrahedron centered at (0,0,0)
  const v0: Vector3D = { x: center.x + s, y: center.y + s, z: center.z + s };
  const v1: Vector3D = { x: center.x + s, y: center.y - s, z: center.z - s };
  const v2: Vector3D = { x: center.x - s, y: center.y + s, z: center.z - s };
  const v3: Vector3D = { x: center.x - s, y: center.y - s, z: center.z + s };

  interface TriFace {
    id: string;
    name: string;
    a: Vector3D;
    b: Vector3D;
    c: Vector3D;
  }

  const faces: TriFace[] = [
    { id: 'tetra_face1', name: 'Cara 1 (+X+Y)', a: v0, b: v1, c: v2 },
    { id: 'tetra_face2', name: 'Cara 2 (+Y+Z)', a: v0, b: v2, c: v3 },
    { id: 'tetra_face3', name: 'Cara 3 (+X+Z)', a: v0, b: v3, c: v1 },
    { id: 'tetra_face4', name: 'Cara 4 (Base Inf.)', a: v1, b: v3, c: v2 }
  ];

  return faces.map((f) => {
    // Cross product (b - a) x (c - a)
    const abx = f.b.x - f.a.x;
    const aby = f.b.y - f.a.y;
    const abz = f.b.z - f.a.z;

    const acx = f.c.x - f.a.x;
    const acy = f.c.y - f.a.y;
    const acz = f.c.z - f.a.z;

    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const mag = Math.hypot(nx, ny, nz);

    // Face centroid
    const fc: Vector3D = {
      x: (f.a.x + f.b.x + f.c.x) / 3,
      y: (f.a.y + f.b.y + f.c.y) / 3,
      z: (f.a.z + f.b.z + f.c.z) / 3
    };

    // Orient normal outward (away from tetrahedron center)
    const toFaceX = fc.x - center.x;
    const toFaceY = fc.y - center.y;
    const toFaceZ = fc.z - center.z;
    if (nx * toFaceX + ny * toFaceY + nz * toFaceZ < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }

    const unx = nx / mag;
    const uny = ny / mag;
    const unz = nz / mag;

    const faceArea = 0.5 * mag;
    const totalSubTris = subdivN * subdivN;
    const dSubA = faceArea / totalSubTris;

    let faceFlux = 0;

    // Subdivide triangle into subdivN x subdivN mini-triangles
    for (let i = 0; i < subdivN; i++) {
      for (let j = 0; j < subdivN - i; j++) {
        // Sub-triangle 1 (upright)
        const u1 = (i + 1 / 3) / subdivN;
        const v1 = (j + 1 / 3) / subdivN;
        const w1 = 1 - u1 - v1;
        const p1: Vector3D = {
          x: w1 * f.a.x + u1 * f.b.x + v1 * f.c.x,
          y: w1 * f.a.y + u1 * f.b.y + v1 * f.c.y,
          z: w1 * f.a.z + u1 * f.b.z + v1 * f.c.z
        };
        const E1 = evaluateNonUniformField(p1, params, center);
        faceFlux += (E1.x * unx + E1.y * uny + E1.z * unz) * dSubA;

        // Sub-triangle 2 (inverted, exists if not on diagonal)
        if (i + j < subdivN - 1) {
          const u2 = (i + 2 / 3) / subdivN;
          const v2 = (j + 2 / 3) / subdivN;
          const w2 = 1 - u2 - v2;
          const p2: Vector3D = {
            x: w2 * f.a.x + u2 * f.b.x + v2 * f.c.x,
            y: w2 * f.a.y + u2 * f.b.y + v2 * f.c.y,
            z: w2 * f.a.z + u2 * f.b.z + v2 * f.c.z
          };
          const E2 = evaluateNonUniformField(p2, params, center);
          faceFlux += (E2.x * unx + E2.y * uny + E2.z * unz) * dSubA;
        }
      }
    }

    return {
      id: f.id,
      name: f.name,
      area: faceArea,
      flux: faceFlux,
      normal: { x: unx, y: uny, z: unz },
      center: fc,
      fluxDensityAvg: faceFlux / faceArea
    };
  });
}

/**
 * Numerical integration of flux on a 3D Sphere using Fibonacci spiral sampling.
 */
export function integrateSphere3DFaces(
  center: Vector3D,
  radius: number,
  params: NonUniformFieldParams,
  samples: number = 720
): FaceFluxResult[] {
  const totalArea = 4 * Math.PI * radius * radius;
  const dA = totalArea / samples;
  let totalFlux = 0;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < samples; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / samples);

    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);

    const pt: Vector3D = {
      x: center.x + radius * nx,
      y: center.y + radius * ny,
      z: center.z + radius * nz
    };

    const E = evaluateNonUniformField(pt, params, center);
    const EdotN = E.x * nx + E.y * ny + E.z * nz;
    totalFlux += EdotN * dA;
  }

  return [
    {
      id: 'sphere_total',
      name: 'Superficie Esférica Continua',
      area: totalArea,
      flux: totalFlux,
      normal: { x: 1, y: 0, z: 0 },
      center,
      fluxDensityAvg: totalFlux / totalArea
    }
  ];
}

/**
 * Full 3D Gauss Solver:
 * Calculates flux cara-por-cara, total flux, enclosed charge (Q_enc = Φ · ε0),
 * volume divergence theoretical charge, and relative error.
 */
export function computeGauss3D(
  shape: GaussianShape3D,
  center: Vector3D,
  dimensions: { size: number; radius: number; height: number },
  params: NonUniformFieldParams
): Gauss3DCalculation {
  let faces: FaceFluxResult[] = [];
  let volume = 0;

  if (shape === 'cube') {
    const s = dimensions.size;
    volume = s * s * s;
    faces = integrateBox3DFaces(center, { lx: s, ly: s, lz: s }, params, 16);
  } else if (shape === 'cylinder') {
    const r = dimensions.radius;
    const h = dimensions.height;
    volume = Math.PI * r * r * h;
    faces = integrateCylinder3DFaces(center, r, h, params, 10, 32, 16);
  } else if (shape === 'tetrahedron') {
    const s = dimensions.size * 0.7; // scale factor
    // Volume of regular tetrahedron V = (8/3) * s^3
    volume = (8 / 3) * s * s * s;
    faces = integrateTetrahedron3DFaces(center, s, params, 16);
  } else {
    // sphere
    const r = dimensions.radius;
    volume = (4 / 3) * Math.PI * r * r * r;
    faces = integrateSphere3DFaces(center, r, params, 720);
  }

  const totalFlux = faces.reduce((sum, f) => sum + f.flux, 0);
  const enclosedCharge = totalFlux * EPSILON_0;

  // Theoretical divergence integration over volume
  const divAtCenter = evaluateFieldDivergence(center, params);
  const theoreticalChargeFromDivergence = divAtCenter * volume * EPSILON_0;

  // Relative error comparison between Divergence Theorem and Surface Integral
  let relativeError = 0;
  if (Math.abs(theoreticalChargeFromDivergence) > 1e-18) {
    relativeError =
      Math.abs((enclosedCharge - theoreticalChargeFromDivergence) / theoreticalChargeFromDivergence) *
      100;
  } else {
    relativeError = Math.abs(enclosedCharge) * 1e12; // in picocoulombs if near zero
  }

  return {
    shape,
    totalFlux,
    enclosedCharge,
    theoreticalChargeFromDivergence,
    divergenceAvg: divAtCenter,
    volume,
    relativeError,
    faces
  };
}
