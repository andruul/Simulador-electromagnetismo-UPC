export type SimulationMode =
  | 'electrostatics'
  | 'lorentz3d'
  | 'magnetostatics'
  | 'theory'
  | 'gauss'
  | 'capacitor'
  | 'faraday'
  | 'welcome';

export type ViewMode = 'explore' | 'lab';

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
  initialPosition?: Vector3D;
  initialVelocity?: Vector3D;
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
  initialSpeed?: number;    // Rapidez inicial de inyección v0 (m/s)
  simulationSpeed?: number; // Escala temporal de reproducción (0.15x cámara lenta a 1.5x)
}

// ==========================================
// Gauss's Law & Electric Flux Types
// ==========================================
export type GaussianSurfaceShape = 'circle' | 'rectangle';

export interface GaussianSurface {
  shape: GaussianSurfaceShape;
  cx: number;
  cy: number;
  radius: number; // in meters (scaled for simulation)
  width: number;
  height: number;
}

export interface GaussSurfaceElement {
  x: number;
  y: number;
  nx: number;
  ny: number;
  dl: number;
  dA: number;
  ex: number;
  ey: number;
  fluxDensity: number; // E · n
}

export interface GaussCalculation {
  enclosedCharge: number; // in Coulombs
  theoreticalFlux: number; // Q_enc / ε0 in N·m²/C (or V·m)
  numericalFlux: number;   // ∮ E · dA in N·m²/C
  relativeError: number;  // |numerical - theoretical| / theoretical
  elements: GaussSurfaceElement[];
}

export interface GaussSettings {
  surfaceShape: GaussianSurfaceShape;
  surfaceRadius: number; // meters
  surfaceWidth: number;  // meters
  surfaceHeight: number; // meters
  numElements: number;   // discretization segments
  showVectorField: boolean;
  showNormalVectors: boolean;
  showFluxHeatmap: boolean;
  showFieldLines: boolean;
}

// ==========================================
// Gauss's Law 3D & Non-Uniform Fields
// ==========================================
export type GaussianShape3D = 'cube' | 'cylinder' | 'sphere' | 'tetrahedron';

export type NonUniformFieldModel =
  | 'linear_x'
  | 'quadratic_x'
  | 'divergent_xyz'
  | 'radial_cylinder'
  | 'point_charge';

export interface NonUniformFieldParams {
  model: NonUniformFieldModel;
  alpha: number; // Principal coefficient (e.g. E_x = alpha * x)
  beta: number;  // Secondary coefficient or offset
  gamma: number; // Tertiary coefficient (e.g. E_z = gamma * z)
  chargeQ: number; // For point charge mode (nC)
}

export interface FaceFluxResult {
  id: string;
  name: string;
  area: number; // in m²
  flux: number; // in N·m²/C
  normal: Vector3D;
  center: Vector3D;
  fluxDensityAvg: number; // flux / area
}

export interface Gauss3DCalculation {
  shape: GaussianShape3D;
  totalFlux: number; // N·m²/C
  enclosedCharge: number; // Coulombs (Φ * ε0)
  theoreticalChargeFromDivergence: number; // Coulombs (∭ ∇·E dV * ε0)
  divergenceAvg: number; // N/(C·m)
  volume: number; // m³
  relativeError: number; // percentage
  faces: FaceFluxResult[];
}

// ==========================================
// Capacitance & Dielectrics Types
// ==========================================
export interface DielectricMaterial {
  id: string;
  name: string;
  kappa: number;
  color: string;
  description: string;
}

export interface CapacitorLabState {
  plateArea: number;           // mm² (e.g. 100 to 400 mm²)
  plateDistance: number;       // mm (e.g. 2 to 10 mm)
  dielectricKappa: number;     // κ >= 1.0
  dielectricInsertion: number; // fraction 0.0 to 1.0 inside the capacitor
  connectedToBattery: boolean; // true = constant V, false = constant Q
  batteryVoltage: number;      // Volts (-3.0V to +3.0V)
  // Calculated physical quantities:
  capacitance: number;         // Farads (typically in pF)
  storedCharge: number;        // Coulombs (typically in pC)
  storedEnergy: number;        // Joules (typically in pJ)
  electricField: number;       // V/m (inside vacuum and dielectric regions)
  polarizationCharge: number;  // pC
}

// ==========================================
// Faraday's Law & Electromagnetic Induction Types
// ==========================================
export interface FaradayLabState {
  magnetX: number;
  magnetY: number;
  magnetStrength: number;     // dipole moment in A·m²
  isOscillating: boolean;
  oscillationFreq: number;    // Hz
  oscillationAmp: number;     // px
  coilTurns: number;          // N (1, 2, 3, 4)
  coilRadius: number;         // px or meters
  coilX: number;
  coilY: number;
  // Dynamic quantities:
  flux: number;               // Weber (Wb) = T·m²
  dFluxDt: number;            // Wb/s
  inducedEmf: number;         // Volts (ε = -N dΦ/dt)
  inducedCurrent: number;     // Amperes
  bulbBrightness: number;     // normalized [0, 1]
  galvanometerAngle: number;  // radians or degrees [-45°, +45°]
}


