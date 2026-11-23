import { describe, expect, it } from 'vitest';
import {
  borisStep,
  calculateLorentzForce,
  crossProduct,
  dotProduct,
  vectorLength
} from '../lorentz';
import type { Particle3D, Vector3D } from '../../tipos';
import { relErr } from './testUtils';

const ZERO: Vector3D = { x: 0, y: 0, z: 0 };

function makeParticle(
  position: Vector3D,
  velocity: Vector3D,
  charge = 1,
  mass = 1
): Particle3D {
  return {
    id: 'test',
    position: { ...position },
    velocity: { ...velocity },
    charge,
    mass,
    color: '#ffffff',
    trail: [],
    maxTrailLength: 2
  };
}

function kinetic(p: Particle3D): number {
  const v = vectorLength(p.velocity);
  return 0.5 * p.mass * v * v;
}

describe('Álgebra vectorial', () => {
  it('î × ĵ = k̂, ĵ × k̂ = î, k̂ × î = ĵ y a × a = 0', () => {
    expect(crossProduct({ x: 1, y: 0, z: 0 }, { x: 0, y: 1, z: 0 })).toEqual({ x: 0, y: 0, z: 1 });
    expect(crossProduct({ x: 0, y: 1, z: 0 }, { x: 0, y: 0, z: 1 })).toEqual({ x: 1, y: 0, z: 0 });
    expect(crossProduct({ x: 0, y: 0, z: 1 }, { x: 1, y: 0, z: 0 })).toEqual({ x: 0, y: 1, z: 0 });
    const a = { x: 2, y: -3, z: 5 };
    expect(crossProduct(a, a)).toEqual(ZERO);
  });

  it('producto punto y norma', () => {
    expect(dotProduct({ x: 1, y: 2, z: 3 }, { x: 4, y: -5, z: 6 })).toBe(12);
    expect(vectorLength({ x: 2, y: 3, z: 6 })).toBe(7);
  });
});

describe('Fuerza de Lorentz F = q (E + v × B)', () => {
  it('coincide con el cálculo manual', () => {
    const p = makeParticle(ZERO, { x: 1, y: 2, z: 3 }, 2);
    // v × B = (2·2 − 3·0, 3·0 − 1·2, 0) = (4, −2, 0)
    const F = calculateLorentzForce(p, 0, 'uniform', { x: 1, y: 0, z: 0 }, { x: 0, y: 0, z: 2 });
    expect(F.x).toBeCloseTo(2 * (1 + 4), 12);
    expect(F.y).toBeCloseTo(2 * -2, 12);
    expect(F.z).toBeCloseTo(0, 12);
  });

  it('la fuerza magnética es perpendicular a v (no realiza trabajo)', () => {
    const p = makeParticle(ZERO, { x: 3, y: -1, z: 2 }, 1.5);
    const F = calculateLorentzForce(p, 0, 'uniform', ZERO, { x: 0.3, y: 0.7, z: 2 });
    expect(Math.abs(dotProduct(F, p.velocity))).toBeLessThan(1e-12);
  });
});

