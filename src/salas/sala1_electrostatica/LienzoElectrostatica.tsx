import React, { useRef, useEffect, useState } from 'react';
import type { PointCharge, TestParticle2D, Sensor2D, ElectrostaticsSettings, ViewMode } from '../../tipos';
import { calculateElectricField } from '../../fisica/electrostatica';
import { drawElectrostaticsScene } from './renderizadorElectrostatica';
import { Plus, Minus, Zap, ChevronDown, ChevronUp } from 'lucide-react';

interface ElectrostaticsCanvasProps {
  charges: PointCharge[];
  setCharges: React.Dispatch<React.SetStateAction<PointCharge[]>>;
  selectedChargeId: string | null;
  setSelectedChargeId: (id: string | null) => void;
  settings: ElectrostaticsSettings;
  isPlaying: boolean;
  viewMode?: ViewMode;
}

export const ElectrostaticsCanvas: React.FC<ElectrostaticsCanvasProps> = ({
  charges,
  setCharges,
  selectedChargeId,
  setSelectedChargeId,
  settings,
  isPlaying,
  viewMode = 'explore'
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });
  const [draggedChargeId, setDraggedChargeId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const [sensor, setSensor] = useState<Sensor2D>({ x: 400, y: 300, active: true });
  const [isDraggingSensor, setIsDraggingSensor] = useState(false);

  const [testParticles, setTestParticles] = useState<TestParticle2D[]>([]);
  const [isParticleBarOpen, setIsParticleBarOpen] = useState(true);

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

  const [sensorClampedFor, setSensorClampedFor] = useState({ width: 0, height: 0 });
  if (
    dimensions.width > 50 &&
    dimensions.height > 50 &&
    (sensorClampedFor.width !== dimensions.width || sensorClampedFor.height !== dimensions.height)
  ) {
    setSensorClampedFor({ width: dimensions.width, height: dimensions.height });
    setSensor((prev) => ({
      ...prev,
      x: Math.min(Math.max(30, prev.x), dimensions.width - 30),
      y: Math.min(Math.max(30, prev.y), dimensions.height - 30)
    }));
  }

  useEffect(() => {
    if (dimensions.width <= 50 || dimensions.height <= 50) return;
    setCharges((prev) =>
      prev.map((c) => ({
        ...c,
        x: Math.min(Math.max(30, c.x), dimensions.width - 30),
        y: Math.min(Math.max(30, c.y), dimensions.height - 30)
      }))
    );
  }, [dimensions.width, dimensions.height, setCharges]);

  const spawnTestParticle = (chargeValue: number = 1) => {
    const newP: TestParticle2D = {
      id: Math.random().toString(36).substring(2, 9),
      x: sensor.x + (Math.random() - 0.5) * 20,
      y: sensor.y + (Math.random() - 0.5) * 20,
      vx: 0,
      vy: 0,
      charge: chargeValue,
      mass: 1,
      trail: [],
      color: chargeValue > 0 ? '#D95B5F' : '#3E82AA'
    };
    setTestParticles((prev) => [...prev.slice(-24), newP]);
  };

  const clearTestParticles = () => setTestParticles([]);

  useEffect(() => {
    if (!isPlaying || testParticles.length === 0) return;

    let animId: number;
    const dt = 0.4;

    const step = () => {
      setTestParticles((prevParticles) =>
        prevParticles
          .map((p) => {
            const E = calculateElectricField(p.x, p.y, charges, settings.kConstant);
            const ax = (p.charge * E.x) / p.mass;
            const ay = (p.charge * E.y) / p.mass;
            const vx = (p.vx + ax * dt) * 0.99;
            const vy = (p.vy + ay * dt) * 0.99;
            const newX = p.x + vx * dt;
            const newY = p.y + vy * dt;
            const trail = [...p.trail, { x: newX, y: newY }].slice(-40);
            return { ...p, x: newX, y: newY, vx, vy, trail };
          })
          .filter(
            (p) =>
              p.x >= -100 &&
              p.x <= dimensions.width + 100 &&
              p.y >= -100 &&
              p.y <= dimensions.height + 100
          )
      );
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, charges, settings.kConstant, dimensions, testParticles.length]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    drawElectrostaticsScene(ctx, {
      width,
      height,
      charges,
      selectedChargeId,
      settings,
      sensor,
      isDraggingSensor,
      testParticles,
      viewMode
    });
  }, [
    dimensions,
    charges,
    selectedChargeId,
    settings,
    sensor,
    isDraggingSensor,
    testParticles,
    viewMode
  ]);

  // Interacción universal PointerEvents (ratón, pantalla táctil y lápiz óptico)
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.focus();
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (Math.hypot(mx - sensor.x, my - sensor.y) < 24) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDraggingSensor(true);
      return;
    }

    for (const c of charges) {
      if (Math.hypot(mx - c.x, my - c.y) < 26) {
        e.currentTarget.setPointerCapture(e.pointerId);
        setDraggedChargeId(c.id);
        setSelectedChargeId(c.id);
        setDragOffset({ x: mx - c.x, y: my - c.y });
        return;
      }
    }

    setSelectedChargeId(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingSensor) {
      setSensor((prev) => ({
        ...prev,
        x: Math.min(Math.max(20, mx), dimensions.width - 20),
        y: Math.min(Math.max(20, my), dimensions.height - 20)
      }));
      return;
    }

    if (draggedChargeId) {
      setCharges((prev) =>
        prev.map((c) =>
          c.id === draggedChargeId && !c.fixed
            ? {
                ...c,
                x: Math.min(Math.max(20, mx - dragOffset.x), dimensions.width - 20),
                y: Math.min(Math.max(20, my - dragOffset.y), dimensions.height - 20)
              }
            : c
        )
      );
    }
  };

  const handlePointerUp = () => {
    setDraggedChargeId(null);
    setIsDraggingSensor(false);
  };

  // Accesibilidad por teclado: flechas mueven la carga seleccionada (o el sensor si ninguna está activa)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 20 : 8;
    let dx = 0;
    let dy = 0;
    if (e.key === 'ArrowLeft') dx = -step;
    else if (e.key === 'ArrowRight') dx = step;
    else if (e.key === 'ArrowUp') dy = -step;
    else if (e.key === 'ArrowDown') dy = step;
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
        prev.map((c) =>
          c.id === selectedChargeId && !c.fixed
            ? {
                ...c,
                x: Math.min(Math.max(20, c.x + dx), dimensions.width - 20),
                y: Math.min(Math.max(20, c.y + dy), dimensions.height - 20)
              }
            : c
        )
      );
    } else {
      setSensor((prev) => ({
        ...prev,
        x: Math.min(Math.max(20, prev.x + dx), dimensions.width - 20),
        y: Math.min(Math.max(20, prev.y + dy), dimensions.height - 20)
      }));
    }
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#FAF7F2]">
      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Lienzo interactivo de Electrostática: usa ratón, pantalla táctil o teclas de flecha para desplazar cargas y el sensor"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="w-full h-full cursor-crosshair block touch-none focus:outline-none"
      />

      {isParticleBarOpen ? (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#2D2A26] z-10">
          <span className="font-semibold text-[#6B6560] mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" /> Partícula de prueba:
          </span>
          <button
            onClick={() => spawnTestParticle(1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 border border-rose-300/60 rounded-lg transition-colors cursor-pointer font-medium"
          >
            <Plus className="w-3.5 h-3.5" /> Positiva (+1)
          </button>
          <button
            onClick={() => spawnTestParticle(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-700 border border-sky-300/60 rounded-lg transition-colors cursor-pointer font-medium"
          >
            <Minus className="w-3.5 h-3.5" /> Negativa (−1)
          </button>
          {testParticles.length > 0 && (
            <button
              onClick={clearTestParticles}
              className="px-2.5 py-1.5 bg-[#EDE8DF] hover:bg-[#E0D8CF] text-[#4A4540] border border-[#D5CEC6] rounded-lg transition-colors cursor-pointer"
            >
              Limpiar ({testParticles.length})
            </button>
          )}

          <button
            onClick={() => setIsParticleBarOpen(false)}
            className="p-1 text-[#6B6560] hover:text-[#2D2A26] rounded transition-colors cursor-pointer ml-1"
            title="Minimizar barra de partículas"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsParticleBarOpen(true)}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#2D2A26] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          title="Abrir controles de partícula de prueba"
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          <span>Partícula de prueba</span>
          <ChevronUp className="w-3 h-3 text-[#6B6560]" />
        </button>
      )}
    </div>
  );
};
export default ElectrostaticsCanvas;
