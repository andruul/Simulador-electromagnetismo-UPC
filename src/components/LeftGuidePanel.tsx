import React from 'react';
import type { SimulationMode, ViewMode } from '../types';
import {
  Compass,
  Zap,
  RotateCw,
  Sparkles,
  CircleDot,
  BatteryCharging,
  Eye,
  Hand,
  Lightbulb,
  Target,
  FlaskConical,
  HelpCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface LeftGuidePanelProps {
  mode: SimulationMode;
  viewMode: ViewMode;
  isOpen: boolean;
  onToggle: () => void;
  onApplyPreset: (presetKey: string) => void;
  onOpenTheory: () => void;
}

interface GuideContent {
  title: string;
  roomName: string;
  icon: React.ReactNode;
  interact: string;
  observe: string;
  keyConcept: string;
  exploreChallenge: string;
  labObjective: string;
  formula: string;
  presets: {
    key: string;
    label: string;
    desc: string;
    icon: string;
  }[];
}

const GUIDE_DATA: Record<string, GuideContent> = {
  electrostatics: {
    title: 'Electrostática & Ley de Coulomb',
    roomName: 'Sala 1 • Fuerzas & Campo E',
    icon: <Zap className="w-4 h-4 text-rose-400" />,
    interact: 'Arrastra las cargas positivas (+) o negativas (−) con el ratón. Mueve el sensor amarillo de prueba.',
    observe: 'Las líneas rojas nacen en (+) y mueren en (−). El mapa de calor muestra el voltaje: rojo (alto), azul (negativo).',
    keyConcept: 'Cargas del mismo signo se repelen; cargas opuestas se atraen con una fuerza proporcional a 1/r².',
    exploreChallenge: '¿Puedes encontrar el punto neutro en medio de dos cargas iguales donde el campo eléctrico sea cero?',
    labObjective: 'Comprobar la superposición vectorial E = ∑ k·q/r² y la ortogonalidad con curvas equipotenciales (E = −∇V).',
    formula: 'F = k·|q₁·q₂| / r²',
    presets: [
      { key: 'dipole', label: 'Dipolo Eléctrico', desc: 'Una carga (+) y una (−)', icon: '⚡' },
      { key: 'repulsion', label: 'Cargas Iguales', desc: 'Dos cargas (+) que se repelen', icon: '↔️' },
      { key: 'quadrupole', label: 'Cuadrupolo', desc: '4 cargas alternadas', icon: '💠' },
      { key: 'capacitor', label: 'Placas Paralelas', desc: 'Fila de (+) frente a fila de (−)', icon: '⏸️' },
      { key: 'single', label: 'Carga Aislada', desc: 'Campo radial puro', icon: '☀️' }
    ]
  },
  gauss: {
    title: 'Ley de Gauss & Flujo Eléctrico',
    roomName: 'Sala 2 • Flujo & Superficies',
    icon: <CircleDot className="w-4 h-4 text-emerald-400" />,
    interact: 'Arrastra la superficie gaussiana (esfera o caja) o mueve las cargas dentro y fuera del contorno.',
    observe: 'Los vectores normales n̂ (amarillos) y de campo E (cian) miden el flujo superficial. El medidor compara la integral con Q/ε₀.',
    keyConcept: 'Solo las cargas DENTRO de la superficie generan flujo neto. Las cargas exteriores entran y salen cancelando su aporte.',
    exploreChallenge: 'Coloca una carga fuera de la superficie y comprueba que el flujo total siempre da 0 N·m²/C.',
    labObjective: 'Verificar numéricamente la Ley de Gauss: ∮ E · dA = Q_enc / ε₀ con tolerancia < 1%.',
    formula: 'Φ_E = ∮ E · dA = Q_enc / ε₀',
    presets: [
      { key: 'monopole', label: 'Carga Central', desc: 'Monopolo centrado en la esfera', icon: '🎯' },
      { key: 'dipole', label: 'Dipolo Interno', desc: 'Carga neta 0 => Flujo = 0', icon: '⚖️' },
      { key: 'external', label: 'Cargas Externas', desc: 'Cargas fuera => Flujo = 0', icon: '🚪' },
      { key: 'mixed', label: 'Configuración Mixta', desc: 'Cargas dentro y fuera simultáneas', icon: '🎲' }
    ]
  },
  capacitor: {
    title: 'Capacitancia & Dieléctricos',
    roomName: 'Sala 3 • Condensadores (PhET)',
    icon: <BatteryCharging className="w-4 h-4 text-amber-400" />,
    interact: 'Varía la separación d y área A de las placas. Desliza la barra de material dieléctrico (teflón, papel, vidrio).',
    observe: 'Al meter el aislante, la capacitancia se multiplica por κ. Si desconectas la batería, la carga queda atrapada y el voltaje cae.',
    keyConcept: 'Un capacitor almacena energía en su campo eléctrico interno. El dieléctrico se polariza y ayuda a guardar más carga.',
    exploreChallenge: 'Desconecta la batería (interruptor en OFF) e inserta el vidrio. ¿Por qué disminuye el voltaje entre placas?',
    labObjective: 'Medir la capacitancia C = κε₀A/d y la energía almacenada U = ½ C V² usando el voltímetro flotante.',
    formula: 'C = κ·ε₀·A / d',
    presets: [
      { key: 'vacuum', label: 'Placas al Vacío', desc: 'Sin dieléctrico (κ = 1.0)', icon: '🌌' },
      { key: 'teflon', label: 'Dieléctrico Teflón', desc: 'Placa con κ = 2.1 insertada', icon: '🧈' },
      { key: 'glass', label: 'Vidrio Pyrex (κ=5.6)', desc: 'Alta polarización y capacitancia', icon: '🪟' },
      { key: 'trapped', label: 'Batería Desconectada', desc: 'Carga Q fija atrapada en placas', icon: '🔒' }
    ]
  },
  magnetostatics: {
    title: 'Magnetostática & Corrientes',
    roomName: 'Sala 4 • Biot-Savart & Ampère',
    icon: <Compass className="w-4 h-4 text-teal-400" />,
    interact: 'Arrastra los conductores con corriente saliente (⊙) o entrante (⊗). Mueve la brújula para ver su orientación.',
    observe: 'El campo magnético forma anillos circulares concéntricos cerrados (no existen monopolos magnéticos).',
    keyConcept: 'Regla de la mano derecha: apunta tu pulgar en la dirección de la corriente y tus dedos señalan el giro del campo B.',
    exploreChallenge: 'Coloca dos cables con corrientes en el mismo sentido: ¿las líneas se abrazan (atracción) o se esquivan?',
    labObjective: 'Calcular el campo B = μ₀·I / (2π·r) y la fuerza magnética por unidad de longitud entre conductores paralelos.',
    formula: 'B = (μ₀·I) / (2π·r)',
    presets: [
      { key: 'parallel_attraction', label: 'Hilos Paralelos (Atracción)', desc: 'Mismo sentido de corriente', icon: '🧲' },
      { key: 'parallel_repulsion', label: 'Hilos Opuestos (Repulsión)', desc: 'Corrientes en sentido contrario', icon: '💥' },
      { key: 'solenoid', label: 'Solenoide / Bobina', desc: 'Campo uniforme e intenso en el centro', icon: '🌀' },
      { key: 'single', label: 'Hilo Simple', desc: 'Círculos concéntricos canónicos', icon: '⭕' }
    ]
  },
  lorentz3d: {
    title: 'Dinámica 3D & Fuerza de Lorentz',
    roomName: 'Sala 5 • Partículas en E y B',
    icon: <RotateCw className="w-4 h-4 text-sky-400" />,
    interact: 'Gira la vista 3D con clic izquierdo y rueda del ratón. Añade partículas (+) o (−) y cambia B_z o E_y.',
    observe: 'La fuerza magnética es perpendicular a la velocidad: nunca acelera la partícula en rapidez, solo curva su trayectoria.',
    keyConcept: 'F = q(E + v × B). En un campo magnético puro la partícula describe un círculo o hélice con radio de Larmor.',
    exploreChallenge: 'En el Selector de Velocidades, ¿por qué solo una partícula pasa recta mientras las otras se desvían?',
    labObjective: 'Verificar el radio de Larmor r_L = m·v_⊥ / (|q|·B) y la frecuencia ciclotrón f_c = |q|·B / (2π·m).',
    formula: 'F⃗ = q·(E⃗ + v⃗ × B⃗)',
    presets: [
      { key: 'helix', label: 'Hélice Magnética (B puro)', desc: 'Giro circular uniforme con avance en Z', icon: '🧬' },
      { key: 'velocity_selector', label: 'Filtro de Wien (v = E/B)', desc: 'Partículas rectas vs desviadas', icon: '🎯' },
      { key: 'drift', label: 'Deriva E × B (Cicloide)', desc: 'Movimiento característico de plasmas', icon: '〰️' },
      { key: 'magnetic_bottle', label: 'Botella Magnética', desc: 'Reflexión en extremos (Tokamak)', icon: '🍾' },
      { key: 'cyclotron', label: 'Ciclotrón Acelerador', desc: 'Brecha de aceleración resonante', icon: '⚡' }
    ]
  },
  faraday: {
    title: 'Inducción de Faraday & Lenz',
    roomName: 'Sala 6 • Inducción Electromagnética',
    icon: <Sparkles className="w-4 h-4 text-purple-400" />,
    interact: 'Arrastra el imán permanente a través de la bobina. Modifica el número de espiras N (1 a 4).',
    observe: 'La aguja del galvanómetro se mueve y la bombilla se enciende SOLO MIENTRAS EL IMÁN SE MUEVE. Si se detiene, el voltaje es cero.',
    keyConcept: 'Ley de Lenz: La corriente inducida se opone siempre al cambio que la produce (principio de inercia electromagnética).',
    exploreChallenge: 'Introduce el polo Norte y mira hacia dónde va la aguja. Ahora sácalo: ¿por qué la aguja deflexiona hacia el otro lado?',
    labObjective: 'Comprobar la Ley de Faraday: ε = −N (dΦ_B/dt) y relacionar la potencia disipada con la luminosidad de la bombilla.',
    formula: 'ε = −N · (dΦ_B / dt)',
    presets: [
      { key: 'oscillate', label: 'Oscilación Automática', desc: 'Movimiento armónico continuo del imán', icon: '🔁' },
      { key: 'fast_in', label: 'Entrada Rápida Norte', desc: 'Pulso fuerte de voltaje positivo', icon: '⚡' },
      { key: 'slow_pass', label: 'Paso Suave', desc: 'Observa la inversión de signo al salir', icon: '🌊' },
      { key: 'flip_poles', label: 'Invertir Polos (S - N)', desc: 'Invierte la polaridad inducida', icon: '🔄' }
    ]
  }
};

export const LeftGuidePanel: React.FC<LeftGuidePanelProps> = ({
  mode,
  viewMode,
  isOpen,
  onToggle,
  onApplyPreset,
  onOpenTheory
}) => {
  const content = GUIDE_DATA[mode] || GUIDE_DATA['electrostatics'];

  if (!isOpen) {
    return (
      <div className="h-full bg-slate-950 border-r border-slate-800/80 flex flex-col items-center py-3 px-1 z-20 flex-shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group shadow-md"
          title="Abrir Guía y Experimentos Rápidos"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 mt-6 flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3 text-emerald-400 rotate-90" />
          <span>Guía & Experimentos</span>
        </span>
      </div>
    );
  }

  return (
    <aside className="w-72 h-full bg-[#0d131f] border-r border-slate-800/90 flex flex-col select-none flex-shrink-0 z-20 shadow-xl overflow-hidden text-slate-200">
      {/* Panel Header */}
      <div className="h-11 px-3 border-b border-slate-800/80 bg-slate-950/70 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            {content.icon}
          </div>
          <div>
            <h2 className="text-xs font-bold text-white tracking-wide leading-tight">
              GUÍA DEL EXPERIMENTO
            </h2>
            <p className="text-[10px] text-emerald-400 font-medium leading-none">
              {content.roomName}
            </p>
          </div>
        </div>

        <button
          onClick={onToggle}
          className="p-1 text-slate-400 hover:text-white hover:bg-slate-850 rounded transition-colors cursor-pointer"
          title="Colapsar panel de guía"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3.5 text-xs">
        {/* Step-by-Step Pedagogical Card: ¿Cómo funciona? */}
        <div className="bg-[#111827] rounded-xl border border-slate-800/90 p-3 space-y-2.5 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-1.5">
            <span className="font-bold text-slate-200 text-[11px] flex items-center gap-1.5">
              <HelpCircle className="w-3.5 h-3.5 text-sky-400" />
              <span>¿Cómo usar este laboratorio?</span>
            </span>
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
              3 Pasos
            </span>
          </div>

          {/* Step 1: Interact */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <span className="font-semibold text-emerald-300 text-[11px] flex items-center gap-1">
                <Hand className="w-3 h-3" /> Interactúa
              </span>
              <p className="text-slate-400 text-[11px] leading-snug mt-0.5">
                {content.interact}
              </p>
            </div>
          </div>

          {/* Step 2: Observe */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-sky-500/15 border border-sky-500/40 text-sky-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <span className="font-semibold text-sky-300 text-[11px] flex items-center gap-1">
                <Eye className="w-3 h-3" /> Observa
              </span>
              <p className="text-slate-400 text-[11px] leading-snug mt-0.5">
                {content.observe}
              </p>
            </div>
          </div>

          {/* Step 3: Key Concept */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/40 text-amber-400 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="font-semibold text-amber-300 text-[11px] flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Concepto Clave
              </span>
              <p className="text-slate-300 text-[11px] leading-snug mt-0.5 font-medium">
                {content.keyConcept}
              </p>
            </div>
          </div>
        </div>

        {/* Mode-Specific Objective / Challenge Card */}
        {viewMode === 'explore' ? (
          <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 space-y-1">
            <span className="font-bold text-[11px] text-emerald-300 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-emerald-400" /> Reto de Exploración:
            </span>
            <p className="text-[11px] text-slate-300 leading-snug">
              {content.exploreChallenge}
            </p>
          </div>
        ) : (
          <div className="bg-sky-950/30 border border-sky-500/30 rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-[11px] text-sky-300 flex items-center gap-1.5">
                <FlaskConical className="w-3.5 h-3.5 text-sky-400" /> Objetivo de Medición:
              </span>
              <span className="text-[9px] font-mono text-sky-400 bg-sky-950 px-1 py-0.2 rounded border border-sky-800">
                SI Exacto
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-snug">
              {content.labObjective}
            </p>
            <div className="p-1.5 bg-slate-900/90 rounded border border-slate-800 font-mono text-center text-sky-300 text-[11px]">
              {content.formula}
            </div>
          </div>
        )}

        {/* 1-Click Presets: "Experimentos con 1 Clic" */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-300 text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Experimentos con 1 Clic</span>
            </span>
            <span className="text-[9px] text-slate-500">Cargar rápido</span>
          </div>

          <div className="space-y-1.5">
            {content.presets.map((p) => (
              <button
                key={p.key}
                onClick={() => onApplyPreset(p.key)}
                className="w-full text-left p-2 rounded-lg bg-[#111827] hover:bg-slate-800/90 border border-slate-800 hover:border-emerald-500/40 transition-all cursor-pointer group flex items-start gap-2 shadow-sm"
              >
                <span className="text-base leading-none p-1 bg-slate-900 rounded group-hover:scale-110 transition-transform">
                  {p.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-slate-200 group-hover:text-emerald-300 text-[11px] truncate">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight truncate">
                    {p.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Theory Callout */}
        <button
          onClick={onOpenTheory}
          className="w-full py-2 px-3 rounded-lg bg-indigo-950/40 hover:bg-indigo-900/60 border border-indigo-500/30 text-indigo-300 text-[11px] font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
        >
          <Lightbulb className="w-3.5 h-3.5 text-indigo-400" />
          <span>¿Quieres la explicación completa? Ver Teoría</span>
        </button>
      </div>
    </aside>
  );
};
