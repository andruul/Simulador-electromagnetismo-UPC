import React, { useRef, useEffect, useState, useMemo, useCallback } from 'react';
import { usePresetRequest } from '../hooks/usePresetRequest';
import type { GaussianSurface, GaussSettings, ViewMode } from '../types';
import {
  computeGaussLaw,
  calculateElectricField2D,
  type ChargeSI
} from '../physics/gauss';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Gauss3DViewer } from './Gauss3DViewer';

interface GaussFluxCanvasProps {
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
  dimMode?: '2d' | '3d';
  onDimModeChange?: (mode: '2d' | '3d') => void;
}

export const GaussFluxCanvas: React.FC<GaussFluxCanvasProps> = ({
  presetRequest,
  onPresetHandled,
  viewMode = 'explore',
  dimMode: controlledDimMode,
  onDimModeChange
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });

  // Scale: 100 pixels = 1.0 meter
  const PIXELS_PER_METER = 120;

  // Gaussian Surface state (coordinates in meters)
  const [surface, setSurface] = useState<GaussianSurface>({
    shape: 'circle',
    cx: 0,
    cy: 0,
    radius: 1.2, // meters
    width: 2.2,  // meters
    height: 1.6  // meters
  });

  // Settings
  const [settings, setSettings] = useState<GaussSettings>({
    surfaceShape: 'circle',
    surfaceRadius: 1.2,
    surfaceWidth: 2.2,
    surfaceHeight: 1.6,
    numElements: 48,
    showVectorField: true,
    showNormalVectors: true,
    showFluxHeatmap: true,
    showFieldLines: false
  });

  // Interactive Point Charges in meters and Coulombs
  const [charges, setCharges] = useState<ChargeSI[]>([
    { id: 'q1', x: 0, y: 0, charge: 3e-9 },        // +3 nC inside
    { id: 'q2', x: 2.0, y: 0.8, charge: -2e-9 }    // -2 nC outside
  ]);

  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [isDraggingSurface, setIsDraggingSurface] = useState(false);
  const [draggedChargeId, setDraggedChargeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [surfaceDragStart, setSurfaceDragStart] = useState({ cx: 0, cy: 0 });

  // Dimension mode: 2D Planar vs 3D Volumetric with Non-Uniform Fields
  const [internalDimMode, setInternalDimMode] = useState<'2d' | '3d'>('2d');
  const dimMode = controlledDimMode ?? internalDimMode;
  const setDimMode = useCallback(
    (newDim: '2d' | '3d') => {
      setInternalDimMode(newDim);
      onDimModeChange?.(newDim);
    },
    [onDimModeChange]
  );

  // Collapsible overlay states (clean canvas view)
  const [isTelemetryOpen, setIsTelemetryOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  // Update canvas dimensions dynamically with ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Sync surface with settings (adjusted while rendering, not inside an effect)
  const [syncedSurfaceSettings, setSyncedSurfaceSettings] = useState({
    shape: settings.surfaceShape,
    radius: settings.surfaceRadius,
    width: settings.surfaceWidth,
    height: settings.surfaceHeight
  });
  if (
    syncedSurfaceSettings.shape !== settings.surfaceShape ||
    syncedSurfaceSettings.radius !== settings.surfaceRadius ||
    syncedSurfaceSettings.width !== settings.surfaceWidth ||
    syncedSurfaceSettings.height !== settings.surfaceHeight
  ) {
    setSyncedSurfaceSettings({
      shape: settings.surfaceShape,
      radius: settings.surfaceRadius,
      width: settings.surfaceWidth,
      height: settings.surfaceHeight
    });
    setSurface((prev) => ({
      ...prev,
      shape: settings.surfaceShape,
      radius: settings.surfaceRadius,
      width: settings.surfaceWidth,
      height: settings.surfaceHeight
    }));
  }

  // Coordinate transforms (meters <-> canvas pixels)
  const originX = dimensions.width / 2;
  const originY = dimensions.height / 2;

  const toPixels = useCallback(
    (mx: number, my: number) => ({
      px: originX + mx * PIXELS_PER_METER,
      py: originY + my * PIXELS_PER_METER
    }),
    [originX, originY, PIXELS_PER_METER]
  );

  const toMeters = useCallback(
    (px: number, py: number) => ({
      mx: (px - originX) / PIXELS_PER_METER,
      my: (py - originY) / PIXELS_PER_METER
    }),
    [originX, originY, PIXELS_PER_METER]
  );

  // Compute Gauss's Law in real time
  const gaussResult = useMemo(() => {
    return computeGaussLaw(surface, charges, settings.numElements);
  }, [surface, charges, settings.numElements]);

  // Handle Dragging & Mouse Events
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mousePx = e.clientX - rect.left;
    const mousePy = e.clientY - rect.top;
    const { mx, my } = toMeters(mousePx, mousePy);

    // Check if clicked on a charge (within 22px)
    for (const c of charges) {
      const { px, py } = toPixels(c.x, c.y);
      const dist = Math.hypot(mousePx - px, mousePy - py);
      if (dist < 22) {
        setDraggedChargeId(c.id);
        setSelectedChargeId(c.id);
        setDragStartPos({ x: mx, y: my });
        return;
      }
    }

    // Check if clicked inside/near Gaussian surface to drag it
    let clickedSurface = false;
    if (surface.shape === 'circle') {
      const distFromCenter = Math.hypot(mx - surface.cx, my - surface.cy);
      if (distFromCenter < surface.radius) {
        clickedSurface = true;
      }
    } else {
      const halfW = surface.width / 2;
      const halfH = surface.height / 2;
      if (Math.abs(mx - surface.cx) < halfW && Math.abs(my - surface.cy) < halfH) {
        clickedSurface = true;
      }
    }

    if (clickedSurface) {
      setIsDraggingSurface(true);
      setSurfaceDragStart({ cx: surface.cx, cy: surface.cy });
      setDragStartPos({ x: mx, y: my });
      setSelectedChargeId(null);
    } else {
      setSelectedChargeId(null);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mousePx = e.clientX - rect.left;
    const mousePy = e.clientY - rect.top;
    const { mx, my } = toMeters(mousePx, mousePy);

    if (draggedChargeId) {
      setCharges((prev) =>
        prev.map((c) => (c.id === draggedChargeId ? { ...c, x: mx, y: my } : c))
      );
    } else if (isDraggingSurface) {
      const dx = mx - dragStartPos.x;
      const dy = my - dragStartPos.y;
      setSurface((prev) => ({
        ...prev,
        cx: surfaceDragStart.cx + dx,
        cy: surfaceDragStart.cy + dy
      }));
    }
  };

  const handleMouseUp = () => {
    setDraggedChargeId(null);
    setIsDraggingSurface(false);
  };

  // Add a new charge
  const addCharge = (sign: number) => {
    const newCharge: ChargeSI = {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.5,
      charge: sign * 2e-9 // 2 nC
    };
    setCharges((prev) => [...prev, newCharge]);
    setSelectedChargeId(newCharge.id);
  };

  // Preset Configurations
  const loadPreset = (preset: 'dipole_inside' | 'dipole_outside' | 'monopole' | 'quadrupole') => {
    if (preset === 'monopole') {
      setCharges([{ id: 'q1', x: 0, y: 0, charge: 3e-9 }]);
      setSurface((prev) => ({ ...prev, cx: 0, cy: 0, shape: 'circle', radius: 1.2 }));
    } else if (preset === 'dipole_inside') {
      setCharges([
        { id: 'q1', x: -0.4, y: 0, charge: 3e-9 },
        { id: 'q2', x: 0.4, y: 0, charge: -3e-9 }
      ]);
      setSurface((prev) => ({ ...prev, cx: 0, cy: 0, shape: 'circle', radius: 1.2 }));
    } else if (preset === 'dipole_outside') {
      setCharges([
        { id: 'q1', x: 1.8, y: -0.5, charge: 4e-9 },
        { id: 'q2', x: 1.8, y: 0.5, charge: -4e-9 }
      ]);
      setSurface((prev) => ({ ...prev, cx: 0, cy: 0, shape: 'circle', radius: 1.0 }));
    } else if (preset === 'quadrupole') {
      setCharges([
        { id: 'q1', x: -0.5, y: -0.5, charge: 2e-9 },
        { id: 'q2', x: 0.5, y: -0.5, charge: -2e-9 },
        { id: 'q3', x: 0.5, y: 0.5, charge: 2e-9 },
        { id: 'q4', x: -0.5, y: 0.5, charge: -2e-9 },
        { id: 'q5', x: 2.0, y: 0, charge: 5e-9 }
      ]);
      setSurface((prev) => ({ ...prev, cx: 0, cy: 0, shape: 'rectangle', width: 2.2, height: 2.2 }));
    }
  };

  // Handle external preset requests from LeftGuidePanel or Search
  usePresetRequest(presetRequest, onPresetHandled, (preset) => {
    const is3D = ['tetra_divergent', 'cube_linear', 'cylinder_radial', 'sphere_coulomb'].includes(preset);
    if (is3D) {
      if (dimMode !== '3d') setDimMode('3d');
    } else {
      if (dimMode !== '2d') setDimMode('2d');
      if (preset === 'monopole') loadPreset('monopole');
      else if (preset === 'dipole' || preset === 'dipole_inside') loadPreset('dipole_inside');
      else if (preset === 'external' || preset === 'dipole_outside') loadPreset('dipole_outside');
      else if (preset === 'mixed' || preset === 'quadrupole') loadPreset('quadrupole');
    }
  });

  // ==========================================
  // High Performance Canvas Rendering
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = dimensions.width;
    const h = dimensions.height;
    canvas.width = w;
    canvas.height = h;

    // Background gradient
    const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
    bgGrad.addColorStop(0, '#FAF7F2');
    bgGrad.addColorStop(1, '#EFE9DF');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Coordinate grid (Meters grid)
    ctx.strokeStyle = 'rgba(80, 70, 60, 0.08)';
    ctx.lineWidth = 1;
    const gridSpacing = PIXELS_PER_METER * 0.5; // 0.5 meter steps

    const startX = (originX % gridSpacing);
    const startY = (originY % gridSpacing);

    ctx.beginPath();
    for (let x = startX; x < w; x += gridSpacing) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
    }
    for (let y = startY; y < h; y += gridSpacing) {
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Subtle Axis at Origin
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, h);
    ctx.moveTo(0, originY);
    ctx.lineTo(w, originY);
    ctx.stroke();

    // Vector field grid if enabled
    if (settings.showVectorField && charges.length > 0) {
      const step = 45; // pixels
      for (let px = 25; px < w; px += step) {
        for (let py = 25; py < h; py += step) {
          const { mx, my } = toMeters(px, py);
          const E = calculateElectricField2D({ x: mx, y: my }, charges);
          const mag = Math.hypot(E.x, E.y);
          if (mag > 1e-5) {
            const angle = Math.atan2(E.y, E.x);
            // Logarithmic vector arrow length
            const length = Math.min(24, Math.max(8, Math.log10(mag + 1) * 6));

            // Intensity color
            const alpha = Math.min(0.65, Math.max(0.12, Math.log10(mag + 1) * 0.15));
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.fillStyle = `rgba(56, 189, 248, ${alpha})`;
            ctx.lineWidth = 1.2;

            const endX = px + Math.cos(angle) * length;
            const endY = py + Math.sin(angle) * length;

            ctx.beginPath();
            ctx.moveTo(px, py);
            ctx.lineTo(endX, endY);
            ctx.stroke();

            // Arrow head
            const arrowSize = 3;
            ctx.beginPath();
            ctx.moveTo(endX, endY);
            ctx.lineTo(
              endX - arrowSize * Math.cos(angle - Math.PI / 6),
              endY - arrowSize * Math.sin(angle - Math.PI / 6)
            );
            ctx.lineTo(
              endX - arrowSize * Math.cos(angle + Math.PI / 6),
              endY - arrowSize * Math.sin(angle + Math.PI / 6)
            );
            ctx.closePath();
            ctx.fill();
          }
        }
      }
    }

    // Draw Gaussian Surface Interior Glow
    const { px: sPx, py: sPy } = toPixels(surface.cx, surface.cy);
    ctx.save();
    if (surface.shape === 'circle') {
      const rPx = surface.radius * PIXELS_PER_METER;
      ctx.beginPath();
      ctx.arc(sPx, sPy, rPx, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    } else {
      const wPx = surface.width * PIXELS_PER_METER;
      const hPx = surface.height * PIXELS_PER_METER;
      ctx.beginPath();
      ctx.rect(sPx - wPx / 2, sPy - hPx / 2, wPx, hPx);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.85)';
      ctx.lineWidth = 2.5;
      ctx.setLineDash([8, 6]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Draw Visual Surface Elements dA and Outward Normal Vectors n̂
    if (gaussResult.elements && gaussResult.elements.length > 0) {
      for (const el of gaussResult.elements) {
        const { px: elPx, py: elPy } = toPixels(el.x, el.y);

        // Flux density color along perimeter:
        // Positive (outward) = Emerald/Green; Negative (inward) = Rose/Red; Zero = Slate
        const fluxDensity = el.fluxDensity;
        let segColor = 'rgba(148, 163, 184, 0.4)';
        if (fluxDensity > 10) {
          segColor = 'rgba(16, 185, 129, 0.9)'; // Outward flux
        } else if (fluxDensity < -10) {
          segColor = 'rgba(244, 63, 94, 0.9)';  // Inward flux
        }

        // Draw dA element marker
        ctx.fillStyle = segColor;
        ctx.beginPath();
        ctx.arc(elPx, elPy, 2.5, 0, 2 * Math.PI);
        ctx.fill();

        // Draw outward unit normal vector n̂ (Yellow)
        if (settings.showNormalVectors) {
          const nLen = 22; // px
          const endNx = elPx + el.nx * nLen;
          const endNy = elPy + el.ny * nLen;

          ctx.strokeStyle = '#facc15'; // Amber / Yellow
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.moveTo(elPx, elPy);
          ctx.lineTo(endNx, endNy);
          ctx.stroke();

          // Normal arrow tip
          const nAngle = Math.atan2(el.ny, el.nx);
          const aSize = 3.5;
          ctx.fillStyle = '#facc15';
          ctx.beginPath();
          ctx.moveTo(endNx, endNy);
          ctx.lineTo(
            endNx - aSize * Math.cos(nAngle - Math.PI / 6),
            endNy - aSize * Math.sin(nAngle - Math.PI / 6)
          );
          ctx.lineTo(
            endNx - aSize * Math.cos(nAngle + Math.PI / 6),
            endNy - aSize * Math.sin(nAngle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }

        // Draw local electric field vector E (Cyan)
        const eMag = Math.hypot(el.ex, el.ey);
        if (eMag > 1e-4) {
          const eAngle = Math.atan2(el.ey, el.ex);
          const eLen = Math.min(30, Math.max(10, Math.log10(eMag + 1) * 7));
          const endEx = elPx + Math.cos(eAngle) * eLen;
          const endEy = elPy + Math.sin(eAngle) * eLen;

          ctx.strokeStyle = '#38bdf8'; // Sky blue
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(elPx, elPy);
          ctx.lineTo(endEx, endEy);
          ctx.stroke();

          // Arrow tip
          const aSize = 3.5;
          ctx.fillStyle = '#38bdf8';
          ctx.beginPath();
          ctx.moveTo(endEx, endEy);
          ctx.lineTo(
            endEx - aSize * Math.cos(eAngle - Math.PI / 6),
            endEy - aSize * Math.sin(eAngle - Math.PI / 6)
          );
          ctx.lineTo(
            endEx - aSize * Math.cos(eAngle + Math.PI / 6),
            endEy - aSize * Math.sin(eAngle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }

    // Draw Charges
    for (const c of charges) {
      const { px, py } = toPixels(c.x, c.y);
      const isPositive = c.charge > 0;
      const isSelected = c.id === selectedChargeId;

      // Glow halo
      const grad = ctx.createRadialGradient(px, py, 4, px, py, 26);
      if (isPositive) {
        grad.addColorStop(0, 'rgba(239, 68, 68, 0.9)');
        grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.3)');
        grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
      } else {
        grad.addColorStop(0, 'rgba(59, 130, 246, 0.9)');
        grad.addColorStop(0.5, 'rgba(59, 130, 246, 0.3)');
        grad.addColorStop(1, 'rgba(59, 130, 246, 0)');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, 26, 0, 2 * Math.PI);
      ctx.fill();

      // Main charge sphere
      ctx.fillStyle = isPositive ? '#ef4444' : '#3b82f6';
      ctx.beginPath();
      ctx.arc(px, py, 14, 0, 2 * Math.PI);
      ctx.fill();

      // Selected ring
      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      // Plus / Minus Sign
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isPositive ? '+' : '−', px, py);

      // Charge label (in nC)
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '10px monospace';
      const qValStr = `${(c.charge * 1e9).toFixed(1)} nC`;
      ctx.fillText(qValStr, px, py + 22);
    }

    // Legend on canvas corner
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(14, h - 80, 200, 66, 8);
    ctx.fill();
    ctx.stroke();

    ctx.font = '10px sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    // Normal vector legend
    ctx.fillStyle = '#facc15';
    ctx.fillRect(24, h - 64, 12, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Vector normal exterior n̂', 42, h - 63);

    // E field vector legend
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(24, h - 46, 12, 3);
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Campo Eléctrico E', 42, h - 45);

    // Surface element dA
    ctx.fillStyle = '#34d399';
    ctx.beginPath();
    ctx.arc(30, h - 28, 4, 0, 2 * Math.PI);
    ctx.fill();
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText('Elemento de superficie dA', 42, h - 28);
    ctx.restore();

  }, [
    dimensions,
    surface,
    charges,
    settings,
    gaussResult,
    selectedChargeId,
    toPixels,
    toMeters,
    originX,
    originY,
    PIXELS_PER_METER
  ]);

  const selectedCharge = charges.find((c) => c.id === selectedChargeId);

  // Formatted SI readouts
  const qEncNano = (gaussResult.enclosedCharge * 1e9).toFixed(3);
  const theoFluxSci = gaussResult.theoreticalFlux.toExponential(3);
  const numFluxSci = gaussResult.numericalFlux.toExponential(3);
  const errorPercent = (gaussResult.relativeError * 100).toFixed(2);
  const isVerified = parseFloat(errorPercent) < 2.0 || Math.abs(gaussResult.numericalFlux) < 1e-2;

  // 3D Volumetric View Mode with Non-Uniform Electric Fields
  if (dimMode === '3d') {
    return (
      <div ref={containerRef} className="w-full h-full relative flex flex-col bg-[#FAF7F2] select-none overflow-hidden">
        {/* 3D Volumetric Gauss & Non-uniform fields */}
        <Gauss3DViewer
          viewMode={viewMode}
          presetRequest={presetRequest}
          onPresetHandled={onPresetHandled}
        />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-[#FAF7F2] select-none overflow-hidden">

      {/* Top Scientific Formula & Verification HUD (Collapsible) */}
      {isTelemetryOpen ? (
        <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md">
          <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-4">
            <div className="w-7 h-7 rounded-lg bg-[#5B9E8A]/15 border border-[#5B9E8A]/30 flex items-center justify-center text-[#3D7A69] font-bold">
              Φ
            </div>
            <div>
              <div className="text-xs font-bold text-[#2D2A26] tracking-wide">LEY DE GAUSS</div>
              <div className="text-[11px] font-mono text-[#3D7A69] font-medium">
                Φ_E = ∮ E · dA = Q_enc / ε₀
              </div>
            </div>
          </div>

          {/* Real-time Verification Gauge */}
          {viewMode === 'explore' ? (
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-[#6B6560]">Carga Encerrada: </span>
                <span className={`font-bold ${parseFloat(qEncNano) > 0 ? 'text-rose-600' : parseFloat(qEncNano) < 0 ? 'text-sky-600' : 'text-[#4A4540]'}`}>
                  {parseFloat(qEncNano) > 0 ? 'Positiva (+ Flujo sale)' : parseFloat(qEncNano) < 0 ? 'Negativa (− Flujo entra)' : 'Nula (Flujo neto = 0)'}
                </span>
              </div>
              <div className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${isVerified ? 'text-[#5B9E8A]' : 'text-amber-500'}`} />
                <span className="text-[11px] font-bold text-[#3D7A69]">
                  {isVerified ? 'Ley de Gauss Comprobada' : 'Verificando...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[#6B6560]">Q_enc: </span>
                <span className={`font-bold ${parseFloat(qEncNano) > 0 ? 'text-rose-600' : parseFloat(qEncNano) < 0 ? 'text-sky-600' : 'text-[#4A4540]'}`}>
                  {qEncNano} nC
                </span>
              </div>

              <div className="border-l border-[#E0D8CF] pl-3">
                <span className="text-[#6B6560]">Φ_teórico: </span>
                <span className="text-indigo-700 font-bold">{theoFluxSci} N·m²/C</span>
              </div>

              <div className="border-l border-[#E0D8CF] pl-3">
                <span className="text-[#6B6560]">Φ_numérico: </span>
                <span className="text-[#3D7A69] font-bold">{numFluxSci} N·m²/C</span>
              </div>

              {/* Verification Badge */}
              <div className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${isVerified ? 'text-[#5B9E8A]' : 'text-amber-500'}`} />
                <span className={`text-[11px] font-bold ${isVerified ? 'text-[#3D7A69]' : 'text-amber-600'}`}>
                  {isVerified ? 'VERIFICADO (Error ' + errorPercent + '%)' : 'Error: ' + errorPercent + '%'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsTelemetryOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-1"
            title="Minimizar panel de telemetría"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsTelemetryOpen(true)}
          className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          title="Expandir telemetría de Ley de Gauss"
        >
          <span className="w-2 h-2 rounded-full bg-[#5B9E8A]" />
          <span className="font-bold text-[#3D7A69]">Ley de Gauss:</span>
          <span className="font-mono text-[#2D2A26] font-semibold">{qEncNano} nC</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}

      {/* Surface & Physics Controls HUD (Top Right - Collapsible) */}
      {isControlsOpen ? (
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-[#D5CEC6] shadow-md">
          {/* Surface Shape Switcher */}
          <div className="flex items-center bg-[#EDE8DF] p-1 rounded-lg border border-[#D5CEC6] text-xs font-medium">
            <button
              onClick={() => setSettings((s) => ({ ...s, surfaceShape: 'circle' }))}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                settings.surfaceShape === 'circle'
                  ? 'bg-[#5B9E8A] text-white shadow-sm font-semibold'
                  : 'text-[#6B6560] hover:text-[#2D2A26]'
              }`}
            >
              Esfera
            </button>
            <button
              onClick={() => setSettings((s) => ({ ...s, surfaceShape: 'rectangle' }))}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                settings.surfaceShape === 'rectangle'
                  ? 'bg-emerald-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Caja
            </button>
          </div>

          {/* Size Slider */}
          <div className="flex items-center gap-1.5 px-1.5 text-xs text-slate-300">
            <Sliders className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Radio:</span>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={settings.surfaceShape === 'circle' ? settings.surfaceRadius : settings.surfaceWidth}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setSettings((s) => ({
                  ...s,
                  surfaceRadius: val,
                  surfaceWidth: val,
                  surfaceHeight: val * 0.8
                }));
              }}
              className="w-16 accent-emerald-500 cursor-pointer"
            />
          </div>

          {/* Add Charges */}
          <button
            onClick={() => addCharge(1)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 text-xs font-semibold cursor-pointer"
            title="Añadir Carga Positiva"
          >
            <Plus className="w-3.5 h-3.5" /> +q
          </button>
          <button
            onClick={() => addCharge(-1)}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-500/40 hover:bg-sky-500/30 text-xs font-semibold cursor-pointer"
            title="Añadir Carga Negativa"
          >
            <Minus className="w-3.5 h-3.5" /> -q
          </button>

          <button
            onClick={() => setIsControlsOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer"
            title="Minimizar controles de superficie"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsControlsOpen(true)}
          className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          title="Expandir controles de superficie"
        >
          <span>⚙️ Superficie</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}

      {/* Selected Charge Inspector (Bottom Right) */}
      {selectedCharge && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#D5CEC6] shadow-md flex items-center gap-4 text-xs">
          <div>
            <div className="text-[#6B6560] text-[10px]">Carga Seleccionada:</div>
            <div className="font-mono font-bold text-[#2D2A26]">
              {(selectedCharge.charge * 1e9).toFixed(1)} nC
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#6B6560] text-[10px]">Ajustar q:</span>
            <input
              type="range"
              min="-10"
              max="10"
              step="0.5"
              value={selectedCharge.charge * 1e9}
              onChange={(e) => {
                const val = parseFloat(e.target.value) * 1e-9;
                setCharges((prev) =>
                  prev.map((c) => (c.id === selectedCharge.id ? { ...c, charge: val } : c))
                );
              }}
              className="w-24 accent-sky-500 cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setCharges((prev) => prev.filter((c) => c.id !== selectedCharge.id));
              setSelectedChargeId(null);
            }}
            className="p-1.5 rounded-lg bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 cursor-pointer"
            title="Eliminar Carga"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
export default GaussFluxCanvas;
