import React, { useRef, useEffect, useState } from 'react';
import { usePresetRequest } from '../../hooks/usePresetRequest';
import type { WireCurrent, Vector2D, ViewMode } from '../../types';
import {
  calculateMagneticField2D,
  traceMagneticLine
} from '../../physics/biotsavart';
import { Plus, ChevronDown, ChevronUp } from 'lucide-react';

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

  // Compass probe
  const [compass, setCompass] = useState<Vector2D>({ x: 400, y: 200 });
  const [isDraggingCompass, setIsDraggingCompass] = useState(false);

  // Settings
  const [showVectors, setShowVectors] = useState(true);
  const [showLines, setShowLines] = useState(true);
  const [isControlsOpen, setIsControlsOpen] = useState(true);

  // Dynamic ResizeObserver
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

  // Bounds clamping to keep conductors and compass inside canvas bounds
  // (adjusted while rendering whenever the canvas size changes, not inside an effect)
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

  // Main rendering loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { width, height } = dimensions;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // 1. Clear background
    ctx.fillStyle = '#FAF7F2';
    ctx.fillRect(0, 0, width, height);

    // 2. Subtle grid
    ctx.strokeStyle = 'rgba(80, 70, 60, 0.08)';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Magnetic Vector Field
    if (showVectors && wires.length > 0) {
      const step = 32;
      for (let x = step / 2; x < width; x += step) {
        for (let y = step / 2; y < height; y += step) {
          const B = calculateMagneticField2D(x, y, wires);
          const mag = Math.hypot(B.x, B.y);
          if (mag < 0.01) continue;

          const angle = Math.atan2(B.y, B.x);
          const length = Math.min(step * 0.75, Math.max(8, Math.log10(mag + 1) * 7.5));
          const strength = Math.min(1, Math.log10(mag + 1) / 3.0);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          // Color palette: Cyan -> Teal -> Bright Emerald
          ctx.strokeStyle = `rgba(${Math.floor(14 + 100 * strength)}, ${Math.floor(
            165 + 60 * strength
          )}, ${Math.floor(233 - 50 * strength)}, 0.65)`;
          ctx.fillStyle = ctx.strokeStyle;
          ctx.lineWidth = 1.3;

          ctx.beginPath();
          ctx.moveTo(-length / 2, 0);
          ctx.lineTo(length / 2, 0);
          ctx.stroke();

          const head = Math.max(3, length * 0.28);
          ctx.beginPath();
          ctx.moveTo(length / 2, 0);
          ctx.lineTo(length / 2 - head, -head * 0.55);
          ctx.lineTo(length / 2 - head, head * 0.55);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // 4. Closed Magnetic Field Lines
    if (showLines && wires.length > 0) {
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
      ctx.lineWidth = 1.6;

      for (const w of wires) {
        const radii = [25, 50, 85, 130, 190, 270];
        for (const r of radii) {
          const startX = w.x + r;
          const startY = w.y;
          const points = traceMagneticLine(startX, startY, 1, wires, width, height, 3, 300);

          if (points.length > 2) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let i = 1; i < points.length; i++) {
              ctx.lineTo(points[i].x, points[i].y);
            }
            ctx.stroke();

            // Arrow along line
            if (points.length > 15) {
              const mid = Math.floor(points.length / 2);
              const p1 = points[mid];
              const p2 = points[mid + 1] || points[mid];
              const arrAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

              ctx.save();
              ctx.translate(p1.x, p1.y);
              ctx.rotate(arrAngle);
              ctx.fillStyle = '#22d3ee';
              ctx.beginPath();
              ctx.moveTo(4, 0);
              ctx.lineTo(-4, -3);
              ctx.lineTo(-4, 3);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }
    }

    // 5. Render Conductors (Wires)
    for (const w of wires) {
      const isSelected = w.id === selectedWireId;
      const isOut = w.current > 0;
      const radius = 17;

      ctx.save();
      ctx.shadowColor = isOut ? '#06b6d4' : '#f59e0b';
      ctx.shadowBlur = isSelected ? 20 : 12;

      // Conductor body
      const grad = ctx.createRadialGradient(w.x - 3, w.y - 3, 2, w.x, w.y, radius);
      if (isOut) {
        grad.addColorStop(0, '#a5f3fc');
        grad.addColorStop(0.5, '#0891b2');
        grad.addColorStop(1, '#164e63');
      } else {
        grad.addColorStop(0, '#fef3c7');
        grad.addColorStop(0.5, '#d97706');
        grad.addColorStop(1, '#78350f');
      }
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(w.x, w.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }
      ctx.restore();

      // Current notation: Dot (out of screen) or Cross (into screen)
      ctx.save();
      if (isOut) {
        // Dot (circle)
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(w.x, w.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Cross (X)
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        const s = 6;
        ctx.moveTo(w.x - s, w.y - s);
        ctx.lineTo(w.x + s, w.y + s);
        ctx.moveTo(w.x + s, w.y - s);
        ctx.lineTo(w.x - s, w.y + s);
        ctx.stroke();
      }
      ctx.restore();

      // Label & Ampere value
      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${w.label || 'I'}: ${Math.abs(w.current)} A (${isOut ? 'Hacia ti ⊙' : 'Hacia dentro ⊗'})`,
        w.x,
        w.y + radius + 15
      );
    }

    // 6. Magnetic Compass Probe
    const B_at_compass = calculateMagneticField2D(compass.x, compass.y, wires);
    const B_mag = Math.hypot(B_at_compass.x, B_at_compass.y);
    const needleAngle = Math.atan2(B_at_compass.y, B_at_compass.x);

    ctx.save();
    ctx.translate(compass.x, compass.y);

    // Compass Housing
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = isDraggingCompass ? '#38bdf8' : '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Cardinal dots
    ctx.fillStyle = '#94a3b8';
    ctx.fillRect(-1, -22, 2, 4);
    ctx.fillRect(-1, 18, 2, 4);
    ctx.fillRect(-22, -1, 4, 2);
    ctx.fillRect(18, -1, 4, 2);

    // Needle rotating along B vector
    ctx.rotate(needleAngle);

    // North Needle (Red)
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(19, 0);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();

    // South Needle (White/Silver)
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, -3);
    ctx.lineTo(-19, 0);
    ctx.lineTo(0, 3);
    ctx.closePath();
    ctx.fill();

    // Needle pivot
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // Compass Telemetry Tag
    const tagX = compass.x + 30;
    const tagY = compass.y - 20;
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(tagX, tagY, 130, 48, 6);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = viewMode === 'explore' ? '#10b981' : '#38bdf8';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(viewMode === 'explore' ? 'BRÚJULA DE EXPLORACIÓN' : 'MAGNETÓMETRO (SI)', tagX + 8, tagY + 16);

    ctx.fillStyle = '#f8fafc';
    ctx.font = '11px monospace';
    if (viewMode === 'explore') {
      const magLevel = B_mag * 10 > 25 ? 'Intenso 🧲' : B_mag * 10 > 8 ? 'Moderado' : 'Débil';
      ctx.fillText(`Intensidad: ${magLevel}`, tagX + 8, tagY + 32);
      ctx.fillText(`Giro: ${((needleAngle * 180) / Math.PI).toFixed(0)}°`, tagX + 8, tagY + 45);
    } else {
      ctx.fillText(`|B|: ${(B_mag * 10).toFixed(2)} µT`, tagX + 8, tagY + 32);
      ctx.fillText(`θ:   ${((needleAngle * 180) / Math.PI).toFixed(1)}°`, tagX + 8, tagY + 45);
    }
  }, [dimensions, wires, selectedWireId, compass, isDraggingCompass, showVectors, showLines, viewMode]);

  // Mouse handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (Math.hypot(mx - compass.x, my - compass.y) < 25) {
      setIsDraggingCompass(true);
      return;
    }

    for (const w of wires) {
      if (Math.hypot(mx - w.x, my - w.y) < 22) {
        setDraggedWireId(w.id);
        setSelectedWireId(w.id);
        setDragOffset({ x: mx - w.x, y: my - w.y });
        return;
      }
    }

    setSelectedWireId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingCompass) {
      setCompass({ x: mx, y: my });
      return;
    }

    if (draggedWireId) {
      setWires((prev) =>
        prev.map((w) =>
          w.id === draggedWireId ? { ...w, x: mx - dragOffset.x, y: my - dragOffset.y } : w
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedWireId(null);
    setIsDraggingCompass(false);
  };

  // Presets
  const applyPreset = (preset: string) => {
    if (preset === 'single') {
      setWires([{ id: 'w1', x: 400, y: 300, current: 5, label: 'I' }]);
    } else if (preset === 'parallel_attraction') {
      setWires([
        { id: 'w1', x: 340, y: 300, current: 4, label: 'I₁' },
        { id: 'w2', x: 460, y: 300, current: 4, label: 'I₂' }
      ]);
    } else if (preset === 'parallel_repulsion') {
      setWires([
        { id: 'w1', x: 340, y: 300, current: 4, label: 'I₁' },
        { id: 'w2', x: 460, y: 300, current: -4, label: 'I₂' }
      ]);
    } else if (preset === 'solenoid') {
      const newWires: WireCurrent[] = [];
      const startX = 260;
      const spacing = 45;
      for (let i = 0; i < 7; i++) {
        newWires.push({
          id: `top_${i}`,
          x: startX + i * spacing,
          y: 220,
          current: 3,
          label: `⊙`
        });
        newWires.push({
          id: `bot_${i}`,
          x: startX + i * spacing,
          y: 380,
          current: -3,
          label: `⊗`
        });
      }
      setWires(newWires);
    }
  };

  // Handle presetRequest from parent
  usePresetRequest(presetRequest, onPresetHandled, applyPreset);

  const addWire = (currentVal: number) => {
    const id = 'w_' + Math.random().toString(36).substring(2, 7);
    const newW: WireCurrent = {
      id,
      x: 400 + (Math.random() - 0.5) * 80,
      y: 300 + (Math.random() - 0.5) * 80,
      current: currentVal,
      label: currentVal > 0 ? '⊙' : '⊗'
    };
    setWires((prev) => [...prev, newW]);
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none bg-[#090d16]">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        className="w-full h-full cursor-crosshair block"
      />

      {/* Bottom control bar (Collapsible) */}
      {isControlsOpen ? (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 bg-white/95 backdrop-blur-md px-3 py-2 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#2D2A26] z-10">
          <span className="font-semibold text-[#6B6560] mr-1 flex items-center gap-1">
            <Plus className="w-3.5 h-3.5 text-teal-600" /> Conductor:
          </span>
          <button
            onClick={() => addWire(4)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-teal-100 hover:bg-teal-200 text-teal-800 border border-teal-300 rounded-lg transition-colors cursor-pointer"
          >
            Saliente (⊙)
          </button>
          <button
            onClick={() => addWire(-4)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-800 border border-amber-300 rounded-lg transition-colors cursor-pointer"
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
          title="Añadir conductores y alternar vectores"
        >
          <Plus className="w-3.5 h-3.5 text-teal-600" />
          <span>Conductores & Vectores</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}
    </div>
  );
};
