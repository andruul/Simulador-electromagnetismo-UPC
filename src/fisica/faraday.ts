/**
 * Faraday's Law & Electromagnetic Induction Physics Engine
 * Universidad Popular del Cesar (UPC)
 * 
 * Physical Law:
 *   ε = -N (dΦ_B / dt)   (Faraday & Lenz)
 * 
 * SI Units:
 *   Magnetic Field B in Tesla (T)
 *   Magnetic Flux Φ_B in Webers (Wb = T·m²)
 *   Induced EMF ε in Volts (V)
 *   Induced Current I in Amperes (A)
 *   Power P in Watts (W)
 */

import type { Vector2D, Vector3D } from '../tipos';

export const MU_0 = 4 * Math.PI * 1e-7; // T·m/A
export const MAG_SCALE = 1e-7; // μ₀ / 4π

export interface BarMagnet {
  x: number;       // center x in meters
  y: number;       // center y in meters
  length: number;  // meters (e.g. 0.12 m)
  width: number;   // meters (e.g. 0.03 m)
  angle: number;   // orientation angle in radians (0 = horizontal N on right)
  poleStrength: number; // magnetic charge q_m in A·m (e.g. 1500)
}

export interface InductionCoil {
  x: number;       // center x in meters
  y: number;       // center y in meters
  radius: number;  // coil radius in meters (e.g. 0.05 m)
  turns: number;   // N = 1, 2, 3, 4
  resistancePerTurn: number; // Ω
  normal: Vector2D;// orientation normal (typically { x: 1, y: 0 })
}

/**
 * Calculates the positions of North (+q_m) and South (-q_m) poles.
 */
export function getMagnetPoles(magnet: BarMagnet): {
  north: Vector2D;
  south: Vector2D;
} {
  const halfL = magnet.length / 2;
  const cosA = Math.cos(magnet.angle);
  const sinA = Math.sin(magnet.angle);

  return {
    north: {
      x: magnet.x + halfL * cosA,
      y: magnet.y + halfL * sinA
    },
    south: {
      x: magnet.x - halfL * cosA,
      y: magnet.y - halfL * sinA
    }
  };
}

/**
 * Numerical regularization of the magnetic pole singularity (m²).
 * Equivalent to a core radius of √1e-5 ≈ 3.2 mm: the field is capped inside the
 * magnet body and is only needed to avoid NaN/Infinity at a pole center.
 * For r >> 3.2 mm the relative bias of the field is ≈ 1.5·softening/r² (see tests).
 */
export const POLE_SOFTENING_M2 = 1e-7;

/**
 * Magnetic field B (Tesla) at the 3D point (x, y, z) due to the bar magnet, modelled
 * as two magnetic charges ±q_m placed in the z = 0 plane:
 * B(r) = (μ₀ / 4π) * q_m * [ (r - r_N) / |r - r_N|³ - (r - r_S) / |r - r_S|³ ]
 */
export function calculateMagneticField3D(
  x: number,
  y: number,
  z: number,
  magnet: BarMagnet
): Vector3D {
  const { north, south } = getMagnetPoles(magnet);

  // From North pole (+q_m)
  const dxN = x - north.x;
  const dyN = y - north.y;
  const rN2 = dxN * dxN + dyN * dyN + z * z + POLE_SOFTENING_M2;
  const factorN = (MAG_SCALE * magnet.poleStrength) / (Math.sqrt(rN2) * rN2);

  // From South pole (-q_m)
  const dxS = x - south.x;
  const dyS = y - south.y;
  const rS2 = dxS * dxS + dyS * dyS + z * z + POLE_SOFTENING_M2;
  const factorS = (MAG_SCALE * magnet.poleStrength) / (Math.sqrt(rS2) * rS2);

  return {
    x: factorN * dxN - factorS * dxS,
    y: factorN * dyN - factorS * dyS,
    z: (factorN - factorS) * z
  };
}

/**
 * Magnetic field B at pos in the z = 0 plane (the plane drawn on screen).
 */