describe('Boris pusher en campo magnético uniforme', () => {
  // q = 2, m = 3, B = 1.5 ẑ, v = 4 x̂  →  r = mv/(qB) = 4,  ω = qB/m = 1,  T = 2π
  const q = 2;
  const m = 3;
  const Bz = 1.5;
  const v0 = 4;
  const B: Vector3D = { x: 0, y: 0, z: Bz };
  const omega = (q * Bz) / m;
  const rLarmor = (m * v0) / (q * Bz);
  const period = (2 * Math.PI * m) / (q * Bz);

  function orbit(stepsPerPeriod: number, periods = 1) {
    const dt = period / stepsPerPeriod;
    const p = makeParticle(ZERO, { x: v0, y: 0, z: 0 }, q, m);
    let minX = 0;
    let maxX = 0;
    let minY = 0;
    let maxY = 0;
    let totalAngle = 0;
    const n = stepsPerPeriod * periods;
    for (let i = 0; i < n; i++) {
      const before = { ...p.velocity };
      borisStep(p, dt, i * dt, 'uniform', ZERO, B);
      // Ángulo girado por el vector velocidad en este paso (signo: horario para q>0, B>0)
      const cross = before.x * p.velocity.y - before.y * p.velocity.x;
      const dot = before.x * p.velocity.x + before.y * p.velocity.y;
      totalAngle += Math.atan2(cross, dot);
      minX = Math.min(minX, p.position.x);
      maxX = Math.max(maxX, p.position.x);
      minY = Math.min(minY, p.position.y);
      maxY = Math.max(maxY, p.position.y);
    }
    return { p, dt, minX, maxX, minY, maxY, totalAngle, n };
  }

  it('radio de Larmor r = mv/(|q|B) (error < 0.1 % con 400 pasos por órbita)', () => {
    const { minX, maxX, minY, maxY } = orbit(400);
    const rx = (maxX - minX) / 2;
    const ry = (maxY - minY) / 2;
    expect(relErr(rx, rLarmor)).toBeLessThan(1e-3);
    expect(relErr(ry, rLarmor)).toBeLessThan(1e-3);
  });

  it('el centro de la órbita está donde predice F = qv×B (en −y para q > 0)', () => {
    const { minY, maxY } = orbit(400);
    // Centro en (0, −r): la partícula nunca sube por encima de y ≈ 0
    expect(maxY).toBeLessThan(0.01 * rLarmor);
    expect(relErr(-minY, 2 * rLarmor)).toBeLessThan(1e-3);
  });

  it('una carga negativa gira en sentido contrario', () => {
    const dt = period / 400;
    const p = makeParticle(ZERO, { x: v0, y: 0, z: 0 }, -q, m);
    for (let i = 0; i < 100; i++) borisStep(p, dt, i * dt, 'uniform', ZERO, B);
    expect(p.position.y).toBeGreaterThan(0);
  });

  it('periodo ciclotrón T = 2πm/(|q|B): frecuencia angular numérica (error < 1e-4)', () => {
    const { totalAngle, dt, n } = orbit(400, 3);
    const omegaNum = Math.abs(totalAngle) / (n * dt);
    expect(relErr(omegaNum, omega)).toBeLessThan(1e-4);
    expect(relErr((2 * Math.PI) / omegaNum, period)).toBeLessThan(1e-4);
  });

  it('el ángulo por paso es exactamente 2·atan(ω·dt/2) (propiedad del rotador de Boris)', () => {
    const { totalAngle, dt, n } = orbit(200);
    const expectedStep = 2 * Math.atan((omega * dt) / 2);
    expect(Math.abs(totalAngle) / n).toBeCloseTo(expectedStep, 10);
  });

  it('el error de fase es de segundo orden en dt', () => {
    const errAt = (steps: number): number => {
      const { totalAngle, dt, n } = orbit(steps);
      return relErr(Math.abs(totalAngle) / (n * dt), omega);
    };
    const e1 = errAt(100);
    const e2 = errAt(200);
    const ratio = e1 / e2;
    expect(ratio).toBeGreaterThan(3.8);
    expect(ratio).toBeLessThan(4.2);
  });

  it('conserva la energía cinética en 1 000 pasos (deriva relativa < 1e-12)', () => {
    const p = makeParticle(ZERO, { x: v0, y: 1, z: 2 }, q, m);
    const k0 = kinetic(p);
    const dt = period / 200;
    let maxDrift = 0;
    for (let i = 0; i < 1000; i++) {
      borisStep(p, dt, i * dt, 'uniform', ZERO, B);
      maxDrift = Math.max(maxDrift, relErr(kinetic(p), k0));
    }
    expect(maxDrift).toBeLessThan(1e-12);
  });

  it('estabilidad simpléctica: 200 000 pasos sin deriva secular de energía', () => {
    const p = makeParticle(ZERO, { x: v0, y: 0, z: 0 }, q, m);
    const k0 = kinetic(p);
    const dt = period / 50;
    for (let i = 0; i < 200_000; i++) borisStep(p, dt, i * dt, 'uniform', ZERO, B);
    expect(relErr(kinetic(p), k0)).toBeLessThan(1e-9);
  });

  it('estable incluso con paso muy grueso (ω·dt = 2): |v| se conserva', () => {
    const p = makeParticle(ZERO, { x: v0, y: 0, z: 0 }, q, m);
    const k0 = kinetic(p);
    for (let i = 0; i < 5000; i++) borisStep(p, 2 / omega, 0, 'uniform', ZERO, B);
    expect(relErr(kinetic(p), k0)).toBeLessThan(1e-10);
    expect(Number.isFinite(p.position.x)).toBe(true);
  });

  it('la velocidad paralela a B no cambia (movimiento helicoidal)', () => {
    const p = makeParticle(ZERO, { x: v0, y: 0, z: 2.5 }, q, m);
    const dt = period / 200;
    for (let i = 0; i < 1000; i++) borisStep(p, dt, i * dt, 'uniform', ZERO, B);
    expect(p.velocity.z).toBeCloseTo(2.5, 12);
    expect(relErr(p.position.z, 2.5 * 1000 * dt)).toBeLessThan(1e-12);
  });

  it('el rastro se mantiene acotado por maxTrailLength', () => {
    const p = makeParticle(ZERO, { x: 1, y: 0, z: 0 });
    p.maxTrailLength = 5;
    for (let i = 0; i < 50; i++) borisStep(p, 0.01, 0, 'uniform', ZERO, B);
    expect(p.trail.length).toBe(5);
  });
});

