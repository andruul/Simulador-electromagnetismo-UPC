import React, { useRef, useEffect, useState, useMemo } from 'react';
import { usePresetRequest } from '../../ganchos/usePeticionPreset';
import type { WireCurrent, Vector2D, ViewMode } from '../../tipos';
import {
  MAGNETOSTATICS_PIXELS_PER_METER,
  computeAmpereLaw
} from '../../fisica/biotsavart';
import {
  drawMagnetostaticsScene,
  type AmperianLoop
} from './renderizadorMagnetostatica';
import { Plus, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface MagnetostaticsCanvasProps {
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
}

export const MagnetostaticsCanvas: React.FC<MagnetostaticsCanvasProps> = ({
  presetRequest,
  onPresetHandled,
  viewMode = 'explore'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  const [wires, setWires] = useState<WireCurrent[]>([
    { id: 'w1', x: 340, y: 300, current: 4, label: 'I₁' },
    { id: 'w2', x: 460, y: 300, current: 4, label: 'I₂' }
  ]);
  const [selectedWireId, setSelectedWireId] = useState<string | null>(null);
  const [draggedWireId, setDraggedWireId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [compass, setCompass] = useState<Vector2D>({ x: 400, y: 190 });
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Ley de Ampère interactiva: ∮ B · dl = μ₀ I_enc
  const [showAmpereLoop, setShowAmpereLoop] = useState(true);
  const [ampereLoop, setAmpereLoop] = useState<AmperianLoop>({ x: 400, y: 300, radiusPx: 110 });
  const [isDraggingLoop, setIsDraggingLoop] = useState(false);
  const [isAmpereHudOpen, setIsAmpereHudOpen] = useState(true);

  const [showVectors, setShowVectors] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  useEffect(() => {
    const container = canvasRef.current?.parentElement;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({
            width: Math.round(width),
            height: Math.round(height)
          });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  const [clampedFor, setClampedFor] = useState({ width: 0, height: 0 });
  if (
    dimensions.width > 50 &&
    dimensions.height > 50 &&
    (clampedFor.width !== dimensions.width || clampedFor.height !== dimensions.height)
  ) {
    setClampedFor({ width: dimensions.width, height: dimensions.height });
    setWires((prev) =>
      prev.map((w) => ({
        ...w,
        x: Math.min(Math.max(30, w.x), dimensions.width - 30),
        y: Math.min(Math.max(30, w.y), dimensions.height - 30)
      }))
    );
    setCompass((prev) => ({
      x: Math.min(Math.max(30, prev.x), dimensions.width - 30),
      y: Math.min(Math.max(30, prev.y), dimensions.height - 30)
    }));
  }

  const ampereStats = useMemo(
    () =>
      computeAmpereLaw(
        ampereLoop.x,
        ampereLoop.y,
        ampereLoop.radiusPx,
        wires,
        MAGNETOSTATICS_PIXELS_PER_METER
      ),
    [ampereLoop, wires]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    drawMagnetostaticsScene(ctx, {
      width,
      height,
      wires,
      selectedWireId,
      compass,
      isDraggingCompass,
      showVectors,
      showLines,
      showAmpereLoop,
      ampereLoop,
      viewMode
    });
  }, [
    dimensions,
    wires,
    selectedWireId,
    compass,
    isDraggingCompass,
    showVectors,
    showLines,
    showAmpereLoop,
    ampereLoop,
    viewMode
  ]);

  // PointerEvents universales (ratón + táctil)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (Math.hypot(mx - compass.x, my - compass.y) < 28) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDraggingCompass(true);
      return;
    }

    for (const w of wires) {
      if (Math.hypot(mx - w.x, my - w.y) < 24) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggedWireId(w.id);
        setSelectedWireId(w.id);
        setDragOffset({ x: mx - w.x, y: my - w.y });
        return;
      }
    }

    if (showAmpereLoop) {
      const distToLoopCenter = Math.hypot(mx - ampereLoop.x, my - ampereLoop.y);
      if (Math.abs(distToLoopCenter - ampereLoop.radiusPx) < 18 || distToLoopCenter < ampereLoop.radiusPx) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setIsDraggingLoop(true);
        setDragOffset({ x: mx - ampereLoop.x, y: my - ampereLoop.y });
        setSelectedWireId(null);
        return;
      }
    }

    setSelectedWireId(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingCompass) {
      setCompass({
        x: Math.min(Math.max(24, mx), dimensions.width - 24),
        y: Math.min(Math.max(24, my), dimensions.height - 24)
      });
      return;
    }

    if (draggedWireId) {
      setWires((prev) =>
        prev.map((w) =>
          w.id === draggedWireId
            ? {
                ...w,
                x: Math.min(Math.max(24, mx - dragOffset.x), dimensions.width - 24),
                y: Math.min(Math.max(24, my - dragOffset.y), dimensions.height - 24)
              }
            : w
        )
      );
      return;
    }

    if (isDraggingLoop) {
      setAmpereLoop((prev) => ({
        ...prev,
        x: Math.min(Math.max(30, mx - dragOffset.x), dimensions.width - 30),
        y: Math.min(Math.max(30, my - dragOffset.y), dimensions.height - 30)
      }));
    }
  };

  const handlePointerUp = () => {
    setDraggedWireId(null);
    setIsDraggingCompass(false);
    setIsDraggingLoop(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 20 : 8;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
    else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedWireId && wires.length > 1) {
      e.preventDefault();
      setWires((prev) => prev.filter((w) => w.id !== selectedWireId));
      setSelectedWireId(null);
      return;
    } else {
      return;
    }

    e.preventDefault();
    if (selectedWireId) {
      setWires((prev) =>
        prev.map((w) =>
          w.id === selectedWireId ? { ...w, x: w.x + dx, y: w.y + dy } : w
        )
      );
    } else {
      setCompass((prev) => ({ x: prev.x + dx, y: prev.y + dy }));
    }
  };

  const applyPreset = (preset: string) => {
    if (preset === 'single') {
      setWires([{ id: 'w1', x: 400, y: 300, current: 5, label: 'I' }]);
      setAmpereLoop({ x: 400, y: 300, radiusPx: 100 });
    } else if (preset === 'parallel_attraction') {
      setWires([
        { id: 'w1', x: 340, y: 300, current: 4, label: 'I₁' },
        { id: 'w2', x: 460, y: 300, current: 4, label: 'I₂' }
      ]);
      setAmpereLoop({ x: 400, y: 300, radiusPx: 115 });
    } else if (preset === 'parallel_repulsion') {
      setWires([
        { id: 'w1', x: 340, y: 300, current: 4, label: 'I₁' },
        { id: 'w2', x: 460, y: 300, current: -4, label: 'I₂' }
      ]);
      setAmpereLoop({ x: 400, y: 300, radiusPx: 115 });
    } else if (preset === 'solenoid') {
      const newWires: WireCurrent[] = [];
      const startX = 260;
      const spacing = 45;
      for (let i = 0; i < 7; i++) {
        newWires.push({ id: `top_${i}`, x: startX + i * spacing, y: 220, current: 3, label: '⊙' });
        newWires.push({ id: `bot_${i}`, x: startX + i * spacing, y: 380, current: -3, label: '⊗' });
      }
      setWires(newWires);
      setAmpereLoop({ x: 400, y: 220, radiusPx: 95 });
    }
  };

  usePresetRequest(presetRequest, onPresetHandled, applyPreset);

  const addWire = (currentVal: number) => {
    const id = 'w_' + Math.random().toString(36).substring(2, 7);
    setWires((prev) => [
      ...prev,
      {
        id,
        x: 400 + (Math.random() - 0.5) * 80,
        y: 300 + (Math.random() - 0.5) * 80,
        current: currentVal,
        label: currentVal > 0 ? '⊙' : '⊗'
      }
    ]);
  };

  const circMicroTm = (ampereStats.circulationTm * 1e6).toFixed(2);
  const theoMicroTm = (ampereStats.theoreticalTm * 1e6).toFixed(2);

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#FAF7F2]">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Lienzo interactivo de Magnetostática y Ley de Ampère"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="w-full h-full cursor-crosshair block touch-none focus:outline-none"
      />

      {/* Telemetría de la Ley de Ampère (Superior Izquierda - Plegable) */}
      {showAmpereLoop &&
        (isAmpereHudOpen ? (
          <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md max-w-[calc(100%-2rem)]">
            <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-3">
              <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-300/70 flex items-center justify-center text-purple-800 font-bold">
                ∮
              </div>
              <div>
                <div className="text-xs font-bold text-[#231F1C] tracking-wide">LEY DE AMPÈRE</div>
                <div className="text-[11px] font-mono text-purple-800 font-semibold">
                  ∮_C B · dl = μ₀ I_enc
                </div>
              </div>
            </div>

            {viewMode === 'explore' ? (
              <div className="flex items-center gap-3 text-xs">
                <span>
                  <span className="text-[#5C554E]">Corriente encerrada: </span>
                  <span className="font-bold text-[#231F1C] font-mono">
                    {ampereStats.enclosedCurrentA > 0 ? '+' : ''}
                    {ampereStats.enclosedCurrentA.toFixed(1)} A
                  </span>
                </span>
                <span className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1 text-[#2D7A64] font-bold">
                  <CheckCircle2 className="w-4 h-4" /> Circulación Comprobada
                </span>
              </div>
            ) : (
              <div className="flex items-center gap-3.5 text-xs font-mono">
                <div>
                  <span className="text-[#5C554E]">I_enc: </span>
                  <span className="font-bold text-[#231F1C]">
                    {ampereStats.enclosedCurrentA > 0 ? '+' : ''}
                    {ampereStats.enclosedCurrentA.toFixed(1)} A
                  </span>
                </div>
                <div className="border-l border-[#E0D8CF] pl-3">
                  <span className="text-[#5C554E]">μ₀·I_enc: </span>
                  <span className="font-bold text-purple-800">{theoMicroTm} µT·m</span>
                </div>
                <div className="border-l border-[#E0D8CF] pl-3">
                  <span className="text-[#5C554E]">∮ B·dl: </span>
                  <span className="font-bold text-[#2D7A64]">{circMicroTm} µT·m</span>
                </div>
                <div className="border-l border-[#E0D8CF] pl-3 flex items-center gap-1">
                  <span className="text-[10px] font-sans text-[#5C554E]">Radio C:</span>
                  <input
                    type="range"
                    min="55"
                    max="220"
                    step="5"
                    value={ampereLoop.radiusPx}
                    onChange={(e) =>
                      setAmpereLoop((prev) => ({ ...prev, radiusPx: parseInt(e.target.value, 10) }))
                    }
                    className="w-16 accent-purple-700 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <button
              onClick={() => setIsAmpereHudOpen(false)}
              className="p-1 text-[#6B6560] hover:text-[#231F1C] rounded transition-colors cursor-pointer ml-auto"
              title="Minimizar Ley de Ampère"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsAmpereHudOpen(true)}
            className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#231F1C] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          >
            <span className="font-bold text-purple-800">∮ Ley de Ampère:</span>
            <span className="font-mono font-semibold">{circMicroTm} µT·m</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
          </button>
        ))}

      {/* Barra inferior de controles (Plegable) */}
      {isControlsOpen ? (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#2D2A26] z-10">
          <span className="font-semibold text-[#6B6560] mr-1 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-teal-600" /> Conductor:
          </span>
          <button
            onClick={() => addWire(4)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-300 rounded-lg transition-colors cursor-pointer font-medium"
          >
            Saliente (⊙)
          </button>
          <button
            onClick={() => addWire(-4)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg transition-colors cursor-pointer font-medium"
          >
            Entrante (⊗)
          </button>

          <div className="h-4 w-px bg-[#D5CEC6] mx-1" />

          <button
            onClick={() => setShowVectors(!showVectors)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showVectors
                ? 'bg-sky-100 border-sky-300 text-sky-800 font-semibold'
                : 'bg-[#EDE8DF] border-[#D5CEC6] text-[#6B6560]'
            }`}
          >
            Vectores B
          </button>
          <button
            onClick={() => setShowLines(!showLines)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showLines
                ? 'bg-teal-100 border-teal-300 text-teal-800 font-semibold'
                : 'bg-[#EDE8DF] border-[#D5CEC6] text-[#6B6560]'
            }`}
          >
            Líneas
          </button>
          <button
            onClick={() => setShowAmpereLoop(!showAmpereLoop)}
            className={`px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
              showAmpereLoop
                ? 'bg-purple-100 border-purple-300 text-purple-800 font-semibold'
                : 'bg-[#EDE8DF] border-[#D5CEC6] text-[#6B6560]'
            }`}
          >
            Curva Amperiana ∮
          </button>

          <button
            onClick={() => setIsControlsOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#2D2A26] rounded transition-colors cursor-pointer ml-1"
            title="Minimizar barra de conductores"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsControlsOpen(true)}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#2D2A26] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-teal-600" />
          <span>Conductores & Ampère</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}
    </div>
  );
};
export default MagnetostaticsCanvas;
