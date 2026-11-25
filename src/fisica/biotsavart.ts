import type { Vector2D, WireCurrent } from '../tipos';

export const MU0_OVER_2PI = 1000; // Scaled visual constant for magnetostatics

/**
 * Calculates the magnetic field B = (Bx, By) in 2D at (x, y)
 * produced by an array of current-carrying wires perpendicular to the plane.
 */
export function calculateMagneticField2D(
  x: number,
  y: number,
  wires: WireCurrent[],
  constant: number = MU0_OVER_2PI
): Vector2D {
  let bx = 0;
  let by = 0;
  const softening = 9;

  for (const wire of wires) {
    const dx = x - wire.x;
    const dy = y - wire.y;
    const r2 = dx * dx + dy * dy + softening;

    // By Right-Hand Rule:
    // If I > 0 (out of page / +Z), B circulates counter-clockwise:
    // B_vec = (constant * I / r^2) * (-dy, dx)
    const factor = (constant * wire.current) / r2;
    bx += -factor * dy;
    by += factor * dx;
  }

  return { x: bx, y: by };
}

/**
 * Traces a magnetic field line in 2D around current wires using RK4.
 */
export function traceMagneticLine(
  startX: number,
  startY: number,
  directionSign: number,
  wires: WireCurrent[],
  width: number,
  height: number,
  stepSize: number = 3,
  maxSteps: number = 300
): Vector2D[] {
  const points: Vector2D[] = [{ x: startX, y: startY }];
  let curX = startX;
  let curY = startY;

  const getDir = (x: number, y: number): Vector2D => {
    const B = calculateMagneticField2D(x, y, wires);
    const mag = Math.hypot(B.x, B.y);
    if (mag < 1e-6) return { x: 0, y: 0 };
    return {
      x: (B.x / mag) * directionSign,
      y: (B.y / mag) * directionSign
    };
  };

  const margin = 40;

  for (let i = 0; i < maxSteps; i++) {
    if (curX < -margin || curX > width + margin || curY < -margin || curY > height + margin) {
      break;
    }

    // Check loop closure back to start
    if (i > 25 && Math.hypot(curX - startX, curY - startY) < stepSize * 1.5) {
      points.push({ x: startX, y: startY });
      break;
    }

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

/** Escala física explícita del laboratorio de Magnetostática: 100 px = 1.00 m. */
export const MAGNETOSTATICS_PIXELS_PER_METER = 100;
/** Permeabilidad magnética del vacío en el SI: μ₀ = 4π × 10⁻⁷ T·m/A. */
export const MU_0_SI = 4 * Math.PI * 1e-7;
/** Factor μ₀ / (2π) = 2 × 10⁻⁷ T·m/A para conductor rectilíneo infinito. */
export const MU0_OVER_2PI_SI = 2e-7;

/**
 * Calcula el campo magnético B = (Bx, By) en Teslas (unidades SI exactas)
 * para hilos rectilíneos infinitos perpendiculares al plano XY.
 */
export function calculateMagneticFieldSI2D(
  xPx: number,
  yPx: number,
  wires: WireCurrent[],
  pixelsPerMeter: number = MAGNETOSTATICS_PIXELS_PER_METER
): Vector2D {
  let bx = 0;
  let by = 0;
  const softeningM2 = (3 / pixelsPerMeter) ** 2; // Núcleo conductor de 3 cm

  for (const wire of wires) {
    const dxM = (xPx - wire.x) / pixelsPerMeter;
    const dyM = (yPx - wire.y) / pixelsPerMeter;
    const r2 = dxM * dxM + dyM * dyM + softeningM2;
    // B_vec = (μ₀ I / (2π r²)) * (-dy, dx)
    const factor = (MU0_OVER_2PI_SI * wire.current) / r2;
    bx += -factor * dyM;
    by += factor * dxM;
  }

  return { x: bx, y: by };
}

export interface AmpereLawResult {
  /** Circulación numérica ∮ B · dl en T·m */
  circulationTm: number;
  /** Valor teórico exacto μ₀ · I_enc en T·m */
  theoreticalTm: number;
  /** Corriente neta encerrada I_enc en Amperios (A) */
  enclosedCurrentA: number;
  /** Error numérico relativo en porcentaje (%) */
  relativeErrorPct: number;
}

/**
 * Ley de Ampère numérica: integra ∮_C B(r) · dl a lo largo de una curva amperiana circular
 * orientada en sentido antihorario (+Z por regla de la mano derecha) usando regla del punto medio.
 */
export function computeAmpereLaw(
  centerX: number,
  centerY: number,
  radiusPx: number,
  wires: WireCurrent[],
  pixelsPerMeter: number = MAGNETOSTATICS_PIXELS_PER_METER,
  segments: number = 256
): AmpereLawResult {
  const radiusM = radiusPx / pixelsPerMeter;
  const dTheta = (2 * Math.PI) / segments;
  const dlMag = radiusM * dTheta;
  let circulationTm = 0;

  for (let i = 0; i < segments; i++) {
    const theta = (i + 0.5) * dTheta;
    const px = centerX + radiusPx * Math.cos(theta);
    const py = centerY + radiusPx * Math.sin(theta);
    const B = calculateMagneticFieldSI2D(px, py, wires, pixelsPerMeter);
    // Vector tangente unitario antihorario en coordenadas donde +X derecha, +Y abajo -> sentido matemático: (-sin θ, cos θ)
    const tx = -Math.sin(theta);
    const ty = Math.cos(theta);
    circulationTm += (B.x * tx + B.y * ty) * dlMag;
  }

  let enclosedCurrentA = 0;
  for (const w of wires) {
    const dist = Math.hypot(w.x - centerX, w.y - centerY);
    if (dist < radiusPx) {
      enclosedCurrentA += w.current;
    }
  }

  const theoreticalTm = MU_0_SI * enclosedCurrentA;
  const denom = Math.max(Math.abs(theoreticalTm), 1e-12);
  const relativeErrorPct =
    Math.abs(theoreticalTm) > 1e-11
      ? (Math.abs(circulationTm - theoreticalTm) / denom) * 100
      : Math.abs(circulationTm) * 1e6;

  return {
    circulationTm,
    theoreticalTm,
    enclosedCurrentA,
    relativeErrorPct
  };
}
