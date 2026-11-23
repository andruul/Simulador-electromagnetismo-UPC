import React, { useState } from 'react';
import type { SimulationMode, ViewMode } from '../tipos';
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
import { CollapsibleSection } from './SeccionPlegable';

interface LeftGuidePanelProps {
  mode: SimulationMode;
  viewMode: ViewMode;
  isOpen: boolean;
  onToggle: () => void;
  onApplyPreset: (presetKey: string) => void;
  gaussDimMode?: '2d' | '3d';
  onGaussDimChange?: (dim: '2d' | '3d') => void;
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
    roomName: 'Sala 2 • Superficies en Plano 2D',
    icon: <CircleDot className="w-4 h-4 text-emerald-400" />,
    interact: 'Arrastra la superficie gaussiana (esfera o caja) o mueve las cargas dentro y fuera del contorno.',
    observe: 'Los vectores normales n̂ (amarillos) y de campo E (cian) miden el flujo superficial. El medidor compara la integral con Q/ε₀.',
    keyConcept: 'Solo las cargas DENTRO de la superficie cerrada generan flujo neto. Las cargas exteriores entran y salen cancelando su aporte.',
    exploreChallenge: 'Coloca una carga fuera de la superficie gaussiana y comprueba que el flujo total siempre da 0 N·m²/C (las líneas que entran son iguales a las que salen).',
    labObjective: 'Verificar numéricamente la Ley de Gauss: ∮ E · dA = Q_enc / ε₀ con tolerancia < 1%.',
    formula: 'Φ_E = ∮ E · dA = Q_enc / ε₀',
    presets: [
      { key: 'monopole', label: 'Carga Central', desc: 'Monopolo centrado en la esfera', icon: '🎯' },
      { key: 'dipole', label: 'Dipolo Interno', desc: 'Carga neta 0 => Flujo neto = 0', icon: '⚖️' },
      { key: 'external', label: 'Cargas Externas', desc: 'Cargas fuera => Flujo neto = 0', icon: '🚪' },
      { key: 'mixed', label: 'Configuración Mixta', desc: 'Cargas dentro y fuera simultáneas', icon: '🎲' }
    ]
  },
  gauss_3d: {
    title: 'Ley de Gauss 3D & Divergencia',
    roomName: 'Sala 2 • Espacio Volumétrico 3D',
    icon: <CircleDot className="w-4 h-4 text-teal-400" />,
    interact: 'Selecciona una figura 3D (Tetraedro, Cubo, Cilindro, Esfera) y ajusta los coeficientes del campo eléctrico E(x,y,z) con los deslizadores.',
    observe: 'El color de cada cara indica el signo del flujo: rojo (saliente), azul (entrante), esmeralda (tangencial). Rota la vista 3D con el ratón.',
    keyConcept: 'Teorema de la Divergencia de Gauss: el flujo total que atraviesa la superficie cerrada equivale a la integral de volumen: Φ = ∮ E·dA = ∭ (∇·E) dV = Q_enc / ε₀.',
    exploreChallenge: 'En el Tetraedro o Cubo, ajusta los coeficientes del campo divergente (E = αx î + βy ĵ + γz k̂) y comprueba cómo el balance de flujo en sus caras determina la carga encerrada sin necesidad de añadir cargas puntuales.',
    labObjective: 'Comprobar numéricamente el Teorema de Gauss en 3D: Φ_neto = ∮ E · dA con tolerancia < 1% frente a la divergencia analítica.',
    formula: 'Φ_E = ∮ E⃗ · dA⃗ = ∭ (∇ · E⃗) dV = Q_enc / ε₀',
    presets: [
      { key: 'tetra_divergent', label: 'Tetraedro Divergente 3D', desc: '4 caras en campo E = αx î + βy ĵ + γz k̂', icon: '🔺' },
      { key: 'cube_linear', label: 'Cubo en Campo Lineal', desc: 'Gradiente en X: E = (αx + β)î', icon: '🧊' },
      { key: 'cylinder_radial', label: 'Cilindro con Gradiente', desc: 'Flujo en manto lateral vs tapas', icon: '🥫' },
      { key: 'sphere_coulomb', label: 'Esfera con Monopolo Q', desc: 'Simetría esférica analítica', icon: '🌐' }
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
  gaussDimMode = '2d',
  onGaussDimChange
}) => {
  const guideKey = mode === 'gauss' ? (gaussDimMode === '3d' ? 'gauss_3d' : 'gauss') : mode;
  const content = GUIDE_DATA[guideKey] || GUIDE_DATA['electrostatics'];

  // Collapsible section states (prevents visual clutter and cognitive overload)
  const [openHowItWorks, setOpenHowItWorks] = useState<boolean>(true);
  const [openObjectives, setOpenObjectives] = useState<boolean>(true); // Open by default so students immediately see the Reto de Exploración!
  const [openPresets, setOpenPresets] = useState<boolean>(true);


  if (!isOpen) {
    return (
      <div className="h-full bg-[#F0EBE2] border-r border-[#E0D8CF] flex flex-col items-center py-3 px-1 z-20 flex-shrink-0">
        <button
          onClick={onToggle}
          className="p-2 rounded-lg bg-white hover:bg-[#EDE8DF] text-[#5B9E8A] border border-[#D5CEC6] hover:border-[#5B9E8A]/50 transition-all cursor-pointer group shadow-sm"
          title="Abrir Guía y Experimentos Rápidos"
        >
          <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
        </button>
        <span className="text-[10px] font-bold text-[#A89E94] uppercase tracking-widest [writing-mode:vertical-lr] rotate-180 mt-6 flex items-center gap-1.5">
          <Lightbulb className="w-3 h-3 text-[#5B9E8A] rotate-90" />
          <span>Guía & Experimentos</span>
        </span>
      </div>
    );
  }

  return (
    <aside className="w-72 h-full bg-[#F5F0E8] border-r border-[#E0D8CF] flex flex-col select-none flex-shrink-0 z-20 shadow-md overflow-hidden text-[#2D2A26]">
      {/* Panel Header */}
      <div className="h-11 px-3 border-b border-[#E0D8CF] bg-white/70 backdrop-blur-sm flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="p-1 rounded bg-[#5B9E8A]/10 border border-[#5B9E8A]/30 text-[#5B9E8A] flex-shrink-0">
            {content.icon}
          </div>
          <div className="min-w-0">
            <h2 className="text-xs font-bold text-[#2D2A26] tracking-wide leading-tight truncate">
              GUÍA DEL EXPERIMENTO
            </h2>
            <p className="text-[10px] text-[#5B9E8A] font-medium leading-none truncate">
              {content.roomName}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={onToggle}
            className="p-1 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#EDE8DF] rounded transition-colors cursor-pointer"
            title="Colapsar panel de guía"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Dimension Mode Switcher for Sala 2 */}
      {mode === 'gauss' && (
        <div className="px-3 py-1.5 bg-white/50 border-b border-[#E0D8CF] flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[10px] text-[#6B6560] font-medium">Modo:</span>
          <div className="flex-1 flex items-center bg-[#EDE8DF] p-0.5 rounded-lg border border-[#D5CEC6] text-[10px]">
            <button
              onClick={() => onGaussDimChange?.('2d')}
              className={`flex-1 py-1 rounded text-center font-semibold cursor-pointer transition-all ${
                gaussDimMode !== '3d'
                  ? 'bg-[#5B9E8A] text-white shadow-md'
                  : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
              }`}
            >
              Plano 2D
            </button>
            <button
              onClick={() => onGaussDimChange?.('3d')}
              className={`flex-1 py-1 rounded text-center font-semibold cursor-pointer transition-all ${
                gaussDimMode === '3d'
                  ? 'bg-gradient-to-r from-[#5B9E8A] to-teal-500 text-white shadow-md'
                  : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
              }`}
            >
              Espacio 3D
            </button>
          </div>
        </div>
      )}

      {/* Scrollable Content with Collapsible Sections */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 text-xs custom-scrollbar">
        {/* 1. Step-by-Step Pedagogical Card: ¿Cómo funciona? */}
        <CollapsibleSection
          title="¿Cómo funciona?"
          subtitle="3 pasos: interactúa, observa y aprende"
          icon={<HelpCircle className="w-3.5 h-3.5 text-sky-500" />}
          badge={undefined}
          isOpen={openHowItWorks}
          onToggle={() => setOpenHowItWorks((prev) => !prev)}
        >
          {/* Step 1: Interact */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-[#5B9E8A]/15 border border-[#5B9E8A]/40 text-[#5B9E8A] flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              1
            </div>
            <div>
              <span className="font-semibold text-[#3D7A69] text-[11px] flex items-center gap-1">
                <Hand className="w-3 h-3" /> Interactúa
              </span>
              <p className="text-[#6B6560] text-[11px] leading-snug mt-0.5">
                {content.interact}
              </p>
            </div>
          </div>

          {/* Step 2: Observe */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-sky-100 border border-sky-300/60 text-sky-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              2
            </div>
            <div>
              <span className="font-semibold text-sky-600 text-[11px] flex items-center gap-1">
                <Eye className="w-3 h-3" /> Observa
              </span>
              <p className="text-[#6B6560] text-[11px] leading-snug mt-0.5">
                {content.observe}
              </p>
            </div>
          </div>

          {/* Step 3: Key Concept */}
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-amber-100 border border-amber-300/60 text-amber-600 flex items-center justify-center font-bold text-[10px] flex-shrink-0 mt-0.5">
              3
            </div>
            <div>
              <span className="font-semibold text-amber-600 text-[11px] flex items-center gap-1">
                <Lightbulb className="w-3 h-3" /> Concepto Clave
              </span>
              <p className="text-[#4A4540] text-[11px] leading-snug mt-0.5 font-medium">
                {content.keyConcept}
              </p>
            </div>
          </div>
        </CollapsibleSection>

        {/* 2. Mode-Specific Objective / Challenge Card */}
        <CollapsibleSection
          title={viewMode === 'explore' ? 'Reto de Exploración' : 'Objetivo de Medición'}
          subtitle={viewMode === 'explore' ? 'Prueba este experimento' : content.formula}
          icon={
            viewMode === 'explore' ? (
              <Target className="w-3.5 h-3.5 text-[#5B9E8A]" />
            ) : (
              <FlaskConical className="w-3.5 h-3.5 text-sky-500" />
            )
          }
          badge={
            viewMode === 'explore' ? (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#5B9E8A]/15 text-[#3D7A69] border border-[#5B9E8A]/30">
                Misión
              </span>
            ) : (
              <span className="text-[9px] px-1.5 py-0.2 rounded bg-sky-100 text-sky-700 border border-sky-300/50 font-mono">
                SI Exacto
              </span>
            )
          }
          isOpen={openObjectives}
          onToggle={() => setOpenObjectives((prev) => !prev)}
        >
          {viewMode === 'explore' ? (
            <p className="text-[11px] text-[#4A4540] leading-snug">
              {content.exploreChallenge}
            </p>
          ) : (
            <div className="space-y-1.5">
              <p className="text-[11px] text-[#4A4540] leading-snug">
                {content.labObjective}
              </p>
              <div className="p-1.5 bg-[#EDE8DF] rounded border border-[#D5CEC6] font-mono text-center text-sky-700 text-[11px]">
                {content.formula}
              </div>
            </div>
          )}
        </CollapsibleSection>

        {/* 3. 1-Click Presets: "Experimentos con 1 Clic" */}
        <CollapsibleSection
          title="Experimentos con 1 Clic"
          subtitle="Cargar escenarios clásicos"
          icon={<Sparkles className="w-3.5 h-3.5 text-amber-500" />}
          badge={
            <span className="text-[9px] px-1.5 py-0.2 rounded bg-[#EDE8DF] text-amber-600 font-mono border border-[#D5CEC6]">
              {content.presets.length} Presets
            </span>
          }
          isOpen={openPresets}
          onToggle={() => setOpenPresets((prev) => !prev)}
        >
          <div className="space-y-1.5 pt-0.5">
            {content.presets.map((p) => (
              <button
                key={p.key}
                onClick={() => onApplyPreset(p.key)}
                className="w-full text-left p-2 rounded-lg bg-white hover:bg-[#EDE8DF] border border-[#D5CEC6] hover:border-[#5B9E8A]/40 transition-all cursor-pointer group flex items-start gap-2 shadow-sm"
              >
                <span className="text-base leading-none p-1 bg-[#EDE8DF] rounded group-hover:scale-110 transition-transform flex-shrink-0">
                  {p.icon}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[#2D2A26] group-hover:text-[#3D7A69] text-[11px] truncate">
                    {p.label}
                  </div>
                  <div className="text-[10px] text-[#6B6560] leading-tight truncate">
                    {p.desc}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CollapsibleSection>

      </div>
    </aside>
  );
};

export default LeftGuidePanel;
