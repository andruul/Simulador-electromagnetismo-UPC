import React, { useState } from 'react';
import type {
  SimulationMode,
  PointCharge,
  ElectrostaticsSettings,
  Lorentz3DSettings
} from '../types';
import {
  Plus,
  Minus,
  Trash2,
  Layers,
  Zap,
  RotateCw,
  Lock,
  Unlock,
  X,
  Sliders,
  ChevronsUpDown,
  Settings2
} from 'lucide-react';
import { CollapsibleSection } from './CollapsibleSection';

interface ControlPanelProps {
  mode: SimulationMode;
  // Electrostatics props
  charges: PointCharge[];
  setCharges: React.Dispatch<React.SetStateAction<PointCharge[]>>;
  selectedChargeId: string | null;
  setSelectedChargeId: (id: string | null) => void;
  electroSettings: ElectrostaticsSettings;
  setElectroSettings: React.Dispatch<React.SetStateAction<ElectrostaticsSettings>>;
  // Lorentz 3D props
  lorentzSettings: Lorentz3DSettings;
  setLorentzSettings: React.Dispatch<React.SetStateAction<Lorentz3DSettings>>;
  onRequestLorentzPreset?: (preset: string) => void;
  onRequestMagnetoPreset?: (preset: string) => void;
  onClose?: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  mode,
  charges,
  setCharges,
  selectedChargeId,
  setSelectedChargeId,
  electroSettings,
  setElectroSettings,
  lorentzSettings,
  setLorentzSettings,
  onClose
}) => {
  const selectedCharge = charges.find((c) => c.id === selectedChargeId);

  // Section collapse states (clean by default, preventing cognitive overload)
  const [openSection1, setOpenSection1] = useState<boolean>(true); // Main controls
  const [openSection2, setOpenSection2] = useState<boolean>(true); // Visualization layers
  const [openSection3, setOpenSection3] = useState<boolean>(false); // Advanced / density (closed by default)

  const allOpen = openSection1 && openSection2 && openSection3;
  const toggleAll = () => {
    const next = !allOpen;
    setOpenSection1(next);
    setOpenSection2(next);
    setOpenSection3(next);
  };

  // Add a charge in Electrostatics
  const addCharge = (value: number) => {
    const newCharge: PointCharge = {
      id: 'c_' + Math.random().toString(36).substring(2, 7),
      x: 350 + (Math.random() - 0.5) * 100,
      y: 280 + (Math.random() - 0.5) * 100,
      charge: value,
      fixed: false
    };
    setCharges((prev) => [...prev, newCharge]);
    setSelectedChargeId(newCharge.id);
  };

  const removeSelectedCharge = () => {
    if (!selectedChargeId) return;
    setCharges((prev) => prev.filter((c) => c.id !== selectedChargeId));
    setSelectedChargeId(null);
  };

  return (
    <aside className="w-80 h-full bg-[#0d131f] border-l border-slate-800/90 flex flex-col overflow-y-auto select-none p-3 space-y-3 text-xs text-slate-300 flex-shrink-0 z-20 shadow-2xl custom-scrollbar">
      {/* Panel Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-slate-400 flex-shrink-0">
        <div className="flex items-center gap-1.5 min-w-0">
          <Sliders className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-200 truncate">
            CONTROLES
          </span>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Master collapse/expand toggle */}
          <button
            onClick={toggleAll}
            className="p-1 text-slate-400 hover:text-emerald-300 hover:bg-slate-850 rounded transition-colors cursor-pointer"
            title={allOpen ? 'Contraer todo' : 'Expandir todo'}
          >
            <ChevronsUpDown className="w-3.5 h-3.5" />
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer ml-0.5"
              title="Ocultar panel lateral"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ----------------- MODE: ELECTROSTATICS ----------------- */}
      {mode === 'electrostatics' && (
        <div className="space-y-2.5">
          {/* 1. Add & Manage Charges */}
          <CollapsibleSection
            title="Añadir & Configurar Cargas"
            subtitle={`${charges.length} cargas en el lienzo`}
            icon={<Zap className="w-3.5 h-3.5 text-rose-400" />}
            badge={
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-rose-300 font-mono">
                {charges.length} q
              </span>
            }
            isOpen={openSection1}
            onToggle={() => setOpenSection1((prev) => !prev)}
          >
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => addCharge(2)}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded-lg font-medium transition-colors cursor-pointer text-[11px]"
                >
                  <Plus className="w-3 h-3" /> +2 µC
                </button>
                <button
                  onClick={() => addCharge(-2)}
                  className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-lg font-medium transition-colors cursor-pointer text-[11px]"
                >
                  <Minus className="w-3 h-3" /> −2 µC
                </button>
              </div>

              {/* Selected Charge Inspector */}
              {selectedCharge ? (
                <div className="p-2.5 bg-[#0e1422] rounded-lg border border-slate-800 space-y-2 mt-1">
                  <div className="flex items-center justify-between text-slate-200 font-semibold text-[11px]">
                    <span>Carga Seleccionada</span>
                    <span
                      className={`font-mono px-1.5 py-0.2 rounded text-[10px] font-bold ${
                        selectedCharge.charge > 0
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-sky-500/20 text-sky-400 border border-sky-500/30'
                      }`}
                    >
                      {selectedCharge.charge > 0 ? '+' : ''}
                      {selectedCharge.charge} µC
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-slate-300 text-[10px] mb-1">
                      <span>Valor de Carga (q):</span>
                      <span className="font-mono text-white font-bold">{selectedCharge.charge} µC</span>
                    </div>
                    <input
                      type="range"
                      min="-6"
                      max="6"
                      step="0.5"
                      value={selectedCharge.charge}
                      onChange={(e) => {
                        const val = parseFloat(e.target.value);
                        setCharges((prev) =>
                          prev.map((c) => (c.id === selectedCharge.id ? { ...c, charge: val } : c))
                        );
                      }}
                      className="w-full accent-rose-500 cursor-pointer"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-slate-800">
                    <button
                      onClick={() => {
                        setCharges((prev) =>
                          prev.map((c) =>
                            c.id === selectedCharge.id ? { ...c, fixed: !c.fixed } : c
                          )
                        );
                      }}
                      className="flex items-center gap-1 text-slate-300 hover:text-white cursor-pointer text-[10px]"
                    >
                      {selectedCharge.fixed ? (
                        <Lock className="w-3 h-3 text-amber-400" />
                      ) : (
                        <Unlock className="w-3 h-3 text-slate-500" />
                      )}
                      <span>{selectedCharge.fixed ? 'Fijada' : 'Libre'}</span>
                    </button>

                    <button
                      onClick={removeSelectedCharge}
                      className="flex items-center gap-1 text-rose-400 hover:text-rose-300 cursor-pointer text-[10px]"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-2 bg-[#0e1422] rounded-lg border border-slate-800/80 text-slate-400 text-center text-[10px] italic">
                  💡 Haz clic en una carga del lienzo para ajustarla.
                </div>
              )}
            </div>
          </CollapsibleSection>

          {/* 2. Visual Layers */}
          <CollapsibleSection
            title="Capas de Visualización"
            subtitle="Vectores, líneas y equipotenciales"
            icon={<Layers className="w-3.5 h-3.5 text-sky-400" />}
            badge={
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-sky-400 font-mono">
                {Number(electroSettings.showVectorField) +
                  Number(electroSettings.showFieldLines) +
                  Number(electroSettings.showPotentialHeatmap) +
                  Number(electroSettings.showEquipotentialLines)}{' '}
                activas
              </span>
            }
            isOpen={openSection2}
            onToggle={() => setOpenSection2((prev) => !prev)}
          >
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1422] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Vectores de Campo (E)</span>
                  <span className="text-[10px] text-slate-400">Flechas con dirección e intensidad</span>
                </div>
                <input
                  type="checkbox"
                  checked={electroSettings.showVectorField}
                  onChange={(e) =>
                    setElectroSettings((s) => ({ ...s, showVectorField: e.target.checked }))
                  }
                  className="accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1422] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Líneas de Campo (RK4)</span>
                  <span className="text-[10px] text-slate-400">Trayectorias continuas (+) a (−)</span>
                </div>
                <input
                  type="checkbox"
                  checked={electroSettings.showFieldLines}
                  onChange={(e) =>
                    setElectroSettings((s) => ({ ...s, showFieldLines: e.target.checked }))
                  }
                  className="accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1422] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Mapa de Potencial (V)</span>
                  <span className="text-[10px] text-slate-400">Rojo (+) y Azul (−)</span>
                </div>
                <input
                  type="checkbox"
                  checked={electroSettings.showPotentialHeatmap}
                  onChange={(e) =>
                    setElectroSettings((s) => ({ ...s, showPotentialHeatmap: e.target.checked }))
                  }
                  className="accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1422] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Curvas Equipotenciales</span>
                  <span className="text-[10px] text-slate-400">Líneas de igual voltaje</span>
                </div>
                <input
                  type="checkbox"
                  checked={electroSettings.showEquipotentialLines}
                  onChange={(e) =>
                    setElectroSettings((s) => ({
                      ...s,
                      showEquipotentialLines: e.target.checked
                    }))
                  }
                  className="accent-emerald-500 cursor-pointer"
                />
              </label>
            </div>
          </CollapsibleSection>

          {/* 3. Advanced Density Settings (Collapsed by default) */}
          <CollapsibleSection
            title="Ajustes Avanzados de Densidad"
            subtitle="Resolución de campo y grilla"
            icon={<Settings2 className="w-3.5 h-3.5 text-amber-400" />}
            badge={
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                Fino
              </span>
            }
            isOpen={openSection3}
            onToggle={() => setOpenSection3((prev) => !prev)}
          >
            <div className="space-y-3 pt-0.5">
              <div>
                <div className="flex justify-between text-slate-300 text-[10px] mb-1">
                  <span>Líneas por carga:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {electroSettings.fieldLinesPerCharge}
                  </span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="32"
                  step="4"
                  value={electroSettings.fieldLinesPerCharge}
                  onChange={(e) =>
                    setElectroSettings((s) => ({
                      ...s,
                      fieldLinesPerCharge: parseInt(e.target.value)
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-slate-300 text-[10px] mb-1">
                  <span>Espaciado de Grilla:</span>
                  <span className="font-mono text-emerald-400 font-bold">
                    {electroSettings.vectorGridDensity} px
                  </span>
                </div>
                <input
                  type="range"
                  min="24"
                  max="60"
                  step="4"
                  value={electroSettings.vectorGridDensity}
                  onChange={(e) =>
                    setElectroSettings((s) => ({
                      ...s,
                      vectorGridDensity: parseInt(e.target.value)
                    }))
                  }
                  className="w-full accent-emerald-500 cursor-pointer"
                />
              </div>
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* ----------------- MODE: LORENTZ 3D ----------------- */}
      {mode === 'lorentz3d' && (
        <div className="space-y-2.5">
          {/* 1. Fields E and B */}
          <CollapsibleSection
            title="Intensidad de Campos E y B"
            subtitle={`Bz: ${lorentzSettings.bField.z.toFixed(1)}T | Ey: ${lorentzSettings.eField.y.toFixed(1)}N/C`}
            icon={<RotateCw className="w-3.5 h-3.5 text-sky-400" />}
            badge={
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-300 font-mono">
                {lorentzSettings.bField.z.toFixed(1)} T
              </span>
            }
            isOpen={openSection1}
            onToggle={() => setOpenSection1((prev) => !prev)}
          >
            <div className="space-y-2.5 pt-0.5">
              {/* Magnetic Field B */}
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="font-semibold text-cyan-400">Campo Magnético (B_z)</span>
                  <span className="font-mono text-white font-bold">
                    {lorentzSettings.bField.z.toFixed(1)} T
                  </span>
                </div>
                <input
                  type="range"
                  min="-5"
                  max="5"
                  step="0.5"
                  value={lorentzSettings.bField.z}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLorentzSettings((s) => ({
                      ...s,
                      bField: { ...s.bField, z: val }
                    }));
                  }}
                  className="w-full accent-cyan-500 cursor-pointer"
                />
              </div>

              {/* Electric Field E */}
              <div>
                <div className="flex justify-between items-center text-[10px] mb-1">
                  <span className="font-semibold text-rose-400">Campo Eléctrico (E_y)</span>
                  <span className="font-mono text-white font-bold">
                    {lorentzSettings.eField.y.toFixed(1)} N/C
                  </span>
                </div>
                <input
                  type="range"
                  min="-10"
                  max="10"
                  step="1"
                  value={lorentzSettings.eField.y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value);
                    setLorentzSettings((s) => ({
                      ...s,
                      eField: { ...s.eField, y: val }
                    }));
                  }}
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          </CollapsibleSection>

          {/* 2. 3D Toggles */}
          <CollapsibleSection
            title="Capas y Vectores 3D"
            subtitle="Fuerza, velocidad y grilla"
            icon={<Layers className="w-3.5 h-3.5 text-cyan-400" />}
            badge={
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-cyan-400 font-mono">
                3D
              </span>
            }
            isOpen={openSection2}
            onToggle={() => setOpenSection2((prev) => !prev)}
          >
            <div className="space-y-1.5 pt-0.5">
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1422] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 text-[11px] block">Vectores v y F</span>
                  <span className="text-[10px] text-slate-400">Verde (v) y Amarillo (F)</span>
                </div>
                <input
                  type="checkbox"
                  checked={lorentzSettings.showVectorsOnParticle}
                  onChange={(e) =>
                    setLorentzSettings((s) => ({
                      ...s,
                      showVectorsOnParticle: e.target.checked
                    }))
                  }
                  className="accent-sky-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#0e1422] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 text-[11px] block">Flechas de campo 3D</span>
                  <span className="text-[10px] text-slate-400">Matriz tridimensional</span>
                </div>
                <input
                  type="checkbox"
                  checked={lorentzSettings.showFieldVectors}
                  onChange={(e) =>
                    setLorentzSettings((s) => ({
                      ...s,
                      showFieldVectors: e.target.checked
                    }))
                  }
                  className="accent-sky-500 cursor-pointer"
                />
              </label>
            </div>
          </CollapsibleSection>

          {/* 3. Boris Pusher dt (Collapsed by default) */}
          <CollapsibleSection
            title="Precisión Boris Pusher"
            subtitle={`Paso temporal dt: ${lorentzSettings.timeStep}`}
            icon={<Settings2 className="w-3.5 h-3.5 text-amber-400" />}
            isOpen={openSection3}
            onToggle={() => setOpenSection3((prev) => !prev)}
          >
            <div className="pt-0.5 space-y-1">
              <div className="flex justify-between text-slate-300 text-[10px]">
                <span>Paso de Tiempo (dt):</span>
                <span className="font-mono text-sky-400 font-bold">{lorentzSettings.timeStep}</span>
              </div>
              <input
                type="range"
                min="0.01"
                max="0.08"
                step="0.01"
                value={lorentzSettings.timeStep}
                onChange={(e) =>
                  setLorentzSettings((s) => ({
                    ...s,
                    timeStep: parseFloat(e.target.value)
                  }))
                }
                className="w-full accent-sky-500 cursor-pointer"
              />
            </div>
          </CollapsibleSection>
        </div>
      )}

      {/* Spacer: pushes nothing else to bottom for modes without sidebar controls */}
    </aside>
  );
};

export default ControlPanel;
