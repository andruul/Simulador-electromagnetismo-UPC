import React, { useState } from 'react';
import type { CapacitorPhysicsResult } from '../../physics/capacitance';
import type { DielectricMaterial, ViewMode } from '../../types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CapacitorHudProps {
  viewMode: ViewMode;
  physics: CapacitorPhysicsResult;
  connectedToBattery: boolean;
  material: DielectricMaterial;
  insertionFraction: number;
}

/** Top-left panel: laws of the laboratory and real-time physical readings (collapsible). */
export const CapacitorHud: React.FC<CapacitorHudProps> = ({
  viewMode,
  physics,
  connectedToBattery,
  material,
  insertionFraction
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute top-3 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-xl text-xs text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        title="Expandir telemetría de capacitancia"
      >
        <span className="w-2 h-2 rounded-full bg-cyan-400" />
        <span className="font-bold text-cyan-400">Capacitor:</span>
        <span className="font-mono text-slate-200 font-semibold">{physics.capacitancePF.toFixed(2)} pF</span>
        <span className="text-slate-500">•</span>
        <span className="font-mono text-amber-300">{physics.voltage.toFixed(1)} V</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/70 shadow-2xl max-w-[calc(100%-12rem)]">
      <div className="flex items-center gap-2 border-r border-slate-700/80 pr-4">
        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
          C
        </div>
        <div>
          <div className="text-xs font-bold text-white tracking-wide">LABORATORIO DE CAPACITANCIA</div>
          <div className="text-[11px] font-mono text-cyan-400">
            C = κ ε₀ A / d &nbsp;|&nbsp; Q = C·V &nbsp;|&nbsp; U = ½ C·V²
          </div>
        </div>
      </div>

      {viewMode === 'explore' ? (
        <div className="flex items-center gap-3 text-xs">
          <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-medium">
            Capacitancia:{' '}
            {physics.capacitancePF > 1.2 ? '⚡ Alta' : physics.capacitancePF > 0.5 ? '🔹 Media' : '🔸 Baja'} (
            {physics.capacitancePF.toFixed(1)} pF)
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-medium">
            {connectedToBattery ? '🔋 Batería Activa' : '🔒 Carga Atrapada'}
          </span>
          <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-medium">
            {material.name} ({Math.round(insertionFraction * 100)}%)
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-4 text-xs font-mono">
          <Reading first label="Capacitancia C:" valueClass="text-cyan-300">
            {physics.capacitancePF.toFixed(2)} pF
          </Reading>
          <Reading label="Carga Q:" valueClass="text-rose-400">
            {physics.storedChargePC.toFixed(2)} pC
          </Reading>
          <Reading label="Voltaje V:" valueClass="text-amber-400">
            {physics.voltage.toFixed(2)} V
          </Reading>
          <Reading label="Energía U:" valueClass="text-emerald-400">
            {physics.storedEnergyPJ.toFixed(2)} pJ
          </Reading>
          <Reading label="Campo E:" valueClass="text-purple-300">
            {physics.electricFieldKVm.toFixed(2)} kV/m
          </Reading>
        </div>
      )}

      <button
        onClick={() => setIsIsOpenFalse(setIsOpen)}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-auto"
        title="Minimizar telemetría"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const setIsIsOpenFalse = (fn: React.Dispatch<React.SetStateAction<boolean>>) => fn(false);

const Reading: React.FC<{
  label: string;
  valueClass: string;
  children: React.ReactNode;
  first?: boolean;
}> = ({ label, valueClass, children, first = false }) => (
  <div className={first ? undefined : 'border-l border-slate-800 pl-3'}>
    <span className="text-slate-400">{label} </span>
    <span className={`${valueClass} font-bold`}>{children}</span>
  </div>
);
