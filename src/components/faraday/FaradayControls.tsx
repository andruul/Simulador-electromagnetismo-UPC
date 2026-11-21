import React, { useState } from 'react';
import { ArrowRightLeft, Repeat, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { OutputDevice } from './faradayRenderer';

interface MagnetControlsProps {
  isOscillating: boolean;
  onFlipPoles: () => void;
  onToggleOscillation: () => void;
}

/** Top-right panel: flip the magnet poles and toggle automatic oscillation. */
export const FaradayMagnetControls: React.FC<MagnetControlsProps> = ({
  isOscillating,
  onFlipPoles,
  onToggleOscillation
}) => (
  <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700/70 shadow-2xl">
    <button
      onClick={onFlipPoles}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium cursor-pointer transition-all border border-slate-700"
      title="Invertir Polos N/S del Imán"
    >
      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-400" />
      <span>Invertir Polos</span>
    </button>

    <button
      onClick={onToggleOscillation}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
        isOscillating
          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
          : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30'
      }`}
    >
      <Repeat className={`w-3.5 h-3.5 ${isOscillating ? 'animate-spin' : ''}`} />
      <span>{isOscillating ? 'Detener Oscilación' : 'Oscilar Imán'}</span>
    </button>
  </div>
);

interface BottomControlsProps {
  coilTurns: number;
  onCoilTurnsChange: (turns: number) => void;
  outputDevice: OutputDevice;
  onOutputDeviceChange: (device: OutputDevice) => void;
}

const COIL_TURN_OPTIONS = [1, 2, 3, 4];

const OUTPUT_DEVICE_OPTIONS: { id: OutputDevice; label: string }[] = [
  { id: 'both', label: 'Ambos' },
  { id: 'galvanometer', label: 'Galvanómetro' },
  { id: 'lightbulb', label: 'Bombilla' }
];

/** Bottom bar: number of coil turns, connected load and academic hint (collapsible). */
export const FaradayBottomControls: React.FC<BottomControlsProps> = ({
  coilTurns,
  onCoilTurnsChange,
  outputDevice,
  onOutputDeviceChange
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-2xl text-xs text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        title="Expandir controles de bobina"
      >
        <Zap className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-slate-300">Controles de Bobina & Carga</span>
        <span className="text-[10px] text-slate-400 font-mono">(N = {coilTurns})</span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] z-20 flex flex-wrap items-center gap-3 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/70 shadow-2xl">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-slate-300">Espiras (N):</span>
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
          {COIL_TURN_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onCoilTurnsChange(n)}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                coilTurns === n ? 'bg-amber-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              N = {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-slate-800 pl-3 text-xs text-slate-300">
        <span className="text-[11px]">Carga:</span>
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800">
          {OUTPUT_DEVICE_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onOutputDeviceChange(id)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all text-[11px] ${
                outputDevice === id ? 'bg-indigo-600 text-white font-bold shadow' : 'text-slate-400'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(false)}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-1"
        title="Minimizar controles de bobina"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
