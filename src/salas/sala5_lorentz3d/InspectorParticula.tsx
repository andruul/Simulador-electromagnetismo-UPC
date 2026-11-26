import React, { useEffect, useState } from 'react';
import type { Particle3D, Vector3D } from '../../tipos';
import { vectorLength } from '../../fisica/lorentz';
import { X, Trash2, Sparkles, Sliders, Check, Compass, Undo2, Redo2 } from 'lucide-react';

interface InspectorParticulaProps {
  particles: Particle3D[];
  selectedParticle: Particle3D;
  isStudio: boolean;
  canUndoParticles: boolean;
  canRedoParticles: boolean;
  onUndoParticles: () => void;
  onRedoParticles: () => void;
  onSelectParticle: (id: string) => void;
  onApplyParticleChanges: (
    id: string,
    patch: { velocity: Vector3D; charge: number; mass: number; color: string }
  ) => void;
  onClearTrail: (id: string) => void;
  onDeleteParticle: (id: string) => void;
  onClose: () => void;
}

function colorForCharge(q: number): string {
  if (q > 0.01) return '#D95B5F';
  if (q < -0.01) return '#3E82AA';
  return '#78716C';
}

/** Convierte un vector velocidad a coordenadas esféricas respecto al eje Z (líneas de B). */
function velocityToAngles(v: Vector3D): { speed: number; thetaDeg: number; phiDeg: number } {
  const speed = vectorLength(v);
  if (speed < 1e-6) {
    return { speed: 0, thetaDeg: 90, phiDeg: 0 };
  }
  const cosTheta = Math.max(-1, Math.min(1, v.z / speed));
  const thetaDeg = (Math.acos(cosTheta) * 180) / Math.PI;
  let phiDeg = (Math.atan2(v.y, v.x) * 180) / Math.PI;
  if (phiDeg < 0) phiDeg += 360;
  return { speed, thetaDeg, phiDeg };
}

/** Reconstruye (vx, vy, vz) exacto a partir de rapidez |v|, ángulo polar θ (con eje B/Z) y azimutal φ. */
function anglesToVelocity(speed: number, thetaDeg: number, phiDeg: number): Vector3D {
  const theta = (thetaDeg * Math.PI) / 180;
  const phi = (phiDeg * Math.PI) / 180;
  const sinT = Math.sin(theta);
  return {
    x: speed * sinT * Math.cos(phi),
    y: speed * sinT * Math.sin(phi),
    z: speed * Math.cos(theta)
  };
}

interface DraftState {
  speed: number;
  thetaDeg: number;
  phiDeg: number;
  vx: number;
  vy: number;
  vz: number;
  charge: number;
  mass: number;
}

function createDraftFromParticle(p: Particle3D): DraftState {
  const { speed, thetaDeg, phiDeg } = velocityToAngles(p.velocity);
  return {
    speed: Number(speed.toFixed(2)),
    thetaDeg: Math.round(thetaDeg),
    phiDeg: Math.round(phiDeg),
    vx: Number(p.velocity.x.toFixed(2)),
    vy: Number(p.velocity.y.toFixed(2)),
    vz: Number(p.velocity.z.toFixed(2)),
    charge: p.charge,
    mass: p.mass
  };
}

