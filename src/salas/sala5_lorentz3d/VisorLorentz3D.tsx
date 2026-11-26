import React, { useRef, useEffect, useState, useCallback } from 'react';
import { usePresetRequest } from '../../ganchos/usePeticionPreset';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { Particle3D, Lorentz3DSettings, Vector3D, ViewMode } from '../../tipos';
import { borisStep, calculateLorentzForce, evaluateFields, vectorLength } from '../../fisica/lorentz';
import {
  Plus,
  Play,
  Pause,
  ChevronDown,
  ChevronUp,
  MousePointerClick,
  Box,
  Sparkles,
  RotateCcw
} from 'lucide-react';
import { LorentzTelemetryHud } from './TelemetriaLorentz';
import { InspectorParticula } from './InspectorParticula';
import { GizmoOrientacion3D, type CameraPresetView } from './GizmoOrientacion3D';

interface LorentzViewer3DProps {
  settings: Lorentz3DSettings;
  setSettings: React.Dispatch<React.SetStateAction<Lorentz3DSettings>>;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
}

/** Volumen ampliado de la cámara de vacío: 60 × 44 × 60 metros (evita reinicios prematuros). */
const CHAMBER_HALF_X = 30;
const CHAMBER_HALF_Y = 22;
const CHAMBER_HALF_Z = 30;
const DEFAULT_PARTICLE_SPEED = 2.5;
const DEFAULT_TRAIL_LENGTH = 750;

/**
 * Construye un vector velocidad con magnitud EXACTA `speed` en la dirección de `dir`.
 * Garantiza que |v| coincida exactamente con el valor configurado (sin error de normalización).
 */
function buildNormalizedVelocity(dir: Vector3D, speed: number): Vector3D {
  const len = Math.hypot(dir.x, dir.y, dir.z);
  if (len < 1e-9) return { x: speed, y: 0, z: 0 };
  const scale = speed / len;
  return { x: dir.x * scale, y: dir.y * scale, z: dir.z * scale };
}

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

function createInitialDefaultParticle(): Particle3D {
  const initPos = { x: 0, y: 0, z: -14 };
  const initVel = buildNormalizedVelocity({ x: 0.88, y: 0.34, z: 0.32 }, DEFAULT_PARTICLE_SPEED);
  return {
    id: 'p1',
    position: initPos,
    velocity: initVel,
    initialPosition: { ...initPos },
    initialVelocity: { ...initVel },
    charge: 1.0,
    mass: 1.0,
    color: '#D95B5F',
    trail: [],
    maxTrailLength: DEFAULT_TRAIL_LENGTH
  };
}