export function calculateMagneticField(
  pos: Vector2D,
  magnet: BarMagnet
): Vector2D {
  const b = calculateMagneticField3D(pos.x, pos.y, 0, magnet);
  return { x: b.x, y: b.y };
}

const gaussLegendreCache = new Map<number, { nodes: number[]; weights: number[] }>();

/**
 * Gauss-Legendre nodes and weights on [-1, 1] (Newton iteration on P_n).
 */
export function gaussLegendre(n: number): { nodes: number[]; weights: number[] } {
  const cached = gaussLegendreCache.get(n);
  if (cached) return cached;

  const nodes: number[] = new Array<number>(n).fill(0);
  const weights: number[] = new Array<number>(n).fill(0);
  for (let i = 0; i < n; i++) {
    let x = Math.cos((Math.PI * (i + 0.75)) / (n + 0.5));
    let dp = 1;
    for (let iter = 0; iter < 100; iter++) {
      let p0 = 1;
      let p1 = x;
      for (let k = 2; k <= n; k++) {
        const p2 = ((2 * k - 1) * x * p1 - (k - 1) * p0) / k;
        p0 = p1;
        p1 = p2;
      }
      dp = (n * (x * p1 - p0)) / (x * x - 1);
      const dx = p1 / dp;
      x -= dx;
      if (Math.abs(dx) < 1e-15) break;
    }
    nodes[i] = x;
    weights[i] = 2 / ((1 - x * x) * dp * dp);
  }
  const result = { nodes, weights };
  gaussLegendreCache.set(n, result);
  return result;
}

/**
 * Numerically computes the magnetic flux Φ_B through ONE loop of the coil:
 *   Φ_B = ∬_Disk B · n dA
 * The loop is a circular disk of radius R whose axis (normal n) lies in the screen
 * plane. The disk therefore extends along the in-plane tangent t = (-n_y, n_x) and
 * along the out-of-screen z axis; B is evaluated with its full z dependence.
 *
 * Polar quadrature: Gauss-Legendre in r (radialNodes points) × uniform midpoint rule
 * in θ (2·radialNodes points, spectrally accurate for periodic integrands).
 */
export function calculateCoilFlux(
  coil: InductionCoil,
  magnet: BarMagnet,
  radialNodes: number = 16
): number {
  const R = coil.radius;
  const nMag = Math.hypot(coil.normal.x, coil.normal.y);
  if (nMag === 0 || R <= 0) return 0;
  const nx = coil.normal.x / nMag;
  const ny = coil.normal.y / nMag;
  const tx = -ny;
  const ty = nx;

  const nRadial = Math.max(1, Math.floor(radialNodes));
  const { nodes, weights } = gaussLegendre(nRadial);
  const angular = Math.max(8, 2 * nRadial);
  const dTheta = (2 * Math.PI) / angular;

  let flux = 0;
  for (let i = 0; i < nodes.length; i++) {
    const r = (R * (nodes[i] + 1)) / 2;
    const wr = (R / 2) * weights[i];
    let ring = 0;
    for (let j = 0; j < angular; j++) {
      const theta = (j + 0.5) * dTheta;
      const u = r * Math.cos(theta);
      const v = r * Math.sin(theta);
      const B = calculateMagneticField3D(coil.x + u * tx, coil.y + u * ty, v, magnet);
      ring += B.x * nx + B.y * ny;
    }
    flux += wr * r * ring * dTheta;
  }

  return flux;
}

/**
 * Traces a magnetic field line from startPos using RK4.
 */
