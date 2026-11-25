import React, { useRef, useEffect, useState, useMemo, useCallback, Suspense } from 'react';
import { usePresetRequest } from '../../ganchos/usePeticionPreset';
import type { GaussianSurface, GaussSettings, ViewMode } from '../../tipos';
import { computeGaussLaw, type ChargeSI } from '../../fisica/gauss';
import { drawGauss2DScene } from './renderizadorGauss2D';
import {
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Sliders,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

const LazyGauss3DViewer = React.lazy(() =>
  import('./VisorGauss3D').then((m) => ({ default: m.Gauss3DViewer }))
);

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

  const PIXELS_PER_METER = 120;

  const [surface, setSurface] = useState<GaussianSurface>({
    shape: 'circle',
    cx: 0,
    cy: 0,
    radius: 1.2,
    width: 2.2,
    height: 1.6
  });

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

  const [charges, setCharges] = useState<ChargeSI[]>([
    { id: 'q1', x: 0, y: 0, charge: 3e-9 },
    { id: 'q2', x: 2.0, y: 0.8, charge: -2e-9 }
  ]);

  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [isDraggingSurface, setIsDraggingSurface] = useState(false);
  const [draggedChargeId, setDraggedChargeId] = useState<string | null>(null);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [surfaceDragStart, setSurfaceDragStart] = useState({ cx: 0, cy: 0 });

  const [internalDimMode, setInternalDimMode] = useState<'2d' | '3d'>('2d');
  const dimMode = controlledDimMode ?? internalDimMode;
  const setDimMode = useCallback(
    (newDim: '2d' | '3d') => {
      setInternalDimMode(newDim);
      onDimModeChange?.(newDim);
    },
    [onDimModeChange]
  );

  const [isTelemetryOpen, setIsTelemetryOpen] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

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

  const originX = dimensions.width / 2;
  const originY = dimensions.height / 2;

  const toPixels = useCallback(
    (mx: number, my: number) => ({
      px: originX + mx * PIXELS_PER_METER,
      py: originY + my * PIXELS_PER_METER
    }),
    [originX, originY]
  );

  const toMeters = useCallback(
    (px: number, py: number) => ({
      mx: (px - originX) / PIXELS_PER_METER,
      my: (py - originY) / PIXELS_PER_METER
    }),
    [originX, originY]
  );

  const gaussResult = useMemo(
    () => computeGaussLaw(surface, charges, settings.numElements),
    [surface, charges, settings.numElements]
  );

  // PointerEvents universales (ratón + pantalla táctil)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    const rect = canvas.getBoundingClientRect();

    const mousePx = e.clientX - rect.left;
    const mousePy = e.clientY - rect.top;
    const { mx, my } = toMeters(mousePx, mousePy);

    for (const c of charges) {
      const { px, py } = toPixels(c.x, c.y);
      if (Math.hypot(mousePx - px, mousePy - py) < 24) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggedChargeId(c.id);
        setSelectedChargeId(c.id);
        setDragStartPos({ x: mx, y: my });
        return;
      }
    }

    const clickedSurface =
      surface.shape === 'circle'
        ? Math.hypot(mx - surface.cx, my - surface.cy) < surface.radius
        : Math.abs(mx - surface.cx) < surface.width / 2 &&
          Math.abs(my - surface.cy) < surface.height / 2;

    if (clickedSurface) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDraggingSurface(true);
      setSurfaceDragStart({ cx: surface.cx, cy: surface.cy });
      setDragStartPos({ x: mx, y: my });
      setSelectedChargeId(null);
    } else {
      setSelectedChargeId(null);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
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
      setSurface((prev) => ({
        ...prev,
        cx: surfaceDragStart.cx + (mx - dragStartPos.x),
        cy: surfaceDragStart.cy + (my - dragStartPos.y)
      }));
    }
  };

  const handlePointerUp = () => {
    setDraggedChargeId(null);
    setIsDraggingSurface(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const stepM = e.shiftKey ? 0.2 : 0.08;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -stepM;
    else if (e.key === 'ArrowRight') dx = stepM;
    else if (e.key === 'ArrowUp') dy = -stepM;
    else if (e.key === 'ArrowDown') dy = stepM;
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedChargeId) {
      e.preventDefault();
      setCharges((prev) => prev.filter((c) => c.id !== selectedChargeId));
      setSelectedChargeId(null);
      return;
    } else {
      return;
    }

    e.preventDefault();
    if (selectedChargeId) {
      setCharges((prev) =>
        prev.map((c) => (c.id === selectedChargeId ? { ...c, x: c.x + dx, y: c.y + dy } : c))
      );
    } else {
      setSurface((prev) => ({ ...prev, cx: prev.cx + dx, cy: prev.cy + dy }));
    }
  };

  const addCharge = (sign: number) => {
    const newCharge: ChargeSI = {
      id: 'q_' + Math.random().toString(36).substring(2, 8),
      x: (Math.random() - 0.5) * 1.5,
      y: (Math.random() - 0.5) * 1.5,
      charge: sign * 2e-9
    };
    setCharges((prev) => [...prev, newCharge]);
    setSelectedChargeId(newCharge.id);
  };

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

  useEffect(() => {
    if (dimMode === '3d') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    drawGauss2DScene(ctx, {
      width: dimensions.width,
      height: dimensions.height,
      pixelsPerMeter: PIXELS_PER_METER,
      originX,
      originY,
      surface,
      charges,
      settings,
      gaussResult,
      selectedChargeId,
      toPixels,
      toMeters
    });
  }, [
    dimMode,
    dimensions,
    surface,
    charges,
    settings,
    gaussResult,
    selectedChargeId,
    toPixels,
    toMeters,
    originX,
    originY
  ]);

  const selectedCharge = charges.find((c) => c.id === selectedChargeId);
  const qEncNano = (gaussResult.enclosedCharge * 1e9).toFixed(3);
  const theoFluxSci = gaussResult.theoreticalFlux.toExponential(3);
  const numFluxSci = gaussResult.numericalFlux.toExponential(3);
  const errorPercent = (gaussResult.relativeError * 100).toFixed(2);
  const isVerified = parseFloat(errorPercent) < 2.0 || Math.abs(gaussResult.numericalFlux) < 1e-2;

  if (dimMode === '3d') {
    return (
      <div ref={containerRef} className="w-full h-full relative flex flex-col bg-[#FAF7F2] select-none overflow-hidden">
        <Suspense
          fallback={
            <div className="w-full h-full flex items-center justify-center text-sm font-medium text-[#5C554E]">
              Cargando visor volumétrico 3D...
            </div>
          }
        >
          <LazyGauss3DViewer
            viewMode={viewMode}
            presetRequest={presetRequest}
            onPresetHandled={onPresetHandled}
          />
        </Suspense>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-[#FAF7F2] select-none overflow-hidden">
      {isTelemetryOpen ? (
        <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md">
          <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-4">
            <div className="w-7 h-7 rounded-lg bg-[#E6F2EE] border border-[#B3D9CC] flex items-center justify-center text-[#2D7A64] font-bold">
              Φ
            </div>
            <div>
              <div className="text-xs font-bold text-[#231F1C] tracking-wide">LEY DE GAUSS</div>
              <div className="text-[11px] font-mono text-[#2D7A64] font-semibold">
                Φ_E = ∮ E · dA = Q_enc / ε₀
              </div>
            </div>
          </div>

          {viewMode === 'explore' ? (
            <div className="flex items-center gap-3 text-xs">
              <div>
                <span className="text-[#5C554E]">Carga Encerrada: </span>
                <span className={`font-bold ${parseFloat(qEncNano) > 0 ? 'text-rose-700' : parseFloat(qEncNano) < 0 ? 'text-sky-700' : 'text-[#231F1C]'}`}>
                  {parseFloat(qEncNano) > 0 ? 'Positiva (+ Flujo sale)' : parseFloat(qEncNano) < 0 ? 'Negativa (− Flujo entra)' : 'Nula (Flujo neto = 0)'}
                </span>
              </div>
              <div className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${isVerified ? 'text-[#2D7A64]' : 'text-amber-600'}`} />
                <span className="text-[11px] font-bold text-[#2D7A64]">
                  {isVerified ? 'Ley de Gauss Comprobada' : 'Verificando...'}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4 text-xs font-mono">
              <div>
                <span className="text-[#5C554E]">Q_enc: </span>
                <span className={`font-bold ${parseFloat(qEncNano) > 0 ? 'text-rose-700' : parseFloat(qEncNano) < 0 ? 'text-sky-700' : 'text-[#231F1C]'}`}>
                  {qEncNano} nC
                </span>
              </div>
              <div className="border-l border-[#E0D8CF] pl-3">
                <span className="text-[#5C554E]">Φ_teórico: </span>
                <span className="text-indigo-700 font-bold">{theoFluxSci} N·m²/C</span>
              </div>
              <div className="border-l border-[#E0D8CF] pl-3">
                <span className="text-[#5C554E]">Φ_numérico: </span>
                <span className="text-[#2D7A64] font-bold">{numFluxSci} N·m²/C</span>
              </div>
              <div className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1.5">
                <CheckCircle2 className={`w-4 h-4 ${isVerified ? 'text-[#2D7A64]' : 'text-amber-600'}`} />
                <span className={`text-[11px] font-bold ${isVerified ? 'text-[#2D7A64]' : 'text-amber-700'}`}>
                  {isVerified ? 'VERIFICADO (Error ' + errorPercent + '%)' : 'Error: ' + errorPercent + '%'}
                </span>
              </div>
            </div>
          )}

          <button
            onClick={() => setIsTelemetryOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#231F1C] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-1"
            title="Minimizar panel de telemetría"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsTelemetryOpen(true)}
          className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#231F1C] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        >
          <span className="w-2 h-2 rounded-full bg-[#2D7A64]" />
          <span className="font-bold text-[#2D7A64]">Ley de Gauss:</span>
          <span className="font-mono font-semibold">{qEncNano} nC</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}

      {isControlsOpen ? (
        <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-[#D5CEC6] shadow-md">
          <div className="flex items-center bg-[#EDE8DF] p-1 rounded-lg border border-[#D5CEC6] text-xs font-medium">
            <button
              onClick={() => setSettings((s) => ({ ...s, surfaceShape: 'circle' }))}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                settings.surfaceShape === 'circle'
                  ? 'bg-[#2D7A64] text-white shadow-sm font-semibold'
                  : 'text-[#5C554E] hover:text-[#231F1C]'
              }`}
            >
              Esfera
            </button>
            <button
              onClick={() => setSettings((s) => ({ ...s, surfaceShape: 'rectangle' }))}
              className={`px-3 py-1 rounded cursor-pointer transition-all ${
                settings.surfaceShape === 'rectangle'
                  ? 'bg-[#2D7A64] text-white shadow-sm font-semibold'
                  : 'text-[#5C554E] hover:text-[#231F1C]'
              }`}
            >
              Caja
            </button>
          </div>

          <div className="flex items-center gap-1.5 px-1.5 text-xs text-[#231F1C]">
            <Sliders className="w-3.5 h-3.5 text-[#5C554E]" />
            <span className="text-[11px] font-medium">Radio:</span>
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
              className="w-16 accent-[#2D7A64] cursor-pointer"
            />
          </div>

          <button
            onClick={() => addCharge(1)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-300/70 hover:bg-rose-200 text-xs font-semibold cursor-pointer"
            title="Añadir Carga Positiva"
          >
            <Plus className="w-3.5 h-3.5" /> +q
          </button>
          <button
            onClick={() => addCharge(-1)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-100 text-sky-700 border border-sky-300/70 hover:bg-sky-200 text-xs font-semibold cursor-pointer"
            title="Añadir Carga Negativa"
          >
            <Minus className="w-3.5 h-3.5" /> −q
          </button>

          <button
            onClick={() => setIsControlsOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#231F1C] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsControlsOpen(true)}
          className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#231F1C] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        >
          <span>⚙️ Superficie</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}

      {selectedCharge && (
        <div className="absolute bottom-4 right-4 z-20 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#D5CEC6] shadow-md flex items-center gap-4 text-xs">
          <div>
            <div className="text-[#5C554E] text-[10px]">Carga Seleccionada:</div>
            <div className="font-mono font-bold text-[#231F1C]">
              {(selectedCharge.charge * 1e9).toFixed(1)} nC
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[#5C554E] text-[10px]">Ajustar q:</span>
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
              className="w-24 accent-[#3A7CA5] cursor-pointer"
            />
          </div>

          <button
            onClick={() => {
              setCharges((prev) => prev.filter((c) => c.id !== selectedCharge.id));
              setSelectedChargeId(null);
            }}
            className="p-1.5 rounded-lg bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200 cursor-pointer"
            title="Eliminar Carga"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Lienzo interactivo de Ley de Gauss 2D"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="w-full h-full cursor-crosshair touch-none focus:outline-none"
      />
    </div>
  );
};
export default GaussFluxCanvas;
