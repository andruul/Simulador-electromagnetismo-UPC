export type SimulationMode = 'electrostatics' | 'lorentz3d' | 'magnetostatics' | 'theory';

export interface Vector2D {
  x: number;
  y: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
}

export interface PointCharge {
  id: string;
  x: number;
  y: number;
  charge: number; // In microCoulombs or standard units
  fixed: boolean;
  radius?: number;
  color?: string;
}

export interface TestParticle2D {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  charge: number;
  mass: number;
  trail: Vector2D[];
  color: string;
}

export interface Sensor2D {
  x: number;
  y: number;
  active: boolean;
}

export interface Particle3D {
  id: string;
  position: Vector3D;
  velocity: Vector3D;
  charge: number; // in relative elementary units or Coulombs
  mass: number;   // in relative units
  color: string;
  trail: Vector3D[];
  maxTrailLength: number;
}

export interface WireCurrent {
  id: string;
  x: number;
  y: number;
  current: number; // Positive = coming out of screen (+Z), Negative = going into screen (-Z)
  label?: string;
}

export interface ElectrostaticsSettings {
  showVectorField: boolean;
  showFieldLines: boolean;
  showPotentialHeatmap: boolean;
  showEquipotentialLines: boolean;
  fieldLinesPerCharge: number;
  vectorGridDensity: number;
  rk4StepSize: number;
  maxFieldLineSteps: number;
  kConstant: number;
}

export interface Lorentz3DSettings {
  eField: Vector3D;
  bField: Vector3D;
  fieldConfiguration: 'uniform' | 'velocity_selector' | 'cyclotron' | 'magnetic_bottle' | 'drift';
  showVectorsOnParticle: boolean;
  showFieldVectors: boolean;
  timeStep: number;
  trailLength: number;
}

