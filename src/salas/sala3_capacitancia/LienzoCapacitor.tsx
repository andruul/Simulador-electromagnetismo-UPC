import React, { useEffect, useMemo, useRef, useState } from 'react';
import type { ViewMode } from '../../types';
import { DIELECTRIC_MATERIALS, computeCapacitorState } from '../../physics/capacitance';
import { useElementSize } from '../../hooks/useElementSize';
import { usePresetRequest } from '../../hooks/usePresetRequest';
import { CapacitorHud } from './TelemetriaCapacitor';
import { CapacitorBatteryControls, CapacitorBottomControls } from './ControlesCapacitor';
import {
  computeCapacitorLayout,
  measureProbeField,
  measureProbeVoltage,
  type Point
} from './diseñoCapacitor';
import { drawCapacitorScene } from './renderizadorCapacitor';

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

  // Capacitor parameters
  const [plateAreaMm2, setPlateAreaMm2] = useState<number>(200); // 100 to 400 mm²
  const [plateDistanceMm, setPlateDistanceMm] = useState<number>(5.0); // 2.0 to 10.0 mm
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('teflon');
  const [customKappa] = useState<number>(2.1);
  const [insertionFraction, setInsertionFraction] = useState<number>(0.8); // 0.0 to 1.0

  // Battery state
  const [connectedToBattery, setConnectedToBattery] = useState<boolean>(true);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(1.5); // Volts (-3.0 to +3.0)
  const [trappedCharge, setTrappedCharge] = useState<number>(0);

  // Instruments
  const [showVoltmeter, setShowVoltmeter] = useState<boolean>(true);
  const [showFieldMeter, setShowFieldMeter] = useState<boolean>(true);

  // Probe positions (in canvas coordinates)
  const [redProbePos, setRedProbePos] = useState<Point>({ x: 340, y: 190 });
  const [blackProbePos, setBlackProbePos] = useState<Point>({ x: 340, y: 390 });
  const [fieldProbePos, setFieldProbePos] = useState<Point>({ x: 420, y: 290 });

  // Dragging state
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });

  // Material selection
  const currentMaterial = useMemo(
    () => DIELECTRIC_MATERIALS.find((m) => m.id === selectedMaterialId) || DIELECTRIC_MATERIALS[0],
    [selectedMaterialId]
  );
  const activeKappa = selectedMaterialId === 'custom' ? customKappa : currentMaterial.kappa;

  // Toggle battery connection
  const toggleBattery = () => {
    if (connectedToBattery) {
      // Disconnecting: save current charge so Q stays constant!
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

  // Physics state
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

  // Handle 1-click presets from LeftGuidePanel or Search
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

  // Layout geometry and probe readings
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

  // Render the scene whenever anything visible changes
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

  // Mouse event handlers for interactive probes and dielectric
  const canvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): Point | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(e);
    if (!point) return;
    const { x: mx, y: my } = point;
    const { slabX, slabY, slabWidthPx, slabHeightPx } = layout;

    if (showVoltmeter && Math.hypot(mx - redProbePos.x, my - redProbePos.y) < 20) {
      setDragTarget('redProbe');
      setDragOffset({ x: mx - redProbePos.x, y: my - redProbePos.y });
    } else if (showVoltmeter && Math.hypot(mx - blackProbePos.x, my - blackProbePos.y) < 20) {
      setDragTarget('blackProbe');
      setDragOffset({ x: mx - blackProbePos.x, y: my - blackProbePos.y });
    } else if (showFieldMeter && Math.hypot(mx - fieldProbePos.x, my - fieldProbePos.y) < 24) {
      setDragTarget('fieldProbe');
      setDragOffset({ x: mx - fieldProbePos.x, y: my - fieldProbePos.y });
    } else if (mx >= slabX && mx <= slabX + slabWidthPx && my >= slabY && my <= slabY + slabHeightPx) {
      setDragTarget('dielectric');
      setDragOffset({ x: mx - slabX, y: my - slabY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
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
      // slabX = plateLeftX + (1 - frac) * plateWidthPx  =>  frac = 1 - (slabX - plateLeftX) / plateWidthPx
      const rawFrac = 1 - (target.x - layout.plateLeftX) / layout.plateWidthPx;
      setInsertionFraction(Math.max(0, Math.min(1, rawFrac)));
    }
  };

  const handleMouseUp = () => {
    setDragTarget(null);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-slate-950 select-none overflow-hidden">
      <CapacitorHud
        viewMode={viewMode}
        physics={physics}
        connectedToBattery={connectedToBattery}
        material={currentMaterial}
        insertionFraction={insertionFraction}
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
export default CapacitorLabCanvas;
