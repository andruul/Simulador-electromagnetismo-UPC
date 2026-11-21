import { describe, expect, it } from 'vitest';
import {
  calculateCapacitance,
  computeCapacitorState,
  sampleLocalPotential,
  type CapacitorCalculationInput
} from '../capacitance';
import { EPSILON_0 } from '../gauss';
import { relErr } from './testUtils';

/**
 * Parallel-plate capacitor vs. exact analytic formulas:
 *   C = κ ε₀ A / d,  Q = C V,  U = ½ C V² = Q² / 2C,  E = V / d
 */
const AREA_MM2 = 200;
const DIST_MM = 5;
const AREA_M2 = AREA_MM2 * 1e-6;
const DIST_M = DIST_MM * 1e-3;
const C_VACUUM = (EPSILON_0 * AREA_M2) / DIST_M;

function input(overrides: Partial<CapacitorCalculationInput> = {}): CapacitorCalculationInput {
  return {
    plateAreaMm2: AREA_MM2,
    plateDistanceMm: DIST_MM,
    kappa: 1,
    insertionFraction: 0,
    connectedToBattery: true,
    batteryVoltage: 3,
    ...overrides
  };
}

describe('Capacitor de placas paralelas', () => {
  it('C = ε₀A/d en vacío (sin dieléctrico)', () => {
    const r = computeCapacitorState(input());
    expect(relErr(r.capacitance, C_VACUUM)).toBeLessThan(1e-12);
    expect(relErr(r.capacitancePF, C_VACUUM * 1e12)).toBeLessThan(1e-12);
  });

  it('C = κε₀A/d con dieléctrico insertado por completo', () => {
    for (const kappa of [2.1, 3.7, 5.6, 8.5]) {
      const r = computeCapacitorState(input({ kappa, insertionFraction: 1 }));
      expect(relErr(r.capacitance, kappa * C_VACUUM)).toBeLessThan(1e-12);
    }
  });

  it('inserción parcial: C = C₀ (1 + f (κ − 1)) (capacitores en paralelo)', () => {
    const kappa = 5.6;
    for (const f of [0, 0.25, 0.5, 0.75, 1]) {
      const { totalC, vacC, dielC } = calculateCapacitance(AREA_M2, DIST_M, kappa, f);
      expect(relErr(totalC, C_VACUUM * (1 + f * (kappa - 1)))).toBeLessThan(1e-12);
      expect(relErr(vacC + dielC, totalC)).toBeLessThan(1e-12);
    }
  });

  it('la fracción de inserción se satura a [0, 1]', () => {
    const below = calculateCapacitance(AREA_M2, DIST_M, 4, -3).totalC;
    const above = calculateCapacitance(AREA_M2, DIST_M, 4, 7).totalC;
    expect(relErr(below, C_VACUUM)).toBeLessThan(1e-12);
    expect(relErr(above, 4 * C_VACUUM)).toBeLessThan(1e-12);
  });

  it('conectado a batería: V fijo, Q = CV, U = ½CV² = ½QV, E = V/d', () => {
    const V = 3;
    const r = computeCapacitorState(input({ kappa: 5.6, insertionFraction: 1, batteryVoltage: V }));
    const C = 5.6 * C_VACUUM;
    expect(r.voltage).toBe(V);
    expect(relErr(r.storedCharge, C * V)).toBeLessThan(1e-12);
    expect(relErr(r.storedEnergy, 0.5 * C * V * V)).toBeLessThan(1e-12);
    expect(relErr(r.storedEnergy, 0.5 * r.storedCharge * V)).toBeLessThan(1e-12);
    expect(relErr(r.electricField, V / DIST_M)).toBeLessThan(1e-12);
    expect(relErr(r.electricFieldKVm, V / DIST_M / 1000)).toBeLessThan(1e-12);
  });

  it('conversión de unidades: pF, pC y pJ', () => {
    const r = computeCapacitorState(input({ kappa: 2.1, insertionFraction: 1 }));
    expect(relErr(r.capacitancePF, r.capacitance * 1e12)).toBeLessThan(1e-15);
    expect(relErr(r.storedChargePC, r.storedCharge * 1e12)).toBeLessThan(1e-15);
    expect(relErr(r.storedEnergyPJ, r.storedEnergy * 1e12)).toBeLessThan(1e-15);
  });

  it('aislado (Q constante): insertar un dieléctrico divide V y U por κ', () => {
    const V0 = 3;
    const kappa = 5.6;
    const q = C_VACUUM * V0; // carga atrapada al desconectar en vacío
    const before = computeCapacitorState(
      input({ connectedToBattery: false, disconnectedCharge: q, batteryVoltage: V0 })
    );
    const after = computeCapacitorState(
      input({
        connectedToBattery: false,
        disconnectedCharge: q,
        batteryVoltage: V0,
        kappa,
        insertionFraction: 1
      })
    );
    expect(relErr(before.voltage, V0)).toBeLessThan(1e-12);
    expect(relErr(after.storedCharge, q)).toBeLessThan(1e-12); // Q se conserva
    expect(relErr(after.voltage, V0 / kappa)).toBeLessThan(1e-12);
    expect(relErr(after.storedEnergy, before.storedEnergy / kappa)).toBeLessThan(1e-12);
    // U = Q² / 2C
    expect(relErr(after.storedEnergy, (q * q) / (2 * after.capacitance))).toBeLessThan(1e-12);
  });

  it('conectado a batería: insertar dieléctrico multiplica Q y U por κ (V constante)', () => {
    const kappa = 3.7;
    const before = computeCapacitorState(input());
    const after = computeCapacitorState(input({ kappa, insertionFraction: 1 }));
    expect(relErr(after.storedCharge, kappa * before.storedCharge)).toBeLessThan(1e-12);
    expect(relErr(after.storedEnergy, kappa * before.storedEnergy)).toBeLessThan(1e-12);
  });

  it('carga de polarización: Q_b = Q_libre (1 − 1/κ) con dieléctrico completo', () => {
    const kappa = 5.6;
    const r = computeCapacitorState(input({ kappa, insertionFraction: 1 }));
    const expected = r.storedChargePC * (1 - 1 / kappa);
    expect(relErr(r.polarizationChargePC, expected)).toBeLessThan(1e-12);
  });

  it('κ = 1 (vacío) no genera carga de polarización', () => {
    const r = computeCapacitorState(input({ kappa: 1, insertionFraction: 1 }));
    expect(r.polarizationChargePC).toBe(0);
  });

  it('el campo es proporcional a V y se invierte con la polaridad', () => {
    const pos = computeCapacitorState(input({ batteryVoltage: 3 }));
    const neg = computeCapacitorState(input({ batteryVoltage: -3 }));
    expect(neg.storedCharge).toBeCloseTo(-pos.storedCharge, 20);
    expect(neg.electricField).toBe(pos.electricField); // |E|
    expect(neg.storedEnergy).toBe(pos.storedEnergy); // U no depende del signo
  });

  it('el tamaño del resultado es finito para distancias y áreas límite del simulador', () => {
    for (const area of [100, 400]) {
      for (const dist of [2, 10]) {
        const r = computeCapacitorState(input({ plateAreaMm2: area, plateDistanceMm: dist }));
        expect(Number.isFinite(r.capacitance)).toBe(true);
        expect(r.capacitance).toBeGreaterThan(0);
      }
    }
  });
});

