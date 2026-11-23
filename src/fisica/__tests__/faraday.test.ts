import { describe, expect, it } from 'vitest';
import {
  MAG_SCALE,
  POLE_SOFTENING_M2,
  calculateCoilFlux,
  calculateMagneticField,
  calculateMagneticField3D,
  computeFaradayInduction,
  gaussLegendre,
  getMagnetPoles,
  type BarMagnet,
  type InductionCoil
} from '../faraday';
import { relErr } from './testUtils';

// Geometría y parámetros reales del laboratorio (FaradayInductionCanvas.tsx)
const COIL: InductionCoil = {
  x: 0.08,
  y: 0,
  radius: 0.07,
  turns: 3,
  resistancePerTurn: 0.8,
  normal: { x: 1, y: 0 }
};

function magnetAt(x: number, y = 0, angle = 0): BarMagnet {
  return { x, y, length: 0.18, width: 0.05, angle, poleStrength: 1800 };
}

/**
 * Flujo exacto de un monopolo puntual sobre su eje a través de un disco de radio R
 * a distancia axial d (ángulo sólido Ω = 2π(1 − |d|/√(d²+R²))):
 *   Φ = sign(d) · (μ₀/4π) · q_m · Ω
 */
function monopoleDiskFlux(q: number, d: number, R: number): number {
  const omega = 2 * Math.PI * (1 - Math.abs(d) / Math.hypot(d, R));
  return Math.sign(d) * MAG_SCALE * q * omega;
}

/** Flujo analítico exacto del imán (dos polos) cuando está sobre el eje de la bobina. */
function analyticOnAxisFlux(coil: InductionCoil, magnet: BarMagnet): number {
  const { north, south } = getMagnetPoles(magnet);
  const q = magnet.poleStrength;
  return (
    monopoleDiskFlux(q, coil.x - north.x, coil.radius) -
    monopoleDiskFlux(q, coil.x - south.x, coil.radius)
  );
}

/**
 * Referencia independiente fuera del eje: integración polar fina del campo 3D de los
 * monopolos SIN regularización (600 × 256 puntos).
 */
function referenceDiskFlux(coil: InductionCoil, magnet: BarMagnet): number {
  const { north, south } = getMagnetPoles(magnet);
  const poles = [
    { x: north.x, y: north.y, q: magnet.poleStrength },
    { x: south.x, y: south.y, q: -magnet.poleStrength }
  ];
  const nr = 600;
  const nt = 256;
  let flux = 0;
  for (let i = 0; i < nr; i++) {
    const r = ((i + 0.5) / nr) * coil.radius;
    for (let j = 0; j < nt; j++) {
      const t = ((j + 0.5) / nt) * 2 * Math.PI;
      const y = coil.y + r * Math.cos(t);
      const z = r * Math.sin(t);
      let bx = 0;
      for (const p of poles) {
        const dx = coil.x - p.x;
        const dy = y - p.y;
        const d2 = dx * dx + dy * dy + z * z;
        bx += (MAG_SCALE * p.q * dx) / (d2 * Math.sqrt(d2));
      }
      flux += bx * r * (coil.radius / nr) * ((2 * Math.PI) / nt);
    }
  }
  return flux;
}

