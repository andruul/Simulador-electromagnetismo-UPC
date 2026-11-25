import type {
  Vector3D,
  GaussianShape3D,
  NonUniformFieldParams,
  FaceFluxResult,
  Gauss3DCalculation
} from '../tipos';
import { EPSILON_0, COULOMB_KE } from './gauss';

// =========================================================================
// MOTOR 3D DE LEY DE GAUSS: CAMPOS NO UNIFORMES Y CUERPOS VOLUMÉTRICOS
// =========================================================================

/**
 * Evalúa el campo eléctrico no uniforme E (en N/C) en cualquier coordenada 3D.
 */
export function evaluateNonUniformField(
  pos: Vector3D,
  params: NonUniformFieldParams,
  center: Vector3D = { x: 0, y: 0, z: 0 }
): Vector3D {
  const dx = pos.x - center.x;
  const dy = pos.y - center.y;
  const dz = pos.z - center.z;

  switch (params.model) {
    case 'linear_x':
      return { x: params.alpha * pos.x + params.beta, y: 0, z: 0 };

    case 'quadratic_x':
      return { x: params.alpha * pos.x * pos.x + params.beta, y: 0, z: 0 };

    case 'divergent_xyz':
      return {
        x: params.alpha * pos.x,
        y: params.beta * pos.y,
        z: params.gamma * pos.z
      };

    case 'radial_cylinder': {
      const r2 = dx * dx + dy * dy + 1e-6;
      const factor = params.alpha / r2;
      return {
        x: factor * dx,
        y: factor * dy,
        z: params.gamma * dz
      };
    }

    case 'point_charge': {
      const qC = params.chargeQ * 1e-9;
      const r2 = dx * dx + dy * dy + dz * dz + 1e-6;
      const r3 = Math.sqrt(r2) * r2;
      const factor = (COULOMB_KE * qC) / r3;
      return {
        x: factor * dx,
        y: factor * dy,
        z: factor * dz
      };
    }

    default:
      return { x: params.alpha, y: 0, z: 0 };
  }
}

/**
 * Divergencia teórica ∇·E en un punto dado para verificar el Teorema de la Divergencia.
 */
export function evaluateFieldDivergence(
  pos: Vector3D,
  params: NonUniformFieldParams
): number {
  switch (params.model) {
    case 'linear_x':
      return params.alpha;
    case 'quadratic_x':
      return 2 * params.alpha * pos.x;
    case 'divergent_xyz':
      return params.alpha + params.beta + params.gamma;
    case 'radial_cylinder':
      return 0;
    case 'point_charge':
      return 0;
    default:
      return 0;
  }
}

/**
 * Integración numérica de flujo sobre cada una de las 6 caras de un cubo/prisma 3D.
 */
