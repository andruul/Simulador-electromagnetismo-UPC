import React, { useState } from 'react';
import { BatteryCharging, Layers, Unplug, ChevronDown, ChevronUp } from 'lucide-react';
import { DIELECTRIC_MATERIALS } from '../../fisica/capacitancia';

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
  <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md p-2 rounded-xl border border-[#D5CEC6] shadow-md">
    <button
      onClick={onToggleBattery}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
        connectedToBattery
          ? 'bg-[#5B9E8A]/15 text-[#3D7A69] border border-[#5B9E8A]/40 hover:bg-[#5B9E8A]/25'
          : 'bg-rose-100 text-rose-700 border border-rose-300 hover:bg-rose-200'
      }`}
    >
      {connectedToBattery ? (
        <>
          <BatteryCharging className="w-4 h-4 text-[#5B9E8A]" />
          <span>Conectado (V cte)</span>
        </>
      ) : (
        <>
          <Unplug className="w-4 h-4 text-rose-600" />
          <span>Desconectado (Q cte)</span>
        </>
      )}
    </button>

    {connectedToBattery && (
      <div className="flex items-center gap-2 px-2 text-xs text-[#4A4540] border-l border-[#E0D8CF]">
        <span className="text-[11px] text-[#6B6560]">Voltaje:</span>
        <input
          type="range"
          min="-3.0"
          max="3.0"
          step="0.1"
          value={batteryVoltage}
          onChange={(e) => onBatteryVoltageChange(parseFloat(e.target.value))}
          className="w-16 accent-sky-500 cursor-pointer"
        />
        <span className="font-mono w-9 text-right text-sky-700 font-bold">{batteryVoltage.toFixed(1)}V</span>
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
        className="absolute bottom-4 left-4 z-20 flex items-center gap-2 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-[#D5CEC6] shadow-md text-xs text-[#4A4540] hover:bg-[#EDE8DF] transition-colors cursor-pointer"
        title="Expandir parámetros del condensador"
      >
        <Layers className="w-3.5 h-3.5 text-amber-600" />
        <span className="font-semibold text-[#2D2A26]">Parámetros Placas & Dieléctrico</span>
        <span className="text-[10px] text-[#6B6560] font-mono">
          (d={plateDistanceMm.toFixed(1)}mm, A={plateAreaMm2}mm²)
        </span>
        <ChevronUp className="w-3.5 h-3.5 text-[#6B6560] ml-1" />
      </button>
    );
  }

  return (
    <div className="absolute bottom-4 left-4 max-w-[calc(100%-2rem)] z-20 flex flex-wrap items-center gap-3 bg-white/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#D5CEC6] shadow-md">
      <div className="flex items-center gap-2">
        <Layers className="w-4 h-4 text-amber-600" />
        <span className="text-xs font-semibold text-[#2D2A26]">Dieléctrico:</span>
        <select
          value={selectedMaterialId}
          onChange={(e) => onMaterialChange(e.target.value)}
          className="bg-[#EDE8DF] border border-[#D5CEC6] text-[#2D2A26] text-xs rounded-lg px-2 py-1 focus:ring-1 focus:ring-[#5B9E8A] cursor-pointer"
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

      <div className="flex items-center gap-1.5 border-l border-[#E0D8CF] pl-3 text-xs">
        <InstrumentToggle active={showVoltmeter} onClick={onToggleVoltmeter}>
          Voltímetro
        </InstrumentToggle>
        <InstrumentToggle active={showFieldMeter} onClick={onToggleFieldMeter}>
          Sensor E
        </InstrumentToggle>
      </div>

      <button
        onClick={() => setIsOpen(false)}
        className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer ml-1"
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
      active ? 'bg-[#5B9E8A] text-white shadow-sm font-semibold' : 'bg-[#EDE8DF] text-[#6B6560] hover:text-[#2D2A26]'
    }`}
  >
    {children}
  </button>
);
