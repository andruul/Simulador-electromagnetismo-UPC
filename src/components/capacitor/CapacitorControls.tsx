import React, { useState } from 'react';
import { BatteryCharging, Layers, Unplug, ChevronDown, ChevronUp } from 'lucide-react';
import { DIELECTRIC_MATERIALS } from '../../physics/capacitance';

interface BatteryControlsProps {
  connectedToBattery: boolean;
  batteryVoltage: number;
  onToggleBattery: () => void;
  onBatteryVoltageChange: (volts: number) => void;
}

/** Top-right panel: battery connection switch and voltage slider. */
export const CapacitorBatteryControls: React.FC<BatteryControlsProps> = ({
  connectedToBattery,
  batteryVoltage,
  onToggleBattery,
  onBatteryVoltageChange
}) => (
  <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700/70 shadow-2xl">
    <button
      onClick={onToggleBattery}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
        connectedToBattery
          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
      }`}
    >
      {connectedToBattery ? (
        <>
          <BatteryCharging className="w-4 h-4 text-emerald-400" />
          <span>Conectado (V cte)</span>
        </>
      ) : (
        <>
          <Unplug className="w-4 h-4 text-rose-400" />
          <span>Desconectado (Q cte)</span>
        </>
      )}
    </button>

    {connectedToBattery && (
      <div className="flex items-center gap-2 px-2 text-xs text-slate-300 border-l border-slate-800">
        <span className="text-[11px]">Voltaje:</span>
        <input
          type="range"
          min="-3.0"
          max="3.0"
          step="0.1"
          value={batteryVoltage}
          onChange={(e) => onBatteryVoltageChange(parseFloat(e.target.value))}
          className="w-16 accent-cyan-500 cursor-pointer"
        />
        <span className="font-mono w-9 text-right text-cyan-300 font-bold">{batteryVoltage.toFixed(1)}V</span>
      </div>
    )}
  </div>
);

interface LabSliderProps {
  label: string;
  min: string;
  max: string;
  step: string;
  value: number;
  onChange: (value: number) => void;
  sliderClass: string;
  valueClass: string;
  display: string;
}

const LabSlider: React.FC<LabSliderProps> = ({
  label,
  min,
  max,
  step,
  value,
  onChange,
  sliderClass,
  valueClass,
  display
}) => (
  <div className="flex items-center gap-2 text-xs text-slate-300 border-l border-slate-800 pl-3">
    <span className="text-[11px] whitespace-nowrap">{label}</span>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      className={`w-20 ${sliderClass} cursor-pointer`}
    />
    <span className={`font-mono ${valueClass} font-bold whitespace-nowrap`}>{display}</span>
  </div>
);

interface BottomControlsProps {
  selectedMaterialId: string;
  onMaterialChange: (id: string) => void;
  insertionFraction: number;
  onInsertionChange: (fraction: number) => void;
  plateDistanceMm: number;
  onDistanceChange: (mm: number) => void;
  plateAreaMm2: number;
  onAreaChange: (mm2: number) => void;
  showVoltmeter: boolean;
  onToggleVoltmeter: () => void;
  showFieldMeter: boolean;
  onToggleFieldMeter: () => void;
}

/** Bottom bar: dielectric, geometry sliders and instrument toggles (collapsible). */
export const CapacitorBottomControls: React.FC<BottomControlsProps> = ({
  selectedMaterialId,
  onMaterialChange,
  insertionFraction,
  onInsertionChange,
  plateDistanceMm,
  onDistanceChange,
  plateAreaMm2,
  onAreaChange,
  showVoltmeter,
  onToggleVoltmeter,
  showFieldMeter,
  onToggleFieldMeter
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border border-slate-700/70 shadow-2xl text-xs text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
        title="Expandir parámetros del condensador"
      >
        <Layers className="w-3.5 h-3.5 text-amber-400" />
        <span className="font-semibold text-slate-300">Parámetros Placas & Dieléctrico</span>
        <span className="text-[10px] text-slate-400 font-mono">
          (d={plateDistanceMm.toFixed(1)}mm, A={plateAreaMm2}mm²)
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-1" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] z-20 flex flex-wrap items-center gap-3 bg-slate-900/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-slate-700/70 shadow-2xl">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-amber-400" />
        <span className="text-xs font-semibold text-slate-300">Dieléctrico:</span>
        <select
          value={selectedMaterialId}
          onChange={(e) => onMaterialChange(e.target.value)}
          className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
        >
          {DIELECTRIC_MATERIALS.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} (κ = {m.kappa})
            </option>
          ))}
        </select>
      </div>

      <LabSlider
        label="Inserción:"
        min="0"
        max="1"
        step="0.05"
        value={insertionFraction}
        onChange={onInsertionChange}
        sliderClass="accent-amber-500"
        valueClass="text-amber-400"
        display={`${(insertionFraction * 100).toFixed(0)}%`}
      />
      <LabSlider
        label="Distancia d:"
        min="2.0"
        max="10.0"
        step="0.5"
        value={plateDistanceMm}
        onChange={onDistanceChange}
        sliderClass="accent-sky-500"
        valueClass="text-cyan-300"
        display={`${plateDistanceMm.toFixed(1)} mm`}
      />
      <LabSlider
        label="Área A:"
        min="100"
        max="400"
        step="10"
        value={plateAreaMm2}
        onChange={onAreaChange}
        sliderClass="accent-indigo-500"
        valueClass="text-indigo-300"
        display={`${plateAreaMm2.toFixed(0)} mm²`}
      />

      <div className="flex items-center gap-1.5 border-l border-slate-800 pl-3 text-xs">
        <InstrumentToggle active={showVoltmeter} onClick={onToggleVoltmeter}>
          Voltímetro
        </InstrumentToggle>
        <InstrumentToggle active={showFieldMeter} onClick={onToggleFieldMeter}>
          Sensor E
        </InstrumentToggle>
      </div>

      <button
        onClick={() => setIsOpen(false)}
        className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-1"
        title="Minimizar barra de parámetros"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

const InstrumentToggle: React.FC<{
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}> = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`px-2 py-0.5 rounded cursor-pointer transition-all text-[11px] ${
      active ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-400'
    }`}
  >
    {children}
  </button>
);
