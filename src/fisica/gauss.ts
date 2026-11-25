/**
 * Gauss's Law & Electric Flux Numerical Physics Engine
 * Universidad Popular del Cesar (UPC)
 *
 * Physical Law:
 *   Φ_E = ∮_S E · dA = Q_enc / ε₀
 */

import type {
  GaussianSurface,
  GaussSurfaceElement,
  GaussCalculation,
  Vector2D,
  Vector3D
} from '../tipos';

export const EPSILON_0 = 8.8541878128e-12; // F/m or C²/(N·m²)
export const COULOMB_KE = 1 / (4 * Math.PI * EPSILON_0); // ≈ 8.9875517923e9 N·m²/C²

export interface ChargeSI {
  id: string;
  x: number; // in meters
  y: number; // in meters
  charge: number; // in Coulombs (e.g. 1e-9 C = 1 nC)
}

export function calculateElectricField3D(pos: Vector3D, charges: ChargeSI[]): Vector3D {
  let ex = 0;
  let ey = 0;
  let ez = 0;
  const softening = 1e-7;

  for (const c of charges) {
    const dx = pos.x - c.x;
    const dy = pos.y - c.y;
    const dz = pos.z;

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

export function calculateElectricField2D(pos: Vector2D, charges: ChargeSI[]): Vector2D {
  const e3d = calculateElectricField3D({ x: pos.x, y: pos.y, z: 0 }, charges);
  return { x: e3d.x, y: e3d.y };
}

export function isChargeEnclosed(charge: ChargeSI, surface: GaussianSurface): boolean {
  if (surface.shape === 'circle') {
    const distSq = (charge.x - surface.cx) ** 2 + (charge.y - surface.cy) ** 2;
    return distSq < surface.radius * surface.radius;
  }
  const halfW = surface.width / 2;
  const halfH = surface.height / 2;
  return Math.abs(charge.x - surface.cx) < halfW && Math.abs(charge.y - surface.cy) < halfH;
}

export function calculateEnclosedCharge(charges: ChargeSI[], surface: GaussianSurface): number {
  let qEnc = 0;
  for (const c of charges) {
    if (isChargeEnclosed(c, surface)) {
      qEnc += c.charge;
    }
  }
  return qEnc;
}

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
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / samples);

    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);

    const px = surface.cx + R * nx;
    const py = surface.cy + R * ny;
    const pz = R * nz;

    const E = calculateElectricField3D({ x: px, y: py, z: pz }, charges);
    fluxSum += (E.x * nx + E.y * ny + E.z * nz) * dA;
  }

  return fluxSum;
}

export function integrateBoxFlux(
  surface: GaussianSurface,
  charges: ChargeSI[],
  pointsPerSide: number = 14
): number {
  const halfW = surface.width / 2;
  const halfH = surface.height / 2;
  const halfD = Math.min(halfW, halfH);
  let fluxSum = 0;

  const faces: {
    fixedAxis: 'x' | 'y' | 'z';
    fixedVal: number;
    normal: Vector3D;
    uRange: [number, number];
    vRange: [number, number];
    uAxis: 'x' | 'y' | 'z';
    vAxis: 'x' | 'y' | 'z';
  }[] = [
    {
      fixedAxis: 'x',
      fixedVal: surface.cx + halfW,
      normal: { x: 1, y: 0, z: 0 },
      uRange: [surface.cy - halfH, surface.cy + halfH],
      vRange: [-halfD, halfD],
      uAxis: 'y',
      vAxis: 'z'
    },
    {
      fixedAxis: 'x',
      fixedVal: surface.cx - halfW,
      normal: { x: -1, y: 0, z: 0 },
      uRange: [surface.cy - halfH, surface.cy + halfH],
      vRange: [-halfD, halfD],
      uAxis: 'y',
      vAxis: 'z'
    },
    {
      fixedAxis: 'y',
      fixedVal: surface.cy + halfH,
      normal: { x: 0, y: 1, z: 0 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [-halfD, halfD],
      uAxis: 'x',
      vAxis: 'z'
    },
    {
      fixedAxis: 'y',
      fixedVal: surface.cy - halfH,
      normal: { x: 0, y: -1, z: 0 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [-halfD, halfD],
      uAxis: 'x',
      vAxis: 'z'
    },
    {
      fixedAxis: 'z',
      fixedVal: halfD,
      normal: { x: 0, y: 0, z: 1 },
      uRange: [surface.cx - halfW, surface.cx + halfW],
      vRange: [surface.cy - halfH, surface.cy + halfH],
      uAxis: 'x',
      vAxis: 'y'
    },
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
        fluxSum += (E.x * face.normal.x + E.y * face.normal.y + E.z * face.normal.z) * patchArea;
      }
    }
  }

  return fluxSum;
}

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
      elements.push({
        x,
        y,
        nx,
        ny,
        dl,
        dA,
        ex: E.x,
        ey: E.y,
        fluxDensity: E.x * nx + E.y * ny
      });
    }
  } else {
    const halfW = surface.width / 2;
    const halfH = surface.height / 2;
    const perimeter = 2 * (surface.width + surface.height);
    const segsH = Math.max(6, Math.round((surface.width / perimeter) * numSegments));
    const segsV = Math.max(6, Math.round((surface.height / perimeter) * numSegments));
    const totalArea =
      2 * (surface.width * surface.height + surface.width * surface.height + surface.height * surface.height);
    const dA = totalArea / (2 * (segsH + segsV));

    const dxTop = surface.width / segsH;
    for (let i = 0; i < segsH; i++) {
      const x = surface.cx - halfW + (i + 0.5) * dxTop;
      const y = surface.cy - halfH;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({ x, y, nx: 0, ny: -1, dl: dxTop, dA, ex: E.x, ey: E.y, fluxDensity: -E.y });
    }

    const dyRight = surface.height / segsV;
    for (let i = 0; i < segsV; i++) {
      const x = surface.cx + halfW;
      const y = surface.cy - halfH + (i + 0.5) * dyRight;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({ x, y, nx: 1, ny: 0, dl: dyRight, dA, ex: E.x, ey: E.y, fluxDensity: E.x });
    }

    for (let i = segsH - 1; i >= 0; i--) {
      const x = surface.cx - halfW + (i + 0.5) * dxTop;
      const y = surface.cy + halfH;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({ x, y, nx: 0, ny: 1, dl: dxTop, dA, ex: E.x, ey: E.y, fluxDensity: E.y });
    }

    for (let i = segsV - 1; i >= 0; i--) {
      const x = surface.cx - halfW;
      const y = surface.cy - halfH + (i + 0.5) * dyRight;
      const E = calculateElectricField2D({ x, y }, charges);
      elements.push({ x, y, nx: -1, ny: 0, dl: dyRight, dA, ex: E.x, ey: E.y, fluxDensity: -E.x });
    }
  }

  return elements;
}

export function computeGaussLaw(
  surface: GaussianSurface,
  charges: ChargeSI[],
  num2dSegments: number = 48
): GaussCalculation {
  const enclosedCharge = calculateEnclosedCharge(charges, surface);
  const theoreticalFlux = enclosedCharge / EPSILON_0;

  const numericalFlux =
    surface.shape === 'circle'
      ? integrateSphereFlux(surface, charges, 720)
      : integrateBoxFlux(surface, charges, 14);

  let relativeError = 0;
  if (Math.abs(theoreticalFlux) > 1e-5) {
    relativeError = Math.abs((numericalFlux - theoreticalFlux) / theoreticalFlux);
  } else {
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

export * from './gauss3d';
