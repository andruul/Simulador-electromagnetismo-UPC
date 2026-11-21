import React, { useRef, useEffect, useState } from 'react';
import type { PointCharge, TestParticle2D, Sensor2D, ElectrostaticsSettings, ViewMode } from '../types';
import {
  calculateElectricField,
  calculateElectricPotential,
  traceFieldLine,
  traceEquipotentialLine
} from '../physics/electrostatics';
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

  // Sensor state
  const [sensor, setSensor] = useState<Sensor2D>({ x: 400, y: 300, active: true });
  const [isDraggingSensor, setIsDraggingSensor] = useState(false);

  // Test particles that move under Coulomb force
  const [testParticles, setTestParticles] = useState<TestParticle2D[]>([]);
  const [isParticleBarOpen, setIsParticleBarOpen] = useState(true);

  // Update canvas size dynamically with ResizeObserver
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

  // Keep the sensor within visible canvas bounds when the container resizes
  // (adjusted while rendering, not inside an effect)
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

  // Keep charges (owned by the parent) within visible canvas bounds as well
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

  // Spawn a test particle at sensor position or center
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
      color: chargeValue > 0 ? '#fb7185' : '#38bdf8'
    };
    setTestParticles((prev) => [...prev.slice(-24), newP]);
  };

  const clearTestParticles = () => {
    setTestParticles([]);
  };

  // Physics animation loop for moving test particles
  useEffect(() => {
    if (!isPlaying || testParticles.length === 0) return;

    let animId: number;
    const dt = 0.4;

    const step = () => {
      setTestParticles((prevParticles) =>
        prevParticles
          .map((p) => {
            const E = calculateElectricField(p.x, p.y, charges, settings.kConstant);
            // a = q * E / m
            const ax = (p.charge * E.x) / p.mass;
            const ay = (p.charge * E.y) / p.mass;

            // Verlet / Euler with light damping
            const vx = (p.vx + ax * dt) * 0.99;
            const vy = (p.vy + ay * dt) * 0.99;
            const newX = p.x + vx * dt;
            const newY = p.y + vy * dt;

            const trail = [...p.trail, { x: newX, y: newY }].slice(-40);

            return {
              ...p,
              x: newX,
              y: newY,
              vx,
              vy,
              trail
            };
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

  // Main rendering effect
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

    // 1. Background clear
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // 2. Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // 3. Potential Heatmap (fast block rendering)
    if (settings.showPotentialHeatmap && charges.length > 0) {
      const step = 16;
      for (let x = 0; x < width; x += step) {
        for (let y = 0; y < height; y += step) {
          const V = calculateElectricPotential(x + step / 2, y + step / 2, charges, settings.kConstant);
          const normV = Math.tanh(V / 600);
          let r = 0, g = 0, b = 0, a = Math.min(0.35, Math.abs(normV) * 0.4);

          if (normV > 0) {
            r = Math.floor(255 * normV);
            g = Math.floor(60 * normV);
            b = Math.floor(90 * (1 - normV));
          } else {
            const neg = Math.abs(normV);
            r = Math.floor(40 * (1 - neg));
            g = Math.floor(150 * neg);
            b = Math.floor(255 * neg);
          }

          ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
          ctx.fillRect(x, y, step, step);
        }
      }
    }

    // 4. Equipotential Lines
    if (settings.showEquipotentialLines && charges.length > 0) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([4, 4]);

      for (const c of charges) {
        const radii = [35, 70, 120, 180, 260];
        for (const r of radii) {
          const startX = c.x + r;
          const startY = c.y;
          const eqPoints = traceEquipotentialLine(
            startX,
            startY,
            charges,
            width,
            height,
            4,
            250,
            settings.kConstant
          );

          if (eqPoints.length > 2) {
            ctx.beginPath();
            ctx.moveTo(eqPoints[0].x, eqPoints[0].y);
            for (let i = 1; i < eqPoints.length; i++) {
              ctx.lineTo(eqPoints[i].x, eqPoints[i].y);
            }
            ctx.stroke();
          }
        }
      }
      ctx.setLineDash([]);
    }

    // 5. Electric Vector Field (arrows)
    if (settings.showVectorField && charges.length > 0) {
      const step = Math.max(25, settings.vectorGridDensity);
      for (let x = step / 2; x < width; x += step) {
        for (let y = step / 2; y < height; y += step) {
          const E = calculateElectricField(x, y, charges, settings.kConstant);
          const mag = Math.hypot(E.x, E.y);
          if (mag < 0.01) continue;

          const angle = Math.atan2(E.y, E.x);
          const length = Math.min(step * 0.75, Math.max(8, Math.log10(mag + 1) * 7));

          const strength = Math.min(1, Math.log10(mag + 1) / 3.5);
          const red = Math.floor(strength * 255);
          const blue = Math.floor((1 - strength) * 255);
          const green = Math.floor(180 * strength);

          ctx.save();
          ctx.translate(x, y);
          ctx.rotate(angle);

          ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.65)`;
          ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.85)`;
          ctx.lineWidth = 1.4;

          // Arrow shaft
          ctx.beginPath();
          ctx.moveTo(-length / 2, 0);
          ctx.lineTo(length / 2, 0);
          ctx.stroke();

          // Arrow head
          const headSize = Math.max(3, length * 0.28);
          ctx.beginPath();
          ctx.moveTo(length / 2, 0);
          ctx.lineTo(length / 2 - headSize, -headSize * 0.55);
          ctx.lineTo(length / 2 - headSize, headSize * 0.55);
          ctx.closePath();
          ctx.fill();

          ctx.restore();
        }
      }
    }

    // 6. Continuous Field Lines (RK4)
    if (settings.showFieldLines && charges.length > 0) {
      const linesPerCharge = settings.fieldLinesPerCharge || 16;
      ctx.lineWidth = 1.6;

      for (const c of charges) {
        if (c.charge > 0) {
          ctx.strokeStyle = 'rgba(244, 63, 94, 0.75)';
          const count = Math.round(linesPerCharge * Math.abs(c.charge));
          for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i) / count;
            const startX = c.x + 16 * Math.cos(angle);
            const startY = c.y + 16 * Math.sin(angle);

            const points = traceFieldLine(
              startX,
              startY,
              1,
              charges,
              width,
              height,
              settings.rk4StepSize || 4,
              settings.maxFieldLineSteps || 250,
              settings.kConstant
            );

            if (points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(points[0].x, points[0].y);
              for (let p = 1; p < points.length; p++) {
                ctx.lineTo(points[p].x, points[p].y);
              }
              ctx.stroke();

              if (points.length > 20) {
                const mid = Math.floor(points.length / 2);
                const p1 = points[mid];
                const p2 = points[mid + 1] || points[mid];
                const arrAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

                ctx.save();
                ctx.translate(p1.x, p1.y);
                ctx.rotate(arrAngle);
                ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
                ctx.beginPath();
                ctx.moveTo(5, 0);
                ctx.lineTo(-4, -3.5);
                ctx.lineTo(-4, 3.5);
                ctx.closePath();
                ctx.fill();
                ctx.restore();
              }
            }
          }
        }
      }

      const hasPositive = charges.some((c) => c.charge > 0);
      if (!hasPositive) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.75)';
        for (const c of charges) {
          if (c.charge < 0) {
            const count = Math.round(linesPerCharge * Math.abs(c.charge));
            for (let i = 0; i < count; i++) {
              const angle = (2 * Math.PI * i) / count;
              const startX = c.x + 16 * Math.cos(angle);
              const startY = c.y + 16 * Math.sin(angle);

              const points = traceFieldLine(
                startX,
                startY,
                -1,
                charges,
                width,
                height,
                settings.rk4StepSize || 4,
                settings.maxFieldLineSteps || 250,
                settings.kConstant
              );

              if (points.length > 1) {
                ctx.beginPath();
                ctx.moveTo(points[0].x, points[0].y);
                for (let p = 1; p < points.length; p++) {
                  ctx.lineTo(points[p].x, points[p].y);
                }
                ctx.stroke();
              }
            }
          }
        }
      }
    }

    // 7. Test Particles (moving under Coulomb force)
    for (const tp of testParticles) {
      if (tp.trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(tp.trail[0].x, tp.trail[0].y);
        for (let i = 1; i < tp.trail.length; i++) {
          ctx.lineTo(tp.trail[i].x, tp.trail[i].y);
        }
        ctx.strokeStyle = tp.color;
        ctx.lineWidth = 1.8;
        ctx.stroke();
      }

      ctx.save();
      ctx.shadowBlur = 10;
      ctx.shadowColor = tp.color;
      ctx.fillStyle = tp.color;
      ctx.beginPath();
      ctx.arc(tp.x, tp.y, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 8. Render Point Charges
    for (const c of charges) {
      const isSelected = c.id === selectedChargeId;
      const isPositive = c.charge > 0;
      const radius = 18;

      ctx.save();
      ctx.shadowColor = isPositive ? '#ef4444' : '#0ea5e9';
      ctx.shadowBlur = isSelected ? 22 : 14;

      const grad = ctx.createRadialGradient(c.x - 3, c.y - 3, 2, c.x, c.y, radius);
      if (isPositive) {
        grad.addColorStop(0, '#fca5a5');
        grad.addColorStop(0.5, '#dc2626');
        grad.addColorStop(1, '#991b1b');
      } else {
        grad.addColorStop(0, '#7dd3fc');
        grad.addColorStop(0.5, '#0284c7');
        grad.addColorStop(1, '#075985');
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
      ctx.fill();

      if (isSelected) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2.5;
        ctx.stroke();
      }

      ctx.restore();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 20px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isPositive ? '+' : '−', c.x, c.y);

      ctx.font = '11px system-ui, sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText(`${c.charge > 0 ? '+' : ''}${c.charge} µC`, c.x, c.y + radius + 14);
    }

    // 9. Field Sensor (Multimeter probe)
    if (sensor.active) {
      const E = calculateElectricField(sensor.x, sensor.y, charges, settings.kConstant);
      const V = calculateElectricPotential(sensor.x, sensor.y, charges, settings.kConstant);
      const Emag = Math.hypot(E.x, E.y);
      const angleDeg = (Math.atan2(E.y, E.x) * 180) / Math.PI;

      ctx.save();
      ctx.strokeStyle = isDraggingSensor ? '#38bdf8' : '#e2e8f0';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.arc(sensor.x, sensor.y, 12, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sensor.x - 16, sensor.y);
      ctx.lineTo(sensor.x + 16, sensor.y);
      ctx.moveTo(sensor.x, sensor.y - 16);
      ctx.lineTo(sensor.x, sensor.y + 16);
      ctx.stroke();

      if (Emag > 0.05) {
        const arrowLen = Math.min(70, Math.max(20, Math.log10(Emag + 1) * 22));
        const arrAngle = Math.atan2(E.y, E.x);
        const endX = sensor.x + arrowLen * Math.cos(arrAngle);
        const endY = sensor.y + arrowLen * Math.sin(arrAngle);

        ctx.strokeStyle = '#facc15';
        ctx.fillStyle = '#facc15';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.moveTo(sensor.x, sensor.y);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.beginPath();
        const headSize = 8;
        ctx.moveTo(endX, endY);
        ctx.lineTo(
          endX - headSize * Math.cos(arrAngle - Math.PI / 6),
          endY - headSize * Math.sin(arrAngle - Math.PI / 6)
        );
        ctx.lineTo(
          endX - headSize * Math.cos(arrAngle + Math.PI / 6),
          endY - headSize * Math.sin(arrAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }

      const boxW = 145;
      const boxH = 68;
      let boxX = sensor.x + 22;
      let boxY = sensor.y - 34;
      if (boxX + boxW > width) boxX = sensor.x - boxW - 22;
      if (boxY < 10) boxY = 10;

      ctx.fillStyle = 'rgba(15, 23, 42, 0.88)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(boxX, boxY, boxW, boxH, 6);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = viewMode === 'explore' ? '#10b981' : '#38bdf8';
      ctx.font = 'bold 11px system-ui, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(viewMode === 'explore' ? 'SENSOR EXPLORADOR' : 'MULTÍMETRO DIGITAL (SI)', boxX + 10, boxY + 16);

      ctx.fillStyle = '#f8fafc';
      ctx.font = '11px monospace';
      if (viewMode === 'explore') {
        const fieldLevel = Emag > 120 ? 'Muy Fuerte' : Emag > 40 ? 'Medio' : 'Suave';
        const voltLevel = V > 60 ? 'Alto (+)' : V < -60 ? 'Bajo (−)' : 'Cero (0V)';
        ctx.fillText(`Campo: ${fieldLevel} (${Emag.toFixed(0)})`, boxX + 10, boxY + 32);
        ctx.fillText(`Voltaje: ${voltLevel}`, boxX + 10, boxY + 47);
        ctx.fillText(`Ángulo: ${angleDeg.toFixed(0)}°`, boxX + 10, boxY + 61);
      } else {
        ctx.fillText(`|E|: ${Emag.toFixed(2)} N/C`, boxX + 10, boxY + 32);
        ctx.fillText(`V:   ${V.toFixed(2)} Volts`, boxX + 10, boxY + 47);
        ctx.fillText(`θ:   ${angleDeg.toFixed(1)}°`, boxX + 10, boxY + 61);
      }

      ctx.restore();
    }
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

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (Math.hypot(mx - sensor.x, my - sensor.y) < 20) {
      setIsDraggingSensor(true);
      return;
    }

    for (const c of charges) {
      if (Math.hypot(mx - c.x, my - c.y) < 22) {
        setDraggedChargeId(c.id);
        setSelectedChargeId(c.id);
        setDragOffset({ x: mx - c.x, y: my - c.y });
        return;
      }
    }

    setSelectedChargeId(null);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (isDraggingSensor) {
      setSensor((prev) => ({ ...prev, x: mx, y: my }));
      return;
    }

    if (draggedChargeId) {
      setCharges((prev) =>
        prev.map((c) =>
          c.id === draggedChargeId && !c.fixed
            ? { ...c, x: mx - dragOffset.x, y: my - dragOffset.y }
            : c
        )
      );
    }
  };

  const handleMouseUp = () => {
    setDraggedChargeId(null);
    setIsDraggingSensor(false);
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

      {/* Floating Action Overlay for Test Particle (Collapsible) */}
      {isParticleBarOpen ? (
        <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] flex flex-wrap items-center gap-1.5 md:gap-2 bg-slate-900/85 backdrop-blur-md px-3 py-2 rounded-xl border border-slate-700/60 shadow-xl text-xs text-slate-200 z-10">
          <span className="font-semibold text-slate-400 mr-1 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Partícula de prueba:
          </span>
          <button
            onClick={() => spawnTestParticle(1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-lg transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Positiva (+1)
          </button>
          <button
            onClick={() => spawnTestParticle(-1)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-lg transition-colors cursor-pointer"
          >
            <Minus className="w-3.5 h-3.5" /> Negativa (−1)
          </button>
          {testParticles.length > 0 && (
            <button
              onClick={clearTestParticles}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
            >
              Limpiar ({testParticles.length})
            </button>
          )}

          <button
            onClick={() => setIsParticleBarOpen(false)}
            className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-1"
            title="Minimizar barra de partículas"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          onClick={() => setIsParticleBarOpen(true)}
          className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md px-2.5 py-1.5 rounded-xl border border-slate-700/60 shadow-xl text-xs text-yellow-300 hover:bg-slate-800 transition-colors cursor-pointer"
          title="Abrir controles de partícula de prueba"
        >
          <Zap className="w-3.5 h-3.5 text-yellow-400" />
          <span>Partícula de prueba</span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      )}

      {/* Instructions pill */}
      <div className="absolute top-4 left-4 max-w-[calc(100%-2rem)] bg-slate-900/75 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] text-slate-400 hidden sm:flex items-center gap-2 pointer-events-none z-10">
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse flex-shrink-0" />
        <span className="truncate">Arrastra las cargas o el sensor amarillo para explorar el campo y potencial</span>
      </div>
    </div>
  );
};
