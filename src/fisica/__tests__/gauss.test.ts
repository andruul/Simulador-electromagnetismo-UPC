import { describe, expect, it } from 'vitest';
import {
  COULOMB_KE,
  EPSILON_0,
  calculateElectricField3D,
  calculateEnclosedCharge,
  computeGaussLaw,
  integrateBoxFlux,
  integrateSphereFlux,
  type ChargeSI
} from '../gauss';
import type { GaussianSurface } from '../../tipos';
import { relErr } from './testUtils';

const NC = 1e-9;

function charge(x: number, y: number, q: number): ChargeSI {
  return { id: `q-${x}-${y}`, x, y, charge: q };
}

function sphere(cx: number, cy: number, radius: number): GaussianSurface {
  return { shape: 'circle', cx, cy, radius, width: 0, height: 0 };
}

function box(cx: number, cy: number, width: number, height: number): GaussianSurface {
  return { shape: 'rectangle', cx, cy, radius: 0, width, height };
}

describe('Constantes y campo de Coulomb', () => {
  it('k_e = 1/(4πε₀) ≈ 8.98755×10⁹ N·m²/C²', () => {
    expect(relErr(COULOMB_KE, 8.9875517923e9)).toBeLessThan(1e-9);
  });

  it('E = k q / r² para una carga puntual (error ≤ 1.5·s/r², s = 1e-7 m²)', () => {
    const q = 2 * NC;
    for (const r of [0.01, 0.05, 0.1, 0.5, 2]) {
      const E = calculateElectricField3D({ x: r, y: 0, z: 0 }, [charge(0, 0, q)]);
      const exact = (COULOMB_KE * q) / (r * r);
      expect(relErr(E.x, exact)).toBeLessThan(2 * (1e-7 / (r * r)) + 1e-12);
      expect(E.y).toBe(0);
      expect(E.z).toBe(0);
    }
  });

  it('superposición: un dipolo da campo nulo en el infinito más rápido que una carga', () => {
    const dip = [charge(-0.01, 0, NC), charge(0.01, 0, -NC)];
    const single = calculateElectricField3D({ x: 5, y: 0, z: 0 }, [charge(0, 0, NC)]);
    const pair = calculateElectricField3D({ x: 5, y: 0, z: 0 }, dip);
    expect(Math.abs(pair.x)).toBeLessThan(Math.abs(single.x) * 1e-2);
  });

  it('sin NaN/Infinity en la posición exacta de la carga', () => {
    const E = calculateElectricField3D({ x: 0, y: 0, z: 0 }, [charge(0, 0, NC)]);
    expect(Number.isFinite(E.x) && Number.isFinite(E.y) && Number.isFinite(E.z)).toBe(true);
  });
});

