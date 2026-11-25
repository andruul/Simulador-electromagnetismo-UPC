import React, { useMemo, useRef, useState } from 'react';
import type { Vector2D, ViewMode } from '../../tipos';
import type { BarMagnet, InductionCoil } from '../../fisica/faraday';
import { useElementSize } from '../../ganchos/useDimensionElemento';
import { usePresetRequest } from '../../ganchos/usePeticionPreset';
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

const PIXELS_PER_METER = 750;
const COIL_RADIUS_M = 0.07;
const COIL_X_M = 0.08;
const COIL_RESISTANCE_PER_TURN_OHM = 0.8;
const OSCILLATION_FREQ_HZ = 1.2;
const OSCILLATION_AMPLITUDE_M = 0.22;

const INITIAL_MAGNET: BarMagnet = {
  x: -0.22,
  y: 0,
  length: 0.18,
  width: 0.05,
  angle: 0,
  poleStrength: 1800
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
  const [coilTurns, setCoilTurns] = useState<number>(3);
  const [isOscillating, setIsOscillating] = useState<boolean>(false);
  const [outputDevice, setOutputDevice] = useState<OutputDevice>('both');

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

  // PointerEvents universales (ratón, táctil y lápiz óptico)
  const canvasPoint = (e: React.PointerEvent<HTMLCanvasElement>): { x: number; y: number } | null => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return null;
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    canvasRef.current?.focus();
    const point = canvasPoint(e);
    if (!point) return;
    const mPos = toMeters(viewport, point.x, point.y);

    const { px, py } = toPixels(viewport, magnet.x, magnet.y);
    const magWpx = magnet.length * PIXELS_PER_METER;
    const magHpx = magnet.width * PIXELS_PER_METER;

    if (Math.abs(point.x - px) < magWpx / 2 + 16 && Math.abs(point.y - py) < magHpx / 2 + 16) {
      e.currentTarget.setPointerCapture(e.pointerId);
      setIsDraggingMagnet(true);
      setIsOscillating(false);
      setDragOffset({ x: mPos.mx - magnet.x, y: mPos.my - magnet.y });
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDraggingMagnet) return;
    const point = canvasPoint(e);
    if (!point) return;
    const mPos = toMeters(viewport, point.x, point.y);
    setMagnet((m) => ({ ...m, x: mPos.mx - dragOffset.x, y: mPos.my - dragOffset.y }));
  };

  const handlePointerUp = () => setIsDraggingMagnet(false);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLCanvasElement>) => {
    const step = e.shiftKey ? 0.04 : 0.015;
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setIsOscillating(false);
      setMagnet((m) => ({ ...m, x: m.x - step }));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setIsOscillating(false);
      setMagnet((m) => ({ ...m, x: m.x + step }));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIsOscillating(false);
      setMagnet((m) => ({ ...m, y: m.y - step }));
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIsOscillating(false);
      setMagnet((m) => ({ ...m, y: m.y + step }));
    }
  };

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-[#FAF7F2] select-none overflow-hidden">
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
        tabIndex={0}
        aria-label="Lienzo interactivo de Inducción de Faraday y Lenz"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        className="w-full h-full cursor-grab active:cursor-grabbing touch-none focus:outline-none"
      />
    </div>
  );
};
export default FaradayInductionCanvas;