export const InspectorParticula: React.FC<InspectorParticulaProps> = ({
  particles,
  selectedParticle,
  isStudio,
  canUndoParticles,
  canRedoParticles,
  onUndoParticles,
  onRedoParticles,
  onSelectParticle,
  onApplyParticleChanges,
  onClearTrail,
  onDeleteParticle,
  onClose
}) => {
  const currentIndex = particles.findIndex((p) => p.id === selectedParticle.id);
  const [draft, setDraft] = useState<DraftState>(() => createDraftFromParticle(selectedParticle));
  const [isDirty, setIsDirty] = useState(false);

  // Sincronizar borrador al cambiar la partícula seleccionada
  useEffect(() => {
    setDraft(createDraftFromParticle(selectedParticle));
    setIsDirty(false);
    // Solo resincronizar cuando cambia el ID seleccionado para no pisar la edición en curso
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedParticle.id]);

  const updateFromSpherical = (nextSpeed: number, nextTheta: number, nextPhi: number) => {
    const v = anglesToVelocity(nextSpeed, nextTheta, nextPhi);
    setDraft((prev) => ({
      ...prev,
      speed: Number(nextSpeed.toFixed(2)),
      thetaDeg: nextTheta,
      phiDeg: nextPhi,
      vx: Number(v.x.toFixed(2)),
      vy: Number(v.y.toFixed(2)),
      vz: Number(v.z.toFixed(2))
    }));
    setIsDirty(true);
  };

  const updateFromComponent = (axis: 'vx' | 'vy' | 'vz', raw: string) => {
    const val = Number.parseFloat(raw);
    if (Number.isNaN(val)) return;
    const clamped = Math.max(-15, Math.min(15, val));
    setDraft((prev) => {
      const nextVec: Vector3D = {
        x: axis === 'vx' ? clamped : prev.vx,
        y: axis === 'vy' ? clamped : prev.vy,
        z: axis === 'vz' ? clamped : prev.vz
      };
      const { speed, thetaDeg, phiDeg } = velocityToAngles(nextVec);
      return {
        ...prev,
        [axis]: clamped,
        speed: Number(speed.toFixed(2)),
        thetaDeg: Math.round(thetaDeg),
        phiDeg: Math.round(phiDeg)
      };
    });
    setIsDirty(true);
  };

  const handleApply = () => {
    const exactVelocity = anglesToVelocity(draft.speed, draft.thetaDeg, draft.phiDeg);
    onApplyParticleChanges(selectedParticle.id, {
      velocity: exactVelocity,
      charge: draft.charge,
      mass: Math.max(0.2, draft.mass),
      color: colorForCharge(draft.charge)
    });
    setIsDirty(false);
  };

  const surfaceCls = isStudio
    ? 'bg-[#0F1624]/92 border-white/15 text-slate-100 shadow-2xl'
    : 'bg-white/95 border-[#D5CEC6] text-[#231F1C] shadow-lg';

  const subtleBg = isStudio ? 'bg-white/5 border-white/10' : 'bg-[#FAF7F2] border-[#D5CEC6]';
  const mutedText = isStudio ? 'text-slate-400' : 'text-[#5C554E]';

  return (
    <div
      className={`absolute top-14 left-4 w-80 max-w-[calc(100%-2rem)] max-h-[calc(100%-8.5rem)] overflow-y-auto backdrop-blur-md rounded-xl border text-xs z-20 ${surfaceCls}`}
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Cabecera */}
      <div
        className={`flex items-center justify-between px-3 py-2 border-b ${
          isStudio ? 'border-white/10 bg-white/5' : 'border-[#E0D8CF] bg-[#FAF7F2]/80'
        }`}
      >
        <div className="flex items-center gap-2 font-bold">
          <span
            className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-amber-400 shrink-0"
            style={{ backgroundColor: colorForCharge(draft.charge) }}
          />
          <Sliders className="w-3.5 h-3.5 text-[#2D7A64]" />
          <span>
            Partícula #{currentIndex + 1}{' '}
            <span className={`font-mono text-[10px] ${mutedText}`}>
              ({draft.charge > 0 ? '+' : ''}
              {draft.charge.toFixed(1)} C)
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={onUndoParticles}
            disabled={!canUndoParticles}
            className={`p-1 rounded cursor-pointer disabled:opacity-30 ${
              isStudio ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-[#EDE8DF] text-[#5C554E]'
            }`}
            title="Deshacer cambio de partícula"
          >
            <Undo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onRedoParticles}
            disabled={!canRedoParticles}
            className={`p-1 rounded cursor-pointer disabled:opacity-30 ${
              isStudio ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-[#EDE8DF] text-[#5C554E]'
            }`}
            title="Rehacer cambio de partícula"
          >
            <Redo2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onClose}
            className={`p-1 rounded cursor-pointer ${
              isStudio ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-[#EDE8DF] text-[#5C554E]'
            }`}
            title="Cerrar inspector"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2.5">
        {/* Selector rápido entre partículas si hay varias */}
        {particles.length > 1 && (
          <div className="flex flex-wrap gap-1">
            {particles.map((p, i) => {
              const isSelected = p.id === selectedParticle.id;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectParticle(p.id)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono border transition-colors cursor-pointer flex items-center gap-1 ${
                    isSelected
                      ? 'bg-[#2D7A64] text-white border-[#2D7A64] font-semibold'
                      : isStudio
                      ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                      : 'bg-[#FAF7F2] text-[#4A4540] border-[#D5CEC6] hover:bg-[#EDE8DF]'
                  }`}
                >
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: isSelected ? '#FFFFFF' : p.color }}
                  />
                  #{i + 1}
                </button>
              );
            })}
          </div>
        )}

        {/* Rapidez |v| exacta */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-emerald-500">Rapidez inicial |v|</label>
            <span className="font-mono text-[11px] font-bold">{draft.speed.toFixed(2)} m/s</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={Math.min(10, draft.speed)}
            onChange={(e) =>
              updateFromSpherical(parseFloat(e.target.value), draft.thetaDeg, draft.phiDeg)
            }
            className="w-full accent-[#2D7A64] cursor-pointer"
          />
        </div>

        {/* Ángulo respecto a las líneas de flujo (campo B / eje Z) */}
        <div className={`p-2 rounded-lg border space-y-2 ${subtleBg}`}>
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1 text-[10.5px] font-semibold text-sky-500">
              <Compass className="w-3 h-3" /> Ángulo con líneas de flujo (θ)
            </span>
            <span className="font-mono text-[11px] font-bold">{draft.thetaDeg}°</span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={draft.thetaDeg}
            onChange={(e) =>
              updateFromSpherical(draft.speed, parseInt(e.target.value, 10), draft.phiDeg)
            }
            className="w-full accent-sky-500 cursor-pointer"
          />
          <div className="grid grid-cols-4 gap-1">
            {[
              { label: '0° ∥', val: 0 },
              { label: '45° Hélice', val: 45 },
              { label: '90° ⊥', val: 90 },
              { label: '135°', val: 135 }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => updateFromSpherical(draft.speed, opt.val, draft.phiDeg)}
                className={`py-0.5 rounded text-[9.5px] border cursor-pointer transition-colors ${
                  Math.abs(draft.thetaDeg - opt.val) <= 2
                    ? 'bg-sky-600 text-white border-sky-600 font-semibold'
                    : isStudio
                    ? 'bg-white/5 text-slate-300 border-white/10 hover:bg-white/10'
                    : 'bg-white text-[#4A4540] border-[#D5CEC6] hover:bg-[#EDE8DF]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Azimutal φ */}
          <div className="pt-1">
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className={mutedText}>Orientación en plano XY (φ):</span>
              <span className="font-mono font-semibold">{draft.phiDeg}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              step="5"
              value={draft.phiDeg}
              onChange={(e) =>
                updateFromSpherical(draft.speed, draft.thetaDeg, parseInt(e.target.value, 10))
              }
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Componentes vectoriales (vx, vy, vz) sincronizadas con ángulos */}
        <div>
          <div className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${mutedText}`}>
            Vector velocidad (î, ĵ, k̂) m/s
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(
              [
                { key: 'vx', label: 'v_x (î)' },
                { key: 'vy', label: 'v_y (ĵ)' },
                { key: 'vz', label: 'v_z (k̂)' }
              ] as const
            ).map(({ key, label }) => (
              <label key={key} className="flex flex-col gap-0.5">
                <span className={`text-[9.5px] font-mono pl-0.5 ${mutedText}`}>{label}</span>
                <input
                  type="number"
                  step="0.2"
                  min="-15"
                  max="15"
                  value={draft[key]}
                  onChange={(e) => updateFromComponent(key, e.target.value)}
                  className={`w-full px-1.5 py-1 text-[11px] font-mono rounded-md border focus:outline-none focus:border-[#2D7A64] ${
                    isStudio
                      ? 'bg-slate-900/80 border-white/15 text-slate-100'
                      : 'bg-[#FAF7F2] border-[#D5CEC6] text-[#231F1C]'
                  }`}
                />
              </label>
            ))}
          </div>
        </div>

        {/* Carga eléctrica q y Masa m */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="font-semibold text-rose-500">Carga (q)</span>
              <span className="font-mono font-bold">
                {draft.charge > 0 ? '+' : ''}
                {draft.charge.toFixed(1)} C
              </span>
            </div>
            <input
              type="range"
              min="-3"
              max="3"
              step="0.5"
              value={draft.charge}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, charge: parseFloat(e.target.value) }));
                setIsDirty(true);
              }}
              className="w-full accent-[#D95B5F] cursor-pointer"
            />
          </div>

          <div>
            <div className="flex justify-between text-[10px] mb-0.5">
              <span className="font-semibold text-indigo-400">Masa (m)</span>
              <span className="font-mono font-bold">{draft.mass.toFixed(1)} kg</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="5"
              step="0.5"
              value={draft.mass}
              onChange={(e) => {
                setDraft((prev) => ({ ...prev, mass: parseFloat(e.target.value) }));
                setIsDirty(true);
              }}
              className="w-full accent-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Botón principal explícito: Aplicar cambios a la partícula */}
        <button
          onClick={handleApply}
          className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm ${
            isDirty
              ? 'bg-[#2D7A64] hover:bg-[#236250] text-white ring-2 ring-emerald-400/50'
              : isStudio
              ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
              : 'bg-[#2D7A64]/90 hover:bg-[#2D7A64] text-white'
          }`}
        >
          <Check className="w-3.5 h-3.5" />
          {isDirty ? 'Aplicar cambios a la partícula •' : 'Aplicar cambios a la partícula'}
        </button>

        {/* Acciones secundarias */}
        <div
          className={`flex items-center gap-1.5 pt-2 border-t ${
            isStudio ? 'border-white/10' : 'border-[#E2D9CC]'
          }`}
        >
          <button
            onClick={() => onClearTrail(selectedParticle.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg border text-[11px] font-medium cursor-pointer ${
              isStudio
                ? 'bg-white/5 hover:bg-white/10 text-slate-200 border-white/10'
                : 'bg-[#FAF7F2] hover:bg-[#EDE8DF] text-[#4A4540] border-[#D5CEC6]'
            }`}
          >
            <Sparkles className="w-3 h-3" /> Limpiar estela
          </button>
          <button
            onClick={() => onDeleteParticle(selectedParticle.id)}
            disabled={particles.length <= 1}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 text-[11px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={particles.length <= 1 ? 'Debe quedar al menos una partícula' : 'Eliminar esta partícula'}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
