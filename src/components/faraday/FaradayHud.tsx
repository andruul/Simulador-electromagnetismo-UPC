import React, { useState } from 'react';
import type { ViewMode } from '../../types';
import type { InstantValues } from './useFaradaySimulation';
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
        className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-lg text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        title="Expandir telemetría de Faraday"
      >
        <span className={`w-2 h-2 rounded-full ${inducing ? 'bg-rose-400 animate-pulse' : 'bg-purple-400'}`} />
        <span className="font-bold text-purple-600">Faraday:</span>
        <span className="font-mono text-[#2D2A26] tabular-nums">ε = {values.emf.toFixed(2)} V</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-white/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-xl max-w-[calc(100%-14rem)]">
      <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-4">
        <div className="w-7 h-7 rounded-lg bg-purple-100 border border-purple-300/60 flex items-center justify-center text-purple-600 font-bold">
          ε
        </div>
        <div>
          <div className="text-xs font-bold text-[#2D2A26] tracking-wide">LEY DE FARADAY & LENZ</div>
          <div className="text-[11px] font-mono text-purple-600">
            ε = −N (dΦ_B / dt) &nbsp;|&nbsp; P = I²·R
          </div>
        </div>
      </div>

      {viewMode === 'explore' ? (
        <ExploreReadings values={values} coilTurns={coilTurns} inducing={inducing} />
      ) : (
        <MeasurementReadings values={values} inducing={inducing} />
      )}

      <button
        onClick={() => setIsOpen(false)}
        className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-auto"
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
  <div className="flex items-center gap-3 text-xs">
    <span
      className={`px-2 py-0.5 rounded border font-medium ${
        inducing
          ? 'bg-rose-100 border-rose-300/60 text-rose-700 animate-pulse'
          : 'bg-[#EDE8DF] border-[#D5CEC6] text-[#6B6560]'
      }`}
    >
      Inducción: {inducing ? '⚡ ¡Generando Voltaje!' : 'Imán en reposo (FEM = 0)'}
    </span>
    <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300/60 text-amber-700 font-medium">
      Bombilla:{' '}
      {values.bulbPower > BULB_BRIGHT_POWER_W
        ? '💡 Encendida'
        : values.bulbPower > BULB_DIM_POWER_W
          ? '✨ Tenue'
          : 'Apagada'}
    </span>
    <span className="px-2 py-0.5 rounded bg-purple-100 border border-purple-300/60 text-purple-700 font-medium">
      N = {coilTurns}
    </span>
  </div>
);

const Reading: React.FC<{ label: string; valueClass: string; children: React.ReactNode; first?: boolean }> = ({
  label,
  valueClass,
  children,
  first = false
}) => (
  <div className={first ? undefined : 'border-l border-stone-300/60 pl-3'}>
    <span className="text-stone-500 text-[11px]">{label} </span>
    <span className={`${valueClass} font-bold font-mono tabular-nums inline-block min-w-[4rem] text-right`}>{children}</span>
  </div>
);

const MeasurementReadings: React.FC<{ values: InstantValues; inducing: boolean }> = ({
  values,
  inducing
}) => (
  <div className="flex items-center gap-4 text-xs font-mono">
    <Reading first label="Flujo Φ_B:" valueClass="text-sky-400">
      {(values.flux * 1000).toFixed(2)} mWb
    </Reading>
    <Reading label="dΦ_B/dt:" valueClass="text-indigo-300">
      {values.dFluxDt.toFixed(3)} Wb/s
    </Reading>
    <Reading label="FEM ε:" valueClass={inducing ? 'text-rose-400' : 'text-slate-300'}>
      {values.emf.toFixed(3)} V
    </Reading>
    <Reading label="I:" valueClass="text-emerald-400">
      {(values.current * 1000).toFixed(1)} mA
    </Reading>
  </div>
);
