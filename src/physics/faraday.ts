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

import type { Vector2D } from '../types';

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
 * Calculates the exact 2D magnetic field B at pos due to the bar magnet dipole model:
 * B(r) = (μ₀ / 4π) * q_m * [ (r - r_N) / |r - r_N|³ - (r - r_S) / |r - r_S|³ ]
 */
export function calculateMagneticField(
  pos: Vector2D,
  magnet: BarMagnet
): Vector2D {
  const { north, south } = getMagnetPoles(magnet);
  const softening = 1e-5; // m² to prevent singularity inside pole centers

  // From North pole (+q_m)
  const dxN = pos.x - north.x;
  const dyN = pos.y - north.y;
  const rN2 = dxN * dxN + dyN * dyN + softening;
  const rN3 = Math.sqrt(rN2) * rN2;
  const factorN = (MAG_SCALE * magnet.poleStrength) / rN3;

  // From South pole (-q_m)
  const dxS = pos.x - south.x;
  const dyS = pos.y - south.y;
  const rS2 = dxS * dxS + dyS * dyS + softening;
  const rS3 = Math.sqrt(rS2) * rS2;
  const factorS = (MAG_SCALE * magnet.poleStrength) / rS3;

  const bx = factorN * dxN - factorS * dxS;
  const by = factorN * dyN - factorS * dyS;

  return { x: bx, y: by };
}

/**
 * Numerically computes the magnetic flux Φ_B through a single loop of the coil:
 *   Φ_B = ∬_Coil B · n dA
 * For a circular coil perpendicular to the x-axis:
 *   Φ_B = ∫_{-R}^{R} 2 * √(R² - y²) * B_x(x_c, y_c + y) dy
 */
export function calculateCoilFlux(
  coil: InductionCoil,
  magnet: BarMagnet,
  segments: number = 24
): number {
  const R = coil.radius;
  const dy = (2 * R) / segments;
  let flux = 0;

  for (let i = 0; i < segments; i++) {
    const yOffset = -R + (i + 0.5) * dy;
    const chordLength = 2 * Math.sqrt(Math.max(0, R * R - yOffset * yOffset));
    const samplePos: Vector2D = {
      x: coil.x,
      y: coil.y + yOffset
    };

    const B = calculateMagneticField(samplePos, magnet);
    // B · n (normal is typically {x: 1, y: 0})
    const bDotN = B.x * coil.normal.x + B.y * coil.normal.y;

    flux += bDotN * chordLength * dy;
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
  // Saturated at ~2.5 Watts
  const bulbBrightness = Math.min(1.0, Math.pow(bulbPower / 2.5, 0.45));

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
