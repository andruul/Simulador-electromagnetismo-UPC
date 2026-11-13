/**
 * Capacitance & Dielectrics Physics Engine
 * Universidad Popular del Cesar (UPC)
 * 
 * Physics Fundamentals:
 *   C = κ ε₀ A / d
 *   Q = C V
 *   E = V / d
 *   U = 0.5 C V² = Q² / (2 C)
 *   Polarization Charge: Q_b = Q_diel * (1 - 1/κ)
 * 
 * SI Units:
 *   ε₀ = 8.8541878128e-12 F/m
 *   Area A in m² (UI in mm²)
 *   Distance d in m (UI in mm)
 *   Voltage V in Volts (V)
 *   Capacitance in Farads (F) -> displayed in pF (10⁻¹² F)
 *   Charge in Coulombs (C) -> displayed in pC (10⁻¹² C)
 *   Energy in Joules (J) -> displayed in pJ (10⁻¹² J)
 *   E-field in V/m or kV/m
 */

import { EPSILON_0 } from './gauss';
import type { DielectricMaterial } from '../types';

export const DIELECTRIC_MATERIALS: DielectricMaterial[] = [
  {
    id: 'vacuum',
    name: 'Vacío / Aire',
    kappa: 1.0,
    color: 'rgba(56, 189, 248, 0.15)',
    description: 'Permitividad base del vacío (κ = 1.000)'
  },
  {
    id: 'teflon',
    name: 'Teflón (PTFE)',
    kappa: 2.1,
    color: 'rgba(251, 191, 36, 0.45)',
    description: 'Polímero fluorado de baja pérdida dieléctrica (κ = 2.1)'
  },
  {
    id: 'paper',
    name: 'Papel',
    kappa: 3.7,
    color: 'rgba(217, 119, 6, 0.45)',
    description: 'Aislante de celulosa tratado (κ = 3.7)'
  },
  {
    id: 'glass',
    name: 'Vidrio Pyrex',
    kappa: 5.6,
    color: 'rgba(45, 212, 191, 0.45)',
    description: 'Borosilicato con alta rigidez dieléctrica (κ = 5.6)'
  },
  {
    id: 'strontium',
    name: 'Cerámica Dieléctrica',
    kappa: 8.5,
    color: 'rgba(168, 85, 247, 0.45)',
    description: 'Material cerámico de alta permitividad (κ = 8.5)'
  }
];

export interface CapacitorCalculationInput {
  plateAreaMm2: number;      // e.g. 100 to 400 mm²
  plateDistanceMm: number;    // e.g. 2 to 10 mm
  kappa: number;              // >= 1.0
  insertionFraction: number;  // 0.0 to 1.0 (portion of area with dielectric)
  connectedToBattery: boolean;// true: V = batteryVoltage; false: Q = constant
  batteryVoltage: number;     // Volts
  disconnectedCharge?: number;// Coulombs (if previously disconnected)
}

export interface CapacitorPhysicsResult {
  capacitance: number;        // Farads
  capacitancePF: number;      // pF
  storedCharge: number;       // Coulombs
  storedChargePC: number;     // pC
  voltage: number;            // Volts
  storedEnergy: number;       // Joules
  storedEnergyPJ: number;     // pJ
  electricField: number;      // V/m
  electricFieldKVm: number;   // kV/m
  polarizationChargePC: number; // pC
  vacuumCapacitancePF: number;// pF (without dielectric)
  dielectricCapacitancePF: number; // pF (portion with dielectric)
}

/**
 * Calculates parallel plate capacitance with optional partial dielectric insertion:
 *   C = C_vac + C_diel
 *   C_vac = ε₀ (1 - f) A / d
 *   C_diel = κ ε₀ f A / d
 */
export function calculateCapacitance(
  areaM2: number,
  distanceM: number,
  kappa: number,
  insertionFraction: number
): { totalC: number; vacC: number; dielC: number } {
  const f = Math.max(0, Math.min(1, insertionFraction));
  const vacArea = areaM2 * (1 - f);
  const dielArea = areaM2 * f;

  const vacC = (EPSILON_0 * vacArea) / distanceM;
  const dielC = (kappa * EPSILON_0 * dielArea) / distanceM;
  const totalC = vacC + dielC;

  return { totalC, vacC, dielC };
}

/**
 * Computes all electrical and physical parameters of the capacitor lab.
 */
export function computeCapacitorState(
  input: CapacitorCalculationInput
): CapacitorPhysicsResult {
  const areaM2 = input.plateAreaMm2 * 1e-6; // mm² -> m²
  const distanceM = input.plateDistanceMm * 1e-3; // mm -> m
  const f = Math.max(0, Math.min(1, input.insertionFraction));

  const { totalC, vacC, dielC } = calculateCapacitance(
    areaM2,
    distanceM,
    input.kappa,
    f
  );

  let voltage = 0;
  let storedCharge = 0;

  if (input.connectedToBattery) {
    voltage = input.batteryVoltage;
    storedCharge = totalC * voltage;
  } else {
    // When disconnected, charge is trapped! Q = cte
    storedCharge = input.disconnectedCharge ?? (totalC * input.batteryVoltage);
    voltage = totalC > 0 ? storedCharge / totalC : 0;
  }

  // Energy U = 0.5 * C * V² = 0.5 * Q * V
  const storedEnergy = 0.5 * totalC * voltage * voltage;

  // Average Electric Field E = V / d
  const electricField = distanceM > 0 ? Math.abs(voltage) / distanceM : 0;

  // Bound / Polarization Charge on dielectric
  // Q_diel = dielC * voltage
  // Q_b = Q_diel * (1 - 1/κ)
  const qDiel = dielC * voltage;
  const qPolarization = input.kappa > 1 ? qDiel * (1 - 1 / input.kappa) : 0;

  return {
    capacitance: totalC,
    capacitancePF: totalC * 1e12,
    storedCharge,
    storedChargePC: storedCharge * 1e12,
    voltage,
    storedEnergy,
    storedEnergyPJ: storedEnergy * 1e12,
    electricField,
    electricFieldKVm: electricField / 1000,
    polarizationChargePC: qPolarization * 1e12,
    vacuumCapacitancePF: vacC * 1e12,
    dielectricCapacitancePF: dielC * 1e12
  };
}

/**
 * Calculates the local potential V(x, y) at probe coordinates in the simulation space.
 * Plate 1 (Top) at y = -d/2 with potential +V/2.
 * Plate 2 (Bottom) at y = +d/2 with potential -V/2.
 */
export function sampleLocalPotential(
  px: number,
  py: number,
  topPlateY: number,
  botPlateY: number,
  plateLeftX: number,
  plateRightX: number,
  voltage: number
): number {
  const d = Math.abs(botPlateY - topPlateY);
  if (d <= 0) return 0;

  // Check if inside horizontal bounds
  const marginX = 25;
  if (px >= plateLeftX - marginX && px <= plateRightX + marginX) {
    if (py <= topPlateY) {
      return voltage / 2;
    } else if (py >= botPlateY) {
      return -voltage / 2;
    } else {
      // Linear potential ramp between plates: V(y) = +V/2 - (y - y_top)/d * V
      const frac = (py - topPlateY) / d;
      return (voltage / 2) - frac * voltage;
    }
  }

  // Fringe decay outside
  const distOut = Math.min(Math.abs(px - plateLeftX), Math.abs(px - plateRightX));
  const decay = Math.exp(-distOut / 35);

  const frac = Math.max(0, Math.min(1, (py - topPlateY) / d));
  const midV = (voltage / 2) - frac * voltage;
  return midV * decay;
}
