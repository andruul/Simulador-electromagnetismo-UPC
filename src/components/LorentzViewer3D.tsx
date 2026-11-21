import React, { useRef, useEffect, useState } from 'react';
import { usePresetRequest } from '../hooks/usePresetRequest';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Particle3D, Lorentz3DSettings, ViewMode } from '../types';
import { borisStep, calculateLorentzForce, evaluateFields, vectorLength } from '../physics/lorentz';
import { RotateCw, Sparkles, Plus, Play, Pause, Compass, ChevronDown, ChevronUp } from 'lucide-react';

interface LorentzViewer3DProps {
  settings: Lorentz3DSettings;
  setSettings: React.Dispatch<React.SetStateAction<Lorentz3DSettings>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
}

/**
 * Writes a particle trail into a line geometry.
 *
 * BufferGeometry.setFromPoints cannot grow an existing position buffer: once the trail
 * got longer than its first upload, three.js truncated it and logged "Buffer size too
 * small" every frame. Here the buffer is allocated once for the maximum trail length and
 * only the draw range changes.
 */
function updateTrailGeometry(
  geometry: THREE.BufferGeometry,
  trail: Particle3D['trail'],
  maxPoints: number
): void {
  const capacity = Math.max(2, maxPoints, trail.length);
  let attribute = geometry.getAttribute('position') as THREE.BufferAttribute | undefined;
  if (!attribute || attribute.count < capacity) {
    attribute = new THREE.BufferAttribute(new Float32Array(capacity * 3), 3);
    attribute.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('position', attribute);
  }

  const array = attribute.array as Float32Array;
  for (let i = 0; i < trail.length; i++) {
    array[i * 3] = trail[i].x;
    array[i * 3 + 1] = trail[i].y;
    array[i * 3 + 2] = trail[i].z;
  }
  geometry.setDrawRange(0, trail.length);
  attribute.needsUpdate = true;
}