describe('Boris pusher con campos E y B cruzados', () => {
  it('deriva E×B: velocidad media = E/B (cicloide, partícula desde el reposo)', () => {
    const E: Vector3D = { x: 0, y: 1, z: 0 };
    const B: Vector3D = { x: 0, y: 0, z: 2 };
    const omega = 2; // q = m = 1
    const period = (2 * Math.PI) / omega;
    const stepsPerPeriod = 200;
    const periods = 5;
    const dt = period / stepsPerPeriod;
    const p = makeParticle(ZERO, ZERO);
    const n = stepsPerPeriod * periods;
    for (let i = 0; i < n; i++) borisStep(p, dt, i * dt, 'uniform', E, B);
    const meanVx = p.position.x / (n * dt);
    expect(relErr(meanVx, 1 / 2)).toBeLessThan(2e-3);
  });

  it('selector de velocidades (Wien): solo pasa sin desviarse v = E/B', () => {
    const E: Vector3D = { x: 0, y: 10, z: 0 };
    const B: Vector3D = { x: 0, y: 0, z: 2 };
    const vSel = 5;
    const dt = 0.01;

    const ideal = makeParticle(ZERO, { x: vSel, y: 0, z: 0 });
    for (let i = 0; i < 2000; i++) borisStep(ideal, dt, i * dt, 'velocity_selector', E, B);
    expect(Math.abs(ideal.position.y)).toBeLessThan(1e-9);
    expect(ideal.velocity.x).toBeCloseTo(vSel, 9);

    const fast = makeParticle(ZERO, { x: 6, y: 0, z: 0 });
    for (let i = 0; i < 100; i++) borisStep(fast, dt, i * dt, 'velocity_selector', E, B);
    expect(Math.abs(fast.position.y)).toBeGreaterThan(0.1); // se desvía
    expect(fast.position.y).toBeLessThan(0); // F_y = q(E − vB) < 0 si v > E/B

    const slow = makeParticle(ZERO, { x: 4, y: 0, z: 0 });
    for (let i = 0; i < 100; i++) borisStep(slow, dt, i * dt, 'velocity_selector', E, B);
    expect(slow.position.y).toBeGreaterThan(0.1); // opuesto al rápido
  });

  it('trabajo del campo eléctrico: ΔK = q E · Δx (campo uniforme sin B)', () => {
    const E: Vector3D = { x: 3, y: 0, z: 0 };
    const p = makeParticle(ZERO, ZERO, 2, 4);
    const dt = 0.001;
    for (let i = 0; i < 5000; i++) borisStep(p, dt, i * dt, 'uniform', E, ZERO);
    const work = p.charge * E.x * p.position.x;
    // Boris con E uniforme es exacto en v y de 2º orden en x
    expect(relErr(kinetic(p), work)).toBeLessThan(2e-3);
  });
});

describe('Botella magnética', () => {
  it('con E = 0, |v| se conserva a lo largo de la trayectoria', () => {
    const p = makeParticle({ x: 0.5, y: 0, z: 0 }, { x: 0, y: 1, z: 1 });
    const k0 = kinetic(p);
    const dt = 0.005;
    let maxDrift = 0;
    for (let i = 0; i < 20_000; i++) {
      borisStep(p, dt, i * dt, 'magnetic_bottle', ZERO, { x: 0, y: 0, z: 2 });
      maxDrift = Math.max(maxDrift, relErr(kinetic(p), k0));
    }
    expect(maxDrift).toBeLessThan(1e-9);
  });

  it('el espejo magnético confina la partícula en z (sin escapar)', () => {
    const p = makeParticle({ x: 0.5, y: 0, z: 0 }, { x: 0, y: 1, z: 1 });
    const dt = 0.005;
    let maxAbsZ = 0;
    for (let i = 0; i < 40_000; i++) {
      borisStep(p, dt, i * dt, 'magnetic_bottle', ZERO, { x: 0, y: 0, z: 2 });
      maxAbsZ = Math.max(maxAbsZ, Math.abs(p.position.z));
    }
    // Sin campo en z el recorrido sería vz·t = 200: aquí queda reflejada en el espejo
    expect(maxAbsZ).toBeLessThan(5);
    expect(maxAbsZ).toBeGreaterThan(1);
  });
});
