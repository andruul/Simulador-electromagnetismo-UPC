import React from 'react';
import { BookOpen, X, Zap, Compass, RotateCw, Atom } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl max-h-[88vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-sky-500/10 rounded-lg border border-sky-500/20 text-sky-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Guía y Fundamentos de Electromagnetismo</h2>
              <p className="text-xs text-slate-400">Leyes físicas, formulación matemática y aplicaciones prácticas</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm">
          {/* Section 1: Electrostática */}
          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Zap className="w-4 h-4" /> 1. Ley de Coulomb y Campo Eléctrico
            </div>
            <p className="text-slate-300 leading-relaxed">
              La fuerza electrostática entre dos cargas puntuales q₁ y q₂ separadas una distancia r está descrita por la <strong>Ley de Coulomb</strong>:
            </p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-center text-rose-300 text-sm">
              F = (1 / 4πε₀) · (|q₁ · q₂| / r²)
            </div>
            <p className="text-slate-300 leading-relaxed">
              El <strong>campo eléctrico E</strong> representa la fuerza por unidad de carga que experimentaría una carga de prueba positiva. Las líneas de campo nacen en las cargas positivas (fuentes) y mueren en las negativas (sumideros).
            </p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-center text-rose-300 text-sm">
              E(r) = ∑ (k · qᵢ / rᵢ³) · r⃗ᵢ &nbsp;&nbsp;|&nbsp;&nbsp; V(r) = ∑ (k · qᵢ / rᵢ)
            </div>
            <div className="text-xs text-slate-400 border-l-2 border-rose-500/50 pl-3">
              <strong>Superficies Equipotenciales:</strong> Son regiones donde el potencial eléctrico V es idéntico en todos sus puntos. En cualquier lugar, el vector de campo eléctrico es rigurosamente perpendicular a las curvas equipotenciales (E = −∇V).
            </div>
          </div>

          {/* Section 2: Fuerza de Lorentz */}
          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
              <RotateCw className="w-4 h-4" /> 2. Dinámica de Partículas y Fuerza de Lorentz
            </div>
            <p className="text-slate-300 leading-relaxed">
              Cuando una partícula con carga q se desplaza con velocidad v en presencia simultánea de un campo eléctrico E y un campo magnético B, experimenta la <strong>Fuerza de Lorentz</strong>:
            </p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-center text-sky-300 text-sm">
              F⃗ = q · (E⃗ + v⃗ × B⃗)
            </div>
            <p className="text-slate-300 leading-relaxed">
              Propiedad fundamental: El campo magnético <strong>no realiza trabajo</strong> sobre la partícula (W = F_B · v = 0), ya que la fuerza magnética es siempre perpendicular a la velocidad instantánea. Por tanto, el campo magnético curva la trayectoria pero conserva inalterada su energía cinética.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-semibold text-emerald-400">Radio de Larmor (Giro orbital):</span>
                <div className="font-mono text-slate-300 mt-1">r_L = (m · v_⊥) / (|q| · B)</div>
                <p className="text-slate-400 mt-1">Determina el radio del movimiento circular/helicoidal de la partícula.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-semibold text-purple-400">Frecuencia de Ciclotrón:</span>
                <div className="font-mono text-slate-300 mt-1">f_c = (|q| · B) / (2π · m)</div>
                <p className="text-slate-400 mt-1">Es independiente de la velocidad y el radio de la órbita (principio del ciclotrón).</p>
              </div>
            </div>
          </div>

          {/* Section 3: Fenómenos electromagnéticos especiales */}
          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Atom className="w-4 h-4" /> 3. Fenómenos y Configuraciones Especiales
            </div>
            <ul className="space-y-2 text-slate-300 list-disc list-inside">
              <li>
                <strong className="text-amber-300">Filtro de Wien (Selector de Velocidades):</strong> Campos E y B perpendiculares entre sí y a la velocidad. Solo las partículas con rapidez exacta v = E/B experimentan fuerza neta cero y atraviesan en línea recta.
              </li>
              <li>
                <strong className="text-amber-300">Deriva E × B (Drift Velocity):</strong> En plasmas y campos cruzados, la curvatura asimétrica genera un desplazamiento lateral constante perpendicular a ambos campos con velocidad v_d = (E × B) / B².
              </li>
              <li>
                <strong className="text-amber-300">Espejo y Botella Magnética:</strong> En zonas donde las líneas de campo convergen, el gradiente de campo magnético genera una fuerza paralela opuesta que frena y refleja a las partículas cargadas, permitiendo el confinamiento en reactores de fusión nuclear (Tokamak) y en los cinturones de radiación de Van Allen de la Tierra.
              </li>
            </ul>
          </div>

          {/* Section 4: Magnetostática */}
          <div className="bg-slate-950/40 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <Compass className="w-4 h-4" /> 4. Ley de Biot-Savart y Regla de la Mano Derecha
            </div>
            <p className="text-slate-300 leading-relaxed">
              Cualquier corriente eléctrica estacionaria genera un campo magnético a su alrededor. Para un hilo conductor rectilíneo muy largo:
            </p>
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800 font-mono text-center text-cyan-300 text-sm">
              B = (μ₀ · I) / (2π · r)
            </div>
            <p className="text-slate-300 leading-relaxed">
              <strong>Regla de la Mano Derecha:</strong> Al orientar el pulgar derecho en el sentido de la corriente eléctrica (I), los demás dedos se curvan indicando el sentido de las líneas de inducción magnética concéntricas. Dos conductores con corrientes en el mismo sentido se atraen mutuamente, mientras que corrientes opuestas se repelen.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl font-medium text-xs transition-colors cursor-pointer"
          >
            Entendido, volver a la simulación
          </button>
        </div>
      </div>
    </div>
  );
};
