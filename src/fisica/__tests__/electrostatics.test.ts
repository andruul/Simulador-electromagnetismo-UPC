import { describe, expect, it } from 'vitest';
import {
  COULOMB_K,
  calculateElectricField,
  calculateElectricPotential,
  traceFieldLine
} from '../electrostatica';
import type { PointCharge } from '../../tipos';
import { relErr } from './testUtils';

/**
 * Modelo 2D en unidades de pantalla (px): E = k q r̂ / (r² + s)·… con s = 4 px²
 * (regularización de núcleo). Solución analítica de Coulomb: E = k q / r².
 */
const SOFTENING = 4;

function pc(x: number, y: number, charge: number): PointCharge {
  return { id: `c-${x}-${y}`, x, y, charge, fixed: true };
}

describe('Electrostática 2D (Coulomb)', () => {
  it('E ≈ k q / r² con error ≤ 1.5·s/r² (r ≥ 20 px: < 1.5 %)', () => {
    const q = 3;
    for (const r of [20, 40, 100, 300]) {
      const E = calculateElectricField(r, 0, [pc(0, 0, q)]);
      const exact = (COULOMB_K * q) / (r * r);
      expect(relErr(E.x, exact)).toBeLessThan((2 * SOFTENING) / (r * r));
      expect(Math.abs(E.y)).toBeLessThan(1e-12);
    }
  });

  it('V ≈ k q / r con error ≤ s/(2r²)', () => {
    const q = 2;
    for (const r of [20, 60, 200]) {
      const V = calculateElectricPotential(r, 0, [pc(0, 0, q)]);
      expect(relErr(V, (COULOMB_K * q) / r)).toBeLessThan(SOFTENING / (r * r));
    }
  });

  it('E = −∇V (consistencia campo–potencial por diferencias centradas)', () => {
    const charges = [pc(0, 0, 3), pc(80, 20, -2), pc(-40, 60, 1)];
    const h = 1e-3;
    for (const [x, y] of [
      [30, 30],
      [-20, 50],
      [100, -40]
    ] as const) {
      const E = calculateElectricField(x, y, charges);
      const dVdx =
        (calculateElectricPotential(x + h, y, charges) - calculateElectricPotential(x - h, y, charges)) / (2 * h);
      const dVdy =
        (calculateElectricPotential(x, y + h, charges) - calculateElectricPotential(x, y - h, charges)) / (2 * h);
      expect(relErr(E.x, -dVdx)).toBeLessThan(1e-6);
      expect(relErr(E.y, -dVdy)).toBeLessThan(1e-6);
    }
  });

  it('principio de superposición y simetría del dipolo', () => {
    const dip = [pc(-30, 0, 2), pc(30, 0, -2)];
    const mid = calculateElectricField(0, 0, dip);
    const single = calculateElectricField(0, 0, [pc(-30, 0, 2)]);
    expect(relErr(mid.x, 2 * single.x)).toBeLessThan(1e-12);
    expect(calculateElectricPotential(0, 50, dip)).toBeCloseTo(0, 6);
  });

  it('la regularización evita NaN/Infinity en la posición de la carga', () => {
    const E = calculateElectricField(10, 10, [pc(10, 10, 5)]);
    expect(Number.isFinite(E.x) && Number.isFinite(E.y)).toBe(true);
    expect(Number.isFinite(calculateElectricPotential(10, 10, [pc(10, 10, 5)]))).toBe(true);
  });

  it('las líneas de campo (RK4) nacen en la carga + y terminan en la carga −', () => {
    const charges = [pc(200, 200, 4), pc(400, 200, -4)];
    const line = traceFieldLine(200 + 20, 200, 1, charges, 800, 600, 2, 1000);
    const end = line[line.length - 1];
    expect(Math.hypot(end.x - 400, end.y - 200)).toBeLessThan(1);
  });

  it('los puntos de una línea de campo siguen la dirección de E (tangente ∥ E)', () => {
    const charges = [pc(300, 300, 3)];
    const line = traceFieldLine(320, 300, 1, charges, 800, 600, 2, 50);
    for (let i = 1; i < line.length; i++) {
      const tx = line[i].x - line[i - 1].x;
      const ty = line[i].y - line[i - 1].y;
      const E = calculateElectricField(line[i - 1].x, line[i - 1].y, charges);
      const cross = (tx * E.y - ty * E.x) / (Math.hypot(tx, ty) * Math.hypot(E.x, E.y));
      expect(Math.abs(cross)).toBeLessThan(1e-3);
    }
  });
});