describe('Ley de Faraday-Lenz: ε = −N dΦ/dt', () => {
  it('rampa lineal de flujo: dΦ/dt y ε exactos en magnitud y signo (N = 1…4)', () => {
    const alpha = 0.05; // Wb/s
    const dt = 0.01;
    for (const N of [1, 2, 3, 4]) {
      const coil = { ...COIL, turns: N };
      const phi0 = 1e-3;
      const phi1 = phi0 + alpha * dt;
      const r = computeFaradayInduction(phi1, phi0, dt, coil, 10);
      expect(relErr(r.dFluxDt, alpha)).toBeLessThan(1e-9);
      expect(relErr(r.inducedEmf, -N * alpha)).toBeLessThan(1e-9);
      expect(r.inducedEmf).toBeLessThan(0); // flujo creciente → ε negativa (Lenz)
    }
  });

  it('flujo decreciente invierte el signo de la fem (Lenz)', () => {
    const r = computeFaradayInduction(0.9e-3, 1e-3, 0.01, COIL, 10);
    expect(r.dFluxDt).toBeLessThan(0);
    expect(r.inducedEmf).toBeGreaterThan(0);
    expect(r.inducedCurrent).toBeGreaterThan(0);
  });

  it('flujo constante no induce fem, corriente ni potencia', () => {
    const r = computeFaradayInduction(2e-3, 2e-3, 0.016, COIL, 10);
    expect(Math.abs(r.inducedEmf)).toBe(0);
    expect(Math.abs(r.inducedCurrent)).toBe(0);
    expect(r.bulbPower).toBe(0);
    expect(r.bulbBrightness).toBe(0);
  });

  it('la corriente inducida se opone al cambio: campo de Lenz con signo opuesto a dΦ/dt', () => {
    const inc = computeFaradayInduction(2e-3, 1e-3, 0.01, COIL, 10);
    const dec = computeFaradayInduction(1e-3, 2e-3, 0.01, COIL, 10);
    expect(inc.opposingBFieldX).toBeLessThan(0);
    expect(dec.opposingBFieldX).toBeGreaterThan(0);
    expect(Math.sign(inc.opposingBFieldX)).toBe(-Math.sign(inc.dFluxDt));
  });

  it('circuito: I = ε/(N·r + R_bulb), P_bulb = I²R_bulb y ε·I = I²R_total (energía)', () => {
    const Rb = 10;
    const dt = 0.01;
    const r = computeFaradayInduction(3e-3, 1e-3, dt, COIL, Rb);
    const Rtot = COIL.turns * COIL.resistancePerTurn + Rb;
    expect(relErr(r.inducedCurrent, r.inducedEmf / Rtot)).toBeLessThan(1e-12);
    expect(relErr(r.bulbPower, r.inducedCurrent ** 2 * Rb)).toBeLessThan(1e-12);
    // Potencia total suministrada por la fem = disipada en bobina + bombilla
    expect(relErr(r.inducedEmf * r.inducedCurrent, r.inducedCurrent ** 2 * Rtot)).toBeLessThan(1e-12);
    expect(r.bulbPower).toBeLessThan(r.inducedEmf * r.inducedCurrent);
  });

  it('el brillo está en [0, 1] y crece con la potencia', () => {
    let prev = -1;
    for (const dPhi of [0, 1e-4, 1e-3, 1e-2, 1e-1]) {
      const r = computeFaradayInduction(dPhi, 0, 0.01, COIL, 10);
      expect(r.bulbBrightness).toBeGreaterThanOrEqual(0);
      expect(r.bulbBrightness).toBeLessThanOrEqual(1);
      expect(r.bulbBrightness).toBeGreaterThanOrEqual(prev);
      prev = r.bulbBrightness;
    }
  });

  it('dt ≤ 0 se limita a 1 ms (sin NaN/Infinity)', () => {
    const r = computeFaradayInduction(2e-3, 1e-3, 0, COIL, 10);
    expect(Number.isFinite(r.dFluxDt)).toBe(true);
    expect(relErr(r.dFluxDt, 1e-3 / 0.001)).toBeLessThan(1e-12);
  });

  it('imán que se acerca con el polo N hacia la bobina: ε < 0; al alejarse: ε > 0', () => {
    const dt = 0.01;
    const v = 0.2; // m/s
    const flux = (x: number): number => calculateCoilFlux(COIL, magnetAt(x), 32);

    const xa = -0.4;
    const approach = computeFaradayInduction(flux(xa + v * dt), flux(xa), dt, COIL, 10);
    expect(approach.dFluxDt).toBeGreaterThan(0);
    expect(approach.inducedEmf).toBeLessThan(0);

    const xb = 0.4;
    const leave = computeFaradayInduction(flux(xb + v * dt), flux(xb), dt, COIL, 10);
    expect(leave.dFluxDt).toBeLessThan(0);
    expect(leave.inducedEmf).toBeGreaterThan(0);
  });

  it('∫ ε dt = −N ΔΦ a lo largo de un pase completo del imán (consistencia del solver)', () => {
    const dt = 0.005;
    const v = 0.3;
    const steps = 400;
    let x = -0.5;
    let prev = calculateCoilFlux(COIL, magnetAt(x), 32);
    const phiStart = prev;
    let integral = 0;
    for (let i = 0; i < steps; i++) {
      x += v * dt;
      const cur = calculateCoilFlux(COIL, magnetAt(x), 32);
      integral += computeFaradayInduction(cur, prev, dt, COIL, 10).inducedEmf * dt;
      prev = cur;
    }
    expect(Math.abs(integral + COIL.turns * (prev - phiStart))).toBeLessThan(1e-12);
  });
});

