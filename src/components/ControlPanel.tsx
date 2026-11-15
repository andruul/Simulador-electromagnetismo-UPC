import React from 'react';
import type {
  SimulationMode,
  ViewMode,
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
  Compass,
  Lock,
  Unlock,
  X,
  Gauge,
  Sliders,
  BatteryCharging,
  CircleDot,
  Sparkles,
  Info
} from 'lucide-react';

interface ControlPanelProps {
  mode: SimulationMode;
  viewMode: ViewMode;
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
  viewMode,
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
    <aside className="w-80 h-full bg-[#0d131f] border-l border-slate-800/90 flex flex-col overflow-y-auto select-none p-3.5 space-y-4 text-xs text-slate-300 flex-shrink-0 z-20 shadow-2xl">
      {/* Panel Top Bar */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-800/80 text-slate-400">
        <div className="flex items-center gap-1.5">
          <Sliders className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-[11px] uppercase tracking-wider text-slate-200">
            CONTROLES DE LABORATORIO
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
              viewMode === 'explore'
                ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40'
                : 'bg-sky-950 text-sky-300 border-sky-500/40'
            }`}
          >
            {viewMode === 'explore' ? 'Modo Exploración' : 'Modo Medición'}
          </span>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Ocultar panel lateral"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ----------------- MODE: ELECTROSTATICS ----------------- */}
      {mode === 'electrostatics' && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-center gap-2 pb-1 text-rose-400 font-bold border-b border-slate-800/60">
            <Zap className="w-4 h-4" />
            <span className="text-[11px]">ELECTROSTÁTICA Y CARGAS</span>
          </div>

          {/* Charge management */}
          <div className="space-y-1.5">
            <label className="text-slate-300 font-semibold block text-[11px]">
              Añadir Carga al Lienzo:
            </label>
            <p className="text-[10px] text-slate-400 leading-tight">
              Coloca partículas cargadas para ver cómo interactúan y modifican el espacio.
            </p>
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={() => addCharge(2)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/40 rounded-lg font-medium transition-colors cursor-pointer text-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Positiva (+2 µC)
              </button>
              <button
                onClick={() => addCharge(-2)}
                className="flex items-center justify-center gap-1 py-1.5 px-2 bg-sky-500/15 hover:bg-sky-500/25 text-sky-300 border border-sky-500/40 rounded-lg font-medium transition-colors cursor-pointer text-xs"
              >
                <Minus className="w-3.5 h-3.5" /> Negativa (−2 µC)
              </button>
            </div>
          </div>

          {/* Selected Charge Inspector */}
          {selectedCharge ? (
            <div className="p-3 bg-[#111827] rounded-xl border border-slate-800 space-y-2.5 shadow-sm">
              <div className="flex items-center justify-between text-slate-200 font-semibold">
                <span>Carga Seleccionada</span>
                <span
                  className={`font-mono px-2 py-0.5 rounded text-[10px] font-bold ${
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
                <div className="flex justify-between text-slate-300 text-[11px] mb-1">
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
                <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                  Carga eléctrica: Valores positivos repelen a otras positivas y atraen a negativas.
                </p>
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
                  className="flex items-center gap-1.5 text-slate-300 hover:text-white cursor-pointer text-[11px]"
                >
                  {selectedCharge.fixed ? (
                    <Lock className="w-3.5 h-3.5 text-amber-400" />
                  ) : (
                    <Unlock className="w-3.5 h-3.5 text-slate-500" />
                  )}
                  <span>{selectedCharge.fixed ? 'Fijada en el espacio' : 'Libre para mover'}</span>
                </button>

                <button
                  onClick={removeSelectedCharge}
                  className="flex items-center gap-1 text-rose-400 hover:text-rose-300 cursor-pointer text-[11px]"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-[#111827]/70 rounded-xl border border-slate-800/80 text-slate-400 text-center text-[11px] italic">
              💡 Haz clic sobre cualquier carga en el lienzo para ajustar su valor o fijarla.
            </div>
          )}