export function integrateBox3DFaces(
  center: Vector3D,
  size: { lx: number; ly: number; lz: number },
  params: NonUniformFieldParams,
  gridN: number = 16
): FaceFluxResult[] {
  const halfX = size.lx / 2;
  const halfY = size.ly / 2;
  const halfZ = size.lz / 2;

  interface FaceDef {
    id: string;
    name: string;
    normal: Vector3D;
    area: number;
    center: Vector3D;
    uRange: [number, number];
    vRange: [number, number];
    pointAt: (u: number, v: number) => Vector3D;
  }

  const faceDefs: FaceDef[] = [
    {
      id: 'face_px',
      name: 'Cara Derecha (+X)',
      normal: { x: 1, y: 0, z: 0 },
      area: size.ly * size.lz,
      center: { x: center.x + halfX, y: center.y, z: center.z },
      uRange: [center.y - halfY, center.y + halfY],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: center.x + halfX, y: u, z: v })
    },
    {
      id: 'face_nx',
      name: 'Cara Izquierda (−X)',
      normal: { x: -1, y: 0, z: 0 },
      area: size.ly * size.lz,
      center: { x: center.x - halfX, y: center.y, z: center.z },
      uRange: [center.y - halfY, center.y + halfY],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: center.x - halfX, y: u, z: v })
    },
    {
      id: 'face_py',
      name: 'Cara Superior (+Y)',
      normal: { x: 0, y: 1, z: 0 },
      area: size.lx * size.lz,
      center: { x: center.x, y: center.y + halfY, z: center.z },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: u, y: center.y + halfY, z: v })
    },
    {
      id: 'face_ny',
      name: 'Cara Inferior (−Y)',
      normal: { x: 0, y: -1, z: 0 },
      area: size.lx * size.lz,
      center: { x: center.x, y: center.y - halfY, z: center.z },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.z - halfZ, center.z + halfZ],
      pointAt: (u, v) => ({ x: u, y: center.y - halfY, z: v })
    },
    {
      id: 'face_pz',
      name: 'Cara Frontal (+Z)',
      normal: { x: 0, y: 0, z: 1 },
      area: size.lx * size.ly,
      center: { x: center.x, y: center.y, z: center.z + halfZ },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.y - halfY, center.y + halfY],
      pointAt: (u, v) => ({ x: u, y: v, z: center.z + halfZ })
    },
    {
      id: 'face_nz',
      name: 'Cara Trasera (−Z)',
      normal: { x: 0, y: 0, z: -1 },
      area: size.lx * size.ly,
      center: { x: center.x, y: center.y, z: center.z - halfZ },
      uRange: [center.x - halfX, center.x + halfX],
      vRange: [center.y - halfY, center.y + halfY],
      pointAt: (u, v) => ({ x: u, y: v, z: center.z - halfZ })
    }
  ];

  return faceDefs.map((face) => {
    const du = (face.uRange[1] - face.uRange[0]) / gridN;
    const dv = (face.vRange[1] - face.vRange[0]) / gridN;
    const dA = du * dv;
    let faceFlux = 0;

    for (let i = 0; i < gridN; i++) {
      const u = face.uRange[0] + (i + 0.5) * du;
      for (let j = 0; j < gridN; j++) {
        const v = face.vRange[0] + (j + 0.5) * dv;
        const pt = face.pointAt(u, v);
        const E = evaluateNonUniformField(pt, params, center);
        const EdotN = E.x * face.normal.x + E.y * face.normal.y + E.z * face.normal.z;
        faceFlux += EdotN * dA;
      }
    }

    return {
      id: face.id,
      name: face.name,
      area: face.area,
      flux: faceFlux,
      normal: face.normal,
      center: face.center,
      fluxDensityAvg: faceFlux / face.area
    };
  });
}

/**
 * Integración numérica de flujo sobre un Cilindro 3D (Tapa superior, inferior y manto lateral).
 */
export function integrateCylinder3DFaces(
  center: Vector3D,
  radius: number,
  height: number,
  params: NonUniformFieldParams,
  radialRings: number = 10,
  angularSteps: number = 32,
  heightSteps: number = 16
): FaceFluxResult[] {
  const halfH = height / 2;
  const capArea = Math.PI * radius * radius;
  const mantleArea = 2 * Math.PI * radius * height;

  let topFlux = 0;
  const topNormal: Vector3D = { x: 0, y: 0, z: 1 };
  const dR = radius / radialRings;
  const dTheta = (2 * Math.PI) / angularSteps;

  for (let i = 0; i < radialRings; i++) {
    const r = (i + 0.5) * dR;
    const ringArea = ((i + 1) * (i + 1) - i * i) * dR * dR * Math.PI;
    const dSectorA = ringArea / angularSteps;

    for (let j = 0; j < angularSteps; j++) {
      const th = (j + 0.5) * dTheta;
      const pt: Vector3D = {
        x: center.x + r * Math.cos(th),
        y: center.y + r * Math.sin(th),
        z: center.z + halfH
      };
      const E = evaluateNonUniformField(pt, params, center);
      topFlux += E.z * topNormal.z * dSectorA;
    }
  }

  let bottomFlux = 0;
  const bottomNormal: Vector3D = { x: 0, y: 0, z: -1 };

  for (let i = 0; i < radialRings; i++) {
    const r = (i + 0.5) * dR;
    const ringArea = ((i + 1) * (i + 1) - i * i) * dR * dR * Math.PI;
    const dSectorA = ringArea / angularSteps;

    for (let j = 0; j < angularSteps; j++) {
      const th = (j + 0.5) * dTheta;
      const pt: Vector3D = {
        x: center.x + r * Math.cos(th),
        y: center.y + r * Math.sin(th),
        z: center.z - halfH
      };
      const E = evaluateNonUniformField(pt, params, center);
      bottomFlux += E.z * bottomNormal.z * dSectorA;
    }
  }

  let mantleFlux = 0;
  const dZ = height / heightSteps;
  const dMantleA = radius * dTheta * dZ;

  for (let i = 0; i < heightSteps; i++) {
    const z = center.z - halfH + (i + 0.5) * dZ;
    for (let j = 0; j < angularSteps; j++) {
      const th = (j + 0.5) * dTheta;
      const nx = Math.cos(th);
      const ny = Math.sin(th);
      const pt: Vector3D = {
        x: center.x + radius * nx,
        y: center.y + radius * ny,
        z
      };
      const E = evaluateNonUniformField(pt, params, center);
      const EdotN = E.x * nx + E.y * ny;
      mantleFlux += EdotN * dMantleA;
    }
  }

  return [
    {
      id: 'cap_top',
      name: 'Tapa Superior (+Z)',
      area: capArea,
      flux: topFlux,
      normal: topNormal,
      center: { x: center.x, y: center.y, z: center.z + halfH },
      fluxDensityAvg: topFlux / capArea
    },
    {
      id: 'cap_bottom',
      name: 'Tapa Inferior (−Z)',
      area: capArea,
      flux: bottomFlux,
      normal: bottomNormal,
      center: { x: center.x, y: center.y, z: center.z - halfH },
      fluxDensityAvg: bottomFlux / capArea
    },
    {
      id: 'mantle',
      name: 'Manto Lateral Cilíndrico',
      area: mantleArea,
      flux: mantleFlux,
      normal: { x: 1, y: 0, z: 0 },
      center: { x: center.x, y: center.y, z: center.z },
      fluxDensityAvg: mantleFlux / mantleArea
    }
  ];
}

