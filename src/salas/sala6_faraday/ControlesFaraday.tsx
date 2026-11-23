import React, { useState } from 'react';
import { ArrowRightLeft, Repeat, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import type { OutputDevice } from './renderizadorFaraday';

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
  <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-[#D5CEC6] shadow-md">
    <button
      onClick={onFlipPoles}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EDE8DF] hover:bg-[#E0D8CF] text-[#4A4540] text-xs font-medium cursor-pointer transition-all border border-[#D5CEC6]"
      title="Invertir Polos N/S del Imán"
    >
      <ArrowRightLeft className="w-3.5 h-3.5 text-sky-600" />
      <span>Invertir Polos</span>
    </button>

    <button
      onClick={onToggleOscillation}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
        isOscillating
          ? 'bg-amber-100 text-amber-800 border border-amber-300 hover:bg-amber-200'
          : 'bg-indigo-100 text-indigo-700 border border-indigo-300/60 hover:bg-indigo-200'
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
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        title="Expandir controles de bobina"
      >
        <Zap className="w-3.5 h-3.5 text-amber-600" />
        <span className="font-semibold text-[#2D2A26]">Controles de Bobina & Carga</span>
        <span className="text-[10px] text-[#6B6560] font-mono">(N = {coilTurns})</span>
        <ChevronUp className="w-3.5 h-3.5 text-[#6B6560] ml-1" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md">
      <div className="flex items-center gap-2">
        <Zap className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-semibold text-[#2D2A26]">Espiras (N):</span>
        <div className="flex items-center bg-[#EDE8DF] p-1 rounded-lg border border-[#D5CEC6] text-xs">
          {COIL_TURN_OPTIONS.map((n) => (
            <button
              key={n}
              onClick={() => onCoilTurnsChange(n)}
              className={`px-2.5 py-0.5 rounded cursor-pointer transition-all ${
                coilTurns === n ? 'bg-amber-400 text-[#2D2A26] font-bold shadow-sm' : 'text-[#6B6560] hover:text-[#2D2A26]'
              }`}
            >
              N = {n}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 border-l border-[#E0D8CF] pl-3 text-xs text-[#2D2A26]">
        <span className="text-[11px] text-[#6B6560]">Carga:</span>
        <div className="flex items-center bg-[#EDE8DF] p-1 rounded-lg border border-[#D5CEC6]">
          {OUTPUT_DEVICE_OPTIONS.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => onOutputDeviceChange(id)}
              className={`px-2 py-0.5 rounded cursor-pointer transition-all text-[11px] ${
                outputDevice === id ? 'bg-indigo-500 text-white font-bold shadow-sm' : 'text-[#6B6560] hover:text-[#2D2A26]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => setIsOpen(false)}
        className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-1"
        title="Minimizar controles de bobina"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