describe('Flujo magnético a través de la bobina', () => {
  it('coincide con la solución analítica exacta (ángulo sólido) con el imán en el eje', () => {
    for (const x of [-0.5, -0.3, -0.22, -0.15, -0.05, 0, 0.08, 0.15, 0.3, 0.5]) {
      const m = magnetAt(x);
      const exact = analyticOnAxisFlux(COIL, m);
      const num = calculateCoilFlux(COIL, m, 32);
      expect(relErr(num, exact)).toBeLessThan(2e-3);
    }
  });

  it('el flujo cambia de signo al invertir los polos del imán (Φ → −Φ)', () => {
    for (const x of [-0.3, 0.0, 0.2]) {
      const a = calculateCoilFlux(COIL, magnetAt(x, 0, 0), 32);
      const b = calculateCoilFlux(COIL, magnetAt(x, 0, Math.PI), 32);
      expect(relErr(b, -a)).toBeLessThan(1e-9);
    }
  });

  it('flujo neto de B a través del disco ≈ campo uniforme × área si el imán está lejos', () => {
    const far = magnetAt(-3);
    const B = calculateMagneticField({ x: COIL.x, y: COIL.y }, far);
    const approx = B.x * Math.PI * COIL.radius ** 2;
    expect(relErr(calculateCoilFlux(COIL, far, 16), approx)).toBeLessThan(5e-3);
  });

  it('linealidad en la intensidad de polo q_m', () => {
    const base = calculateCoilFlux(COIL, magnetAt(-0.2), 32);
    const double = calculateCoilFlux(COIL, { ...magnetAt(-0.2), poleStrength: 3600 }, 32);
    expect(relErr(double, 2 * base)).toBeLessThan(1e-12);
  });

  it('con radio o normal nulos devuelve 0 (sin NaN)', () => {
    expect(calculateCoilFlux({ ...COIL, radius: 0 }, magnetAt(-0.2))).toBe(0);
    expect(calculateCoilFlux({ ...COIL, normal: { x: 0, y: 0 } }, magnetAt(-0.2))).toBe(0);
  });

  it('soporta normal arbitraria en el plano (rotar bobina e imán 90° no altera Φ)', () => {
    const base = calculateCoilFlux(COIL, magnetAt(-0.2, 0.03), 32);
    // Rotación de 90° alrededor del origen: (x, y) → (−y, x)
    const rotCoil: InductionCoil = {
      ...COIL,
      x: -COIL.y,
      y: COIL.x,
      normal: { x: -COIL.normal.y, y: COIL.normal.x }
    };
    // El imán en (−0.2, 0.03) con ángulo 0 pasa a (−0.03, −0.2) con ángulo π/2
    const rm: BarMagnet = magnetAt(-0.03, -0.2, Math.PI / 2);
    expect(relErr(calculateCoilFlux(rotCoil, rm, 32), base)).toBeLessThan(1e-9);
  });
});