/**
 * Integración numérica de flujo sobre un Tetraedro Regular 3D.
 */
export function integrateTetrahedron3DFaces(
  center: Vector3D,
  scale: number,
  params: NonUniformFieldParams,
  subdivN: number = 16
): FaceFluxResult[] {
  const s = scale;
  const v0: Vector3D = { x: center.x + s, y: center.y + s, z: center.z + s };
  const v1: Vector3D = { x: center.x + s, y: center.y - s, z: center.z - s };
  const v2: Vector3D = { x: center.x - s, y: center.y + s, z: center.z - s };
  const v3: Vector3D = { x: center.x - s, y: center.y - s, z: center.z + s };

  interface TriFace {
    id: string;
    name: string;
    a: Vector3D;
    b: Vector3D;
    c: Vector3D;
  }

  const faces: TriFace[] = [
    { id: 'tetra_face1', name: 'Cara 1 (+X+Y)', a: v0, b: v1, c: v2 },
    { id: 'tetra_face2', name: 'Cara 2 (+Y+Z)', a: v0, b: v2, c: v3 },
    { id: 'tetra_face3', name: 'Cara 3 (+X+Z)', a: v0, b: v3, c: v1 },
    { id: 'tetra_face4', name: 'Cara 4 (Base Inf.)', a: v1, b: v3, c: v2 }
  ];

  return faces.map((f) => {
    const abx = f.b.x - f.a.x;
    const aby = f.b.y - f.a.y;
    const abz = f.b.z - f.a.z;

    const acx = f.c.x - f.a.x;
    const acy = f.c.y - f.a.y;
    const acz = f.c.z - f.a.z;

    let nx = aby * acz - abz * acy;
    let ny = abz * acx - abx * acz;
    let nz = abx * acy - aby * acx;
    const mag = Math.hypot(nx, ny, nz);

    const fc: Vector3D = {
      x: (f.a.x + f.b.x + f.c.x) / 3,
      y: (f.a.y + f.b.y + f.c.y) / 3,
      z: (f.a.z + f.b.z + f.c.z) / 3
    };

    const toFaceX = fc.x - center.x;
    const toFaceY = fc.y - center.y;
    const toFaceZ = fc.z - center.z;
    if (nx * toFaceX + ny * toFaceY + nz * toFaceZ < 0) {
      nx = -nx;
      ny = -ny;
      nz = -nz;
    }

    const unx = nx / mag;
    const uny = ny / mag;
    const unz = nz / mag;

    const faceArea = 0.5 * mag;
    const totalSubTris = subdivN * subdivN;
    const dSubA = faceArea / totalSubTris;

    let faceFlux = 0;

    for (let i = 0; i < subdivN; i++) {
      for (let j = 0; j < subdivN - i; j++) {
        const u1 = (i + 1 / 3) / subdivN;
        const v1 = (j + 1 / 3) / subdivN;
        const w1 = 1 - u1 - v1;
        const p1: Vector3D = {
          x: w1 * f.a.x + u1 * f.b.x + v1 * f.c.x,
          y: w1 * f.a.y + u1 * f.b.y + v1 * f.c.y,
          z: w1 * f.a.z + u1 * f.b.z + v1 * f.c.z
        };
        const E1 = evaluateNonUniformField(p1, params, center);
        faceFlux += (E1.x * unx + E1.y * uny + E1.z * unz) * dSubA;

        if (i + j < subdivN - 1) {
          const u2 = (i + 2 / 3) / subdivN;
          const v2 = (j + 2 / 3) / subdivN;
          const w2 = 1 - u2 - v2;
          const p2: Vector3D = {
            x: w2 * f.a.x + u2 * f.b.x + v2 * f.c.x,
            y: w2 * f.a.y + u2 * f.b.y + v2 * f.c.y,
            z: w2 * f.a.z + u2 * f.b.z + v2 * f.c.z
          };
          const E2 = evaluateNonUniformField(p2, params, center);
          faceFlux += (E2.x * unx + E2.y * uny + E2.z * unz) * dSubA;
        }
      }
    }

    return {
      id: f.id,
      name: f.name,
      area: faceArea,
      flux: faceFlux,
      normal: { x: unx, y: uny, z: unz },
      center: fc,
      fluxDensityAvg: faceFlux / faceArea
    };
  });
}

