import { describe, expect, it } from 'vitest';
import {
  COULOMB_KE_SI,
  ELECTROSTATICS_PIXELS_PER_METER,
  calculateElectricFieldSI,
  calculateElectricPotentialSI
} from '../electrostatica';
import {
  MAGNETOSTATICS_PIXELS_PER_METER,
  MU_0_SI,
  calculateMagneticFieldSI2D,
  computeAmpereLaw
} from '../biotsavart';
import {
  calculateKirchhoffFringingFactor,
  computeCapacitorNetwork
} from '../capacitancia';
import type { PointCharge, WireCurrent } from '../../tipos';
import { relErr } from './testUtils';

describe('Rigor dimensional SI en Electrostática (100 px = 1.00 m)', () => {
  const charges: PointCharge[] = [{ id: 'c1', x: 200, y: 200, charge: 2, fixed: false }]; // +2 µC

  it('coincide con E = k_e · q / r² en N/C a 1.00 m (100 px)', () => {
    const E = calculateElectricFieldSI(300, 200, charges, ELECTROSTATICS_PIXELS_PER_METER);
    const exact = (COULOMB_KE_SI * 2e-6) / (1 * 1); // ~17975.10 N/C
    expect(E.y).toBeCloseTo(0, 6);
    expect(relErr(E.x, exact)).toBeLessThan(1e-3);
  });

  it('coincide con V = k_e · q / r en Voltios a 2.00 m (200 px)', () => {
    const V = calculateElectricPotentialSI(400, 200, charges, ELECTROSTATICS_PIXELS_PER_METER);
    const exact = (COULOMB_KE_SI * 2e-6) / 2; // ~8987.55 V
    expect(relErr(V, exact)).toBeLessThan(5e-4);
  });
});

describe('Rigor dimensional SI y Ley de Ampère en Magnetostática', () => {
  it('coincide con B = μ₀ I / (2π r) en Teslas a 1.00 m de un hilo de 4 A', () => {
    const wires: WireCurrent[] = [{ id: 'w1', x: 300, y: 300, current: 4 }];
    const B = calculateMagneticFieldSI2D(400, 300, wires, MAGNETOSTATICS_PIXELS_PER_METER);
    const exactMag = (2e-7 * 4) / 1.0; // 0.80 µT = 8e-7 T
    expect(relErr(Math.hypot(B.x, B.y), exactMag)).toBeLessThan(2e-3);
  });

  it('verifica ∮ B · dl = μ₀ I_enc para un conductor encerrado y descentrado', () => {
    const wires: WireCurrent[] = [{ id: 'w1', x: 430, y: 315, current: 5 }];
    const res = computeAmpereLaw(400, 300, 120, wires, MAGNETOSTATICS_PIXELS_PER_METER, 512);
    expect(res.enclosedCurrentA).toBe(5);
    expect(relErr(res.circulationTm, MU_0_SI * 5)).toBeLessThan(2e-3);
  });

  it('da circulación neta prácticamente cero cuando los conductores están fuera de la curva C', () => {
    const wires: WireCurrent[] = [
      { id: 'w1', x: 150, y: 300, current: 6 },
      { id: 'w2', x: 650, y: 300, current: -4 }
    ];
    const res = computeAmpereLaw(400, 300, 100, wires, MAGNETOSTATICS_PIXELS_PER_METER, 512);
    expect(res.enclosedCurrentA).toBe(0);
    expect(Math.abs(res.circulationTm)).toBeLessThan(1e-9);
  });

  it('cancela la circulación cuando encierra corrientes antiparalelas iguales (+4 A y −4 A)', () => {
    const wires: WireCurrent[] = [
      { id: 'w1', x: 370, y: 300, current: 4 },
      { id: 'w2', x: 430, y: 300, current: -4 }
    ];
    const res = computeAmpereLaw(400, 300, 120, wires, MAGNETOSTATICS_PIXELS_PER_METER, 512);
    expect(res.enclosedCurrentA).toBe(0);
    expect(Math.abs(res.circulationTm)).toBeLessThan(1e-9);
  });
});

describe('Corrección de borde de Kirchhoff y redes Serie/Paralelo en Capacitancia', () => {
  it('factor de Kirchhoff es mayor que 1 y tiende a 1 cuando d/R -> 0', () => {
    const fClose = calculateKirchhoffFringingFactor(400e-6, 0.5e-3);
    const fWide = calculateKirchhoffFringingFactor(200e-6, 8e-3);
    expect(fClose).toBeGreaterThan(1.0);
    expect(fWide).toBeGreaterThan(fClose);
  });

  it('calcula correctamente C_eq, cargas iguales y suma de voltajes en conexión en Serie', () => {
    const net = computeCapacitorNetwork('series', 2.0, 6.0, 12.0);
    expect(net.equivalentCPF).toBeCloseTo(1.5, 6); // (2*6)/(2+6) = 1.5 pF
    expect(net.q1PC).toBeCloseTo(18.0, 6);
    expect(net.q2PC).toBeCloseTo(18.0, 6);
    expect(net.v1 + net.v2).toBeCloseTo(12.0, 6);
    expect(net.v1).toBeCloseTo(9.0, 6);
    expect(net.v2).toBeCloseTo(3.0, 6);
  });

  it('calcula correctamente C_eq, voltajes iguales y suma de cargas en conexión en Paralelo', () => {
    const net = computeCapacitorNetwork('parallel', 2.0, 6.0, 5.0);
    expect(net.equivalentCPF).toBeCloseTo(8.0, 6);
    expect(net.v1).toBe(5.0);
    expect(net.v2).toBe(5.0);
    expect(net.q1PC + net.q2PC).toBeCloseTo(net.totalChargePC, 6);
    expect(net.totalEnergyPJ).toBeCloseTo(0.5 * 8.0 * 25.0, 6);
  });
});