describe('Convergencia de la cuadratura del flujo', () => {
  // Posiciones estándar del simulador (incluye el polo N a ~1 cm del plano del disco)
  const positions: { label: string; magnet: BarMagnet }[] = [
    { label: 'lejos (x = −0.44)', magnet: magnetAt(-0.44) },
    { label: 'estándar (x = −0.22)', magnet: magnetAt(-0.22) },
    { label: 'cerca (x = −0.05)', magnet: magnetAt(-0.05) },
    { label: 'polo a 1 cm del plano (x = 0)', magnet: magnetAt(0) },
    { label: 'dentro (x = 0.08)', magnet: magnetAt(0.08) },
    { label: 'fuera del eje (x = 0, y = 0.05)', magnet: magnetAt(0, 0.05) },
    { label: 'fuera del eje (x = −0.22, y = 0.05)', magnet: magnetAt(-0.22, 0.05) }
  ];

  it('con 32 nodos radiales (valor usado por el laboratorio) el error es < 0.5 % en todas', () => {
    for (const { label, magnet } of positions) {
      const ref = referenceDiskFlux(COIL, magnet);
      const err = relErr(calculateCoilFlux(COIL, magnet, 32), ref);
      expect(err, label).toBeLessThan(5e-3);
    }
  });

  it('con 16 nodos radiales (valor por defecto) el error es < 1 % en todas', () => {
    for (const { label, magnet } of positions) {
      const ref = referenceDiskFlux(COIL, magnet);
      const err = relErr(calculateCoilFlux(COIL, magnet, 16), ref);
      expect(err, label).toBeLessThan(1e-2);
    }
  });

  it('el error no empeora al refinar (8 → 16 → 32 → 64) salvo ruido de 0.1 %', () => {
    for (const { label, magnet } of positions) {
      const ref = referenceDiskFlux(COIL, magnet);
      const errs = [8, 16, 32, 64].map((n) => relErr(calculateCoilFlux(COIL, magnet, n), ref));
      for (let i = 1; i < errs.length; i++) {
        expect(errs[i], label).toBeLessThanOrEqual(errs[i - 1] + 1e-3);
      }
    }
  });

  it('el valor converge: 32 y 64 nodos coinciden a 0.1 %', () => {
    for (const { label, magnet } of positions) {
      const a = calculateCoilFlux(COIL, magnet, 32);
      const b = calculateCoilFlux(COIL, magnet, 64);
      expect(relErr(a, b), label).toBeLessThan(1e-3);
    }
  });

  it('el integrador Gauss-Legendre es exacto para polinomios de grado ≤ 2n − 1', () => {
    const { nodes, weights } = gaussLegendre(5);
    const integrate = (f: (x: number) => number): number =>
      nodes.reduce((acc, x, i) => acc + weights[i] * f(x), 0);
    expect(integrate(() => 1)).toBeCloseTo(2, 13);
    expect(integrate((x) => x ** 2)).toBeCloseTo(2 / 3, 13);
    expect(integrate((x) => x ** 8)).toBeCloseTo(2 / 9, 13);
    expect(integrate((x) => x ** 3)).toBeCloseTo(0, 13);
  });
});

