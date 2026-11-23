import type {
  ElectrostaticsSettings,
  Lorentz3DSettings,
  PointCharge
} from '../tipos';

/**
 * Initial state and one-click presets of the laboratories owned by the application shell.
 * Factories return fresh objects every time so React state never shares references.
 */

export function createDefaultCharges(): PointCharge[] {
  return [
    { id: 'c1', x: 330, y: 300, charge: 2, fixed: false },
    { id: 'c2', x: 490, y: 300, charge: -2, fixed: false }
  ];
}

export function createDefaultElectrostaticsSettings(): ElectrostaticsSettings {
  return {
    showVectorField: true,
    showFieldLines: true,
    showPotentialHeatmap: true,
    showEquipotentialLines: true,
    fieldLinesPerCharge: 16,
    vectorGridDensity: 32,
    rk4StepSize: 4,
    maxFieldLineSteps: 260,
    kConstant: 89900
  };
}

export function createDefaultLorentzSettings(): Lorentz3DSettings {
  return {
    eField: { x: 0, y: 0, z: 0 },
    bField: { x: 0, y: 0, z: 2.0 },
    fieldConfiguration: 'uniform',
    showVectorsOnParticle: true,
    showFieldVectors: true,
    timeStep: 0.04,
    trailLength: 350
  };
}

/** Charges of an electrostatics preset, or null when the key is unknown. */
export function buildElectrostaticsPreset(presetType: string): PointCharge[] | null {
  switch (presetType) {
    case 'single':
      return [{ id: 'c1', x: 400, y: 300, charge: 2, fixed: false }];
    case 'dipole':
      return [
        { id: 'c1', x: 320, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 480, y: 300, charge: -2, fixed: false }
      ];
    case 'repulsion':
      return [
        { id: 'c1', x: 320, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 480, y: 300, charge: 2, fixed: false }
      ];
    case 'quadrupole':
      return [
        { id: 'c1', x: 340, y: 240, charge: 2, fixed: false },
        { id: 'c2', x: 460, y: 240, charge: -2, fixed: false },
        { id: 'c3', x: 340, y: 360, charge: -2, fixed: false },
        { id: 'c4', x: 460, y: 360, charge: 2, fixed: false }
      ];
    case 'capacitor': {
      const plates: PointCharge[] = [];
      const count = 7;
      const startX = 260;
      const step = 45;
      for (let i = 0; i < count; i++) {
        plates.push({ id: `top_${i}`, x: startX + i * step, y: 200, charge: 1.5, fixed: true });
        plates.push({ id: `bot_${i}`, x: startX + i * step, y: 400, charge: -1.5, fixed: true });
      }
      return plates;
    }
    default:
      return null;
  }
}
