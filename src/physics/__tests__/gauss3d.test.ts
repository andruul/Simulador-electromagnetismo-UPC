import { describe, it, expect } from 'vitest';
import {
  computeGauss3D,
  EPSILON_0
} from '../gauss';
import type { NonUniformFieldParams } from '../../types';

describe("Gauss's Law 3D & Non-Uniform Fields Physics Engine", () => {
  it('Cube in linear non-uniform field E = alpha * x * i verifies Divergence Theorem', () => {
    const params: NonUniformFieldParams = {
      model: 'linear_x',
      alpha: 100, // 100 N/(C·m)
      beta: 50,
      gamma: 0,
      chargeQ: 0
    };

    const side = 1.2; // meters
    const center = { x: 1.5, y: 0, z: 0 };
    const result = computeGauss3D('cube', center, { size: side, radius: 0.6, height: side }, params);

    // Theoretical: ∇·E = alpha = 100
    // Volume = side^3 = 1.728 m^3
    // Theoretical flux = ∇·E * V = 100 * 1.728 = 172.8 N·m²/C
    const expectedFlux = params.alpha * Math.pow(side, 3);
    expect(result.totalFlux).toBeCloseTo(expectedFlux, 1);

    // Q_enc = Φ * ε0
    const expectedCharge = expectedFlux * EPSILON_0;
    expect(result.enclosedCharge).toBeCloseTo(expectedCharge, 15);
    expect(result.relativeError).toBeLessThan(0.5); // < 0.5% numerical error
  });

  it('Tetrahedron in divergent 3D field E = (alpha*x)i + (beta*y)j + (gamma*z)k matches divergence', () => {
    const params: NonUniformFieldParams = {
      model: 'divergent_xyz',
      alpha: 40,
      beta: 30,
      gamma: 20,
      chargeQ: 0
    };

    const scale = 1.0;
    const center = { x: 0, y: 0, z: 0 };
    const result = computeGauss3D(
      'tetrahedron',
      center,
      { size: scale / 0.7, radius: scale, height: scale },
      params
    );

    // ∇·E = 40 + 30 + 20 = 90
    // Volume of regular tetrahedron V = (8/3) * scale^3
    const expectedFlux = 90 * result.volume;
    expect(result.totalFlux).toBeCloseTo(expectedFlux, 0);
    expect(result.faces.length).toBe(4); // Exactly 4 triangular faces
  });

  it('Cylinder in linear field E = alpha*x*i evaluates top, bottom and lateral flux', () => {
    const params: NonUniformFieldParams = {
      model: 'linear_x',
      alpha: 60,
      beta: 0,
      gamma: 0,
      chargeQ: 0
    };

    const radius = 0.8;
    const height = 1.5;
    const center = { x: 1.0, y: 0, z: 0 };
    const result = computeGauss3D(
      'cylinder',
      center,
      { size: 1.0, radius, height },
      params
    );

    // Volume of cylinder = π * R² * H
    const expectedVolume = Math.PI * radius * radius * height;
    const expectedFlux = params.alpha * expectedVolume;
    expect(result.totalFlux).toBeCloseTo(expectedFlux, 0);
    expect(result.faces.length).toBe(3); // Top cap, bottom cap, mantle
  });

  it('Sphere in point charge Coulomb field verifies Gauss Law Φ = Q / ε0', () => {
    const chargeNC = 5.0; // 5 nC
    const params: NonUniformFieldParams = {
      model: 'point_charge',
      alpha: 0,
      beta: 0,
      gamma: 0,
      chargeQ: chargeNC
    };

    const radius = 1.2;
    const center = { x: 0, y: 0, z: 0 };
    const result = computeGauss3D(
      'sphere',
      center,
      { size: radius * 2, radius, height: radius * 2 },
      params
    );

    // Theoretical flux for point charge = Q / ε0
    const expectedFlux = (chargeNC * 1e-9) / EPSILON_0;
    expect(result.totalFlux).toBeCloseTo(expectedFlux, -1);
  });
});
