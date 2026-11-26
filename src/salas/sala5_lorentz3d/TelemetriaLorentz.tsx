import React from 'react';
import type { Vector3D, ViewMode } from '../../tipos';
import { Compass, ChevronDown, ChevronUp } from 'lucide-react';

export interface LorentzTelemetryData {
  speed: number;
  force: number;
  kineticEnergy: number;
  larmorRadius: number;
  cyclotronFreq: number;
  pos: Vector3D;
}

interface LorentzTelemetryProps {
  viewMode: ViewMode;
  telemetry: LorentzTelemetryData;
  bFieldZ: number;
  particleLabel?: string;
  particleCharge?: number;
  particleMass?: number;
  isStudio?: boolean;
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Panel HUD superior derecho de la Sala 5 (Dinámica de Lorentz 3D).
 * Documenta explícitamente el sistema SI (|q|/m) de la partícula seleccionada en el integrador de Boris.
 */
export const LorentzTelemetryHud: React.FC<LorentzTelemetryProps> = ({
  viewMode,
  telemetry,
  bFieldZ,
  particleLabel = 'Partícula #1',
  particleCharge = 1.0,
  particleMass = 1.0,
  isStudio = false,
  isExpanded,
  onToggle
}) => {
  const chargeToMass = particleMass > 0 ? Math.abs(particleCharge) / particleMass : 0;
  const chargeSign = particleCharge > 0 ? '+' : '';
  const containerCls = isStudio
    ? 'bg-[#0F1624]/90 border-white/15 text-slate-100 shadow-2xl'
    : 'bg-white/95 border-[#D5CEC6] text-[#231F1C] shadow-md';
  const mutedCls = isStudio ? 'text-slate-400' : 'text-[#5C554E]';
  const dividerCls = isStudio ? 'border-white/10' : 'border-[#E2D9CC]';

  return (
    <div
      className={`backdrop-blur-md rounded-xl border text-xs z-10 transition-all max-w-[calc(100%-2rem)] ${containerCls}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div
        className={`flex items-center justify-between p-2.5 border-b gap-3 cursor-pointer select-none ${dividerCls}`}
        onClick={onToggle}
      >
        <div className={`flex items-center gap-1.5 font-bold ${isStudio ? 'text-sky-400' : 'text-sky-800'}`}>
          <Compass className="w-4 h-4" />
          <span>DINÁMICA DE LORENTZ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-[10px] font-mono hidden sm:inline ${mutedCls}`}>Boris Pusher 3D</span>
          <button
            className={`p-0.5 rounded ${mutedCls}`}
            title={isExpanded ? 'Minimizar HUD' : 'Expandir HUD'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 w-72 max-w-full">
          {viewMode === 'explore' ? (
            <div className="space-y-1.5 text-[11px]">
              <div className="flex justify-between items-center">
                <span className={mutedCls}>Rapidez:</span>
                <span className="text-emerald-500 font-semibold">
                  {telemetry.speed > 3.5 ? 'Muy Rápida ⚡' : telemetry.speed > 1 ? 'Moderada' : 'Lenta'} (
                  {telemetry.speed.toFixed(2)} m/s)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={mutedCls}>Fuerza Magnética:</span>
                <span className="text-amber-500 font-semibold">
                  {telemetry.force > 4 ? 'Curva Fuerte' : 'Curva Suave'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className={mutedCls}>Órbita (Radio):</span>
                <span className="text-indigo-400 font-semibold">
                  {telemetry.larmorRadius > 0
                    ? telemetry.larmorRadius < 2
                      ? 'Espiral Estrecha'
                      : 'Giro Amplio'
                    : 'Línea Recta'}
                </span>
              </div>
              <div className={`flex justify-between items-center border-t pt-1 text-[10px] ${dividerCls}`}>
                <span className={mutedCls}>Comportamiento:</span>
                <span className="text-sky-500 font-semibold">
                  {Math.abs(bFieldZ) > 0 ? 'Giro Orbital Conservativo' : 'Vuelo Libre'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[11px]">
              <div className={`flex justify-between text-[10px] pb-1 border-b ${dividerCls}`}>
                <span className={mutedCls}>{particleLabel} (|q|/m):</span>
                <span className="font-bold">
                  {chargeToMass.toFixed(2)} C/kg ({chargeSign}
                  {particleCharge.toFixed(1)}C, {particleMass.toFixed(1)}kg)
                </span>
              </div>
              <div className="flex justify-between">
                <span className={mutedCls}>Rapidez |v|:</span>
                <span className="text-emerald-500 font-bold">{telemetry.speed.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedCls}>Fuerza Lorentz |F|:</span>
                <span className="text-amber-500 font-bold">{telemetry.force.toFixed(2)} N</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedCls}>Energía Cinética:</span>
                <span className="text-sky-500 font-semibold">{telemetry.kineticEnergy.toFixed(2)} J</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedCls}>Radio de Larmor (r_L):</span>
                <span className="text-indigo-400 font-semibold">{telemetry.larmorRadius.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className={mutedCls}>Frecuencia Ciclotrón:</span>
                <span className="text-purple-400 font-semibold">{telemetry.cyclotronFreq.toFixed(2)} Hz</span>
              </div>
              <div className={`flex justify-between border-t pt-1 text-[10px] ${dividerCls}`}>
                <span className={mutedCls}>Posición (x, y, z):</span>
                <span className="font-medium">
                  ({telemetry.pos.x.toFixed(1)}, {telemetry.pos.y.toFixed(1)}, {telemetry.pos.z.toFixed(1)})
                </span>
              </div>
            </div>
          )}

          <div className={`border-t mt-2.5 pt-2 grid grid-cols-2 gap-1 text-[10px] font-medium ${dividerCls}`}>
            <span className="flex items-center gap-1 text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" /> Vector v (Velocidad)
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" /> Vector F (Lorentz)
            </span>
            <span className="flex items-center gap-1 text-teal-500">
              <span className="w-2 h-2 rounded-full bg-teal-500 inline-block" /> Campo B (Magnético)
            </span>
            <span className="flex items-center gap-1 text-rose-500">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" /> Campo E (Eléctrico)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