describe('Potencial local entre placas (sampleLocalPotential)', () => {
  const top = 100;
  const bottom = 200; // d = 100 px
  const left = 100;
  const right = 400;
  const V = 3;

  it('es V/2 sobre la placa superior, −V/2 bajo la inferior y 0 en el punto medio', () => {
    expect(sampleLocalPotential(250, top, top, bottom, left, right, V)).toBeCloseTo(V / 2, 12);
    expect(sampleLocalPotential(250, bottom, top, bottom, left, right, V)).toBeCloseTo(-V / 2, 12);
    expect(sampleLocalPotential(250, 150, top, bottom, left, right, V)).toBeCloseTo(0, 12);
  });

  it('el potencial es lineal entre placas con pendiente uniforme (E = V/d)', () => {
    const dy = 1;
    const v1 = sampleLocalPotential(250, 120, top, bottom, left, right, V);
    const v2 = sampleLocalPotential(250, 120 + dy, top, bottom, left, right, V);
    const slope = (v1 - v2) / dy; // −dV/dy
    expect(relErr(slope, V / (bottom - top))).toBeLessThan(1e-12);
  });

  it('decae monótonamente fuera del capacitor y no diverge', () => {
    const near = Math.abs(sampleLocalPotential(right + 60, top, top, bottom, left, right, V));
    const far = Math.abs(sampleLocalPotential(right + 200, top, top, bottom, left, right, V));
    expect(far).toBeLessThan(near);
    expect(near).toBeLessThanOrEqual(V / 2);
  });

  it('separación nula devuelve 0 sin NaN', () => {
    expect(sampleLocalPotential(250, 100, 100, 100, left, right, V)).toBe(0);
  });
});
