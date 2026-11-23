import React, { useState } from 'react';
import type { ViewMode } from '../../tipos';
import type { InstantValues } from './useSimulacionFaraday';
import { ChevronDown, ChevronUp } from 'lucide-react';

/** Bulb power thresholds (W) for the qualitative "bright" / "dim" labels. */
const BULB_BRIGHT_POWER_W = 0.0001;
const BULB_DIM_POWER_W = 0.00001;

interface FaradayHudProps {
  viewMode: ViewMode;
  values: InstantValues;
  coilTurns: number;
}

/** Top-left panel: law of the laboratory and real-time physical readings (collapsible). */
export const FaradayHud: React.FC<FaradayHudProps> = ({ viewMode, values, coilTurns }) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const inducing = Math.abs(values.emf) > 0.05;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        title="Expandir telemetría de Faraday"
      >
        <span className={`w-2 h-2 rounded-full ${inducing ? 'bg-rose-500 animate-pulse' : 'bg-purple-500'}`} />
        <span className="font-bold text-purple-700">Faraday:</span>
        <span className="font-mono text-[#2D2A26] tabular-nums font-semibold">ε = {values.emf.toFixed(2)} V</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-4 z-20 flex items-center justify-between gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md w-[770px] max-w-[calc(100vw-22rem)]">
      <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-4 flex-shrink-0">
        <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-300/60 flex items-center justify-center text-purple-700 font-bold">
          ε
        </div>
        <div>
          <div className="text-xs font-bold text-[#2D2A26] tracking-wide">LEY DE FARADAY & LENZ</div>
          <div className="text-[11px] font-mono text-purple-700 font-medium">
            ε = −N (dΦ_B / dt) &nbsp;|&nbsp; P = I²·R
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center min-w-0">
        {viewMode === 'explore' ? (
          <ExploreReadings values={values} coilTurns={coilTurns} inducing={inducing} />
        ) : (
          <MeasurementReadings values={values} inducing={inducing} />
        )}
      </div>

      <button
        onClick={() => setIsOpen(false)}
        className="p-1.5 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded-lg transition-colors cursor-pointer flex-shrink-0 ml-2"
        title="Minimizar telemetría"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const ExploreReadings: React.FC<{ values: InstantValues; coilTurns: number; inducing: boolean }> = ({
  values,
  coilTurns,
  inducing
}) => (
  <div className="flex items-center gap-2 text-xs">
    <span
      className={`w-[180px] text-center px-2 py-0.5 rounded border font-medium truncate ${
        inducing
          ? 'bg-rose-100 border-rose-300 text-rose-700 font-bold'
          : 'bg-[#EDE8DF] border-[#D5CEC6] text-[#6B6560]'
      }`}
    >
      {inducing ? '⚡ ¡Generando Voltaje!' : 'Imán en reposo (FEM = 0)'}
    </span>
    <span className="w-[120px] text-center px-2 py-0.5 rounded bg-amber-100 border border-amber-300/60 text-amber-800 font-medium truncate">
      {values.bulbPower > BULB_BRIGHT_POWER_W
        ? '💡 Bombilla Alta'
        : values.bulbPower > BULB_DIM_POWER_W
          ? '✨ Bombilla Tenue'
          : 'Bombilla Apagada'}
    </span>
    <span className="w-[60px] text-center px-2 py-0.5 rounded bg-purple-100 border border-purple-300/60 text-purple-800 font-medium font-mono">
      N = {coilTurns}
    </span>
  </div>
);

const MeasurementReadings: React.FC<{ values: InstantValues; inducing: boolean }> = ({
  values,
  inducing
}) => (
  <div className="flex items-center gap-3 text-xs font-mono">
    <div className="w-[115px] tabular-nums">
      <span className="text-[#6B6560]">Φ_B: </span>
      <span className="text-sky-700 font-bold inline-block w-[65px] text-right">
        {(values.flux * 1000).toFixed(2)} mWb
      </span>
    </div>
    <div className="border-l border-[#E0D8CF] pl-2.5 w-[135px] tabular-nums">
      <span className="text-[#6B6560]">dΦ/dt: </span>
      <span className="text-indigo-700 font-bold inline-block w-[75px] text-right">
        {values.dFluxDt.toFixed(3)} Wb/s
      </span>
    </div>
    <div className="border-l border-[#E0D8CF] pl-2.5 w-[115px] tabular-nums">
      <span className="text-[#6B6560]">ε: </span>
      <span className={`${inducing ? 'text-rose-700' : 'text-[#4A4540]'} font-bold inline-block w-[65px] text-right`}>
        {values.emf.toFixed(3)} V
      </span>
    </div>
    <div className="border-l border-[#E0D8CF] pl-2.5 w-[95px] tabular-nums">
      <span className="text-[#6B6560]">I: </span>
      <span className="text-[#3D7A69] font-bold inline-block w-[60px] text-right">
        {(values.current * 1000).toFixed(1)} mA
      </span>
    </div>
  </div>
);
