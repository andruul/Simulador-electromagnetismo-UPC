import React from 'react';
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
  Sparkles,
  Zap,
  RotateCw,
  Compass,
  Lock,
  Unlock
} from 'lucide-react';

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
  setLorentzSettings
}) => {
  const selectedCharge = charges.find((c) => c.id === selectedChargeId);

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

  // Electrostatics presets
  const applyElectroPreset = (type: string) => {
    if (type === 'single') {
      setCharges([
        { id: 'c1', x: 400, y: 300, charge: 2, fixed: false }
      ]);
    } else if (type === 'dipole') {
      setCharges([
        { id: 'c1', x: 320, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 480, y: 300, charge: -2, fixed: false }
      ]);
    } else if (type === 'repulsion') {
      setCharges([
        { id: 'c1', x: 320, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 480, y: 300, charge: 2, fixed: false }
      ]);
    } else if (type === 'quadrupole') {
      setCharges([
        { id: 'c1', x: 340, y: 240, charge: 2, fixed: false },
        { id: 'c2', x: 460, y: 240, charge: -2, fixed: false },
        { id: 'c3', x: 340, y: 360, charge: -2, fixed: false },
        { id: 'c4', x: 460, y: 360, charge: 2, fixed: false }
      ]);
    } else if (type === 'capacitor') {
      // Parallel plate capacitor
      const plates: PointCharge[] = [];
      const count = 7;
      const startX = 260;
      const step = 45;
      for (let i = 0; i < count; i++) {
        plates.push({
          id: `top_${i}`,
          x: startX + i * step,
          y: 200,
          charge: 1.5,
          fixed: true
        });
        plates.push({
          id: `bot_${i}`,
          x: startX + i * step,
          y: 400,
          charge: -1.5,
          fixed: true
        });
      }
      setCharges(plates);
    }
    setSelectedChargeId(null);
  };

  return (
    <aside className="w-80 h-full bg-slate-950/95 border-l border-slate-800/80 flex flex-col overflow-y-auto select-none p-4 space-y-5 text-xs text-slate-300">
      {/* ----------------- MODE: ELECTROSTATICS ----------------- */}
      {mode === 'electrostatics' && (
        <>
          {/* Header */}
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-rose-400 font-bold">
            <Zap className="w-4 h-4" />
            <span>CONFIGURACIÓN DE ELECTROSTÁTICA</span>
          </div>

          {/* Charge management */}
          <div className="space-y-2.5">
            <label className="text-slate-400 font-semibold block">Añadir Carga Puntual:</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => addCharge(2)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 rounded-xl font-medium transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" /> Positiva (+2 µC)
              </button>
              <button
                onClick={() => addCharge(-2)}
                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 border border-sky-500/40 rounded-xl font-medium transition-colors cursor-pointer"
              >
                <Minus className="w-4 h-4" /> Negativa (−2 µC)
              </button>
            </div>
          </div>

          {/* Selected Charge Inspector */}
          {selectedCharge ? (
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-slate-200 font-semibold">
                <span>Carga Seleccionada</span>
                <span
                  className={`font-mono px-1.5 py-0.5 rounded text-[10px] ${
                    selectedCharge.charge > 0
                      ? 'bg-rose-500/20 text-rose-400'
                      : 'bg-sky-500/20 text-sky-400'
                  }`}
                >
                  {selectedCharge.charge > 0 ? '+' : ''}
                  {selectedCharge.charge} µC
                </span>
              </div>

              <div>
                <div className="flex justify-between text-slate-400 mb-1">
                  <span>Magnitud de Carga (q):</span>
                  <span className="font-mono text-white">{selectedCharge.charge} µC</span>
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

              <div className="flex items-center justify-between pt-1">
                <button
                  onClick={() => {
                    setCharges((prev) =>
                      prev.map((c) =>
                        c.id === selectedCharge.id ? { ...c, fixed: !c.fixed } : c
                      )
                    );
                  }}
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer"
                >
                  {selectedCharge.fixed ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{selectedCharge.fixed ? 'Fijada' : 'Móvil'}</span>
                </button>

                <button
                  onClick={removeSelectedCharge}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-slate-900/50 rounded-xl border border-slate-800/60 text-slate-500 text-center italic">
              Haz clic en cualquier carga para editar su valor o fijarla
            </div>
          )}

          {/* Visual Layers Toggles */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-semibold text-slate-300">
              <Layers className="w-4 h-4 text-sky-400" />
              <span>Capas de Visualización</span>
            </div>

            <div className="space-y-2">
              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">Vectores de Campo Eléctrico (E)</span>
                <input
                  type="checkbox"
                  checked={electroSettings.showVectorField}
                  onChange={(e) =>
                    setElectroSettings((s) => ({ ...s, showVectorField: e.target.checked }))
                  }
                  className="accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">Líneas de Campo Continuas (RK4)</span>
                <input
                  type="checkbox"
                  checked={electroSettings.showFieldLines}
                  onChange={(e) =>
                    setElectroSettings((s) => ({ ...s, showFieldLines: e.target.checked }))
                  }
                  className="accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">Mapa de Calor de Potencial (V)</span>
                <input
                  type="checkbox"
                  checked={electroSettings.showPotentialHeatmap}
                  onChange={(e) =>
                    setElectroSettings((s) => ({ ...s, showPotentialHeatmap: e.target.checked }))
                  }
                  className="accent-rose-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer hover:bg-slate-900">
                <span className="text-slate-300">Curvas Equipotenciales (Isolíneas)</span>
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
          </div>

          {/* Density Sliders */}
          <div className="space-y-3 p-3 bg-slate-900/40 rounded-xl border border-slate-800/60">
            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Líneas por carga:</span>
                <span className="font-mono text-white">
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
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Densidad de Grilla E:</span>
                <span className="font-mono text-white">
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
                className="w-full accent-rose-500 cursor-pointer"
              />
            </div>
          </div>

          {/* Presets library */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-400">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" /> Presets Didácticos:
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              <button
                onClick={() => applyElectroPreset('dipole')}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-left border border-slate-800 transition-colors"
              >
                ⚡ Dipolo Eléctrico (+q, −q)
              </button>
              <button
                onClick={() => applyElectroPreset('repulsion')}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-left border border-slate-800 transition-colors"
              >
                ⚡ Cargas de Igual Signo (+q, +q)
              </button>
              <button
                onClick={() => applyElectroPreset('quadrupole')}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-left border border-slate-800 transition-colors"
              >
                ⚡ Cuadrupolo Eléctrico
              </button>
              <button
                onClick={() => applyElectroPreset('capacitor')}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-left border border-slate-800 transition-colors"
              >
                ⚡ Condensador de Placas Paralelas
              </button>
              <button
                onClick={() => applyElectroPreset('single')}
                className="py-1.5 px-3 bg-slate-900 hover:bg-slate-850 text-slate-300 rounded-lg text-left border border-slate-800 transition-colors"
              >
                ⚡ Carga Única Aislada
              </button>
            </div>
          </div>
        </>
      )}

      {/* ----------------- MODE: LORENTZ 3D ----------------- */}
      {mode === 'lorentz3d' && (
        <>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-sky-400 font-bold">
            <RotateCw className="w-4 h-4" />
            <span>CAMPOS Y PARÁMETROS 3D</span>
          </div>

          {/* Magnetic Field B control */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-cyan-400">Campo Magnético B (Tesla)</span>
              <span className="font-mono text-[11px] text-slate-400">
                ({lorentzSettings.bField.x.toFixed(1)}, {lorentzSettings.bField.y.toFixed(1)},{' '}
                {lorentzSettings.bField.z.toFixed(1)})
              </span>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Componente B_z:</span>
                <span className="text-white font-mono">{lorentzSettings.bField.z} T</span>
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
          </div>

          {/* Electric Field E control */}
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2.5">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-rose-400">Campo Eléctrico E (N/C)</span>
              <span className="font-mono text-[11px] text-slate-400">
                ({lorentzSettings.eField.x.toFixed(1)}, {lorentzSettings.eField.y.toFixed(1)},{' '}
                {lorentzSettings.eField.z.toFixed(1)})
              </span>
            </div>

            <div>
              <div className="flex justify-between text-slate-400 text-[11px]">
                <span>Componente E_y:</span>
                <span className="text-white font-mono">{lorentzSettings.eField.y} N/C</span>
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

          {/* 3D Toggles */}
          <div className="space-y-2">
            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer hover:bg-slate-900">
              <span className="text-slate-300">Vectores v y F sobre partícula</span>
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

            <label className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 border border-slate-800/60 cursor-pointer hover:bg-slate-900">
              <span className="text-slate-300">Visualizar vectores E y B en 3D</span>
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

          {/* Simulation Time Step */}
          <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800/60 space-y-1">
            <div className="flex justify-between text-slate-400">
              <span>Velocidad de Simulación (dt):</span>
              <span className="font-mono text-white">{lorentzSettings.timeStep}</span>
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
        </>
      )}

      {/* ----------------- MODE: MAGNETOSTATICS ----------------- */}
      {mode === 'magnetostatics' && (
        <>
          <div className="flex items-center gap-2 pb-2 border-b border-slate-800 text-teal-400 font-bold">
            <Compass className="w-4 h-4" />
            <span>MAGNETOSTÁTICA & AMPÈRE</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
            <span className="font-semibold text-slate-200">Ley de Ampère / Biot-Savart</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              El campo magnético circula en torno a las corrientes eléctricas de acuerdo con la regla de la mano derecha.
            </p>
            <div className="p-2 bg-slate-950 rounded text-center font-mono text-teal-300 text-[11px]">
              B = (μ₀ · I) / (2π · r)
            </div>
          </div>

          <div className="space-y-2 text-slate-400 text-[11px]">
            <p className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-cyan-500 inline-block text-[8px] text-center text-slate-950 font-bold leading-3">⊙</span>
              <span><strong>Corriente Saliente (+Z):</strong> Campo circula en sentido antihorario.</span>
            </p>
            <p className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block text-[8px] text-center text-slate-950 font-bold leading-3">⊗</span>
              <span><strong>Corriente Entrante (−Z):</strong> Campo circula en sentido horario.</span>
            </p>
          </div>
        </>
      )}
    </aside>
  );
};
