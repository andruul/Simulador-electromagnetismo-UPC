import { describe, expect, it } from 'vitest';
import { calculateMagneticField2D, MU0_OVER_2PI } from '../biotsavart';
import type { WireCurrent } from '../../tipos';
import { relErr } from './testUtils';

/**
 * Modelo implementado: conductor recto INFINITO perpendicular al plano (problema 2D),
 * en unidades de pantalla (px) con la constante visual MU0_OVER_2PI = 1000.
 *
 *   B(r) = c · I · r / (r² + s)      con s = 9 px² (regularización del núcleo, radio 3 px)
 *
 * Solución analítica exacta de un hilo infinito: B = μ₀ I / (2π r) = c I / r.
 * El error relativo del modelo respecto de la solución analítica es exactamente
 *   ε(r) = s / (r² + s)
 * Por ser un hilo infinito, NO hay error por longitud finita: la única desviación es la
 * regularización del núcleo, que solo importa a r ≲ 10 px (ver pruebas).
 */
const SOFTENING = 9;
const MU0 = 4 * Math.PI * 1e-7;
const C_SI = MU0 / (2 * Math.PI); // = 2e-7 T·m/A

function wire(x: number, y: number, current: number): WireCurrent {
  return { id: `w-${x}-${y}`, x, y, current };
}

function fieldMagnitude(x: number, y: number, wires: WireCurrent[], c: number): number {
  const b = calculateMagneticField2D(x, y, wires, c);
  return Math.hypot(b.x, b.y);
}

