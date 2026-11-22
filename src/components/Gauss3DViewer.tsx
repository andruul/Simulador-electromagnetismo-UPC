import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type {
  GaussianShape3D,
  NonUniformFieldModel,
  NonUniformFieldParams,
  Vector3D,
  ViewMode
} from '../types';
import {
  computeGauss3D,
  evaluateNonUniformField
} from '../physics/gauss';
import { usePresetRequest } from '../hooks/usePresetRequest';
import {
  Box,
  CircleDot,
  Pyramid,
  Sliders,
  CheckCircle2,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Gauss3DViewerProps {
  viewMode?: ViewMode;
  presetRequest?: string | null;
  onPresetHandled?: () => void;
}

export const Gauss3DViewer: React.FC<Gauss3DViewerProps> = ({
  viewMode = 'explore',
  presetRequest,
  onPresetHandled
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // 3D Geometry selection
  const [shape, setShape] = useState<GaussianShape3D>('cube');
  const [dimensions, setDimensions] = useState({ size: 1.6, radius: 0.9, height: 1.8 });

  // Non-uniform electric field parameters
  const [fieldParams, setFieldParams] = useState<NonUniformFieldParams>({
    model: 'linear_x',
    alpha: 80, // N/(C·m)
    beta: 20,
    gamma: 0,
    chargeQ: 4.0 // nC
  });

  // Handle 3D preset scenarios from LeftGuidePanel or Search
  usePresetRequest(presetRequest, onPresetHandled, (preset) => {
    switch (preset) {
      case 'tetra_divergent':
        setShape('tetrahedron');
        setFieldParams({
          model: 'divergent_xyz',
          alpha: 60,
          beta: 20,
          gamma: 40,
          chargeQ: 4.0
        });
        setDimensions({ size: 1.6, radius: 0.9, height: 1.8 });
        break;
      case 'cube_linear':
        setShape('cube');
        setFieldParams({
          model: 'linear_x',
          alpha: 100,
          beta: 20,
          gamma: 0,
          chargeQ: 4.0
        });
        setDimensions({ size: 1.6, radius: 0.9, height: 1.8 });
        break;
      case 'cylinder_radial':
        setShape('cylinder');
        setFieldParams({
          model: 'radial_cylinder',
          alpha: 80,
          beta: 0,
          gamma: 0,
          chargeQ: 4.0
        });
        setDimensions({ size: 1.6, radius: 0.9, height: 1.8 });
        break;
      case 'sphere_coulomb':
        setShape('sphere');
        setFieldParams({
          model: 'point_charge',
          alpha: 0,
          beta: 0,
          gamma: 0,
          chargeQ: 5.0
        });
        setDimensions({ size: 1.6, radius: 1.1, height: 1.8 });
        break;
      default:
        break;
    }
  });

  // Visualization toggles
  const [showArrows, setShowArrows] = useState(true);
  const [showNormals, setShowNormals] = useState(true);
  const [isFaceTableOpen, setIsFaceTableOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  // Position of Gaussian surface center
  const [center] = useState<Vector3D>({ x: 0, y: 0, z: 0 });

  // Physics calculation
  const physics = useMemo(
    () => computeGauss3D(shape, center, dimensions, fieldParams),
    [shape, center, dimensions, fieldParams]
  );

  // Three.js references
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const bodyGroupRef = useRef<THREE.Group | null>(null);
  const fieldVectorsGroupRef = useRef<THREE.Group | null>(null);

  // Initialize Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 800;
    const height = container.clientHeight || 600;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#FAF7F2');
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(4.2, 3.2, 4.6);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.maxDistance = 25;
    controls.minDistance = 1.5;
    controlsRef.current = controls;

    // Ambient & Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0x38bdf8, 1.2);
    dirLight1.position.set(5, 8, 5);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0x10b981, 0.8);
    dirLight2.position.set(-5, -4, -5);
    scene.add(dirLight2);

    // Subtle 3D spatial grid
    const grid = new THREE.GridHelper(8, 16, 0x1e293b, 0x0f172a);
    grid.position.y = -1.6;
    scene.add(grid);

    // Groups for surface body and vector arrows
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);
    bodyGroupRef.current = bodyGroup;

    const fieldVectorsGroup = new THREE.Group();
    scene.add(fieldVectorsGroup);
    fieldVectorsGroupRef.current = fieldVectorsGroup;

    let animId: number;
    const animate = () => {
      controls.update();
      renderer.render(scene, camera);
      animId = requestAnimationFrame(animate);
    };
    animId = requestAnimationFrame(animate);

    const handleResize = () => {
      if (!container || !renderer || !camera) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update 3D Gaussian geometry whenever shape or dimensions change
  useEffect(() => {
    const group = bodyGroupRef.current;
    if (!group) return;

    // Clean previous meshes
    while (group.children.length > 0) {
      const child = group.children[0] as THREE.Mesh;
      group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else if (child.material) {
        child.material.dispose();
      }
    }

    // Color helper based on flux: Red (outward +), Blue (inward -), Emerald (neutral ~0)
    const getFluxColor = (flux: number) => {
      if (flux > 0.5) return 0xf43f5e; // Pink/Rose
      if (flux < -0.5) return 0x0284c7; // Sky blue
      return 0x10b981; // Emerald neutral
    };

    if (shape === 'cube') {
      const s = dimensions.size;
      const geom = new THREE.BoxGeometry(s, s, s);

      // Create materials for the 6 faces matched with face flux
      const materials = physics.faces.map((f) => {
        const color = getFluxColor(f.flux);
        return new THREE.MeshStandardMaterial({
          color,
          roughness: 0.3,
          metalness: 0.1,
          transparent: true,
          opacity: 0.55,
          side: THREE.DoubleSide
        });
      });

      const mesh = new THREE.Mesh(geom, materials);
      group.add(mesh);

      // Edges wireframe
      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom),
        new THREE.LineBasicMaterial({ color: 0x94a3b8, linewidth: 2 })
      );
      group.add(edges);
    } else if (shape === 'cylinder') {
      const r = dimensions.radius;
      const h = dimensions.height;
      const geom = new THREE.CylinderGeometry(r, r, h, 36);

      // Top, Bottom, Mantle
      const materials = [
        new THREE.MeshStandardMaterial({
          color: getFluxColor(physics.faces[2]?.flux || 0), // Mantle
          transparent: true,
          opacity: 0.5,
          side: THREE.DoubleSide
        }),
        new THREE.MeshStandardMaterial({
          color: getFluxColor(physics.faces[0]?.flux || 0), // Top Cap
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide
        }),
        new THREE.MeshStandardMaterial({
          color: getFluxColor(physics.faces[1]?.flux || 0), // Bottom Cap
          transparent: true,
          opacity: 0.65,
          side: THREE.DoubleSide
        })
      ];

      const mesh = new THREE.Mesh(geom, materials);
      group.add(mesh);

      const edges = new THREE.LineSegments(
        new THREE.EdgesGeometry(geom, 40),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, linewidth: 1.5 })
      );
      group.add(edges);
    } else if (shape === 'tetrahedron') {
      // Custom Regular Tetrahedron with 4 distinct colored faces
      const s = dimensions.size * 0.7;
      const v0 = new THREE.Vector3(s, s, s);
      const v1 = new THREE.Vector3(s, -s, -s);
      const v2 = new THREE.Vector3(-s, s, -s);
      const v3 = new THREE.Vector3(-s, -s, s);

      // 4 triangular faces
      const triangles = [
        [v0, v1, v2], // Face 1
        [v0, v2, v3], // Face 2
        [v0, v3, v1], // Face 3
        [v1, v3, v2]  // Face 4
      ];

      triangles.forEach((pts, idx) => {
        const triGeom = new THREE.BufferGeometry();
        const positions = new Float32Array([
          pts[0].x, pts[0].y, pts[0].z,
          pts[1].x, pts[1].y, pts[1].z,
          pts[2].x, pts[2].y, pts[2].z
        ]);
        triGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        triGeom.computeVertexNormals();

        const faceFlux = physics.faces[idx]?.flux || 0;
        const mat = new THREE.MeshStandardMaterial({
          color: getFluxColor(faceFlux),
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
          roughness: 0.2
        });

        const triMesh = new THREE.Mesh(triGeom, mat);
        group.add(triMesh);

        // Triangular outline
        const lineGeom = new THREE.BufferGeometry().setFromPoints([
          pts[0], pts[1], pts[2], pts[0]
        ]);
        const wire = new THREE.Line(
          lineGeom,
          new THREE.LineBasicMaterial({ color: 0xfbbf24, linewidth: 2 })
        );
        group.add(wire);
      });
    } else {
      // Sphere
      const r = dimensions.radius;
      const geom = new THREE.SphereGeometry(r, 36, 24);
      const mat = new THREE.MeshStandardMaterial({
        color: getFluxColor(physics.totalFlux),
        transparent: true,
        opacity: 0.55,
        roughness: 0.2,
        side: THREE.DoubleSide
      });
      const mesh = new THREE.Mesh(geom, mat);
      group.add(mesh);

      const wire = new THREE.LineSegments(
        new THREE.WireframeGeometry(geom),
        new THREE.LineBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.25 })
      );
      group.add(wire);
    }

    // Add Normal Vector Arrows (n_hat) on each face center
    if (showNormals) {
      physics.faces.forEach((face) => {
        const origin = new THREE.Vector3(face.center.x, face.center.y, face.center.z);
        const dir = new THREE.Vector3(face.normal.x, face.normal.y, face.normal.z).normalize();
        const arrow = new THREE.ArrowHelper(dir, origin, 0.7, 0xfacc15, 0.18, 0.12);
        group.add(arrow);
      });
    }
  }, [shape, dimensions, physics, showNormals]);

  // Update Electric Field 3D Vector Grid
  useEffect(() => {
    const group = fieldVectorsGroupRef.current;
    if (!group) return;

    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
    }

    if (!showArrows) return;

    // Sample points in a 3D box surrounding the Gaussian surface
    const span = 2.4;
    const step = 1.2;

    for (let x = -span; x <= span; x += step) {
      for (let y = -span; y <= span; y += step) {
        for (let z = -span; z <= span; z += step) {
          const pt: Vector3D = { x, y, z };
          const E = evaluateNonUniformField(pt, fieldParams, center);
          const mag = Math.hypot(E.x, E.y, E.z);
          if (mag > 1e-4) {
            const dir = new THREE.Vector3(E.x, E.y, E.z).normalize();
            // Arrow length proportional to E strength, clamped between 0.3 and 1.2 m
            const len = Math.min(1.2, Math.max(0.35, mag * 0.008));
            const color = E.x > 0 ? 0x38bdf8 : 0xf43f5e;
            const arrow = new THREE.ArrowHelper(
              dir,
              new THREE.Vector3(x, y, z),
              len,
              color,
              len * 0.25,
              len * 0.18
            );
            group.add(arrow);
          }
        }
      }
    }
  }, [fieldParams, showArrows, center]);

  const qEncNC = (physics.enclosedCharge * 1e9).toFixed(3);
  const qDivNC = (physics.theoreticalChargeFromDivergence * 1e9).toFixed(3);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#FAF7F2]">
      {/* 3D Canvas Mount */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing block" />

      {/* Top Left: Real-Time Gauss 3D & Divergence Telemetry (Collapsible) */}
      <div className="absolute top-3 left-4 z-20 max-w-[calc(100%-2rem)]">
        {viewMode === 'explore' ? (
          <div className="bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-xl border border-[#D5CEC6] shadow-md flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 font-bold text-[#3D7A69]">
              <span className="w-2.5 h-2.5 rounded-full bg-[#5B9E8A] animate-pulse" />
              <span>Flujo Neto 3D:</span>
            </div>
            <span className="font-mono text-[#2D2A26] font-bold">
              {physics.totalFlux > 0 ? '+' : ''}
              {physics.totalFlux.toFixed(1)} N·m²/C
            </span>
            <div className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1">
              <span className="text-[#6B6560]">Carga neta:</span>
              <span className="font-mono text-sky-700 font-bold">{qEncNC} nC</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md flex flex-wrap items-center gap-4 text-xs font-mono">
            <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-3">
              <span className="text-[#3D7A69] font-bold">Φ_neto = ∮ E·dA:</span>
              <span className="text-[#2D2A26] font-bold">{physics.totalFlux.toFixed(2)} N·m²/C</span>
            </div>
            <div className="border-r border-[#E0D8CF] pr-3">
              <span className="text-[#6B6560]">Q_gauss: </span>
              <span className="text-sky-700 font-bold">{qEncNC} nC</span>
            </div>
            <div className="border-r border-[#E0D8CF] pr-3">
              <span className="text-[#6B6560]">Q_teorema (∇·E): </span>
              <span className="text-indigo-700 font-bold">{qDivNC} nC</span>
            </div>
            <div className="flex items-center gap-1 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5 text-[#5B9E8A]" />
              <span className="text-[#3D7A69] font-semibold">
                Error &lt; {physics.relativeError.toFixed(2)}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Top Right: Shape & Field Configuration HUD (Collapsible) */}
      {isControlsOpen ? (
        <div className="absolute top-3 right-4 z-20 w-80 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#D5CEC6] shadow-md text-xs space-y-2.5 text-[#2D2A26]">
          <div className="flex items-center justify-between pb-1.5 border-b border-[#E0D8CF]">
            <div className="flex items-center gap-1.5 font-bold text-[#2D2A26] text-[11px] uppercase tracking-wide">
              <Sliders className="w-3.5 h-3.5 text-[#5B9E8A]" />
              <span>Configuración 3D</span>
            </div>
            <button
              onClick={() => setIsControlsOpen(false)}
              className="p-1 text-[#6B6560] hover:text-[#2D2A26] rounded cursor-pointer"
              title="Minimizar controles"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 3D Gaussian Shape Selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Superficie Gaussiana 3D:
            </label>
            <div className="grid grid-cols-4 gap-1">
              <button
                onClick={() => setShape('cube')}
                className={`py-1.5 px-1 rounded flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                  shape === 'cube'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Box className="w-3.5 h-3.5" /> Cubo
              </button>
              <button
                onClick={() => setShape('cylinder')}
                className={`py-1.5 px-1 rounded flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                  shape === 'cylinder'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" /> Cilindro
              </button>
              <button
                onClick={() => setShape('tetrahedron')}
                className={`py-1.5 px-1 rounded flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                  shape === 'tetrahedron'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <Pyramid className="w-3.5 h-3.5" /> Tetraedro
              </button>
              <button
                onClick={() => setShape('sphere')}
                className={`py-1.5 px-1 rounded flex flex-col items-center gap-0.5 text-[10px] font-medium transition-all cursor-pointer ${
                  shape === 'sphere'
                    ? 'bg-emerald-600 text-white font-bold shadow'
                    : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                }`}
              >
                <CircleDot className="w-3.5 h-3.5" /> Esfera
              </button>
            </div>
          </div>

          {/* Electric Field Model Switcher */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 block mb-1">
              Modelo de Campo E(x,y,z):
            </label>
            <select
              value={fieldParams.model}
              onChange={(e) =>
                setFieldParams((prev) => ({
                  ...prev,
                  model: e.target.value as NonUniformFieldModel
                }))
              }
              className="w-full bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="linear_x">Lineal: E = (α·x + β) î</option>
              <option value="quadratic_x">Cuadrático: E = (α·x² + β) î</option>
              <option value="divergent_xyz">Divergente 3D: E = αx î + βy ĵ + γz k̂</option>
              <option value="radial_cylinder">Radial Cilíndrico: E = (α/r) r̂</option>
              <option value="point_charge">Monopolo Coulomb Central (Q)</option>
            </select>
          </div>

          {/* Coefficient Sliders */}
          <div className="space-y-1.5 bg-slate-950/80 p-2 rounded-lg border border-slate-800">
            {fieldParams.model !== 'point_charge' ? (
              <>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Gradiente α:</span>
                  <span className="font-mono text-cyan-300 font-bold">{fieldParams.alpha}</span>
                </div>
                <input
                  type="range"
                  min="-150"
                  max="150"
                  step="10"
                  value={fieldParams.alpha}
                  onChange={(e) =>
                    setFieldParams((prev) => ({ ...prev, alpha: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Offset β:</span>
                  <span className="font-mono text-cyan-300 font-bold">{fieldParams.beta}</span>
                </div>
                <input
                  type="range"
                  min="-50"
                  max="50"
                  step="5"
                  value={fieldParams.beta}
                  onChange={(e) =>
                    setFieldParams((prev) => ({ ...prev, beta: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-cyan-500 cursor-pointer"
                />

                {fieldParams.model === 'divergent_xyz' && (
                  <>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-slate-400">Gradiente Z γ:</span>
                      <span className="font-mono text-cyan-300 font-bold">{fieldParams.gamma}</span>
                    </div>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      step="10"
                      value={fieldParams.gamma}
                      onChange={(e) =>
                        setFieldParams((prev) => ({ ...prev, gamma: parseFloat(e.target.value) }))
                      }
                      className="w-full accent-indigo-500 cursor-pointer"
                    />
                  </>
                )}
              </>
            ) : (
              <>
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-slate-400">Carga Central Q:</span>
                  <span className="font-mono text-rose-400 font-bold">{fieldParams.chargeQ} nC</span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={fieldParams.chargeQ}
                  onChange={(e) =>
                    setFieldParams((prev) => ({ ...prev, chargeQ: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </>
            )}

            {/* Scale/Dimension Slider */}
            <div className="flex justify-between items-center text-[10px] pt-1 border-t border-slate-800">
              <span className="text-slate-400">Tamaño Superficie (L/R):</span>
              <span className="font-mono text-emerald-400 font-bold">
                {shape === 'cube' || shape === 'tetrahedron'
                  ? dimensions.size.toFixed(1)
                  : dimensions.radius.toFixed(1)}{' '}
                m
              </span>
            </div>
            <input
              type="range"
              min="0.8"
              max="2.4"
              step="0.1"
              value={shape === 'cube' || shape === 'tetrahedron' ? dimensions.size : dimensions.radius}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setDimensions((prev) => ({
                  ...prev,
                  size: val,
                  radius: val * 0.6,
                  height: val * 1.2
                }));
              }}
              className="w-full accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Vector toggles */}
          <div className="flex items-center justify-between pt-1 text-[11px]">
            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showArrows}
                onChange={(e) => setShowArrows(e.target.checked)}
                className="accent-cyan-500"
              />
              <span>Flechas E⃗ 3D</span>
            </label>

            <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={showNormals}
                onChange={(e) => setShowNormals(e.target.checked)}
                className="accent-amber-500"
              />
              <span>Normales n̂</span>
            </label>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsControlsOpen(true)}
          className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        >
          <Sliders className="w-3.5 h-3.5 text-[#5B9E8A]" />
          <span>Configurar 3D</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}

      {/* Bottom Left: Detailed Face-by-Face Flux Table (Collapsible) */}
      <div className="absolute bottom-4 left-4 z-20 max-w-[calc(100%-2rem)]">
        {isFaceTableOpen ? (
          <div className="bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#D5CEC6] shadow-md text-xs space-y-1.5 max-w-sm">
            <div className="flex items-center justify-between border-b border-[#E0D8CF] pb-1">
              <div className="flex items-center gap-1.5 text-[#2D2A26] font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>Desglose de Flujo por Cara (∬ E · n̂ dA)</span>
              </div>
              <button
                onClick={() => setIsFaceTableOpen(false)}
                className="p-0.5 text-[#6B6560] hover:text-[#2D2A26] rounded cursor-pointer"
                title="Minimizar tabla"
              >
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1 max-h-40 overflow-y-auto custom-scrollbar pr-1">
              {physics.faces.map((face) => (
                <div
                  key={face.id}
                  className="flex items-center justify-between p-1.5 rounded bg-[#EDE8DF] border border-[#D5CEC6] text-[11px]"
                >
                  <span className="text-[#4A4540] font-medium truncate pr-2">{face.name}</span>
                  <span
                    className={`font-mono font-bold whitespace-nowrap ${
                      face.flux > 0.1
                        ? 'text-rose-600'
                        : face.flux < -0.1
                          ? 'text-sky-600'
                          : 'text-[#6B6560]'
                    }`}
                  >
                    {face.flux > 0 ? '+' : ''}
                    {face.flux.toFixed(2)} N·m²/C
                  </span>
                </div>
              ))}
            </div>

            <div className="border-t border-[#E0D8CF] pt-1.5 flex items-center justify-between text-[11px] font-bold">
              <span className="text-[#2D2A26]">Flujo Neto Total:</span>
              <span className="font-mono text-[#3D7A69] text-xs">
                {physics.totalFlux > 0 ? '+' : ''}
                {physics.totalFlux.toFixed(2)} N·m²/C
              </span>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsFaceTableOpen(true)}
            className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Balance por Caras ({physics.faces.length})</span>
            <ChevronUp className="w-3.5 h-3.5 text-[#6B6560]" />
          </button>
        )}
      </div>


    </div>
  );
};

export default Gauss3DViewer;
