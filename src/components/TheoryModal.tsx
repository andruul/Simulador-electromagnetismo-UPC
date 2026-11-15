import React from 'react';
import {
  BookOpen,
  X,
  Zap,
  Compass,
  RotateCw,
  Atom,
  Sparkles,
  Layers,
  CircleDot,
  Lightbulb
} from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-wide">
                Teoría Explicada Fácil • Física de Electromagnetismo UPC
              </h2>
              <p className="text-xs text-slate-400">
                Intuición cotidiana, conceptos clave y formulación matemática rigurosa
              </p>
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
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-base">
              <Zap className="w-4 h-4" /> 1. Ley de Coulomb y Campo Eléctrico
            </div>

            {/* Pedagogical Callout */}
            <div className="p-3 bg-rose-500/10 rounded-lg border border-rose-500/30 text-xs text-rose-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-rose-300">
                <Lightbulb className="w-3.5 h-3.5 text-rose-400" />
                <span>En palabras simples / Ejemplo cotidiano:</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Frotar un globo en tu cabello y acercarlo a pequeños trozos de papel o la pantalla de un televisor antiguo. Cargas del mismo signo se rechazan como dos personas enojadas; cargas opuestas se atraen con fuerza. Cuanto más lejos estén, menor es su atracción (decae con el cuadrado de la distancia).
              </p>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              La fuerza electrostática entre dos cargas puntuales q₁ y q₂ en el vacío sigue la <strong>Ley de Coulomb</strong>:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-rose-300 text-xs">
              F = (1 / 4πε₀) · (|q₁ · q₂| / r²) · r̂
            </div>
            <p className="text-slate-300 leading-relaxed text-xs">
              El <strong>campo eléctrico E</strong> es la perturbación que una carga crea en el espacio a su alrededor:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-rose-300 text-xs">
              E(r) = ∑ (k · qᵢ / rᵢ³) · r⃗ᵢ &nbsp;&nbsp;|&nbsp;&nbsp; V(r) = ∑ (k · qᵢ / rᵢ)
            </div>
            <div className="text-xs text-slate-400 border-l-2 border-rose-500/50 pl-3">
              <strong>Superficies Equipotenciales:</strong> Curvas donde el voltaje es constante. El campo eléctrico siempre apunta perpendicular a ellas, en la dirección donde el potencial decrece más rápido (E = −∇V).
            </div>
          </div>

          {/* Section 2: Ley de Gauss */}
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base">
              <CircleDot className="w-4 h-4" /> 2. Ley de Gauss y Flujo Eléctrico
            </div>

            {/* Pedagogical Callout */}
            <div className="p-3 bg-cyan-500/10 rounded-lg border border-cyan-500/30 text-xs text-cyan-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-cyan-300">
                <Lightbulb className="w-3.5 h-3.5 text-cyan-400" />
                <span>En palabras simples / Ejemplo cotidiano:</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Imagina una bombilla encendida dentro de una caja de cartón o una red de pescar en un río. La cantidad de rayos de luz que salen de la caja solo depende de cuántas bombillas hay dentro. Si una bombilla está AFUERA de la caja, sus rayos entran por un lado y salen por el otro, dando un flujo neto de cero.
              </p>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              El flujo eléctrico neto a través de cualquier superficie cerrada es proporcional a la carga interior neta:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-cyan-300 text-xs">
              Φ_E = ∮ E⃗ · dA⃗ = Q_enc / ε₀
            </div>
            <div className="text-xs text-slate-400 border-l-2 border-cyan-500/50 pl-3">
              <strong>Regla fundamental:</strong> El flujo total no depende de la forma ni del tamaño de la superficie gaussiana, únicamente de la suma de cargas que estén encerradas en su interior.
            </div>
          </div>

          {/* Section 3: Capacitancia */}
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-base">
              <Layers className="w-4 h-4" /> 3. Capacitancia y Dieléctricos
            </div>

            {/* Pedagogical Callout */}
            <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/30 text-xs text-amber-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-amber-300">
                <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
                <span>En palabras simples / Ejemplo cotidiano:</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Un condensador es como un tanque de agua o una esponja eléctrica que acumula energía rápidamente para soltarla en una ráfaga potente (como el flash de una cámara de fotos o un desfibrilador médico). Poner un aislante (dieléctrico) entre las placas es como reforzar las paredes del tanque para meter mucha más carga con el mismo voltaje.
              </p>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              Para placas paralelas de área A y separación d con un medio dieléctrico de constante κ:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-amber-300 text-xs">
              C = κ · ε₀ · (A / d) &nbsp;&nbsp;|&nbsp;&nbsp; Q = C · V &nbsp;&nbsp;|&nbsp;&nbsp; U = ½ C · V²
            </div>
            <div className="text-xs text-slate-400 border-l-2 border-amber-500/50 pl-3">
              <strong>Batería conectada vs desconectada:</strong> Con batería conectada, el voltaje V se mantiene fijo. Con batería desconectada, la carga Q queda atrapada (constante); si insertas un dieléctrico, la capacitancia sube y el voltaje disminuye.
            </div>
          </div>

          {/* Section 4: Magnetostática */}
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-teal-400 font-bold text-base">
              <Compass className="w-4 h-4" /> 4. Ley de Biot-Savart y Regla de la Mano Derecha
            </div>

            {/* Pedagogical Callout */}
            <div className="p-3 bg-teal-500/10 rounded-lg border border-teal-500/30 text-xs text-teal-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-teal-300">
                <Lightbulb className="w-3.5 h-3.5 text-teal-400" />
                <span>En palabras simples / Ejemplo cotidiano:</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Los electroimanes de grúas que levantan autos chatarra. Cada vez que pasa corriente por un cable, el espacio alrededor se magnetiza en círculos concéntricos. Si colocas dos cables paralelos con corriente hacia el mismo lado, se atraen como dos imanes.
              </p>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              Campo magnético a una distancia r de un hilo conductor rectilíneo muy largo que transporta corriente I:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-teal-300 text-xs">
              B = (μ₀ · I) / (2π · r) &nbsp;&nbsp;|&nbsp;&nbsp; ∮ B⃗ · dl⃗ = μ₀ · I_enc
            </div>
            <div className="text-xs text-slate-400 border-l-2 border-teal-500/50 pl-3">
              <strong>Regla de la Mano Derecha:</strong> Si tu pulgar apunta hacia donde viaja la corriente eléctrica, tus cuatro dedos curvados señalan la dirección en la que gira el campo magnético B.
            </div>
          </div>

          {/* Section 5: Fuerza de Lorentz */}
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-base">
              <RotateCw className="w-4 h-4" /> 5. Dinámica de Partículas y Fuerza de Lorentz (3D)
            </div>

            {/* Pedagogical Callout */}
            <div className="p-3 bg-sky-500/10 rounded-lg border border-sky-500/30 text-xs text-sky-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-sky-300">
                <Lightbulb className="w-3.5 h-3.5 text-sky-400" />
                <span>En palabras simples / Ejemplo cotidiano:</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Las Auroras Boreales. La Tierra tiene un gigantesco campo magnético que atrapa los electrones y protones provenientes del Sol, obligándolos a girar en espiral hacia los polos, protegiendo la atmósfera sin frenar la velocidad de las partículas, solo doblando su rumbo.
              </p>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              Una partícula de carga q que viaja con velocidad v bajo campos eléctrico E y magnético B experimenta:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-sky-300 text-xs">
              F⃗ = q · (E⃗ + v⃗ × B⃗)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-semibold text-emerald-400">Radio de Larmor (Giro orbital):</span>
                <div className="font-mono text-slate-300 mt-1">r_L = (m · v_⊥) / (|q| · B)</div>
                <p className="text-slate-400 mt-1">Determina el radio de la trayectoria circular o helicoidal.</p>
              </div>
              <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                <span className="font-semibold text-purple-400">Frecuencia de Ciclotrón:</span>
                <div className="font-mono text-slate-300 mt-1">f_c = (|q| · B) / (2π · m)</div>
                <p className="text-slate-400 mt-1">Frecuencia natural de resonancia de partículas en ciclotrones.</p>
              </div>
            </div>
          </div>

          {/* Section 6: Ley de Faraday */}
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-base">
              <Sparkles className="w-4 h-4" /> 6. Inducción de Faraday y Ley de Lenz
            </div>

            {/* Pedagogical Callout */}
            <div className="p-3 bg-purple-500/10 rounded-lg border border-purple-500/30 text-xs text-purple-200 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-purple-300">
                <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                <span>En palabras simples / Ejemplo cotidiano:</span>
              </div>
              <p className="leading-relaxed text-slate-300">
                Generadores hidroeléctricos, recarga inalámbrica del smartphone o frenos magnéticos de trenes bala. Mover un imán a través de una bobina de cobre empuja a los electrones creando corriente eléctrica sin necesidad de pilas ni contacto físico. Si el imán se detiene, la electricidad desaparece al instante.
              </p>
            </div>

            <p className="text-slate-300 leading-relaxed text-xs">
              El voltaje o fuerza electromotriz inducida ε depende de la rapidez con la que cambia el flujo magnético en el tiempo:
            </p>
            <div className="p-2.5 bg-slate-900/90 rounded-lg border border-slate-800 font-mono text-center text-purple-300 text-xs">
              ε = −N · (dΦ_B / dt) &nbsp;&nbsp;|&nbsp;&nbsp; Φ_B = ∬ B⃗ · dA⃗
            </div>
            <div className="text-xs text-slate-400 border-l-2 border-purple-500/50 pl-3">
              <strong>Ley de Lenz (el signo menos):</strong> La naturaleza se resiste al cambio: la corriente inducida genera su propio campo magnético para intentar frenar al imán que se acerca o retener al imán que se aleja.
            </div>
          </div>

          {/* Section 7: Aplicaciones Tecnológicas */}
          <div className="bg-slate-950/50 p-5 rounded-xl border border-slate-800/80 space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-base">
              <Atom className="w-4 h-4" /> 7. Fenómenos Especiales y Aplicaciones Avanzadas
            </div>
            <ul className="space-y-2 text-slate-300 list-disc list-inside text-xs leading-relaxed">
              <li>
                <strong className="text-amber-300">Filtro de Wien (Selector de Velocidades):</strong> Campos E y B cruzados a 90°. Solo las partículas con velocidad exacta v = E/B experimentan fuerza resultante neta cero y continúan en línea recta.
              </li>
              <li>
                <strong className="text-amber-300">Deriva E × B (Drift de Plasma):</strong> El radio de giro cambia periódicamente porque el campo eléctrico acelera y desacelera la carga, produciendo un avance lateral perpendicular a E y B.
              </li>
              <li>
                <strong className="text-amber-300">Botella Magnética (Espejo Magnético):</strong> En regiones donde las líneas de campo convergen, el gradiente produce una fuerza que refleja la partícula hacia atrás. Es la base del confinamiento magnético en reactores de fusión nuclear (Tokamaks).
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <span className="text-xs text-slate-400">
            Universidad Popular del Cesar • Departamento de Física y Ciencias Básicas
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium text-xs transition-colors cursor-pointer"
          >
            Entendido, volver al simulador
          </button>
        </div>
      </div>
    </div>
  );
};
export default TheoryModal;
