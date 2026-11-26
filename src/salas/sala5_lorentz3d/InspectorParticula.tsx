import React from 'react';
import type { Particle3D } from '../../tipos';
import { vectorLength } from '../../fisica/lorentz';
import { X, Trash2, Sparkles, Sliders } from 'lucide-react';

interface InspectorParticulaProps {
  particles: Particle3D[];
  selectedParticle: Particle3D;
  onSelectParticle: (id: string) => void;
  onUpdateParticle: (id: string, updater: (p: Particle3D) => Particle3D) => void;
  onDeleteParticle: (id: string) => void;
  onClose: () => void;
}

function colorForCharge(q: number): string {
  if (q > 0.01) return '#D95B5F';
  if (q < -0.01) return '#3E82AA';
  return '#78716C';
}

export const InspectorParticula: React.FC<InspectorParticulaProps> = ({
  particles,
  selectedParticle,
  onSelectParticle,
  onUpdateParticle,
  onDeleteParticle,
  onClose
}) => {
  const currentIndex = particles.findIndex((p) => p.id === selectedParticle.id);
  const currentSpeed = vectorLength(selectedParticle.velocity);

  const handleSpeedChange = (newSpeed: number) => {
    onUpdateParticle(selectedParticle.id, (p) => {
      const len = vectorLength(p.velocity);
      const nextVel =
        len > 1e-6
          ? {
              x: (p.velocity.x / len) * newSpeed,
              y: (p.velocity.y / len) * newSpeed,
              z: (p.velocity.z / len) * newSpeed
            }
          : { x: newSpeed, y: 0, z: 0 };
      return {
        ...p,
        velocity: nextVel,
        initialVelocity: { ...nextVel }
      };
    });
  };

  const handleVelocityComponent = (axis: 'x' | 'y' | 'z', rawValue: string) => {
    const val = Number.parseFloat(rawValue);
    if (Number.isNaN(val)) return;
    const clamped = Math.max(-15, Math.min(15, val));
    onUpdateParticle(selectedParticle.id, (p) => {
      const nextVel = { ...p.velocity, [axis]: clamped };
      return {
        ...p,
        velocity: nextVel,
        initialVelocity: { ...nextVel }
      };
    });
  };

  const handleChargeChange = (newCharge: number) => {
    onUpdateParticle(selectedParticle.id, (p) => ({
      ...p,
      charge: newCharge,
      color: colorForCharge(newCharge)
    }));
  };

  const handleMassChange = (newMass: number) => {
    onUpdateParticle(selectedParticle.id, (p) => ({
      ...p,
      mass: Math.max(0.2, newMass)
    }));
  };

  const handleClearTrail = () => {
    onUpdateParticle(selectedParticle.id, (p) => ({
      ...p,
      trail: []
    }));
  };

  return (
    <div
      className="absolute top-4 left-4 w-72 max-w-[calc(100%-2rem)] bg-white/95 backdrop-blur-md rounded-xl border border-[#D5CEC6] shadow-lg text-xs text-[#231F1C] z-20 overflow-hidden"
      onPointerDown={(e) => e.stopPropagation()}
    >
      {/* Cabecera */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-[#E0D8CF] bg-[#FAF7F2]/80">
        <div className="flex items-center gap-2 font-bold text-[#231F1C]">
          <span
            className="w-3 h-3 rounded-full ring-2 ring-offset-1 ring-amber-400 shrink-0"
            style={{ backgroundColor: selectedParticle.color }}
          />
          <Sliders className="w-3.5 h-3.5 text-[#2D7A64]" />
          <span>
            Partícula #{currentIndex + 1}{' '}
            <span className="font-mono text-[10px] text-[#5C554E]">
              ({selectedParticle.charge > 0 ? '+' : ''}
              {selectedParticle.charge.toFixed(1)} C)
            </span>
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-[#5C554E] hover:text-[#231F1C] hover:bg-[#EDE8DF] rounded cursor-pointer"
          title="Cerrar inspector"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-3 space-y-3">
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
            <label className="text-[11px] font-semibold text-[#2D7A64]">Rapidez |v|</label>
            <span className="font-mono text-[11px] font-bold text-[#231F1C]">
              {currentSpeed.toFixed(2)} m/s
            </span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.1"
            value={Math.min(10, Number(currentSpeed.toFixed(2)))}
            onChange={(e) => handleSpeedChange(parseFloat(e.target.value))}
            className="w-full accent-[#2D7A64] cursor-pointer"
          />
        </div>

        {/* Componentes vectoriales vx, vy, vz */}
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-wide text-[#5C554E] mb-1">
            Componentes de velocidad (m/s)
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {(['x', 'y', 'z'] as const).map((axis) => (
              <label key={axis} className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono text-[#5C554E] pl-0.5">v_{axis}</span>
                <input
                  type="number"
                  step="0.2"
                  min="-15"
                  max="15"
                  value={Number(selectedParticle.velocity[axis].toFixed(2))}
                  onChange={(e) => handleVelocityComponent(axis, e.target.value)}
                  className="w-full px-1.5 py-1 text-[11px] font-mono bg-[#FAF7F2] border border-[#D5CEC6] rounded-md text-[#231F1C] focus:outline-none focus:border-[#2D7A64]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Carga eléctrica q */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-rose-700">Carga (q)</label>
            <span className="font-mono text-[11px] font-bold text-[#231F1C]">
              {selectedParticle.charge > 0 ? '+' : ''}
              {selectedParticle.charge.toFixed(1)} C
            </span>
          </div>
          <input
            type="range"
            min="-3"
            max="3"
            step="0.5"
            value={selectedParticle.charge}
            onChange={(e) => handleChargeChange(parseFloat(e.target.value))}
            className="w-full accent-[#D95B5F] cursor-pointer"
          />
          <div className="grid grid-cols-3 gap-1 mt-1">
            {[
              { label: '−1 C', val: -1 },
              { label: '0 (Neutra)', val: 0 },
              { label: '+1 C', val: 1 }
            ].map((opt) => (
              <button
                key={opt.val}
                onClick={() => handleChargeChange(opt.val)}
                className={`py-0.5 rounded text-[10px] border cursor-pointer transition-colors ${
                  Math.abs(selectedParticle.charge - opt.val) < 0.05
                    ? 'bg-[#231F1C] text-white border-[#231F1C]'
                    : 'bg-[#FAF7F2] text-[#4A4540] border-[#D5CEC6] hover:bg-[#EDE8DF]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Masa m */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] font-semibold text-indigo-700">Masa (m)</label>
            <span className="font-mono text-[11px] font-bold text-[#231F1C]">
              {selectedParticle.mass.toFixed(1)} kg
            </span>
          </div>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.5"
            value={selectedParticle.mass}
            onChange={(e) => handleMassChange(parseFloat(e.target.value))}
            className="w-full accent-indigo-600 cursor-pointer"
          />
        </div>

        {/* Acciones de partícula */}
        <div className="flex items-center gap-1.5 pt-2 border-t border-[#E2D9CC]">
          <button
            onClick={handleClearTrail}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg bg-[#FAF7F2] hover:bg-[#EDE8DF] text-[#4A4540] border border-[#D5CEC6] text-[11px] font-medium cursor-pointer"
          >
            <Sparkles className="w-3 h-3" /> Limpiar estela
          </button>
          <button
            onClick={() => onDeleteParticle(selectedParticle.id)}
            disabled={particles.length <= 1}
            className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-[11px] font-medium cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            title={particles.length <= 1 ? 'Debe quedar al menos una partícula' : 'Eliminar esta partícula'}
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