function cloneParticles(list: Particle3D[]): Particle3D[] {
  return list.map((p) => ({
    ...p,
    position: { ...p.position },
    velocity: { ...p.velocity },
    initialPosition: p.initialPosition ? { ...p.initialPosition } : undefined,
    initialVelocity: p.initialVelocity ? { ...p.initialVelocity } : undefined,
    trail: p.trail.map((pt) => ({ ...pt }))
  }));
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
  const isStudio = settings.lorentzViewVariant === 'studio';

  const mountRef = useRef<HTMLDivElement | null>(null);
  const [isHudExpanded, setIsHudExpanded] = useState(false);
  const [isBottomOpen, setIsBottomOpen] = useState(true);
  const [selectedParticleId, setSelectedParticleId] = useState<string | null>(null);
  const [gizmoOrientation, setGizmoOrientation] = useState<[number, number, number, number]>([
    0, 0, 0, 1
  ]);

  const [particles, setParticles] = useState<Particle3D[]>(() => [createInitialDefaultParticle()]);

  // Historial local de Deshacer / Rehacer para ediciones de partículas en Sala 5
  const [particleUndoStack, setParticleUndoStack] = useState<Particle3D[][]>([]);
  const [particleRedoStack, setParticleRedoStack] = useState<Particle3D[][]>([]);

  const pushParticleHistory = useCallback((snapshot: Particle3D[]) => {
    setParticleUndoStack((prev) => [...prev.slice(-24), cloneParticles(snapshot)]);
    setParticleRedoStack([]);
  }, []);

  const particlesRef = useRef<Particle3D[]>(particles);
  useEffect(() => {
    particlesRef.current = particles;
  }, [particles]);

  const [telemetry, setTelemetry] = useState({
    speed: DEFAULT_PARTICLE_SPEED,
    force: 0,
    kineticEnergy: 0.5 * DEFAULT_PARTICLE_SPEED * DEFAULT_PARTICLE_SPEED,
    larmorRadius: 0,
    cyclotronFreq: 0,
    pos: { x: 0, y: 0, z: -14 }
  });

  const simTimeRef = useRef(0);
  const accumulatorRef = useRef(0);

  // Three.js object refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const fieldGroupRef = useRef<THREE.Group | null>(null);
  const environmentGroupRef = useRef<THREE.Group | null>(null);
  const selectionHaloRef = useRef<THREE.Mesh | null>(null);

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

  // Inicialización de escena Three.js
  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xfaf7f2);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 1200);
    camera.position.set(26, 20, 32);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.minDistance = 6;
    controls.maxDistance = 130;
    controls.target.set(0, 0, 0);
    controlsRef.current = controls;

    // Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.78);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.15);
    dirLight.position.set(25, 45, 25);
    scene.add(dirLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.35);
    rimLight.position.set(-25, -15, -20);
    scene.add(rimLight);

    // Grupo de entorno (cuadrícula + caja de cámara + ejes) que cambia entre Sencillo y Estudio 3D
    const environmentGroup = new THREE.Group();
    scene.add(environmentGroup);
    environmentGroupRef.current = environmentGroup;

    // Grupo para flechas de campo E y B
    const fieldGroup = new THREE.Group();
    scene.add(fieldGroup);
    fieldGroupRef.current = fieldGroup;

    // Halo de selección 3D
    const haloGeom = new THREE.SphereGeometry(0.85, 22, 22);
    const haloMat = new THREE.MeshBasicMaterial({
      color: 0xf59e0b,
      wireframe: true,
      transparent: true,
      opacity: 0.78
    });
    const selectionHalo = new THREE.Mesh(haloGeom, haloMat);
    selectionHalo.visible = false;
    scene.add(selectionHalo);
    selectionHaloRef.current = selectionHalo;

    // Raycasting 3D + fallback de proximidad en pantalla (26 px)
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
      if (dist > 6) return;

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

    // Sincronizar Gizmo 3D solo cuando la rotación de cámara cambia significativamente
    const lastQuat = new THREE.Quaternion();
    const invQuat = new THREE.Quaternion();
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();

      if (Math.abs(lastQuat.dot(camera.quaternion)) < 0.99992) {
        lastQuat.copy(camera.quaternion);
        invQuat.copy(camera.quaternion).invert();
        setGizmoOrientation([invQuat.x, invQuat.y, invQuat.z, invQuat.w]);
      }

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

  // Actualizar estética de entorno entre Modo Sencillo y Estudio 3D (Unity / Unreal Engine)
  useEffect(() => {
    const scene = sceneRef.current;
    const envGroup = environmentGroupRef.current;
    if (!scene || !envGroup) return;

    while (envGroup.children.length > 0) {
      envGroup.remove(envGroup.children[0]);
    }

    scene.background = new THREE.Color(isStudio ? 0x0b0f17 : 0xfaf7f2);

    // Rejilla ampliada 60×60 m
    const mainGrid = new THREE.GridHelper(
      60,
      isStudio ? 60 : 30,
      isStudio ? 0x334155 : 0x9c9286,
      isStudio ? 0x1e293b : 0xd5cec4
    );
    mainGrid.position.y = -CHAMBER_HALF_Y + 4;
    envGroup.add(mainGrid);

    const axesHelper = new THREE.AxesHelper(isStudio ? 8 : 5);
    envGroup.add(axesHelper);

    // En Estudio 3D (Unity/UE): delimitar el volumen útil de la cámara de vacío 60×44×60 m
    if (isStudio) {
      const boxGeom = new THREE.BoxGeometry(
        CHAMBER_HALF_X * 2,
        CHAMBER_HALF_Y * 2,
        CHAMBER_HALF_Z * 2
      );
      const edgesGeom = new THREE.EdgesGeometry(boxGeom);
      const edgesMat = new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.22
      });
      const chamberWireframe = new THREE.LineSegments(edgesGeom, edgesMat);
      envGroup.add(chamberWireframe);
    }
  }, [isStudio]);

  // Flechas de campo 3D E y B (distribuidas en el volumen ampliado)
  const { bField, eField, showFieldVectors } = settings;
  useEffect(() => {
    const fieldGroup = fieldGroupRef.current;
    if (!fieldGroup) return;

    while (fieldGroup.children.length > 0) {
      fieldGroup.remove(fieldGroup.children[0]);
    }

    if (!showFieldVectors) return;

    const bMag = vectorLength(bField);
    const eMag = vectorLength(eField);

    if (bMag > 0.05) {
      const bDir = new THREE.Vector3(bField.x, bField.y, bField.z).normalize();
      for (let x = -16; x <= 16; x += 16) {
        for (let y = -8; y <= 8; y += 8) {
          for (let z = -16; z <= 16; z += 16) {
            const arrow = new THREE.ArrowHelper(
              bDir,
              new THREE.Vector3(x, y, z),
              2.8,
              isStudio ? 0x38bdf8 : 0x06b6d4,
              0.6,
              0.35
            );
            fieldGroup.add(arrow);
          }
        }
      }
    }

    if (eMag > 0.05) {
      const eDir = new THREE.Vector3(eField.x, eField.y, eField.z).normalize();
      for (let x = -12; x <= 12; x += 12) {
        for (let y = -6; y <= 6; y += 12) {
          for (let z = -12; z <= 12; z += 12) {
            const arrow = new THREE.ArrowHelper(
              eDir,
              new THREE.Vector3(x, y, z),
              2.4,
              0xf43f5e,
              0.48,
              0.28
            );
            fieldGroup.add(arrow);
          }
        }
      }
    }
  }, [bField, eField, showFieldVectors, isStudio]);

  // Bucle físico con acumulador de paso fijo real (Precisión Boris Pusher 100% funcional)
  useEffect(() => {
    if (!isPlaying) return;

    let animId: number;
    let lastNow: number | null = null;
    const fixedDt = Math.min(0.15, Math.max(0.005, settings.timeStep || 0.02));

    const loop = (now: number) => {
      const realDt =
        lastNow === null ? 1 / 60 : Math.min(0.05, Math.max(0.001, (now - lastNow) / 1000));
      lastNow = now;

      accumulatorRef.current += realDt;
      let stepsToRun = 0;
      while (accumulatorRef.current >= fixedDt && stepsToRun < 20) {
        accumulatorRef.current -= fixedDt;
        stepsToRun++;
      }

      if (stepsToRun > 0) {
        const baseTime = simTimeRef.current;
        simTimeRef.current += stepsToRun * fixedDt;

        setParticles((prevParticles) => {
          return prevParticles.map((p) => {
            const updated = {
              ...p,
              position: { ...p.position },
              velocity: { ...p.velocity },
              trail: [...p.trail]
            };

            for (let step = 0; step < stepsToRun; step++) {
              borisStep(
                updated,
                fixedDt,
                baseTime + step * fixedDt,
                settings.fieldConfiguration,
                settings.eField,
                settings.bField
              );

              // Cámara de vacío ampliada 60×44×60 m: solo reinyecta al cruzar el borde lejano
              // restaurando tanto la posición como la velocidad inicial exacta.
              if (
                Math.abs(updated.position.x) > CHAMBER_HALF_X ||
                Math.abs(updated.position.y) > CHAMBER_HALF_Y ||
                Math.abs(updated.position.z) > CHAMBER_HALF_Z
              ) {
                const fallbackPos = {
                  x:
                    settings.fieldConfiguration === 'velocity_selector' ||
                    settings.fieldConfiguration === 'drift'
                      ? -16
                      : 0,
                  y: 0,
                  z: settings.fieldConfiguration === 'uniform' ? -14 : 0
                };
                const fallbackVel = buildNormalizedVelocity(
                  {
                    x: 0.92,
                    y: 0,
                    z: settings.fieldConfiguration === 'uniform' ? 0.36 : 0
                  },
                  DEFAULT_PARTICLE_SPEED
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
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, settings]);

  // Sincronización de mallas Three.js, estelas, vectores y telemetría
  useEffect(() => {
    const scene = sceneRef.current;
    if (!scene) return;

    const cache = particleMeshesRef.current;
    const currentIds = new Set(particles.map((p) => p.id));

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

    particles.forEach((p, idx) => {
      let items = cache.get(p.id);

      if (!items) {
        const geom = new THREE.SphereGeometry(0.55, 32, 32);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(p.color),
          emissive: new THREE.Color(p.color),
          emissiveIntensity: 0.55,
          roughness: 0.2,
          metalness: 0.75
        });
        const mesh = new THREE.Mesh(geom, mat);
        mesh.userData.particleId = p.id;
        scene.add(mesh);

        const trailGeom = new THREE.BufferGeometry();
        const trailMat = new THREE.LineBasicMaterial({
          color: new THREE.Color(p.color),
          linewidth: 2,
          transparent: true,
          opacity: 0.8
        });
        const trailLine = new THREE.Line(trailGeom, trailMat);
        trailLine.frustumCulled = false;
        scene.add(trailLine);

        const vArrow = new THREE.ArrowHelper(
          new THREE.Vector3(1, 0, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          0x84cc16,
          0.35,
          0.22
        );
        scene.add(vArrow);

        const fArrow = new THREE.ArrowHelper(
          new THREE.Vector3(0, 1, 0),
          new THREE.Vector3(0, 0, 0),
          1,
          0xfacc15,
          0.35,
          0.22
        );
        scene.add(fArrow);

        items = { mesh, trailLine, vArrow, fArrow };
        cache.set(p.id, items);
      }

      items.mesh.position.set(p.position.x, p.position.y, p.position.z);
      const meshMat = items.mesh.material as THREE.MeshStandardMaterial;
      meshMat.color.set(p.color);
      meshMat.emissive.set(p.color);
      const trailMat = items.trailLine.material as THREE.LineBasicMaterial;
      trailMat.color.set(p.color);

      updateTrailGeometry(items.trailLine.geometry, p.trail, p.maxTrailLength);

      if (settings.showVectorsOnParticle) {
        const vMag = vectorLength(p.velocity);
        if (vMag > 0.01) {
          items.vArrow.visible = true;
          items.vArrow.position.set(p.position.x, p.position.y, p.position.z);
          items.vArrow.setDirection(
            new THREE.Vector3(p.velocity.x, p.velocity.y, p.velocity.z).normalize()
          );
          items.vArrow.setLength(Math.min(4.2, vMag * 0.7), 0.4, 0.24);
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
          items.fArrow.setLength(Math.min(4.2, fMag * 0.45), 0.4, 0.24);
        } else {
          items.fArrow.visible = false;
        }
      } else {
        items.vArrow.visible = false;
        items.fArrow.visible = false;
      }

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

  // Alinear cámara desde el Gizmo 3D (X, Y, Z, Iso)
  const handleSnapCamera = useCallback((view: CameraPresetView) => {
    const cam = cameraRef.current;
    const controls = controlsRef.current;
    if (!cam || !controls) return;
    const dist = cam.position.length() || 40;
    if (view === 'x') cam.position.set(dist, 0.01, 0);
    else if (view === 'y') cam.position.set(0, dist, 0.01);
    else if (view === 'z') cam.position.set(0, 0.01, dist);
    else cam.position.set(26, 20, 32);
    controls.target.set(0, 0, 0);
    controls.update();
  }, []);

  // Presets de experimentos
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
          particle('p1', { x: 0, y: 0, z: -14 }, { x: 2.8, y: 0, z: 1.1 }, '#D95B5F', 750)
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
          particle('p_exact', { x: -16, y: 0, z: 0 }, { x: 3.0, y: 0, z: 0 }, '#10b981', 500),
          particle('p_slow', { x: -16, y: -0.3, z: 0 }, { x: 1.8, y: 0, z: 0 }, '#f43f5e', 500),
          particle('p_fast', { x: -16, y: 0.3, z: 0 }, { x: 4.5, y: 0, z: 0 }, '#facc15', 500)
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
        particles: [particle('p1', { x: -14, y: 0, z: 0 }, { x: 0, y: 2.0, z: 0 }, '#a855f7', 650)]
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
          particle('p1', { x: 1.2, y: 0, z: 0 }, { x: 0, y: 3.2, z: 1.2 }, '#D95B5F', 750)
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
          particle('p1', { x: 0.1, y: 0, z: 0 }, { x: 0, y: 0.5, z: 0 }, '#f43f5e', 800)
        ]
      };
    }
    return null;
  };

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

  // Agregar partícula con valores predeterminados limpios (2.5 m/s exactos)
  const addParticle = (chargeSign: number) => {
    pushParticleHistory(particlesRef.current);
    const newId = 'p_' + Math.random().toString(36).substring(2, 7);
    const angle = Math.random() * Math.PI * 2;
    const pos = {
      x: (Math.random() - 0.5) * 4,
      y: (Math.random() - 0.5) * 3,
      z: -14 + (Math.random() - 0.5) * 3
    };
    const vel = buildNormalizedVelocity(
      {
        x: Math.cos(angle) * 0.92,
        y: Math.sin(angle) * 0.92,
        z: 0.36
      },
      DEFAULT_PARTICLE_SPEED
    );
    const newP: Particle3D = {
      id: newId,
      position: pos,
      velocity: vel,
      initialPosition: { ...pos },
      initialVelocity: { ...vel },
      charge: chargeSign,
      mass: 1.0,
      color: chargeSign > 0 ? '#D95B5F' : '#3E82AA',
      trail: [],
      maxTrailLength: DEFAULT_TRAIL_LENGTH
    };
    setParticles((prev) => [...prev.slice(-11), newP]);
    setSelectedParticleId(newId);
  };

  const applyParticleChanges = (
    id: string,
    patch: { velocity: Vector3D; charge: number; mass: number; color: string }
  ) => {
    pushParticleHistory(particlesRef.current);
    setParticles((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              velocity: { ...patch.velocity },
              initialVelocity: { ...patch.velocity },
              charge: patch.charge,
              mass: patch.mass,
              color: patch.color
            }
          : p
      )
    );
  };

  const clearParticleTrail = (id: string) => {
    setParticles((prev) => prev.map((p) => (p.id === id ? { ...p, trail: [] } : p)));
  };

  const deleteParticleById = (id: string) => {
    if (particlesRef.current.length <= 1) return;
    pushParticleHistory(particlesRef.current);
    setParticles((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (selectedParticleId === id) {
        setSelectedParticleId(next[0]?.id ?? null);
      }
      return next;
    });
  };

  const handleUndoParticles = () => {
    if (particleUndoStack.length === 0) return;
    const previous = particleUndoStack[particleUndoStack.length - 1];
    setParticleUndoStack((prev) => prev.slice(0, -1));
    setParticleRedoStack((prev) => [cloneParticles(particlesRef.current), ...prev.slice(0, 24)]);
    setParticles(cloneParticles(previous));
  };

  const handleRedoParticles = () => {
    if (particleRedoStack.length === 0) return;
    const next = particleRedoStack[0];
    setParticleRedoStack((prev) => prev.slice(1));
    setParticleUndoStack((prev) => [...prev.slice(-24), cloneParticles(particlesRef.current)]);
    setParticles(cloneParticles(next));
  };

  const clearParticles = () => {
    pushParticleHistory(particlesRef.current);
    simTimeRef.current = 0;
    accumulatorRef.current = 0;
    setSelectedParticleId(null);
    setParticles([createInitialDefaultParticle()]);
  };

  const selectedParticle = selectedParticleId
    ? particles.find((p) => p.id === selectedParticleId) ?? null
    : null;
  const telemetryParticle = selectedParticle ?? particles[0];
  const telemetryParticleIdx = telemetryParticle
    ? particles.findIndex((p) => p.id === telemetryParticle.id)
    : 0;

  return (
    <div
      className={`relative w-full h-full select-none overflow-hidden transition-colors ${
        isStudio ? 'bg-[#0B0F17]' : 'bg-[#FAF7F2]'
      }`}
    >
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Selector superior central: Modo Sencillo vs Estudio 3D (Unity / Unreal Engine) */}
      <div
        className={`absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 rounded-xl border backdrop-blur-md shadow-md ${
          isStudio
            ? 'bg-[#0F1624]/88 border-white/15 text-slate-200'
            : 'bg-white/92 border-[#D5CEC6] text-[#231F1C]'
        }`}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => setSettings((s) => ({ ...s, lorentzViewVariant: 'simple' }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            !isStudio
              ? 'bg-[#2D7A64] text-white shadow-sm'
              : 'text-slate-300 hover:bg-white/10'
          }`}
          title="Interfaz didáctica limpia con control de ángulo respecto a las líneas de flujo"
        >
          <Sparkles className="w-3.5 h-3.5" />
          Modo Sencillo
        </button>
        <button
          onClick={() => setSettings((s) => ({ ...s, lorentzViewVariant: 'studio' }))}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
            isStudio
              ? 'bg-sky-600 text-white shadow-sm'
              : 'text-[#5C554E] hover:bg-[#EDE8DF]'
          }`}
          title="Entorno 3D profesional estilo Unity / Unreal Engine con cámara de vacío 60×44×60 m"
        >
          <Box className="w-3.5 h-3.5" />
          Estudio 3D
        </button>
      </div>

      {/* Inspector de partícula seleccionada o botón de acceso rápido */}
      {selectedParticle ? (
        <InspectorParticula
          particles={particles}
          selectedParticle={selectedParticle}
          isStudio={isStudio}
          canUndoParticles={particleUndoStack.length > 0}
          canRedoParticles={particleRedoStack.length > 0}
          onUndoParticles={handleUndoParticles}
          onRedoParticles={handleRedoParticles}
          onSelectParticle={setSelectedParticleId}
          onApplyParticleChanges={applyParticleChanges}
          onClearTrail={clearParticleTrail}
          onDeleteParticle={deleteParticleById}
          onClose={() => setSelectedParticleId(null)}
        />
      ) : (
        <button
          onClick={() => particles[0] && setSelectedParticleId(particles[0].id)}
          className={`absolute top-4 left-4 z-10 flex items-center gap-1.5 backdrop-blur-md px-3 py-1.5 rounded-xl border shadow-sm text-[11px] transition-colors cursor-pointer ${
            isStudio
              ? 'bg-[#0F1624]/85 hover:bg-[#172033] border-white/15 text-slate-200'
              : 'bg-white/92 hover:bg-white border-[#D5CEC6] text-[#4A4540]'
          }`}
          title="Haz clic en cualquier partícula en 3D o aquí para editar velocidad, ángulo θ con B, carga y masa"
        >
          <MousePointerClick className="w-3.5 h-3.5 text-[#2D7A64]" />
          <span>Clic en partícula (velocidad y ángulo θ)</span>
        </button>
      )}

      {/* Esquina superior derecha: Gizmo 3D (X,Y,Z + î,ĵ,k̂) + Telemetría Lorentz */}
      <div className="absolute top-3 right-3 z-20 flex items-start gap-2 max-w-[calc(100%-2rem)]">
        <GizmoOrientacion3D
          orientation={gizmoOrientation}
          isStudio={isStudio}
          onSnapView={handleSnapCamera}
        />
        <LorentzTelemetryHud
          viewMode={viewMode}
          telemetry={telemetry}
          bFieldZ={settings.bField.z}
          particleLabel={`Partícula #${telemetryParticleIdx + 1}`}
          particleCharge={telemetryParticle?.charge ?? 1.0}
          particleMass={telemetryParticle?.mass ?? 1.0}
          isStudio={isStudio}
          isExpanded={isHudExpanded}
          onToggle={() => setIsHudExpanded(!isHudExpanded)}
        />
      </div>

      {/* Barra inferior izquierda: controles de partículas */}
      {isBottomOpen ? (
        <div
          className={`absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 backdrop-blur-md px-3 py-2 rounded-xl border shadow-md text-xs z-10 ${
            isStudio
              ? 'bg-[#0F1624]/90 border-white/15 text-slate-100'
              : 'bg-white/95 border-[#D5CEC6] text-[#2D2A26]'
          }`}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer ${
              isPlaying
                ? 'bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300'
                : 'bg-[#2D7A64] hover:bg-[#246351] text-white'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pausar' : 'Reanudar'}
          </button>

          <button
            onClick={() => addParticle(1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/15 hover:bg-rose-500/25 text-rose-600 border border-rose-400/40 rounded-lg transition-colors cursor-pointer font-semibold"
            title="Inyectar partícula positiva (+1 C, v₀ = 2.5 m/s)"
          >
            <Plus className="w-3.5 h-3.5" /> +q
          </button>

          <button
            onClick={() => addParticle(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500/15 hover:bg-sky-500/25 text-sky-600 border border-sky-400/40 rounded-lg transition-colors cursor-pointer font-semibold"
            title="Inyectar partícula negativa (−1 C, v₀ = 2.5 m/s)"
          >
            <Plus className="w-3.5 h-3.5" /> −q
          </button>

          <button
            onClick={clearParticles}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer border ${
              isStudio
                ? 'bg-white/10 hover:bg-white/15 text-slate-200 border-white/15'
                : 'bg-[#EDE8DF] hover:bg-[#E0D8CF] text-[#4A4540] border-[#D5CEC6]'
            }`}
            title="Reiniciar partículas de la cámara"
          >
            <RotateCcw className="w-3 h-3" /> Reiniciar
          </button>

          <button
            onClick={() => setIsBottomOpen(false)}
            className={`p-1 rounded transition-colors cursor-pointer ml-0.5 ${
              isStudio ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF]'
            }`}
            title="Minimizar barra de controles"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsBottomOpen(true)}
          className={`absolute bottom-4 left-4 z-10 flex items-center gap-1.5 backdrop-blur-md px-2.5 py-1.5 rounded-xl border shadow-md text-xs transition-colors cursor-pointer ${
            isStudio
              ? 'bg-[#0F1624]/90 border-white/15 text-sky-400 hover:bg-[#172033]'
              : 'bg-white/95 border-[#D5CEC6] text-sky-700 hover:bg-[#EDE8DF]'
          }`}
          title="Abrir controles de partículas"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Partículas</span>
          <ChevronUp className="w-3 h-3" />
        </button>
      )}

      {/* Cuadritos compactos de atajos y controles (esquina inferior derecha) */}
      <div
        className={`hidden md:flex absolute bottom-4 right-4 z-10 items-center gap-1.5 px-2.5 py-1.5 rounded-xl border backdrop-blur-md text-[10px] shadow-sm ${
          isStudio
            ? 'bg-[#0F1624]/82 border-white/12 text-slate-300'
            : 'bg-white/88 border-[#D5CEC6] text-[#5C554E]'
        }`}
      >
        {[
          { kbd: 'Espacio', label: 'Pausa' },
          { kbd: 'R', label: 'Reiniciar' },
          { kbd: 'Ctrl+Z', label: 'Deshacer' },
          { kbd: 'Ctrl+Y', label: 'Rehacer' },
          { kbd: 'Clic', label: 'Partícula' },
          { kbd: 'Arrastrar', label: 'Rotar' }
        ].map((item) => (
          <span key={item.kbd} className="inline-flex items-center gap-1">
            <kbd
              className={`px-1.5 py-0.5 rounded font-mono text-[9.5px] font-semibold border ${
                isStudio
                  ? 'bg-white/10 border-white/15 text-slate-100'
                  : 'bg-[#FAF7F2] border-[#D5CEC6] text-[#231F1C]'
              }`}
            >
              {item.kbd}
            </kbd>
            <span className="opacity-85">{item.label}</span>
          </span>
        ))}
      </div>
    </div>
  );
};
