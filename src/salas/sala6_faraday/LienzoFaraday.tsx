import React, { useMemo, useRef, useState } from 'react';
import type { Vector2D, ViewMode } from '../../types';
import type { BarMagnet, InductionCoil } from '../../physics/faraday';
import { useElementSize } from '../../hooks/useElementSize';
import { usePresetRequest } from '../../hooks/usePresetRequest';
import { FaradayHud } from './TelemetriaFaraday';
import { FaradayBottomControls, FaradayMagnetControls } from './ControlesFaraday';
import {
  createViewport,
  toMeters,
  toPixels,
  type OutputDevice
} from './renderizadorFaraday';
import { useFaradaySimulation } from './useSimulacionFaraday';

export interface FaradayInductionCanvasProps {
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
}

/** Scale of the scene: 1 meter = 750 px. */
const PIXELS_PER_METER = 750;
const COIL_RADIUS_M = 0.07; // 7 cm
const COIL_X_M = 0.08; // coil center 8 cm to the right of the origin
const COIL_RESISTANCE_PER_TURN_OHM = 0.8;
const OSCILLATION_FREQ_HZ = 1.2;
const OSCILLATION_AMPLITUDE_M = 0.22;

const INITIAL_MAGNET: BarMagnet = {
  x: -0.22, // center in meters
  y: 0,
  length: 0.18, // 18 cm
  width: 0.05, // 5 cm
  angle: 0, // radians (0 = North to right, South to left)
  poleStrength: 1800 // A·m
};

export const FaradayInductionCanvas: React.FC<FaradayInductionCanvasProps> = ({
  presetRequest,
  onPresetHandled,
  viewMode = 'explore'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const dimensions = useElementSize(containerRef, { width: 900, height: 650 });
  const viewport = useMemo(
    () => createViewport(dimensions.width, dimensions.height, PIXELS_PER_METER),
    [dimensions.width, dimensions.height]
  );

  const [magnet, setMagnet] = useState<BarMagnet>(INITIAL_MAGNET);
  const [coilTurns, setCoilTurns] = useState<number>(3); // 1 to 4 turns
  const [isOscillating, setIsOscillating] = useState<boolean>(false);
  const [outputDevice, setOutputDevice] = useState<OutputDevice>('both');

  // Dragging state
  const [isDraggingMagnet, setIsDraggingMagnet] = useState<boolean>(false);
  const [dragOffset, setDragOffset] = useState<Vector2D>({ x: 0, y: 0 });

  const coil: InductionCoil = useMemo(
    () => ({
      x: COIL_X_M,
      y: 0,
      radius: COIL_RADIUS_M,
      turns: coilTurns,
      resistancePerTurn: COIL_RESISTANCE_PER_TURN_OHM,
      normal: { x: 1, y: 0 }
    }),
    [coilTurns]
  );

  const flipPoles = () => {
    setMagnet((m) => ({ ...m, angle: m.angle + Math.PI }));
  };

  // Handle 1-click presets from LeftGuidePanel or Search
  usePresetRequest(presetRequest, onPresetHandled, (preset) => {
    if (preset === 'oscillate') {
      setIsOscillating(true);
    } else if (preset === 'fast_in') {
      setIsOscillating(false);
      setMagnet((m) => ({ ...m, x: 0.06, y: 0, angle: 0 }));
    } else if (preset === 'slow_pass') {
      setIsOscillating(false);
      setMagnet((m) => ({ ...m, x: -0.22, y: 0, angle: 0 }));
    } else if (preset === 'flip_poles') {
      flipPoles();
    }
  });

  // Physics + rendering loop
  const instantValues = useFaradaySimulation({
    canvasRef,
    viewport,
    magnet,
    setMagnet,
    coil,
    isOscillating,
    oscillationFreq: OSCILLATION_FREQ_HZ,
    oscillationAmp: OSCILLATION_AMPLITUDE_M,
    outputDevice
  });

  // Mouse drag handlers
  const canvasPoint = (e: React.MouseEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const point = canvasPoint(e);
    if (!point) return;
    const mPos = toMeters(viewport, point.x, point.y);

    // Check if clicked inside bar magnet
    const { px, py } = toPixels(viewport, magnet.x, magnet.y);
    const magWpx = magnet.length * PIXELS_PER_METER;
    const magHpx = magnet.width * PIXELS_PER_METER;

    if (Math.abs(point.x - px) < magWpx / 2 + 10 && Math.abs(point.y - py) < magHpx / 2 + 10) {
      setIsDraggingMagnet(true);
      setIsOscillating(false); // dragging pauses oscillation
      setDragOffset({ x: mPos.mx - magnet.x, y: mPos.my - magnet.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingMagnet) return;
    const point = canvasPoint(e);
    if (!point) return;
    const mPos = toMeters(viewport, point.x, point.y);

    setMagnet((m) => ({ ...m, x: mPos.mx - dragOffset.x, y: mPos.my - dragOffset.y }));
  };

  const handleMouseUp = () => {
    setIsDraggingMagnet(false);
  };

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-slate-950 select-none overflow-hidden">
      <FaradayHud viewMode={viewMode} values={instantValues} coilTurns={coilTurns} />
      <FaradayMagnetControls
        isOscillating={isOscillating}
        onFlipPoles={flipPoles}
        onToggleOscillation={() => setIsOscillating(!isOscillating)}
      />
      <FaradayBottomControls
        coilTurns={coilTurns}
        onCoilTurnsChange={setCoilTurns}
        outputDevice={outputDevice}
        onOutputDeviceChange={setOutputDevice}
      />

      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
export default FaradayInductionCanvas;