describe('Ley de Gauss: Φ = Q_enc/ε₀', () => {
  it('esfera con carga puntual centrada: Φ numérico = Q/ε₀ (error < 0.01 %)', () => {
    const q = 3 * NC;
    const flux = integrateSphereFlux(sphere(0, 0, 0.1), [charge(0, 0, q)]);
    expect(relErr(flux, q / EPSILON_0)).toBeLessThan(1e-4);
  });

  it('esfera: el flujo no depende del radio', () => {
    const q = NC;
    for (const R of [0.05, 0.1, 0.4]) {
      const flux = integrateSphereFlux(sphere(0, 0, R), [charge(0, 0, q)]);
      expect(relErr(flux, q / EPSILON_0)).toBeLessThan(1e-3);
    }
  });

  it('esfera: carga descentrada dentro de la superficie mantiene Φ = Q/ε₀ (error < 1 %)', () => {
    const q = NC;
    const flux = integrateSphereFlux(sphere(0, 0, 0.2), [charge(0.08, -0.05, q)]);
    expect(relErr(flux, q / EPSILON_0)).toBeLessThan(1e-2);
  });

  it('esfera: una carga exterior aporta flujo neto ≈ 0 (< 1 % de Q/ε₀)', () => {
    const q = NC;
    const flux = integrateSphereFlux(sphere(0, 0, 0.1), [charge(0.5, 0, q)]);
    expect(Math.abs(flux) / (q / EPSILON_0)).toBeLessThan(1e-2);
  });

  it('esfera: dipolo encerrado → flujo neto ≈ 0', () => {
    const q = NC;
    const flux = integrateSphereFlux(sphere(0, 0, 0.3), [charge(-0.05, 0, q), charge(0.05, 0, -q)]);
    expect(Math.abs(flux) / (q / EPSILON_0)).toBeLessThan(1e-2);
  });

  it('caja: carga centrada, Φ numérico = Q/ε₀ (error < 1 %)', () => {
    const q = NC;
    const flux = integrateBoxFlux(box(0, 0, 0.3, 0.3), [charge(0, 0, q)]);
    expect(relErr(flux, q / EPSILON_0)).toBeLessThan(1e-2);
  });

  it('caja rectangular alargada con carga descentrada: error < 2 %', () => {
    const q = NC;
    const flux = integrateBoxFlux(box(0, 0, 0.5, 0.3), [charge(0.1, 0.05, q)]);
    expect(relErr(flux, q / EPSILON_0)).toBeLessThan(2e-2);
  });

  it('caja: carga exterior → flujo neto ≈ 0', () => {
    const q = NC;
    const flux = integrateBoxFlux(box(0, 0, 0.2, 0.2), [charge(0.6, 0, q)]);
    expect(Math.abs(flux) / (q / EPSILON_0)).toBeLessThan(1e-2);
  });

  it('superposición: Φ total = (Σ q_enc)/ε₀, ignorando las cargas exteriores', () => {
    const charges = [charge(0.02, 0, 2 * NC), charge(-0.03, 0.01, -NC), charge(0.9, 0.9, 5 * NC)];
    const surface = sphere(0, 0, 0.2);
    const qEnc = calculateEnclosedCharge(charges, surface);
    expect(relErr(qEnc, NC)).toBeLessThan(1e-12);
    const flux = integrateSphereFlux(surface, charges);
    expect(relErr(flux, qEnc / EPSILON_0)).toBeLessThan(2e-2);
  });
});

describe('computeGaussLaw (resultado completo del laboratorio)', () => {
  it('esfera: reporta Q_enc, Φ teórico y error relativo consistentes', () => {
    const q = 2 * NC;
    const r = computeGaussLaw(sphere(0, 0, 0.1), [charge(0, 0, q)]);
    expect(relErr(r.enclosedCharge, q)).toBeLessThan(1e-12);
    expect(relErr(r.theoreticalFlux, q / EPSILON_0)).toBeLessThan(1e-12);
    expect(r.relativeError).toBeLessThan(1e-3);
    expect(r.elements.length).toBe(48);
  });

  it('sin carga encerrada: Φ teórico = 0 y flujo numérico ≈ 0', () => {
    const r = computeGaussLaw(sphere(0, 0, 0.1), [charge(1, 1, NC)]);
    expect(r.enclosedCharge).toBe(0);
    expect(r.theoreticalFlux).toBe(0);
    expect(Math.abs(r.numericalFlux)).toBeLessThan(1e3);
  });

  it('caja: genera elementos de superficie con normales unitarias salientes', () => {
    const r = computeGaussLaw(box(0, 0, 0.3, 0.2), [charge(0, 0, NC)]);
    expect(r.elements.length).toBeGreaterThan(0);
    for (const e of r.elements) {
      expect(Math.hypot(e.nx, e.ny)).toBeCloseTo(1, 12);
      // Normal saliente: apunta en el mismo sentido que (posición − centro) a lo largo de su eje
      expect(e.nx * e.x + e.ny * e.y).toBeGreaterThan(0);
    }
  });
});
