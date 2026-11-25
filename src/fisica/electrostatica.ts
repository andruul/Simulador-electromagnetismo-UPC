import type { PointCharge, Vector2D } from '../tipos';

export const COULOMB_K = 89900; // Scaled for visual coordinates

export function calculateElectricField(
  x: number,
  y: number,
  charges: PointCharge[],
  k: number = COULOMB_K
): Vector2D {
  let ex = 0;
  let ey = 0;
  const softening = 4; // Prevent division by zero / singularity

  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r2 = dx * dx + dy * dy + softening;
    const r = Math.sqrt(r2);
    const r3 = r * r * r;

    // E = k * q * (r_vec) / r^3
    const factor = (k * c.charge) / r3;
    ex += factor * dx;
    ey += factor * dy;
  }

  return { x: ex, y: ey };
}

export function calculateElectricPotential(
  x: number,
  y: number,
  charges: PointCharge[],
  k: number = COULOMB_K
): number {
  let v = 0;
  const softening = 4;

  for (const c of charges) {
    const dx = x - c.x;
    const dy = y - c.y;
    const r = Math.sqrt(dx * dx + dy * dy + softening);
    v += (k * c.charge) / r;
  }

  return v;
}

/**
 * Traces an electric field line from a starting point using Runge-Kutta 4 (RK4).
 */
export function traceFieldLine(
  startX: number,
  startY: number,
  directionSign: number, // +1 for away from positive, -1 for towards negative
  charges: PointCharge[],
  width: number,
  height: number,
  stepSize: number = 4,
  maxSteps: number = 300,
  k: number = COULOMB_K
): Vector2D[] {
  const points: Vector2D[] = [{ x: startX, y: startY }];
  let curX = startX;
  let curY = startY;

  const getDir = (x: number, y: number): Vector2D => {
    const E = calculateElectricField(x, y, charges, k);
    const mag = Math.hypot(E.x, E.y);
    if (mag < 1e-6) return { x: 0, y: 0 };
    return {
      x: (E.x / mag) * directionSign,
      y: (E.y / mag) * directionSign
    };
  };

  const margin = 50;

  for (let i = 0; i < maxSteps; i++) {
    // Check if out of canvas bounds
    if (curX < -margin || curX > width + margin || curY < -margin || curY > height + margin) {
      break;
    }

    // Check if absorbed by an opposite charge
    let hitCharge = false;
    for (const c of charges) {
      const dist = Math.hypot(curX - c.x, curY - c.y);
      const isOpposite = (directionSign > 0 && c.charge < 0) || (directionSign < 0 && c.charge > 0);
      if (isOpposite && dist < 12) {
        hitCharge = true;
        points.push({ x: c.x, y: c.y });
        break;
      }
    }
    if (hitCharge) break;

    // RK4 step
    const k1 = getDir(curX, curY);
    if (k1.x === 0 && k1.y === 0) break;

    const k2 = getDir(curX + 0.5 * stepSize * k1.x, curY + 0.5 * stepSize * k1.y);
    const k3 = getDir(curX + 0.5 * stepSize * k2.x, curY + 0.5 * stepSize * k2.y);
    const k4 = getDir(curX + stepSize * k3.x, curY + stepSize * k3.y);

    const dx = (stepSize / 6) * (k1.x + 2 * k2.x + 2 * k3.x + k4.x);
    const dy = (stepSize / 6) * (k1.y + 2 * k2.y + 2 * k3.y + k4.y);

    curX += dx;
    curY += dy;
    points.push({ x: curX, y: curY });
  }

  return points;
}

/**
 * Traces an equipotential contour line from a starting point (V = const)
 * by moving orthogonally to the electric field vector E.
 */