describe('Biot-Savart / Ley de Ampère — conductor recto largo', () => {
  it('B = μ₀I/(2πr) con error ≤ s/(r²+s) (tolerancia teórica del modelo)', () => {
    const I = 5;
    for (const r of [10, 20, 30, 50, 100, 300]) {
      const B = fieldMagnitude(r, 0, [wire(0, 0, I)], C_SI);
      const analytic = (MU0 * I) / (2 * Math.PI * r);
      const bound = SOFTENING / (r * r + SOFTENING);
      expect(relErr(B, analytic)).toBeLessThanOrEqual(bound * (1 + 1e-9));
      // Y es exactamente la fórmula regularizada
      expect(relErr(B, (C_SI * I * r) / (r * r + SOFTENING))).toBeLessThan(1e-12);
    }
  });

  it('región central (r ≥ 30 px): error respecto de la solución analítica ≤ 1 %', () => {
    for (const r of [30, 60, 120, 240]) {
      const B = fieldMagnitude(0, r, [wire(0, 0, 1)], C_SI);
      expect(relErr(B, C_SI / r)).toBeLessThan(0.01);
    }
  });

  it('el núcleo regularizado evita la singularidad (sin NaN/Infinity en r = 0)', () => {
    const b = calculateMagneticField2D(0, 0, [wire(0, 0, 10)]);
    expect(Number.isFinite(b.x)).toBe(true);
    expect(Number.isFinite(b.y)).toBe(true);
    expect(Math.hypot(b.x, b.y)).toBe(0);
  });

  it('decae como 1/r: duplicar la distancia reduce B a la mitad (r ≫ núcleo)', () => {
    const wires = [wire(0, 0, 3)];
    const b1 = fieldMagnitude(100, 0, wires, C_SI);
    const b2 = fieldMagnitude(200, 0, wires, C_SI);
    expect(relErr(b1 / b2, 2)).toBeLessThan(0.002);
  });

  it('B es lineal en I (invertir la corriente invierte el campo)', () => {
    const bPlus = calculateMagneticField2D(50, 20, [wire(0, 0, 4)], C_SI);
    const bMinus = calculateMagneticField2D(50, 20, [wire(0, 0, -4)], C_SI);
    const bDouble = calculateMagneticField2D(50, 20, [wire(0, 0, 8)], C_SI);
    expect(bMinus.x).toBeCloseTo(-bPlus.x, 20);
    expect(bMinus.y).toBeCloseTo(-bPlus.y, 20);
    expect(relErr(bDouble.x, 2 * bPlus.x)).toBeLessThan(1e-12);
    expect(relErr(bDouble.y, 2 * bPlus.y)).toBeLessThan(1e-12);
  });

  it('regla de la mano derecha: I > 0 (+z) circula en sentido antihorario', () => {
    const w = [wire(0, 0, 1)];
    expect(calculateMagneticField2D(100, 0, w, C_SI).y).toBeGreaterThan(0); // +x → +y
    expect(calculateMagneticField2D(0, 100, w, C_SI).x).toBeLessThan(0); //   +y → −x
    expect(calculateMagneticField2D(-100, 0, w, C_SI).y).toBeLessThan(0); //  −x → −y
    expect(calculateMagneticField2D(0, -100, w, C_SI).x).toBeGreaterThan(0); // −y → +x
  });

  it('B es perpendicular al radio vector (campo puramente azimutal)', () => {
    const b = calculateMagneticField2D(70, 40, [wire(0, 0, 2)], C_SI);
    const radial = (b.x * 70 + b.y * 40) / Math.hypot(70, 40);
    expect(Math.abs(radial)).toBeLessThan(1e-20);
  });

  it('Ley de Ampère: ∮B·dl = μ₀ I_enc con error ≤ s/(R²+s)', () => {
    const I = 2;
    const wires = [wire(0, 0, I)];
    for (const R of [30, 80, 200]) {
      const n = 2000;
      let circulation = 0;
      for (let k = 0; k < n; k++) {
        const t = (2 * Math.PI * (k + 0.5)) / n;
        const b = calculateMagneticField2D(R * Math.cos(t), R * Math.sin(t), wires, C_SI);
        // dl = R dθ (−sin θ, cos θ)
        circulation += (b.x * -Math.sin(t) + b.y * Math.cos(t)) * R * ((2 * Math.PI) / n);
      }
      const bound = SOFTENING / (R * R + SOFTENING);
      expect(relErr(circulation, MU0 * I)).toBeLessThanOrEqual(bound * (1 + 1e-6));
    }
  });

  it('Ley de Ampère: una corriente fuera del lazo no aporta circulación', () => {
    // Lazo de radio 20 px centrado en el origen; el hilo está a 400 px.
    const wires = [wire(400, 0, 5)];
    const R = 20;
    const n = 2000;
    let circulation = 0;
    for (let k = 0; k < n; k++) {
      const t = (2 * Math.PI * (k + 0.5)) / n;
      const b = calculateMagneticField2D(R * Math.cos(t), R * Math.sin(t), wires, C_SI);
      circulation += (b.x * -Math.sin(t) + b.y * Math.cos(t)) * R * ((2 * Math.PI) / n);
    }
    expect(Math.abs(circulation) / (MU0 * 5)).toBeLessThan(1e-4);
  });

  it('superposición: dos hilos paralelos con igual corriente se anulan en el punto medio', () => {
    const b = calculateMagneticField2D(0, 0, [wire(-60, 0, 3), wire(60, 0, 3)], C_SI);
    expect(Math.hypot(b.x, b.y)).toBeLessThan(1e-20);
  });

  it('superposición: hilos antiparalelos duplican el campo en el punto medio', () => {
    const single = fieldMagnitude(0, 0, [wire(60, 0, 3)], C_SI);
    const pair = fieldMagnitude(0, 0, [wire(-60, 0, 3), wire(60, 0, -3)], C_SI);
    expect(relErr(pair, 2 * single)).toBeLessThan(1e-12);
  });

  it('constante visual por defecto: B ≈ 1000·I/r en campo lejano', () => {
    const b = fieldMagnitude(300, 0, [wire(0, 0, 2)], MU0_OVER_2PI);
    expect(relErr(b, (MU0_OVER_2PI * 2) / 300)).toBeLessThan(SOFTENING / (300 * 300));
  });
});
