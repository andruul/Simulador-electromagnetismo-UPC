import React, { useRef, useEffect, useState } from 'react';
import { usePresetRequest } from '../../ganchos/usePeticionPreset';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Particle3D, Lorentz3DSettings, Vector3D, ViewMode } from '../../tipos';
import { borisStep, calculateLorentzForce, evaluateFields, vectorLength } from '../../fisica/lorentz';
import { Plus, Play, Pause, ChevronDown, ChevronUp, Gauge, MousePointerClick } from 'lucide-react';
import { LorentzTelemetryHud } from './TelemetriaLorentz';
import { InspectorParticula } from './InspectorParticula';

/**
 * Construye un vector velocidad con magnitud EXACTA `speed` en la dirección de `dir`.
 * Garantiza que |v| coincida exactamente con v₀ (sin desviaciones de normalización).
 */
function buildNormalizedVelocity(dir: Vector3D, speed: number): Vector3D {
  const len = Math.hypot(dir.x, dir.y, dir.z);
  if (len < 1e-9) return { x: speed, y: 0, z: 0 };
  const scale = speed / len;
  return { x: dir.x * scale, y: dir.y * scale, z: dir.z * scale };
}

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
  const [selectedParticleId, setSelectedParticleId] = useState<string | null>(null);

  // Particles state (+q = rojo terracota consistente con todo el simulador, -q = azul cerúleo)
  const [particles, setParticles] = useState<Particle3D[]>(() => {
    const v0 = settings.initialSpeed ?? 2.5;
    const initPos = { x: 0, y: 0, z: -6 };
    const initVel = buildNormalizedVelocity({ x: 0.88, y: 0.34, z: 0.32 }, v0);
    return [
      {
        id: 'p1',
        position: initPos,
        velocity: initVel,
        initialPosition: { ...initPos },
        initialVelocity: { ...initVel },
        charge: 1.0,
        mass: 1.0,
        color: '#D95B5F',
        trail: [],
        maxTrailLength: 350
      }
    ];
  });

  // Referencia sincronizada para raycasting 3D al hacer clic sobre partículas
  const particlesRef = useRef<Particle3D[]>(particles);
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  const selectionHaloRef = useRef<THREE.Mesh | null>(null);

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
    scene.background = new THREE.Color(0xFAF7F2);
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

    // Coordinate Grid & Axes Helper (armonizado con paleta marfil-arena)
    const gridHelper = new THREE.GridHelper(30, 30, 0x9C9286, 0xD5CEC4);
    gridHelper.position.y = -8;
    scene.add(gridHelper);

    const axesHelper = new THREE.AxesHelper(4);
    scene.add(axesHelper);

    // Group for field arrows
    const fieldGroup = new THREE.Group();
    scene.add(fieldGroup);
    fieldGroupRef.current = fieldGroup;

    // Halo visual de selección 3D (esfera translúcida dorada alrededor de la partícula seleccionada)
    const haloGeom = new THREE.SphereGeometry(0.82, 24, 24);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.75
    });
    const selectionHalo = new THREE.Mesh(haloGeom, haloMat);
    selectionHalo.visible = false;
    scene.add(selectionHalo);
    selectionHaloRef.current = selectionHalo;

    // Selección individual de partículas mediante clic (Raycaster + tolerancia de pantalla 26px)
    const raycaster = new THREE.Raycaster();
    const pointerNdc = new THREE.Vector2();
    let pointerDownPos: { x: number; y: number } | null = null;

    const handlePointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      pointerDownPos = { x: e.clientX, y: e.clientY };
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!pointerDownPos) return;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);
      pointerDownPos = null;
      if (dist > 6) return; // Fue un arrastre de cámara OrbitControls, no un clic

      const rect = renderer.domElement.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      pointerNdc.x = (clickX / rect.width) * 2 - 1;
      pointerNdc.y = -(clickY / rect.height) * 2 + 1;

      raycaster.setFromCamera(pointerNdc, camera);
      const meshes: THREE.Mesh[] = [];
      particleMeshesRef.current.forEach((item) => meshes.push(item.mesh));
      const hits = raycaster.intersectObjects(meshes, false);

      if (hits.length > 0) {
        const hitId = hits[0].object.userData.particleId as string | undefined;
        if (hitId) {
          setSelectedParticleId(hitId);
          return;
        }
      }

      // Fallback cómodo en pantalla para partículas en movimiento rápido (radio 26 px)
      let closestId: string | null = null;
      let minScreenDist = 26;
      const projected = new THREE.Vector3();
      for (const p of particlesRef.current) {
        projected.set(p.position.x, p.position.y, p.position.z).project(camera);
        if (projected.z > 1) continue;
        const sx = ((projected.x + 1) / 2) * rect.width;
        const sy = ((-projected.y + 1) / 2) * rect.height;
        const d = Math.hypot(sx - clickX, sy - clickY);
        if (d < minScreenDist) {
          minScreenDist = d;
          closestId = p.id;
        }
      }

      if (closestId) {
        setSelectedParticleId(closestId);
      }
    };

    renderer.domElement.addEventListener('pointerdown', handlePointerDown);
    renderer.domElement.addEventListener('pointerup', handlePointerUp);

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
      renderer.domElement.removeEventListener('pointerdown', handlePointerDown);
      renderer.domElement.removeEventListener('pointerup', handlePointerUp);
      ro.disconnect();
      cancelAnimationFrame(animId);
      haloGeom.dispose();
      haloMat.dispose();
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

  // Physics simulation step (independiente de los Hz del monitor + sub-stepping Boris)
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastNow: number | null = null;
    const maxSubDt = Math.min(0.025, Math.max(0.005, settings.timeStep || 0.02));
    const simSpeed = settings.simulationSpeed ?? 0.7;
    const defaultV0 = settings.initialSpeed ?? 2.5;

    const loop = (now: number) => {
      const realDt =
        lastNow === null ? 1 / 60 : Math.min(0.04, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;

      const totalSimDt = realDt * simSpeed;
      const subSteps = Math.max(1, Math.min(6, Math.ceil(totalSimDt / maxSubDt)));
      const subDt = totalSimDt / subSteps;
      const baseTime = simTimeRef.current;
      simTimeRef.current += totalSimDt;

      setParticles((prevParticles) => {
        return prevParticles.map((p) => {
          const updated = {
            ...p,
            position: { ...p.position },
            velocity: { ...p.velocity },
            trail: [...p.trail]
          };

          for (let step = 0; step < subSteps; step++) {
            // Integrate using Boris Symplectic Pusher
            borisStep(
              updated,
              subDt,
              baseTime + step * subDt,
              settings.fieldConfiguration,
              settings.eField,
              settings.bField
            );

            // Confinamiento de cámara de vacío: si sale del volumen observable (30×20×30 m),
            // se reinyecta limpiamente restaurando TANTO su posición COMO su velocidad inicial v₀
            // para evitar acumulación infinita de energía cinética cuando E ≠ 0.
            if (
              Math.abs(updated.position.x) > 15 ||
              Math.abs(updated.position.y) > 10 ||
              Math.abs(updated.position.z) > 15
            ) {
              const fallbackPos = {
                x:
                  settings.fieldConfiguration === 'velocity_selector' ||
                  settings.fieldConfiguration === 'drift'
                    ? -8
                    : 0,
                y: 0,
                z: settings.fieldConfiguration === 'uniform' ? -6 : 0
              };
              const fallbackVel = buildNormalizedVelocity(
                {
                  x: 0.92,
                  y: 0,
                  z: settings.fieldConfiguration === 'uniform' ? 0.36 : 0
                },
                defaultV0
              );
              updated.position = p.initialPosition ? { ...p.initialPosition } : fallbackPos;
              updated.velocity = p.initialVelocity ? { ...p.initialVelocity } : fallbackVel;
              updated.trail = [];
              break;
            }
          }

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
        mesh.userData.particleId = p.id;
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

      // Update position & dynamic color of mesh (si el usuario cambió el signo de q en el inspector)
      items.mesh.position.set(p.position.x, p.position.y, p.position.z);
      const meshMat = items.mesh.material as THREE.MeshStandardMaterial;
      meshMat.color.set(p.color);
      meshMat.emissive.set(p.color);
      const trailMat = items.trailLine.material as THREE.LineBasicMaterial;
      trailMat.color.set(p.color);

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

      // Update telemetry from selected particle (or particle 0 if none selected)
      const isTelemetryTarget =
        selectedParticleId !== null ? p.id === selectedParticleId : idx === 0;
      if (isTelemetryTarget) {
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
        const larmor =
          bMag > 0 && Math.abs(p.charge) > 1e-6
            ? (p.mass * vPerp) / (Math.abs(p.charge) * bMag)
            : 0;
        const cycFreq =
          bMag > 0 && Math.abs(p.charge) > 1e-6
            ? (Math.abs(p.charge) * bMag) / (2 * Math.PI * p.mass)
            : 0;

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

    // Actualizar halo visual 3D sobre la partícula seleccionada
    const halo = selectionHaloRef.current;
    if (halo) {
      const selected = selectedParticleId
        ? particles.find((p) => p.id === selectedParticleId)
        : null;
      if (selected) {
        halo.visible = true;
        halo.position.set(selected.position.x, selected.position.y, selected.position.z);
      } else {
        halo.visible = false;
      }
    }
  }, [particles, selectedParticleId, settings.showVectorsOnParticle, settings]);

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
      initialPosition: { ...position },
      initialVelocity: { ...velocity },
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
          particle('p1', { x: 0, y: 0, z: -6 }, { x: 3.0, y: 0, z: 1.2 }, '#D95B5F', 400)
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
          particle('p1', { x: 1.2, y: 0, z: 0 }, { x: 0, y: 3.2, z: 1.2 }, '#D95B5F', 500)
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
    const angle = Math.random() * Math.PI * 2;
    const v0 = settings.initialSpeed ?? 2.5;
    const pos = {
      x: (Math.random() - 0.5) * 3,
      y: (Math.random() - 0.5) * 2,
      z: -6 + (Math.random() - 0.5) * 2
    };
    const vel = buildNormalizedVelocity(
      {
        x: Math.cos(angle) * 0.92,
        y: Math.sin(angle) * 0.92,
        z: 0.36
      },
      v0
    );
    const newP: Particle3D = {
      id: newId,
      position: pos,
      velocity: vel,
      initialPosition: { ...pos },
      initialVelocity: { ...vel },
      charge: chargeSign,
      mass: 1.0,
      color: chargeSign > 0 ? '#D95B5F' : '#3E82AA', // +q Rojo terracota, -q Azul cerúleo
      trail: [],
      maxTrailLength: 350
    };
    setParticles((prev) => [...prev.slice(-11), newP]);
  };

  const updateParticleById = (id: string, updater: (p: Particle3D) => Particle3D) => {
    setParticles((prev) => prev.map((p) => (p.id === id ? updater(p) : p)));
  };

  const deleteParticleById = (id: string) => {
    setParticles((prev) => {
      if (prev.length <= 1) return prev;
      const next = prev.filter((p) => p.id !== id);
      if (selectedParticleId === id) {
        setSelectedParticleId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const resetVelocitiesToV0 = () => {
    const targetV0 = settings.initialSpeed ?? 2.5;
    setParticles((prev) =>
      prev.map((p) => {
        const newVel = buildNormalizedVelocity(p.velocity, targetV0);
        return {
          ...p,
          velocity: newVel,
          initialVelocity: { ...newVel }
        };
      })
    );
  };

  const clearParticles = () => {
    const v0 = settings.initialSpeed ?? 2.5;
    simTimeRef.current = 0;
    const initPos = { x: 0, y: 0, z: -6 };
    const initVel = buildNormalizedVelocity({ x: 0.88, y: 0.34, z: 0.32 }, v0);
    setSelectedParticleId(null);
    setParticles([
      {
        id: 'p_init',
        position: initPos,
        velocity: initVel,
        initialPosition: { ...initPos },
        initialVelocity: { ...initVel },
        charge: 1.0,
        mass: 1.0,
        color: '#D95B5F',
        trail: [],
        maxTrailLength: 350
      }
    ]);
  };

  const selectedParticle = selectedParticleId
    ? particles.find((p) => p.id === selectedParticleId) ?? null
    : null;
  const telemetryParticle = selectedParticle ?? particles[0];
  const telemetryParticleIdx = telemetryParticle
    ? particles.findIndex((p) => p.id === telemetryParticle.id)
    : 0;

  return (
    <div className="relative w-full h-full select-none bg-[#FAF7F2] overflow-hidden">
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {selectedParticle ? (
        <InspectorParticula
          particles={particles}
          selectedParticle={selectedParticle}
          onSelectParticle={setSelectedParticleId}
          onUpdateParticle={updateParticleById}
          onDeleteParticle={deleteParticleById}
          onClose={() => setSelectedParticleId(null)}
        />
      ) : (
        <button
          onClick={() => particles[0] && setSelectedParticleId(particles[0].id)}
          className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 hover:bg-white backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-sm text-[11px] text-[#4A4540] transition-colors cursor-pointer"
          title="Haz clic en cualquier partícula en 3D o aquí para editar su velocidad, carga y masa"
        >
          <MousePointerClick className="w-3.5 h-3.5 text-[#2D7A64]" />
          <span>Clic en una partícula para inspeccionar / editar</span>
        </button>
      )}

      <LorentzTelemetryHud
        viewMode={viewMode}
        telemetry={telemetry}
        bFieldZ={settings.bField.z}
        particleLabel={`Partícula #${telemetryParticleIdx + 1}`}
        particleCharge={telemetryParticle?.charge ?? 1.0}
        particleMass={telemetryParticle?.mass ?? 1.0}
        isExpanded={isHudExpanded}
        onToggle={() => setIsHudExpanded(!isHudExpanded)}
      />

      {/* Bottom Floating Control Bar (Collapsible) */}
      {isBottomOpen ? (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#2D2A26] z-10">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              isPlaying ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300' : 'bg-[#5B9E8A] hover:bg-[#4A8A77] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pausar' : 'Reanudar'}
          </button>

          <button
            onClick={() => addParticle(1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300 rounded-lg transition-colors cursor-pointer font-semibold"
            title="Inyectar partícula con carga positiva (+1 C)"
          >
            <Plus className="w-3.5 h-3.5" /> +q
          </button>

          <button
            onClick={() => addParticle(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 border border-sky-300 rounded-lg transition-colors cursor-pointer font-semibold"
            title="Inyectar partícula con carga negativa (−1 C)"
          >
            <Plus className="w-3.5 h-3.5" /> −q
          </button>

          <button
            onClick={resetVelocitiesToV0}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-lg transition-colors cursor-pointer font-medium"
            title={`Normalizar rapidez de todas las partículas a v₀ (${(settings.initialSpeed ?? 2.5).toFixed(1)} m/s)`}
          >
            <Gauge className="w-3.5 h-3.5" /> Frenar (v₀)
          </button>

          <button
            onClick={clearParticles}
            className="px-2.5 py-1.5 bg-[#EDE8DF] hover:bg-[#E0D8CF] text-[#4A4540] rounded-lg transition-colors cursor-pointer border border-[#D5CEC6]"
          >
            Reiniciar
          </button>

          <button
            onClick={() => setIsBottomOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-1"
            title="Minimizar barra de controles"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsBottomOpen(true)}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-sky-700 hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          title="Abrir controles de partículas"
        >
          <Plus className="w-3.5 h-3.5 text-sky-600" />
          <span>Partículas & Simulación</span>
          <ChevronUp className="w-3 h-3 text-[#6B6560]" />
        </button>
      )}
    </div>
  );
};
