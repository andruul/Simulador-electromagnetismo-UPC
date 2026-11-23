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