export function traceMagneticFieldLine(
  startPos: Vector2D,
  magnet: BarMagnet,
  stepSize: number = 0.005, // meters
  maxSteps: number = 180,
  bounds: { minX: number; maxX: number; minY: number; maxY: number }
): Vector2D[] {
  const points: Vector2D[] = [startPos];
  let cur = { ...startPos };
  const { south } = getMagnetPoles(magnet);

  for (let i = 0; i < maxSteps; i++) {
    // Check bounds
    if (
      cur.x < bounds.minX ||
      cur.x > bounds.maxX ||
      cur.y < bounds.minY ||
      cur.y > bounds.maxY
    ) {
      break;
    }

    // Check if reached South pole (absorption)
    const distToSouth = Math.hypot(cur.x - south.x, cur.y - south.y);
    if (distToSouth < 0.015) {
      points.push({ ...south });
      break;
    }

    // RK4 step along B direction
    const getDirection = (p: Vector2D): Vector2D => {
      const B = calculateMagneticField(p, magnet);
      const mag = Math.hypot(B.x, B.y);
      if (mag < 1e-9) return { x: 0, y: 0 };
      return { x: B.x / mag, y: B.y / mag };
    };

    const k1 = getDirection(cur);
    const k2 = getDirection({
      x: cur.x + k1.x * stepSize * 0.5,
      y: cur.y + k1.y * stepSize * 0.5
    });
    const k3 = getDirection({
      x: cur.x + k2.x * stepSize * 0.5,
      y: cur.y + k2.y * stepSize * 0.5
    });
    const k4 = getDirection({
      x: cur.x + k3.x * stepSize,
      y: cur.y + k3.y * stepSize
    });

    const dx = (stepSize / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
    const dy = (stepSize / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);

    cur = { x: cur.x + dx, y: cur.y + dy };
    points.push({ ...cur });
  }

  return points;
}

/**
 * Power at which the bulb reaches full brightness (W).
 * The flux is now integrated over the real 3D disk (see calculateCoilFlux), which is
 * ~4.3x smaller than the previous planar approximation near the coil, so a miniature
 * 0.13 W lamp (instead of 2.5 W) keeps the demonstration as bright as before.
 */
export const BULB_SATURATION_POWER_W = 0.13;

/**
 * Full induction solver calculating:
 *   - Current Flux Φ_B
 *   - dΦ_B / dt
 *   - Induced EMF: ε = -N (dΦ_B / dt)   (With explicit minus sign for Lenz's Law)
 *   - Induced current: I = ε / R_total
 *   - Bulb Power: P = I² * R_bulb
 *   - Induced Magnetic Field B_ind at coil center opposing ΔΦ
 */
export function computeFaradayInduction(
  currentFlux: number,
  previousFlux: number,
  dt: number,
  coil: InductionCoil,
  bulbResistance: number = 10 // Ω
): {
  dFluxDt: number;
  inducedEmf: number;
  inducedCurrent: number;
  bulbPower: number;
  bulbBrightness: number; // 0 to 1
  opposingBFieldX: number; // Lenz's Law direction
} {
  const safeDt = Math.max(0.001, dt);
  const dFluxDt = (currentFlux - previousFlux) / safeDt;

  // Faraday's Law: ε = -N (dΦ / dt)
  const inducedEmf = -coil.turns * dFluxDt;

  // Circuit resistance: R_total = N * R_turn + R_bulb
  const totalResistance = coil.turns * coil.resistancePerTurn + bulbResistance;
  const inducedCurrent = totalResistance > 0 ? inducedEmf / totalResistance : 0;

  // Power dissipated by the bulb: P = I² * R_bulb
  const bulbPower = inducedCurrent * inducedCurrent * bulbResistance;

  // Non-linear brightness curve matching human eye perception
  const bulbBrightness = Math.min(1.0, Math.pow(bulbPower / BULB_SATURATION_POWER_W, 0.45));

  // Lenz Law B-field: opposes dFluxDt
  // If dFlux/dt > 0 (flux increasing to right), induced field points left (-x)
  const opposingBFieldX = -Math.sign(dFluxDt) * Math.min(1, Math.abs(dFluxDt) * 20);

  return {
    dFluxDt,
    inducedEmf,
    inducedCurrent,
    bulbPower,
    bulbBrightness,
    opposingBFieldX
  };
}