          {/* Visual Layers Toggles */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200 text-[11px]">
              <Layers className="w-3.5 h-3.5 text-sky-400" />
              <span>Capas de Visualización</span>
            </div>

            <div className="space-y-1.5">
              <label className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Vectores de Campo Eléctrico (E)</span>
                  <span className="text-[10px] text-slate-400">Flechas que indican dirección e intensidad</span>
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

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Líneas de Campo (RK4)</span>
                  <span className="text-[10px] text-slate-400">Trayectorias continuas desde (+) hacia (−)</span>
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

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Mapa de Calor de Potencial (V)</span>
                  <span className="text-[10px] text-slate-400">Rojo (voltaje positivo) y Azul (negativo)</span>
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

              <label className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
                <div>
                  <span className="text-slate-200 block text-[11px]">Curvas Equipotenciales</span>
                  <span className="text-[10px] text-slate-400">Líneas de igual voltaje (perpendiculares a E)</span>
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
          </div>

          {/* Density Sliders */}
          <div className="space-y-3 p-3 bg-[#111827] rounded-xl border border-slate-800/80">
            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>Líneas por cada carga:</span>
                <span className="font-mono text-emerald-400 font-bold">{electroSettings.fieldLinesPerCharge}</span>
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
              <p className="text-[10px] text-slate-400 mt-0.5">
                Densidad de líneas: A mayor número, más fino es el mapa de campo.
              </p>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 text-[11px] mb-1">
                <span>Espaciado de Grilla de Flechas:</span>
                <span className="font-mono text-emerald-400 font-bold">{electroSettings.vectorGridDensity} px</span>
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
              <p className="text-[10px] text-slate-400 mt-0.5">
                Separación entre vectores: A menor valor, grilla más tupida.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODE: LORENTZ 3D ----------------- */}
      {mode === 'lorentz3d' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-1 text-sky-400 font-bold border-b border-slate-800/60">
            <RotateCw className="w-4 h-4" />
            <span className="text-[11px]">CAMPOS ELÉCTRICO Y MAGNÉTICO 3D</span>
          </div>

          {/* Magnetic Field B */}
          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-cyan-400 text-[11px]">Campo Magnético (B_z)</span>
              <span className="font-mono text-white font-bold">{lorentzSettings.bField.z.toFixed(1)} Tesla</span>
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
            <p className="text-[10px] text-slate-400 leading-snug">
              Campo magnético: Curva la trayectoria de las partículas en órbitas circulares sin alterar su rapidez.
            </p>
          </div>

          {/* Electric Field E */}
          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-semibold text-rose-400 text-[11px]">Campo Eléctrico (E_y)</span>
              <span className="font-mono text-white font-bold">{lorentzSettings.eField.y.toFixed(1)} N/C</span>
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
            <p className="text-[10px] text-slate-400 leading-snug">
              Campo eléctrico: Empuja y acelera la partícula en la dirección del eje vertical Y.
            </p>
          </div>

          {/* 3D Toggles */}
          <div className="space-y-1.5">
            <label className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
              <div>
                <span className="text-slate-200 text-[11px] block">Vectores v y F sobre partícula</span>
                <span className="text-[10px] text-slate-400">Verde (velocidad) y Amarillo (fuerza)</span>
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

            <label className="flex items-center justify-between p-2 rounded-lg bg-[#111827] border border-slate-800/80 cursor-pointer hover:bg-slate-800/60">
              <div>
                <span className="text-slate-200 text-[11px] block">Mostrar flechas de campo 3D</span>
                <span className="text-[10px] text-slate-400">Matriz tridimensional de vectores B y E</span>
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

          {/* Step size */}
          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800/80 space-y-1.5">
            <div className="flex justify-between text-slate-300 text-[11px]">
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
            <p className="text-[10px] text-slate-400">
              Velocidad de simulación del integrador Boris Pusher.
            </p>
          </div>
        </div>
      )}

      {/* ----------------- MODE: GAUSS ----------------- */}
      {mode === 'gauss' && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-1 text-emerald-400 font-bold border-b border-slate-800/60">
            <CircleDot className="w-4 h-4" />
            <span className="text-[11px]">SUPERFICIE GAUSSIANA & FLUJO</span>
          </div>

          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800/80 space-y-2">
            <span className="font-semibold text-emerald-300 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-emerald-400" /> Principio Fundamental
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              El flujo eléctrico neto que atraviesa cualquier superficie cerrada es proporcional únicamente a la carga neta encerrada:
            </p>
            <div className="p-2 bg-slate-950 rounded text-center font-mono text-emerald-300 text-xs border border-slate-800">
              Φ_E = ∮ E⃗ · dA⃗ = Q_enc / ε₀
            </div>
            <p className="text-[10px] text-slate-400">
              Usa los controles de la barra inferior o la guía izquierda para cambiar de forma y probar casos canónicos.
            </p>
          </div>
        </div>
      )}

      {/* ----------------- MODE: CAPACITOR ----------------- */}
      {mode === 'capacitor' && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-1 text-amber-400 font-bold border-b border-slate-800/60">
            <BatteryCharging className="w-4 h-4" />
            <span className="text-[11px]">PARÁMETROS DEL CONDENSADOR</span>
          </div>

          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800/80 space-y-2">
            <span className="font-semibold text-amber-300 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-amber-400" /> Física de Placas Paralelas
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              La capacitancia mide cuánta carga almacena el dispositivo por cada voltio aplicado:
            </p>
            <div className="p-2 bg-slate-950 rounded text-center font-mono text-amber-300 text-xs border border-slate-800">
              C = κ · ε₀ · A / d
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              Prueba a cambiar el material del dieléctrico y arrastrar las sondas del voltímetro digital dentro del lienzo para medir el potencial.
            </p>
          </div>
        </div>
      )}

      {/* ----------------- MODE: MAGNETOSTATICS ----------------- */}
      {mode === 'magnetostatics' && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-1 text-teal-400 font-bold border-b border-slate-800/60">
            <Compass className="w-4 h-4" />
            <span className="text-[11px]">CAMPOS MAGNÉTICOS & CORRIENTES</span>
          </div>

          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800/80 space-y-2">
            <span className="font-semibold text-teal-300 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-teal-400" /> Ley de Biot-Savart & Ampère
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Toda corriente eléctrica genera un campo magnético a su alrededor formando anillos concéntricos:
            </p>
            <div className="p-2 bg-slate-950 rounded text-center font-mono text-teal-300 text-xs border border-slate-800">
              B = (μ₀ · I) / (2π · r)
            </div>
            <div className="space-y-1 text-[10px] text-slate-400 pt-1">
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-cyan-900 border border-cyan-500 text-cyan-300 flex items-center justify-center font-bold">
                  ⊙
                </span>
                <span>Corriente Saliente (+Z): Giro antihorario</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-amber-900 border border-amber-500 text-amber-300 flex items-center justify-center font-bold">
                  ⊗
                </span>
                <span>Corriente Entrante (−Z): Giro horario</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ----------------- MODE: FARADAY ----------------- */}
      {mode === 'faraday' && (
        <div className="space-y-3.5">
          <div className="flex items-center gap-2 pb-1 text-purple-400 font-bold border-b border-slate-800/60">
            <Sparkles className="w-4 h-4" />
            <span className="text-[11px]">INDUCCIÓN Y LEY DE LENZ</span>
          </div>

          <div className="p-3 bg-[#111827] rounded-xl border border-slate-800/80 space-y-2">
            <span className="font-semibold text-purple-300 text-[11px] flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-purple-400" /> Ley de Faraday-Lenz
            </span>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              La fuerza electromotriz (voltaje inducido) se genera únicamente al existir una variación temporal del flujo magnético:
            </p>
            <div className="p-2 bg-slate-950 rounded text-center font-mono text-purple-300 text-xs border border-slate-800">
              ε = −N · (dΦ_B / dt)
            </div>
            <p className="text-[10px] text-slate-400 leading-relaxed">
              El signo negativo (Lenz) refleja la resistencia natural al cambio: la corriente inducida crea un campo magnético que se opone al movimiento del imán.
            </p>
          </div>
        </div>
      )}

      {/* View Mode Contextual Card */}
      <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800/90 space-y-2">
        <div className="flex items-center gap-2">
          <Gauge className="w-4 h-4 text-emerald-400" />
          <span className="font-bold text-[11px] text-slate-200">
            {viewMode === 'explore' ? 'Modo Exploración Activo' : 'Modo Medición Científica'}
          </span>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed">
          {viewMode === 'explore'
            ? 'Los instrumentos priorizan la comprensión visual e intuitiva con indicadores cualitativos y colores claros.'
            : 'Los instrumentos despliegan datos con exactitud analítica y unidades del Sistema Internacional (SI) para reportes de laboratorio.'}
        </p>
      </div>
    </aside>
  );
};