export function traceEquipotentialLine(
  startX: number,
  startY: number,
  charges: PointCharge[],
  width: number,
  height: number,
  stepSize: number = 3,
  maxSteps: number = 400,
  k: number = COULOMB_K
): Vector2D[] {
  const points: Vector2D[] = [];
  const forwardPoints: Vector2D[] = [{ x: startX, y: startY }];
  const backwardPoints: Vector2D[] = [];

  const getTangent = (x: number, y: number, dir: number): Vector2D => {
    const E = calculateElectricField(x, y, charges, k);
    const mag = Math.hypot(E.x, E.y);
    if (mag < 1e-5) return { x: 0, y: 0 };
    // Tangent perpendicular to E is (-Ey, Ex)
    return {
      x: (-E.y / mag) * dir,
      y: (E.x / mag) * dir
    };
  };

  // Trace forward
  let curX = startX;
  let curY = startY;
  for (let i = 0; i < maxSteps; i++) {
    if (curX < 0 || curX > width || curY < 0 || curY > height) break;
    const t = getTangent(curX, curY, 1);
    curX += t.x * stepSize;
    curY += t.y * stepSize;
    forwardPoints.push({ x: curX, y: curY });
    // If closed loop back to start
    if (i > 15 && Math.hypot(curX - startX, curY - startY) < stepSize * 1.5) {
      forwardPoints.push({ x: startX, y: startY });
      return forwardPoints;
    }
  }

  // Trace backward
  curX = startX;
  curY = startY;
  for (let i = 0; i < maxSteps; i++) {
    if (curX < 0 || curX > width || curY < 0 || curY > height) break;
    const t = getTangent(curX, curY, -1);
    curX += t.x * stepSize;
    curY += t.y * stepSize;
    backwardPoints.push({ x: curX, y: curY });
    if (i > 15 && Math.hypot(curX - startX, curY - startY) < stepSize * 1.5) {
      break;
    }
  }

  // Combine backward reversed + forward
  points.push(...backwardPoints.reverse(), ...forwardPoints);
  return points;
}

/** Escala física explícita del lienzo 2D: 100 px = 1.00 m (1 cuadrícula de 40 px = 0.40 m). */
export const ELECTROSTATICS_PIXELS_PER_METER = 100;
/** Constante electrostática exacta en el SI: k_e = 1 / (4π ε₀) [N·m²/C²]. */
export const COULOMB_KE_SI = 8.9875517923e9;

/**
 * Calcula el vector campo eléctrico E (en N/C = V/m, unidades SI exactas)
 * convirtiendo las coordenadas del lienzo (px) a metros y las cargas (µC) a Coulombs.
 */
export function calculateElectricFieldSI(
  xPx: number,
  yPx: number,
  charges: PointCharge[],
  pixelsPerMeter: number = ELECTROSTATICS_PIXELS_PER_METER
): Vector2D {
  let ex = 0;
  let ey = 0;
  const softeningM2 = (2 / pixelsPerMeter) ** 2; // Regularización de núcleo de 2 cm

  for (const c of charges) {
    const dxM = (xPx - c.x) / pixelsPerMeter;
    const dyM = (yPx - c.y) / pixelsPerMeter;
    const r2 = dxM * dxM + dyM * dyM + softeningM2;
    const r = Math.sqrt(r2);
    const r3 = r * r * r;
    const qCoulombs = c.charge * 1e-6; // µC -> C

    const factor = (COULOMB_KE_SI * qCoulombs) / r3;
    ex += factor * dxM;
    ey += factor * dyM;
  }

  return { x: ex, y: ey };
}

/**
 * Calcula el potencial electrostático escalar V (en Voltios, unidades SI exactas)
 * con referencia V(∞) = 0 y conversión explícita píxeles -> metros, µC -> C.
 */
export function calculateElectricPotentialSI(
  xPx: number,
  yPx: number,
  charges: PointCharge[],
  pixelsPerMeter: number = ELECTROSTATICS_PIXELS_PER_METER
): number {
  let v = 0;
  const softeningM2 = (2 / pixelsPerMeter) ** 2;

  for (const c of charges) {
    const dxM = (xPx - c.x) / pixelsPerMeter;
    const dyM = (yPx - c.y) / pixelsPerMeter;
    const r = Math.sqrt(dxM * dxM + dyM * dyM + softeningM2);
    const qCoulombs = c.charge * 1e-6;
    v += (COULOMB_KE_SI * qCoulombs) / r;
  }

  return v;
}