export const LorentzViewer3D: React.FC<LorentzViewer3DProps> = ({
  settings,
  setSettings,
  isPlaying,
  setIsPlaying,
  presetRequest,
  onPresetHandled,
  viewMode = 'explore'
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState(false); // Collapsed by default for clean view
  const [isBottomOpen, setIsBottomOpen] = useState(true);

  // Particles state
  const [particles, setParticles] = useState<Particle3D[]>([
    {
      id: 'p1',
      position: { x: 0, y: 0, z: 0 },
      velocity: { x: 1.5, y: 3.5, z: 1.0 },
      charge: 1.0,
      mass: 1.0,
      color: '#38bdf8', // Cyan
      trail: [],
      maxTrailLength: 350
    }
  ]);

  // Telemetry for the active particle
  const [telemetry, setTelemetry] = useState({
    speed: 0,
    force: 0,
    kineticEnergy: 0,
    larmorRadius: 0,
    cyclotronFreq: 0,
    pos: { x: 0, y: 0, z: 0 }
  });

  // Time tracker for dynamic fields (cyclotron, etc.)
  const simTimeRef = useRef(0);

  // References to Three.js objects
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const fieldGroupRef = useRef<THREE.Group | null>(null);

  // Particle meshes cache: map particle ID to mesh and trail
  const particleMeshesRef = useRef<
    Map<
      string,
      {
        mesh: THREE.Mesh;
        trailLine: THREE.Line;
        vArrow: THREE.ArrowHelper;
        fArrow: THREE.ArrowHelper;
      }
    >
  >(new Map());

  // Setup Three.js scene
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x090d16);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(18, 14, 22);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Ambient and Directional Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(20, 40, 20);
    scene.add(dirLight);

    // Coordinate Grid & Axes Helper
    const gridHelper = new THREE.GridHelper(30, 30, 0x334155, 0x1e293b);
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(4);
    scene.add(axesHelper);

    // Group for field arrows
    const fieldGroup = new THREE.Group();
    scene.add(fieldGroup);
    fieldGroupRef.current = fieldGroup;

    // Handle Dynamic Container Resize with ResizeObserver
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0 && renderer && camera) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    ro.observe(container);

    // Animation Loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      ro.disconnect();
      cancelAnimationFrame(animId);
      controls.dispose();
      renderer.dispose();
      if (renderer.domElement.parentElement) {
        renderer.domElement.parentElement.removeChild(renderer.domElement);
      }
    };
  }, []);

  // Update Field Arrows visualization when settings change
  const { bField, eField, showFieldVectors } = settings;
  useEffect(() => {
    const fieldGroup = fieldGroupRef.current;
    if (!fieldGroup) return;

    // Clear previous field markers
    while (fieldGroup.children.length > 0) {
      fieldGroup.remove(fieldGroup.children[0]);
    }

    if (!showFieldVectors) return;

    // Create a 3D grid of field arrows
    const bMag = vectorLength(bField);
    const eMag = vectorLength(eField);

    // Magnetic field indicators (Cyan arrows)
    if (bMag > 0.05) {
      const bDir = new THREE.Vector3(bField.x, bField.y, bField.z).normalize();
      for (let x = -8; x <= 8; x += 8) {
        for (let y = -4; y <= 4; y += 4) {
          for (let z = -8; z <= 8; z += 8) {
            const arrow = new THREE.ArrowHelper(
              bDir,
              new THREE.Vector3(x, y, z),
              2.2,
              0x06b6d4, // Cyan
              0.5,
              0.3
            );
            fieldGroup.add(arrow);
          }
        }
      }
    }

    // Electric field indicators (Coral / Red arrows)
    if (eMag > 0.05) {
      const eDir = new THREE.Vector3(eField.x, eField.y, eField.z).normalize();
      for (let x = -6; x <= 6; x += 6) {
        for (let y = -3; y <= 3; y += 6) {
          for (let z = -6; z <= 6; z += 6) {
            const arrow = new THREE.ArrowHelper(
              eDir,
              new THREE.Vector3(x, y, z),
              2.0,
              0xf43f5e, // Coral/Red
              0.4,
              0.25
            );
            fieldGroup.add(arrow);
          }
        }
      }
    }
  }, [bField, eField, showFieldVectors]);

  // Physics simulation step
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    const dt = settings.timeStep || 0.04;

    const loop = () => {
      simTimeRef.current += dt;

      setParticles((prevParticles) => {
        return prevParticles.map((p) => {
          const updated = {
            ...p,
            position: { ...p.position },
            velocity: { ...p.velocity },
            trail: [...p.trail]
          };

          // Integrate using Boris Symplectic Pusher
          borisStep(
            updated,
            dt,
            simTimeRef.current,
            settings.fieldConfiguration,
            settings.eField,
            settings.bField
          );

          return updated;
        });
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, settings]);

  // Sync particle meshes and trails with Three.js scene
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const cache = particleMeshesRef.current;
    const currentIds = new Set(particles.map((p) => p.id));

    // Remove defunct meshes
    for (const [id, items] of cache.entries()) {
      if (!currentIds.has(id)) {
        scene.remove(items.mesh);
        scene.remove(items.trailLine);
        scene.remove(items.vArrow);
        scene.remove(items.fArrow);
        items.mesh.geometry.dispose();
        items.trailLine.geometry.dispose();
        cache.delete(id);
      }
    }

    // Update or create meshes for current particles
    particles.forEach((p, idx) => {
      let items = cache.get(p.id);

      if (!items) {
        // Create Sphere Mesh
        const geom = new THREE.SphereGeometry(0.5, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(p.color),
          emissive: new THREE.Color(p.color),
          emissiveIntensity: 0.6,
          roughness: 0.2,
          metalness: 0.8
        });
        const mesh = new THREE.Mesh(geom, mat);
        scene.add(mesh);

        // Create Trail Line
        const trailGeom = new THREE.BufferGeometry();
        const trailMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(p.color),
          linewidth: 2,
          transparent: true,
          opacity: 0.75
        });
        const trailLine = new THREE.Line(trailGeom, trailMat);
        // The trail grows every frame, so a bounding sphere computed once would go stale
        trailLine.frustumCulled = false;
        scene.add(trailLine);

        // Velocity Arrow (Lime)
        const vArrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          0xa3e635, // Lime
          0.3,
          0.2
        );
        scene.add(vArrow);

        // Force Arrow (Yellow/Gold)
        const fArrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          0xfacc15, // Yellow
          0.3,
          0.2
        );
        scene.add(fArrow);

        items = { mesh, trailLine, vArrow, fArrow };
        cache.set(p.id, items);
      }

      // Update position of mesh
      items.mesh.position.set(p.position.x, p.position.y, p.position.z);

      // Update trail geometry
      updateTrailGeometry(items.trailLine.geometry, p.trail, p.maxTrailLength);

      // Update vectors on particle
      if (settings.showVectorsOnParticle) {
        const vMag = vectorLength(p.velocity);
        if (vMag > 0.01) {
          items.vArrow.visible = true;
          items.vArrow.position.set(p.position.x, p.position.y, p.position.z);
          items.vArrow.setDirection(
            new THREE.Vector3(p.velocity.x, p.velocity.y, p.velocity.z).normalize()
          );
          items.vArrow.setLength(Math.min(3.5, vMag * 0.6), 0.35, 0.2);
        } else {
          items.vArrow.visible = false;
        }

        const F = calculateLorentzForce(
          p,
          simTimeRef.current,
          settings.fieldConfiguration,
          settings.eField,
          settings.bField
        );
        const fMag = vectorLength(F);
        if (fMag > 0.01) {
          items.fArrow.visible = true;
          items.fArrow.position.set(p.position.x, p.position.y, p.position.z);
          items.fArrow.setDirection(new THREE.Vector3(F.x, F.y, F.z).normalize());
          items.fArrow.setLength(Math.min(3.5, fMag * 0.4), 0.35, 0.2);
        } else {
          items.fArrow.visible = false;
        }
      } else {
        items.vArrow.visible = false;
        items.fArrow.visible = false;
      }

      // Update telemetry from particle 0
      if (idx === 0) {
        const vMag = vectorLength(p.velocity);
        const F = calculateLorentzForce(
          p,
          simTimeRef.current,
          settings.fieldConfiguration,
          settings.eField,
          settings.bField
        );
        const fMag = vectorLength(F);
        const Ek = 0.5 * p.mass * vMag * vMag;

        // Effective B field
        const { B } = evaluateFields(
          p.position,
          simTimeRef.current,
          settings.fieldConfiguration,
          settings.eField,
          settings.bField
        );
        const bMag = vectorLength(B);
        const vPerp = Math.hypot(p.velocity.x, p.velocity.y);
        const larmor = bMag > 0 ? (p.mass * vPerp) / (Math.abs(p.charge) * bMag) : 0;
        const cycFreq = bMag > 0 ? (Math.abs(p.charge) * bMag) / (2 * Math.PI * p.mass) : 0;

        setTelemetry({
          speed: vMag,
          force: fMag,
          kineticEnergy: Ek,
          larmorRadius: larmor,
          cyclotronFreq: cycFreq,
          pos: { ...p.position }
        });
      }
    });
  }, [particles, settings.showVectorsOnParticle, settings]);

  // Presets: pure description of the settings patch and the initial particles
  const buildPreset = (
    presetName: string
  ): { settings: Partial<Lorentz3DSettings>; particles: Particle3D[] } | null => {
    const particle = (
      id: string,
      position: Particle3D['position'],
      velocity: Particle3D['velocity'],
      color: string,
      maxTrailLength: number
    ): Particle3D => ({
      id,
      position,
      velocity,
      charge: 1.0,
      mass: 1.0,
      color,
      trail: [],
      maxTrailLength
    });

    if (presetName === 'helix') {
      return {
        settings: {
          fieldConfiguration: 'uniform',
          bField: { x: 0, y: 0, z: 2.0 },
          eField: { x: 0, y: 0, z: 0 }
        },
        particles: [
          particle('p1', { x: 0, y: 0, z: -6 }, { x: 3.0, y: 0, z: 1.2 }, '#38bdf8', 400)
        ]
      };
    }
    if (presetName === 'velocity_selector') {
      return {
        settings: {
          fieldConfiguration: 'velocity_selector',
          eField: { x: 0, y: 6.0, z: 0 },
          bField: { x: 0, y: 0, z: 2.0 }
        },
        particles: [
          particle('p_exact', { x: -8, y: 0, z: 0 }, { x: 3.0, y: 0, z: 0 }, '#10b981', 300),
          particle('p_slow', { x: -8, y: -0.2, z: 0 }, { x: 1.8, y: 0, z: 0 }, '#f43f5e', 300),
          particle('p_fast', { x: -8, y: 0.2, z: 0 }, { x: 4.5, y: 0, z: 0 }, '#facc15', 300)
        ]
      };
    }
    if (presetName === 'drift') {
      return {
        settings: {
          fieldConfiguration: 'drift',
          eField: { x: 0, y: 3.5, z: 0 },
          bField: { x: 0, y: 0, z: 2.5 }
        },
        particles: [particle('p1', { x: -6, y: 0, z: 0 }, { x: 0, y: 2.0, z: 0 }, '#a855f7', 450)]
      };
    }
    if (presetName === 'magnetic_bottle') {
      return {
        settings: {
          fieldConfiguration: 'magnetic_bottle',
          eField: { x: 0, y: 0, z: 0 },
          bField: { x: 0, y: 0, z: 2.0 }
        },
        particles: [
          particle('p1', { x: 1.2, y: 0, z: 0 }, { x: 0, y: 3.2, z: 1.2 }, '#38bdf8', 500)
        ]
      };
    }
    if (presetName === 'cyclotron') {
      return {
        settings: {
          fieldConfiguration: 'cyclotron',
          eField: { x: 0, y: 0, z: 0 },
          bField: { x: 0, y: 0, z: 2.5 }
        },
        particles: [
          particle('p1', { x: 0.1, y: 0, z: 0 }, { x: 0, y: 0.5, z: 0 }, '#f43f5e', 600)
        ]
      };
    }
    return null;
  };

  // One-click preset buttons (event handlers may update both states directly)
  const applyPreset = (presetName: string) => {
    const built = buildPreset(presetName);
    if (!built) return;
    setSettings((s) => ({ ...s, ...built.settings }));
    setParticles(built.particles);
  };

  // Handle preset request from parent (welcome screen or search modal).
  // Particles are this component's own state (applied while rendering); the shared
  // settings belong to the parent and are updated once the preset is committed.
  usePresetRequest(
    presetRequest,
    onPresetHandled,
    (preset) => {
      const built = buildPreset(preset);
      if (built) setParticles(built.particles);
    },
    (preset) => {
      const built = buildPreset(preset);
      if (built) setSettings((s) => ({ ...s, ...built.settings }));
    }
  );

  const addParticle = (chargeSign: number) => {
    const newId = 'p_' + Math.random().toString(36).substring(2, 7);
    const newP: Particle3D = {
      id: newId,
      position: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 4
      },
      velocity: {
        x: (Math.random() - 0.5) * 4,
        y: (Math.random() - 0.5) * 4,
        z: (Math.random() - 0.5) * 2
      },
      charge: chargeSign,
      mass: 1.0,
      color: chargeSign > 0 ? '#38bdf8' : '#fb7185',
      trail: [],
      maxTrailLength: 350
    };
    setParticles((prev) => [...prev, newP]);
  };

  const clearParticles = () => {
    setParticles([
      {
        id: 'p_init',
        position: { x: 0, y: 0, z: 0 },
        velocity: { x: 2.0, y: 3.0, z: 0.8 },
        charge: 1.0,
        mass: 1.0,
        color: '#38bdf8',
        trail: [],
        maxTrailLength: 350
      }
    ]);
  };

  return (
    <div className="relative w-full h-full select-none bg-[#090d16] overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Preset bar top-left */}
      <div className="absolute top-4 left-4 max-w-[calc(100%-5rem)] md:max-w-xl flex flex-wrap items-center gap-1.5 bg-slate-900/85 backdrop-blur-md p-2 rounded-xl border border-slate-700/60 shadow-2xl z-10">
        <span className="text-xs font-semibold text-slate-400 px-2 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Experimentos 3D:
        </span>
        <button
          onClick={() => applyPreset('helix')}
          className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-600/40 transition-colors cursor-pointer"
        >
          Espiral / Hélice (B puro)
        </button>
        <button
          onClick={() => applyPreset('velocity_selector')}
          className="px-2.5 py-1 text-xs bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 rounded-lg border border-emerald-600/40 transition-colors cursor-pointer"
        >
          Selector de Velocidades (Wien)
        </button>
        <button
          onClick={() => applyPreset('drift')}
          className="px-2.5 py-1 text-xs bg-purple-950/60 hover:bg-purple-900/80 text-purple-300 rounded-lg border border-purple-600/40 transition-colors cursor-pointer"
        >
          Deriva E × B (Cicloide)
        </button>
        <button
          onClick={() => applyPreset('magnetic_bottle')}
          className="px-2.5 py-1 text-xs bg-sky-950/60 hover:bg-sky-900/80 text-sky-300 rounded-lg border border-sky-600/40 transition-colors cursor-pointer"
        >
          Botella Magnética (Espejo)
        </button>
        <button
          onClick={() => applyPreset('cyclotron')}
          className="px-2.5 py-1 text-xs bg-rose-950/60 hover:bg-rose-900/80 text-rose-300 rounded-lg border border-rose-600/40 transition-colors cursor-pointer"
        >
          Ciclotrón
        </button>
      </div>

      {/* Telemetry and Physics Parameters HUD (Top Right) */}
      <div className="absolute top-4 right-4 bg-slate-900/90 backdrop-blur-md rounded-xl border border-slate-700/70 shadow-2xl text-xs z-10 transition-all max-w-[calc(100%-2rem)]">
        <div
          className="flex items-center justify-between p-2.5 border-b border-slate-700/60 gap-3 cursor-pointer select-none"
          onClick={() => setIsHudExpanded(!isHudExpanded)}
        >
          <div className="flex items-center gap-1.5 font-bold text-sky-400">
            <Compass className="w-4 h-4" />
            <span>DINÁMICA DE LORENTZ</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">Boris Pusher 3D</span>
            <button
              className="p-0.5 text-slate-400 hover:text-white rounded"
              title={isHudExpanded ? 'Minimizar HUD' : 'Expandir HUD'}
            >
              {isHudExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {isHudExpanded && (
          <div className="p-3.5 w-72 max-w-full">
            {viewMode === 'explore' ? (
              <div className="space-y-1.5 text-[11px] text-slate-300">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Rapidez:</span>
                  <span className="text-emerald-400 font-semibold">
                    {telemetry.speed > 3.5 ? 'Muy Rápida ⚡' : telemetry.speed > 1 ? 'Moderada' : 'Lenta'} ({telemetry.speed.toFixed(1)} m/s)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Fuerza Magnética:</span>
                  <span className="text-yellow-400 font-semibold">
                    {telemetry.force > 4 ? 'Curva Fuerte' : 'Curva Suave'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Órbita (Radio):</span>
                  <span className="text-indigo-300 font-medium">
                    {telemetry.larmorRadius > 0 ? (telemetry.larmorRadius < 2 ? 'Espiral Estrecha' : 'Giro Amplio') : 'Línea Recta'}
                  </span>
                </div>
                <div className="flex justify-between items-center border-t border-slate-800 pt-1 text-[10px]">
                  <span className="text-slate-500">Comportamiento:</span>
                  <span className="text-sky-300">
                    {Math.abs(settings.bField.z) > 0 ? 'Giro Orbital Conservativo' : 'Vuelo Libre'}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-1.5 font-mono text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">Rapidez |v|:</span>
                  <span className="text-emerald-400 font-semibold">{telemetry.speed.toFixed(2)} m/s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Fuerza Lorentz |F|:</span>
                  <span className="text-yellow-400 font-semibold">{telemetry.force.toFixed(2)} N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Energía Cinética:</span>
                  <span className="text-sky-300">{telemetry.kineticEnergy.toFixed(2)} J</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Radio de Larmor (r_L):</span>
                  <span className="text-indigo-300">{telemetry.larmorRadius.toFixed(2)} m</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Frecuencia Ciclotrón:</span>
                  <span className="text-purple-300">{telemetry.cyclotronFreq.toFixed(2)} Hz</span>
                </div>
                <div className="flex justify-between border-t border-slate-800 pt-1 text-[10px]">
                  <span className="text-slate-500">Posición (x, y, z):</span>
                  <span className="text-slate-400">
                    ({telemetry.pos.x.toFixed(1)}, {telemetry.pos.y.toFixed(1)},{' '}
                    {telemetry.pos.z.toFixed(1)})
                  </span>
                </div>
              </div>
            )}

            {/* Vector Legend */}
            <div className="border-t border-slate-800 mt-2.5 pt-2 grid grid-cols-2 gap-1 text-[10px]">
              <span className="flex items-center gap-1 text-lime-400">
                <span className="w-2 h-2 rounded-full bg-lime-400 inline-block" /> Vector v (Velocidad)
              </span>
              <span className="flex items-center gap-1 text-yellow-400">
                <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" /> Vector F (Lorentz)
              </span>
              <span className="flex items-center gap-1 text-cyan-400">
                <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block" /> Campo B (Magnético)
              </span>
              <span className="flex items-center gap-1 text-rose-400">
                <span className="w-2 h-2 rounded-full bg-rose-400 inline-block" /> Campo E (Eléctrico)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Floating Control Bar (Collapsible) */}
      {isBottomOpen ? (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-xl text-xs text-slate-200 z-10">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              isPlaying ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pausar' : 'Reanudar'}
          </button>

          <button
            onClick={() => addParticle(1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> +q
          </button>

          <button
            onClick={() => addParticle(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> −q
          </button>

          <button
            onClick={clearParticles}
            className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
          >
            Reiniciar
          </button>

          <button
            onClick={() => setIsBottomOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-1"
            title="Minimizar barra de controles"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsBottomOpen(true)}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl text-xs text-sky-300 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Abrir controles de partículas"
        >
          <Plus className="w-3.5 h-3.5 text-sky-400" />
          <span>Partículas & Simulación</span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      )}

      {/* Orbit Tip */}
      <div className="absolute bottom-5 right-5 bg-slate-900/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 flex items-center gap-2 pointer-events-none">
        <RotateCw className="w-3 h-3 text-sky-400" />
        <span>Usa el clic izquierdo para rotar la cámara y la rueda para zoom</span>
      </div>
    </div>
  );
};
