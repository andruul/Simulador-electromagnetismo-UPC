import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewMode } from '../../tipos';
import {
  DIELECTRIC_MATERIALS,
  computeCapacitorNetwork,
  computeCapacitorState,
  type CapacitorNetworkTopology
} from '../../fisica/capacitancia';
import { useElementSize } from '../../ganchos/useDimensionElemento';
import { usePresetRequest } from '../../ganchos/usePeticionPreset';
import { CapacitorHud } from './TelemetriaCapacitor';
import { CapacitorBatteryControls, CapacitorBottomControls } from './ControlesCapacitor';
import {
  computeCapacitorLayout,
  measureProbeField,
  measureProbeVoltage,
  type Point
} from './disenoCapacitor';
import { drawCapacitorScene } from './renderizadorCapacitor';
import { GitMerge, ChevronDown, ChevronUp } from 'lucide-react';

export interface CapacitorLabCanvasProps {
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
}

type DragTarget = 'redProbe' | 'blackProbe' | 'fieldProbe' | 'dielectric' | null;

export const CapacitorLabCanvas: React.FC<CapacitorLabCanvasProps> = ({
  presetRequest,
  onPresetHandled,
  viewMode = 'explore'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dimensions = useElementSize(containerRef, { width: 900, height: 650 });

  const [plateAreaMm2, setPlateAreaMm2] = useState<number>(200);
  const [plateDistanceMm, setPlateDistanceMm] = useState<number>(5.0);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('teflon');
  const [customKappa] = useState<number>(2.1);
  const [insertionFraction, setInsertionFraction] = useState<number>(0.8);

  const [connectedToBattery, setConnectedToBattery] = useState<boolean>(true);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(1.5);
  const [trappedCharge, setTrappedCharge] = useState<number>(0);

  const [showVoltmeter, setShowVoltmeter] = useState<boolean>(true);
  const [showFieldMeter, setShowFieldMeter] = useState<boolean>(true);

  // Banco de capacitores (Individual / Serie / Paralelo) con C₁ = capacitor actual y C₂ auxiliar
  const [isNetworkOpen, setIsNetworkOpen] = useState<boolean>(false);
  const [networkTopology, setNetworkTopology] = useState<CapacitorNetworkTopology>('series');
  const [c2PF, setC2PF] = useState<number>(1.0);

  const [redProbePos, setRedProbePos] = useState<Point>({ x: 340, y: 190 });
  const [blackProbePos, setBlackProbePos] = useState<Point>({ x: 340, y: 390 });
  const [fieldProbePos, setFieldProbePos] = useState<Point>({ x: 420, y: 290 });

  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  const currentMaterial = useMemo(
    () => DIELECTRIC_MATERIALS.find((m) => m.id === selectedMaterialId) || DIELECTRIC_MATERIALS[0],
    [selectedMaterialId]
  );
  const activeKappa = selectedMaterialId === 'custom' ? customKappa : currentMaterial.kappa;

  const toggleBattery = () => {
    if (connectedToBattery) {
      const currentPhys = computeCapacitorState({
        plateAreaMm2,
        plateDistanceMm,
        kappa: activeKappa,
        insertionFraction,
        connectedToBattery: true,
        batteryVoltage
      });
      setTrappedCharge(currentPhys.storedCharge);
      setConnectedToBattery(false);
    } else {
      setConnectedToBattery(true);
    }
  };

  const physics = useMemo(
    () =>
      computeCapacitorState({
        plateAreaMm2,
        plateDistanceMm,
        kappa: activeKappa,
        insertionFraction,
        connectedToBattery,
        batteryVoltage,
        disconnectedCharge: trappedCharge
      }),
    [
      plateAreaMm2,
      plateDistanceMm,
      activeKappa,
      insertionFraction,
      connectedToBattery,
      batteryVoltage,
      trappedCharge
    ]
  );

  const networkStats = useMemo(
    () => computeCapacitorNetwork(networkTopology, physics.capacitancePF, c2PF, Math.abs(physics.voltage)),
    [networkTopology, physics.capacitancePF, c2PF, physics.voltage]
  );

  usePresetRequest(presetRequest, onPresetHandled, (preset) => {
    if (preset === 'vacuum') {
      setSelectedMaterialId('vacuum');
      setInsertionFraction(0);
      setConnectedToBattery(true);
      setBatteryVoltage(1.5);
    } else if (preset === 'teflon') {
      setSelectedMaterialId('teflon');
      setInsertionFraction(1.0);
      setConnectedToBattery(true);
      setBatteryVoltage(1.5);
    } else if (preset === 'glass') {
      setSelectedMaterialId('glass');
      setInsertionFraction(1.0);
      setConnectedToBattery(true);
      setBatteryVoltage(2.0);
    } else if (preset === 'trapped') {
      setSelectedMaterialId('glass');
      setInsertionFraction(0.85);
      const currentPhys = computeCapacitorState({
        plateAreaMm2,
        plateDistanceMm,
        kappa: 5.6,
        insertionFraction: 0.85,
        connectedToBattery: true,
        batteryVoltage: 1.5
      });
      setTrappedCharge(currentPhys.storedCharge);
      setConnectedToBattery(false);
    }
  });

  const layout = useMemo(
    () =>
      computeCapacitorLayout(
        dimensions.width,
        dimensions.height,
        plateAreaMm2,
        plateDistanceMm,
        insertionFraction
      ),
    [dimensions.width, dimensions.height, plateAreaMm2, plateDistanceMm, insertionFraction]
  );

  const measuredV = useMemo(
    () => measureProbeVoltage(layout, redProbePos, blackProbePos, physics.voltage),
    [layout, redProbePos, blackProbePos, physics.voltage]
  );

  const measuredE = useMemo(
    () =>
      measureProbeField(layout, fieldProbePos, physics.electricField, activeKappa, connectedToBattery),
    [layout, fieldProbePos, physics.electricField, activeKappa, connectedToBattery]
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;

    canvas.width = dimensions.width;
    canvas.height = dimensions.height;
    drawCapacitorScene(ctx, {
      width: dimensions.width,
      height: dimensions.height,
      layout,
      plateAreaMm2,
      plateDistanceMm,
      activeKappa,
      material: currentMaterial,
      connectedToBattery,
      batteryVoltage,
      physics,
      showVoltmeter,
      showFieldMeter,
      redProbe: redProbePos,
      blackProbe: blackProbePos,
      fieldProbe: fieldProbePos,
      measuredV,
      measuredE
    });
  }, [
    dimensions,
    layout,
    plateAreaMm2,
    plateDistanceMm,
    activeKappa,
    currentMaterial,
    connectedToBattery,
    batteryVoltage,
    physics,
    showVoltmeter,
    showFieldMeter,
    redProbePos,
    blackProbePos,
    fieldProbePos,
    measuredV,
    measuredE
  ]);

  // PointerEvents universales (ratón, táctil y lápiz óptico)
  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.focus();
    const point = canvasPoint(e);
    if (!point) return;
    const { x: mx, y: my } = point;
    const { slabX, slabY, slabWidthPx, slabHeightPx } = layout;

    if (showVoltmeter && Math.hypot(mx - redProbePos.x, my - redProbePos.y) < 24) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragTarget('redProbe');
      setDragOffset({ x: mx - redProbePos.x, y: my - redProbePos.y });
    } else if (showVoltmeter && Math.hypot(mx - blackProbePos.x, my - blackProbePos.y) < 24) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragTarget('blackProbe');
      setDragOffset({ x: mx - blackProbePos.x, y: my - blackProbePos.y });
    } else if (showFieldMeter && Math.hypot(mx - fieldProbePos.x, my - fieldProbePos.y) < 28) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragTarget('fieldProbe');
      setDragOffset({ x: mx - fieldProbePos.x, y: my - fieldProbePos.y });
    } else if (
      mx >= slabX - 10 &&
      mx <= slabX + slabWidthPx + 10 &&
      my >= slabY - 10 &&
      my <= slabY + slabHeightPx + 10
    ) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setDragTarget('dielectric');
      setDragOffset({ x: mx - slabX, y: my - slabY });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!dragTarget) return;
    const point = canvasPoint(e);
    if (!point) return;
    const target: Point = { x: point.x - dragOffset.x, y: point.y - dragOffset.y };

    if (dragTarget === 'redProbe') {
      setRedProbePos(target);
    } else if (dragTarget === 'blackProbe') {
      setBlackProbePos(target);
    } else if (dragTarget === 'fieldProbe') {
      setFieldProbePos(target);
    } else if (dragTarget === 'dielectric') {
      const rawFrac = 1 - (target.x - layout.plateLeftX) / layout.plateWidthPx;
      setInsertionFraction(Math.max(0, Math.min(1, rawFrac)));
    }
  };

  const handlePointerUp = () => setDragTarget(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setInsertionFraction((f) => Math.min(1, +(f + 0.05).toFixed(2)));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setInsertionFraction((f) => Math.max(0, +(f - 0.05).toFixed(2)));
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-[#FAF7F2] select-none overflow-hidden">
      <CapacitorHud
        viewMode={viewMode}
        physics={physics}
        connectedToBattery={connectedToBattery}
        material={currentMaterial}
        insertionFraction={insertionFraction}
        plateAreaMm2={plateAreaMm2}
        plateDistanceMm={plateDistanceMm}
      />
      <CapacitorBatteryControls
        connectedToBattery={connectedToBattery}
        batteryVoltage={batteryVoltage}
        onToggleBattery={toggleBattery}
        onBatteryVoltageChange={setBatteryVoltage}
      />
      <CapacitorBottomControls
        selectedMaterialId={selectedMaterialId}
        onMaterialChange={setSelectedMaterialId}
        insertionFraction={insertionFraction}
        onInsertionChange={setInsertionFraction}
        plateDistanceMm={plateDistanceMm}
        onDistanceChange={setPlateDistanceMm}
        plateAreaMm2={plateAreaMm2}
        onAreaChange={setPlateAreaMm2}
        showVoltmeter={showVoltmeter}
        onToggleVoltmeter={() => setShowVoltmeter(!showVoltmeter)}
        showFieldMeter={showFieldMeter}
        onToggleFieldMeter={() => setShowFieldMeter(!showFieldMeter)}
      />

      {/* Analizador de Redes Serie / Paralelo (Inferior Derecha - Plegable) */}
      {isNetworkOpen ? (
        <div className="absolute bottom-4 right-4 z-20 w-72 bg-white/95 backdrop-blur-md p-3 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#231F1C] space-y-2">
          <div className="flex items-center justify-between border-b border-[#E2D9CC] pb-1.5">
            <span className="font-bold text-cyan-800 flex items-center gap-1.5">
              <GitMerge className="w-3.5 h-3.5" /> Red Serie / Paralelo
            </span>
            <button
              onClick={() => setIsNetworkOpen(false)}
              className="p-0.5 text-[#5C554E] hover:text-[#231F1C] rounded cursor-pointer"
              title="Minimizar red de capacitores"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-1 bg-[#F4EFE6] p-1 rounded-lg border border-[#DDD5C8]">
            <button
              onClick={() => setNetworkTopology('series')}
              className={`py-1 rounded text-[11px] font-semibold cursor-pointer transition-all ${
                networkTopology === 'series'
                  ? 'bg-[#2D7A64] text-white shadow-sm'
                  : 'text-[#5C554E] hover:text-[#231F1C]'
              }`}
            >
              En Serie
            </button>
            <button
              onClick={() => setNetworkTopology('parallel')}
              className={`py-1 rounded text-[11px] font-semibold cursor-pointer transition-all ${
                networkTopology === 'parallel'
                  ? 'bg-[#2D7A64] text-white shadow-sm'
                  : 'text-[#5C554E] hover:text-[#231F1C]'
              }`}
            >
              En Paralelo
            </button>
          </div>

          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between font-mono">
              <span className="text-[#5C554E]">C₁ (placas):</span>
              <span className="font-bold text-cyan-800">{physics.capacitancePF.toFixed(2)} pF</span>
            </div>
            <div className="flex justify-between items-center font-mono">
              <span className="text-[#5C554E]">C₂ auxiliar:</span>
              <span className="font-bold text-indigo-700">{c2PF.toFixed(2)} pF</span>
            </div>
            <input
              type="range"
              min="0.2"
              max="5.0"
              step="0.2"
              value={c2PF}
              onChange={(e) => setC2PF(parseFloat(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
          </div>

          <div className="bg-[#FAF7F2] p-2 rounded-lg border border-[#E2D9CC] font-mono text-[11px] space-y-1">
            <div className="flex justify-between">
              <span className="text-[#5C554E]">C_eq total:</span>
              <span className="font-bold text-[#2D7A64]">{networkStats.equivalentCPF.toFixed(2)} pF</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C554E]">V₁ / V₂:</span>
              <span className="font-semibold text-amber-700">
                {networkStats.v1.toFixed(2)}V / {networkStats.v2.toFixed(2)}V
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C554E]">Q₁ / Q₂:</span>
              <span className="font-semibold text-rose-700">
                {networkStats.q1PC.toFixed(2)} / {networkStats.q2PC.toFixed(2)} pC
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#5C554E]">Energía U_red:</span>
              <span className="font-semibold text-[#231F1C]">{networkStats.totalEnergyPJ.toFixed(2)} pJ</span>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsNetworkOpen(true)}
          className="absolute bottom-4 right-4 z-20 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-cyan-800 font-semibold hover:bg-[#EDE8DF] transition-colors cursor-pointer"
          title="Abrir calculadora interactiva de capacitores en Serie y Paralelo"
        >
          <GitMerge className="w-3.5 h-3.5" />
          <span>Red Serie / Paralelo</span>
          <ChevronUp className="w-3.5 h-3.5 text-[#6B6560]" />
        </button>
      )}

      <canvas
        ref={canvasRef}
        tabIndex={0}
        aria-label="Lienzo interactivo de Capacitancia y Dieléctricos"
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
export default CapacitorLabCanvas;
