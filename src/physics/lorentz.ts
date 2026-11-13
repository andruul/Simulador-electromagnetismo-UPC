import type { Particle3D, Vector3D } from '../types';

export function crossProduct(a: Vector3D, b: Vector3D): Vector3D {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

export function dotProduct(a: Vector3D, b: Vector3D): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

export function vectorLength(v: Vector3D): number {
  return Math.hypot(v.x, v.y, v.z);
}

/**
 * Calculates E and B field at a given 3D position based on configuration
 */
export function evaluateFields(
  pos: Vector3D,
  time: number,
  config: 'uniform' | 'velocity_selector' | 'cyclotron' | 'magnetic_bottle' | 'drift',
  baseE: Vector3D,
  baseB: Vector3D
): { E: Vector3D; B: Vector3D } {
  if (config === 'uniform') {
    return { E: { ...baseE }, B: { ...baseB } };
  }

  if (config === 'velocity_selector') {
    // E is in Y, B is in Z, particle travels in X
    // Wien Filter: only particles with vx = E_y / B_z pass undeflected
    return {
      E: { x: 0, y: baseE.y !== 0 ? baseE.y : 10, z: 0 },
      B: { x: 0, y: 0, z: baseB.z !== 0 ? baseB.z : 2 }
    };
  }

  if (config === 'drift') {
    // E in Y, B in Z: induces drift in X (E x B drift = (0, Ey, 0) x (0, 0, Bz) = (Ey * Bz, 0, 0))
    return {
      E: { x: 0, y: baseE.y !== 0 ? baseE.y : 4, z: 0 },
      B: { x: 0, y: 0, z: baseB.z !== 0 ? baseB.z : 2.5 }
    };
  }

  if (config === 'magnetic_bottle') {
    // Magnetic bottle field: B_z increases at both ends |z| > 0
    // Div(B) = 0 => dBx/dx + dBy/dy + dBz/dz = 0 => Br = -0.5 * r * dBz/dz
    const z = pos.z;
    const rX = pos.x;
    const rY = pos.y;
    const B0 = baseB.z !== 0 ? baseB.z : 2;
    const alpha = 0.08;
    const Bz = B0 * (1 + alpha * z * z);
    const dBz_dz = 2 * alpha * B0 * z;
    const Bx = -0.5 * rX * dBz_dz;
    const By = -0.5 * rY * dBz_dz;

    return {
      E: { x: 0, y: 0, z: 0 },
      B: { x: Bx, y: By, z: Bz }
    };
  }

  if (config === 'cyclotron') {
    // Uniform B in Z
    const Bz = baseB.z !== 0 ? baseB.z : 3;
    // Cyclotron frequency: omega = q*B/m, assuming q=1, m=1
    const omega = Math.abs(Bz);
    // Gap in x in [-1.5, 1.5]
    let Ex = 0;
    if (Math.abs(pos.x) < 1.8) {
      // Alternating E field in gap
      Ex = 15 * Math.cos(omega * time);
    }
    return {
      E: { x: Ex, y: 0, z: 0 },
      B: { x: 0, y: 0, z: Bz }
    };
  }

  return { E: { ...baseE }, B: { ...baseB } };
}

/**
 * Boris Pusher: The golden standard symplectic particle integrator
 * for charged particles in electromagnetic fields.
 */
export function borisStep(
  particle: Particle3D,
  dt: number,
  time: number,
  config: 'uniform' | 'velocity_selector' | 'cyclotron' | 'magnetic_bottle' | 'drift',
  baseE: Vector3D,
  baseB: Vector3D
): void {
  const { E, B } = evaluateFields(particle.position, time, config, baseE, baseB);
  const q_over_m = particle.charge / particle.mass;

  // 1. Half electric acceleration
  const half_dt = 0.5 * dt;
  const v_minus: Vector3D = {
    x: particle.velocity.x + q_over_m * E.x * half_dt,
    y: particle.velocity.y + q_over_m * E.y * half_dt,
    z: particle.velocity.z + q_over_m * E.z * half_dt
  };

  // 2. Magnetic rotation vector t
  const t: Vector3D = {
    x: q_over_m * B.x * half_dt,
    y: q_over_m * B.y * half_dt,
    z: q_over_m * B.z * half_dt
  };

  const t_mag2 = t.x * t.x + t.y * t.y + t.z * t.z;
  const s_factor = 2 / (1 + t_mag2);
  const s: Vector3D = {
    x: t.x * s_factor,
    y: t.y * s_factor,
    z: t.z * s_factor
  };

  // v_prime = v_minus + (v_minus x t)
  const v_minus_cross_t = crossProduct(v_minus, t);
  const v_prime: Vector3D = {
    x: v_minus.x + v_minus_cross_t.x,
    y: v_minus.y + v_minus_cross_t.y,
    z: v_minus.z + v_minus_cross_t.z
  };

  // v_plus = v_minus + (v_prime x s)
  const v_prime_cross_s = crossProduct(v_prime, s);
  const v_plus: Vector3D = {
    x: v_minus.x + v_prime_cross_s.x,
    y: v_minus.y + v_prime_cross_s.y,
    z: v_minus.z + v_prime_cross_s.z
  };

  // 3. Second half electric acceleration
  particle.velocity.x = v_plus.x + q_over_m * E.x * half_dt;
  particle.velocity.y = v_plus.y + q_over_m * E.y * half_dt;
  particle.velocity.z = v_plus.z + q_over_m * E.z * half_dt;

  // 4. Update position
  particle.position.x += particle.velocity.x * dt;
  particle.position.y += particle.velocity.y * dt;
  particle.position.z += particle.velocity.z * dt;

  // 5. Update trail
  particle.trail.push({ ...particle.position });
  if (particle.trail.length > particle.maxTrailLength) {
    particle.trail.shift();
  }
}

/**
 * Computes instantaneous Lorentz Force: F = q * (E + v x B)
 */
export function calculateLorentzForce(
  particle: Particle3D,
  time: number,
  config: 'uniform' | 'velocity_selector' | 'cyclotron' | 'magnetic_bottle' | 'drift',
  baseE: Vector3D,
  baseB: Vector3D
): Vector3D {
  const { E, B } = evaluateFields(particle.position, time, config, baseE, baseB);
  const v_cross_b = crossProduct(particle.velocity, B);
  return {
    x: particle.charge * (E.x + v_cross_b.x),
    y: particle.charge * (E.y + v_cross_b.y),
    z: particle.charge * (E.z + v_cross_b.z)
  };
}
