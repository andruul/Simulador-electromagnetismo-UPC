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
  isExpanded: boolean;
  onToggle: () => void;
}

/**
 * Panel HUD superior derecho de la Sala 5 (Dinámica de Lorentz 3D).
 * Documenta explícitamente el sistema SI normalizado (q/m = ±1.00 C/kg) del integrador de Boris.
 */
export const LorentzTelemetryHud: React.FC<LorentzTelemetryProps> = ({
  viewMode,
  telemetry,
  bFieldZ,
  isExpanded,
  onToggle
}) => {
  return (
    <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-md rounded-xl border border-[#D5CEC6] shadow-md text-xs z-10 transition-all max-w-[calc(100%-2rem)]">
      <div
        className="flex items-center justify-between p-2.5 border-b border-[#E0D8CF] gap-3 cursor-pointer select-none"
        onClick={onToggle}
      >
        <div className="flex items-center gap-1.5 font-bold text-sky-800">
          <Compass className="w-4 h-4" />
          <span>DINÁMICA DE LORENTZ</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#5C554E] font-mono hidden sm:inline">Boris Pusher 3D</span>
          <button
            className="p-0.5 text-[#5C554E] hover:text-[#231F1C] rounded"
            title={isExpanded ? 'Minimizar HUD' : 'Expandir HUD'}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-3.5 w-72 max-w-full">
          {viewMode === 'explore' ? (
            <div className="space-y-1.5 text-[11px] text-[#231F1C]">
              <div className="flex justify-between items-center">
                <span className="text-[#5C554E]">Rapidez:</span>
                <span className="text-[#2D7A64] font-semibold">
                  {telemetry.speed > 3.5 ? 'Muy Rápida ⚡' : telemetry.speed > 1 ? 'Moderada' : 'Lenta'} (
                  {telemetry.speed.toFixed(1)} m/s)
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5C554E]">Fuerza Magnética:</span>
                <span className="text-amber-700 font-semibold">
                  {telemetry.force > 4 ? 'Curva Fuerte' : 'Curva Suave'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#5C554E]">Órbita (Radio):</span>
                <span className="text-indigo-700 font-semibold">
                  {telemetry.larmorRadius > 0
                    ? telemetry.larmorRadius < 2
                      ? 'Espiral Estrecha'
                      : 'Giro Amplio'
                    : 'Línea Recta'}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-[#E2D9CC] pt-1 text-[10px]">
                <span className="text-[#5C554E]">Comportamiento:</span>
                <span className="text-[#2B6CB0] font-semibold">
                  {Math.abs(bFieldZ) > 0 ? 'Giro Orbital Conservativo' : 'Vuelo Libre'}
                </span>
              </div>
            </div>
          ) : (
            <div className="space-y-1.5 font-mono text-[11px] text-[#231F1C]">
              <div className="flex justify-between text-[10px] pb-1 border-b border-[#E2D9CC]">
                <span className="text-[#5C554E]">Escala SI (|q|/m):</span>
                <span className="text-[#231F1C] font-bold">1.00 C/kg (q=±1C, m=1kg)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E]">Rapidez |v|:</span>
                <span className="text-[#2D7A64] font-bold">{telemetry.speed.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E]">Fuerza Lorentz |F|:</span>
                <span className="text-amber-700 font-bold">{telemetry.force.toFixed(2)} N</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E]">Energía Cinética:</span>
                <span className="text-[#2B6CB0] font-semibold">{telemetry.kineticEnergy.toFixed(2)} J</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E]">Radio de Larmor (r_L):</span>
                <span className="text-indigo-700 font-semibold">{telemetry.larmorRadius.toFixed(2)} m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#5C554E]">Frecuencia Ciclotrón:</span>
                <span className="text-purple-700 font-semibold">{telemetry.cyclotronFreq.toFixed(2)} Hz</span>
              </div>
              <div className="flex justify-between border-t border-[#E2D9CC] pt-1 text-[10px]">
                <span className="text-[#5C554E]">Posición (x, y, z):</span>
                <span className="text-[#231F1C] font-medium">
                  ({telemetry.pos.x.toFixed(1)}, {telemetry.pos.y.toFixed(1)}, {telemetry.pos.z.toFixed(1)})
                </span>
              </div>
            </div>
          )}

          <div className="border-t border-[#E2D9CC] mt-2.5 pt-2 grid grid-cols-2 gap-1 text-[10px] font-medium">
            <span className="flex items-center gap-1 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" /> Vector v (Velocidad)
            </span>
            <span className="flex items-center gap-1 text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-600 inline-block" /> Vector F (Lorentz)
            </span>
            <span className="flex items-center gap-1 text-teal-700">
              <span className="w-2 h-2 rounded-full bg-teal-600 inline-block" /> Campo B (Magnético)
            </span>
            <span className="flex items-center gap-1 text-rose-700">
              <span className="w-2 h-2 rounded-full bg-rose-600 inline-block" /> Campo E (Eléctrico)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
