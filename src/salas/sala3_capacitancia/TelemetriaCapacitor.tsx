import React, { useState } from 'react';
import {
  calculateKirchhoffFringingFactor,
  type CapacitorPhysicsResult
} from '../../fisica/capacitancia';
import type { DielectricMaterial, ViewMode } from '../../tipos';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CapacitorHudProps {
  viewMode: ViewMode;
  physics: CapacitorPhysicsResult;
  connectedToBattery: boolean;
  material: DielectricMaterial;
  insertionFraction: number;
  plateAreaMm2?: number;
  plateDistanceMm?: number;
}

/** Panel superior izquierdo: ecuaciones del condensador, lecturas ideales y corrección de borde de Kirchhoff. */
export const CapacitorHud: React.FC<CapacitorHudProps> = ({
  viewMode,
  physics,
  connectedToBattery,
  material,
  insertionFraction,
  plateAreaMm2 = 200,
  plateDistanceMm = 5
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);
  const fringingFactor = calculateKirchhoffFringingFactor(
    plateAreaMm2 * 1e-6,
    plateDistanceMm * 1e-3
  );
  const realCapacitancePF = physics.capacitancePF * fringingFactor;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#231F1C] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        title="Expandir telemetría de capacitancia"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-600" />
        <span className="font-bold text-cyan-800">Capacitor:</span>
        <span className="font-mono font-semibold">{physics.capacitancePF.toFixed(2)} pF</span>
        <span className="text-[#A89E94]">•</span>
        <span className="font-mono text-amber-700 font-semibold">{physics.voltage.toFixed(1)} V</span>
        <ChevronDown className="w-3.5 h-3.5 text-[#6B6560]" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md max-w-[calc(100%-12rem)]">
      <div className="flex items-center gap-2 border-r border-[#E0D8CF] pr-4">
        <div className="w-7 h-7 rounded-lg bg-cyan-100 border border-cyan-300/60 flex items-center justify-center text-cyan-800 font-bold">
          C
        </div>
        <div>
          <div className="text-xs font-bold text-[#231F1C] tracking-wide">LABORATORIO DE CAPACITANCIA</div>
          <div className="text-[11px] font-mono text-cyan-800 font-semibold">
            C = κ ε₀ A / d &nbsp;|&nbsp; Q = C·V &nbsp;|&nbsp; U = ½ C·V²
          </div>
        </div>
      </div>

      {viewMode === 'explore' ? (
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-cyan-100 border border-cyan-300 text-cyan-800 font-medium">
            Capacitancia:{' '}
            {physics.capacitancePF > 1.2 ? '⚡ Alta' : physics.capacitancePF > 0.5 ? '🔹 Media' : '🔸 Baja'} (
            {physics.capacitancePF.toFixed(1)} pF)
          </span>
          <span className="px-2 py-0.5 rounded bg-[#E6F2EE] border border-[#B3D9CC] text-[#2D7A64] font-medium">
            {connectedToBattery ? '🔋 Batería Activa' : '🔒 Carga Atrapada'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-100 border border-amber-300/60 text-amber-800 font-medium">
            {material.name} ({Math.round(insertionFraction * 100)}%)
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3.5 text-xs font-mono">
          <Reading first label="C ideal:" valueClass="text-cyan-800">
            {physics.capacitancePF.toFixed(2)} pF
          </Reading>
          <Reading label="C Kirchhoff:" valueClass="text-indigo-700">
            {realCapacitancePF.toFixed(2)} pF
          </Reading>
          <Reading label="Carga Q:" valueClass="text-rose-700">
            {physics.storedChargePC.toFixed(2)} pC
          </Reading>
          <Reading label="Voltaje V:" valueClass="text-amber-700">
            {physics.voltage.toFixed(2)} V
          </Reading>
          <Reading label="Energía U:" valueClass="text-[#2D7A64]">
            {physics.storedEnergyPJ.toFixed(2)} pJ
          </Reading>
          <Reading label="Campo E:" valueClass="text-purple-700">
            {physics.electricFieldKVm.toFixed(2)} kV/m
          </Reading>
        </div>
      )}

      <button
        onClick={() => setIsOpen(false)}
        className="p-1 text-[#6B6560] hover:text-[#231F1C] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-auto"
        title="Minimizar telemetría"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const Reading: React.FC<{
  label: string;
  valueClass: string;
  children: React.ReactNode;
  first?: boolean;
}> = ({ label, valueClass, children, first = false }) => (
  <div className={first ? undefined : 'border-l border-[#E0D8CF] pl-3'}>
    <span className="text-[#5C554E]">{label} </span>
    <span className={`${valueClass} font-bold`}>{children}</span>
  </div>
);