/**
 * Integración numérica de flujo sobre una Esfera 3D mediante muestreo espiral de Fibonacci.
 */
export function integrateSphere3DFaces(
  center: Vector3D,
  radius: number,
  params: NonUniformFieldParams,
  samples: number = 720
): FaceFluxResult[] {
  const totalArea = 4 * Math.PI * radius * radius;
  const dA = totalArea / samples;
  let totalFlux = 0;
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < samples; i++) {
    const theta = (2 * Math.PI * i) / goldenRatio;
    const phi = Math.acos(1 - (2 * (i + 0.5)) / samples);

    const nx = Math.sin(phi) * Math.cos(theta);
    const ny = Math.sin(phi) * Math.sin(theta);
    const nz = Math.cos(phi);

    const pt: Vector3D = {
      x: center.x + radius * nx,
      y: center.y + radius * ny,
      z: center.z + radius * nz
    };

    const E = evaluateNonUniformField(pt, params, center);
    const EdotN = E.x * nx + E.y * ny + E.z * nz;
    totalFlux += EdotN * dA;
  }

  return [
    {
      id: 'sphere_total',
      name: 'Superficie Esférica Continua',
      area: totalArea,
      flux: totalFlux,
      normal: { x: 1, y: 0, z: 0 },
      center,
      fluxDensityAvg: totalFlux / totalArea
    }
  ];
}

/**
 * Solucionador completo 3D de la Ley de Gauss y Teorema de la Divergencia.
 */
export function computeGauss3D(
  shape: GaussianShape3D,
  center: Vector3D,
  dimensions: { size: number; radius: number; height: number },
  params: NonUniformFieldParams
): Gauss3DCalculation {
  let faces: FaceFluxResult[] = [];
  let volume = 0;

  if (shape === 'cube') {
    const s = dimensions.size;
    volume = s * s * s;
    faces = integrateBox3DFaces(center, { lx: s, ly: s, lz: s }, params, 16);
  } else if (shape === 'cylinder') {
    const r = dimensions.radius;
    const h = dimensions.height;
    volume = Math.PI * r * r * h;
    faces = integrateCylinder3DFaces(center, r, h, params, 10, 32, 16);
  } else if (shape === 'tetrahedron') {
    const s = dimensions.size * 0.7;
    volume = (8 / 3) * s * s * s;
    faces = integrateTetrahedron3DFaces(center, s, params, 16);
  } else {
    const r = dimensions.radius;
    volume = (4 / 3) * Math.PI * r * r * r;
    faces = integrateSphere3DFaces(center, r, params, 720);
  }

  const totalFlux = faces.reduce((sum, f) => sum + f.flux, 0);
  const enclosedCharge = totalFlux * EPSILON_0;

  const divAtCenter = evaluateFieldDivergence(center, params);
  const theoreticalChargeFromDivergence = divAtCenter * volume * EPSILON_0;

  let relativeError = 0;
  if (Math.abs(theoreticalChargeFromDivergence) > 1e-18) {
    relativeError =
      Math.abs((enclosedCharge - theoreticalChargeFromDivergence) / theoreticalChargeFromDivergence) *
      100;
  } else {
    relativeError = Math.abs(enclosedCharge) * 1e12;
  }

  return {
    shape,
    totalFlux,
    enclosedCharge,
    theoreticalChargeFromDivergence,
    divergenceAvg: divAtCenter,
    volume,
    relativeError,
    faces
  };
}