describe('Regularización (softening) del campo del imán', () => {
  const magnet = magnetAt(0);
  const { north } = getMagnetPoles(magnet);

  it('el softening es 1e-7 m² (núcleo ≈ 0.3 mm)', () => {
    expect(POLE_SOFTENING_M2).toBe(1e-7);
  });

  it('evita singularidades a distancia cero del polo (sin NaN ni Infinity)', () => {
    const b = calculateMagneticField3D(north.x, north.y, 0, magnet);
    expect(Number.isFinite(b.x)).toBe(true);
    expect(Number.isFinite(b.y)).toBe(true);
    expect(Number.isFinite(b.z)).toBe(true);
    const b2 = calculateMagneticField({ x: north.x, y: north.y }, magnet);
    expect(Number.isFinite(b2.x) && Number.isFinite(b2.y)).toBe(true);
  });

  it('sesgo respecto de dos monopolos ideales ≈ 1.5·s/r² (< 0.1 % a r ≥ 2 cm del polo)', () => {
    const { south } = getMagnetPoles(magnet);
    const q = magnet.poleStrength;
    for (const r of [0.02, 0.03, 0.05, 0.1, 0.3, 1]) {
      // Punto a distancia r del polo N, en dirección +x
      const px = north.x + r;
      const py = north.y;
      const exact =
        (MAG_SCALE * q) / (r * r) - (MAG_SCALE * q) / ((px - south.x) ** 2 + (py - south.y) ** 2);
      const B = calculateMagneticField3D(px, py, 0, magnet);
      const err = relErr(B.x, exact);
      // Cota teórica del sesgo: 1.5 s / r² con margen de un factor 2 (el polo opuesto añade poco)
      expect(err).toBeLessThan(3 * (POLE_SOFTENING_M2 / (r * r)) + 1e-12);
      if (r >= 0.02) expect(err).toBeLessThan(1e-3);
    }
  });

  it('lejos (r ≫ L) coincide con el dipolo ideal con error O((L/2r)²)', () => {
    // Sobre el eje: B = (μ₀/4π)·2m/r³ con m = q_m·L; corrección exacta 1/(1 − a²/r²)²
    const q = magnet.poleStrength;
    const a = magnet.length / 2;
    const mMoment = q * magnet.length;
    for (const r of [0.5, 1, 2, 5]) {
      const px = magnet.x + r;
      const B = calculateMagneticField3D(px, 0, 0, magnet);
      const dipole = (MAG_SCALE * 2 * mMoment) / r ** 3;
      expect(relErr(B.x, dipole)).toBeLessThan(3 * (a / r) ** 2);
    }
  });

  it('el campo del imán decae ≈ 1/r³ en campo lejano', () => {
    const b1 = Math.abs(calculateMagneticField3D(magnet.x + 2, 0, 0, magnet).x);
    const b2 = Math.abs(calculateMagneticField3D(magnet.x + 4, 0, 0, magnet).x);
    expect(relErr(b1 / b2, 8)).toBeLessThan(0.02);
  });

  it('∇·B = 0: el flujo neto por una esfera pequeña alrededor de un punto vacío es ~0', () => {
    const center = { x: 0.3, y: 0.1, z: 0.05 };
    const R = 0.02;
    const n = 400;
    let flux = 0;
    const golden = (1 + Math.sqrt(5)) / 2;
    for (let i = 0; i < n; i++) {
      const th = (2 * Math.PI * i) / golden;
      const ph = Math.acos(1 - (2 * (i + 0.5)) / n);
      const nx = Math.sin(ph) * Math.cos(th);
      const ny = Math.sin(ph) * Math.sin(th);
      const nz = Math.cos(ph);
      const B = calculateMagneticField3D(center.x + R * nx, center.y + R * ny, center.z + R * nz, magnet);
      flux += (B.x * nx + B.y * ny + B.z * nz) * ((4 * Math.PI * R * R) / n);
    }
    const scale = Math.abs(calculateMagneticField3D(center.x, center.y, center.z, magnet).x) * 4 * Math.PI * R * R;
    expect(Math.abs(flux) / scale).toBeLessThan(1e-2);
  });
});

describe('Calibración de la demostración (modo oscilación del laboratorio)', () => {
  // El flujo 3D exacto es ~4.3 veces menor que la antigua aproximación plana; los
  // instrumentos (lámpara de 0.13 W, galvanómetro de 0.7 V) se dimensionaron para que
  // la bombilla y la aguja sigan siendo claramente visibles.
  function oscillationPeaks(turns: number): { emf: number; brightness: number } {
    const coil = { ...COIL, turns };
    const dt = 1 / 60;
    let prev = 0;
    let emf = 0;
    let brightness = 0;
    for (let i = 0; i < 360; i++) {
      const t = i * dt;
      const x = coil.x - 0.05 + 0.22 * Math.sin(2 * Math.PI * 1.2 * t);
      const flux = calculateCoilFlux(coil, magnetAt(x), 32);
      if (i > 5) {
        const r = computeFaradayInduction(flux, prev, dt, coil, 10);
        emf = Math.max(emf, Math.abs(r.inducedEmf));
        brightness = Math.max(brightness, r.bulbBrightness);
      }
      prev = flux;
    }
    return { emf, brightness };
  }

  it('N = 3: FEM pico ≈ 0.35 V y la bombilla alcanza brillo claramente visible (> 0.2)', () => {
    const { emf, brightness } = oscillationPeaks(3);
    expect(emf).toBeGreaterThan(0.3);
    expect(emf).toBeLessThan(0.4);
    expect(brightness).toBeGreaterThan(0.2);
    expect(brightness).toBeLessThan(0.45);
  });

  it('la FEM pico crece con el número de espiras (N = 1 < 3 < 4)', () => {
    const e1 = oscillationPeaks(1).emf;
    const e3 = oscillationPeaks(3).emf;
    const e4 = oscillationPeaks(4).emf;
    expect(e1).toBeLessThan(e3);
    expect(e3).toBeLessThan(e4);
  });

  it('la aguja del galvanómetro (fondo de escala 0.7 V) se desvía más de un tercio con N = 3', () => {
    const { emf } = oscillationPeaks(3);
    expect(emf / 0.7).toBeGreaterThan(0.33);
  });
});
