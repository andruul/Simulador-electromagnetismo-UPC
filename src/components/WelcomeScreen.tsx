import React from 'react';
import {
  Zap,
  RotateCw,
  Compass,
  Sparkles,
  CircleDot,
  BatteryCharging,
  ArrowRight,
  Search,
  BookOpen,
  FlaskConical,
  Atom
} from 'lucide-react';
import { UpcLogo } from './UpcBadge';
import type { SimulationMode } from '../types';

interface WelcomeScreenProps {
  onStartSimulation: () => void;
  onOpenSearch: () => void;
  onOpenTheory: () => void;
  onLaunchPractice: (mode: SimulationMode | 'theory', presetKey?: string) => void;
}

interface LabRoomCard {
  mode: SimulationMode;
  presetKey?: string;
  roomNumber: number;
  title: string;
  subtitle: string;
  bullets: string[];
  formula: string;
  badge: string;
  colorScheme: {
    border: string;
    bgHover: string;
    iconBg: string;
    iconColor: string;
    accent: string;
    button: string;
  };
}

const LAB_ROOMS: LabRoomCard[] = [
  {
    mode: 'electrostatics',
    presetKey: 'dipole',
    roomNumber: 1,
    title: 'Electrostática & Coulomb',
    subtitle: 'Fuerzas, Campo E y Potencial',
    bullets: [
      'Arrastra cargas (+) y (−) y mapea las líneas de campo continuo (RK4).',
      'Explora el mapa de calor de potencial y las curvas equipotenciales.'
    ],
    formula: 'F = k·|q₁·q₂| / r²',
    badge: 'Interactivo 2D',
    colorScheme: {
      border: 'border-rose-500/30 hover:border-rose-500/70',
      bgHover: 'hover:bg-rose-950/20',
      iconBg: 'bg-rose-500/15 border-rose-500/30',
      iconColor: 'text-rose-400',
      accent: 'text-rose-400',
      button: 'bg-rose-600 hover:bg-rose-500 text-white'
    }
  },
  {
    mode: 'gauss',
    presetKey: 'monopole',
    roomNumber: 2,
    title: 'Ley de Gauss & Flujo',
    subtitle: 'Superficies Gaussianas y Carga Encerrada',
    bullets: [
      'Discretización de superficies (esfera y caja) con vectores normales n̂.',
      'Comprobación exacta de ∮ E · dA = Q_enc / ε₀ en tiempo real.'
    ],
    formula: 'Φ_E = ∮ E · dA = Q_enc / ε₀',
    badge: 'Integración Numérica',
    colorScheme: {
      border: 'border-emerald-500/30 hover:border-emerald-500/70',
      bgHover: 'hover:bg-emerald-950/20',
      iconBg: 'bg-emerald-500/15 border-emerald-500/30',
      iconColor: 'text-emerald-400',
      accent: 'text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-500 text-white'
    }
  },
  {
    mode: 'capacitor',
    presetKey: 'teflon',
    roomNumber: 3,
    title: 'Capacitancia & Dieléctricos',
    subtitle: 'Laboratorio de Placas y Aislantes (PhET)',
    bullets: [
      'Regula el área y distancia entre placas; desliza dieléctricos (κ = 1 a 8.5).',
      'Mide voltaje con el voltímetro flotante con batería conectada o fija.'
    ],
    formula: 'C = κ·ε₀·A / d  |  U = ½ C V²',
    badge: 'Estilo PhET Colorado',
    colorScheme: {
      border: 'border-amber-500/30 hover:border-amber-500/70',
      bgHover: 'hover:bg-amber-950/20',
      iconBg: 'bg-amber-500/15 border-amber-500/30',
      iconColor: 'text-amber-400',
      accent: 'text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-500 text-white'
    }
  },
  {
    mode: 'magnetostatics',
    presetKey: 'parallel_attraction',
    roomNumber: 4,
    title: 'Magnetostática & Ampère',
    subtitle: 'Cables con Corriente y Solenoides',
    bullets: [
      'Conductores salientes (⊙) y entrantes (⊗) con atracción y repulsión.',
      'Sonda de brújula interactiva que verifica la Regla de la Mano Derecha.'
    ],
    formula: 'B = (μ₀·I) / (2π·r)',
    badge: 'Biot-Savart & Ampère',
    colorScheme: {
      border: 'border-teal-500/30 hover:border-teal-500/70',
      bgHover: 'hover:bg-teal-950/20',
      iconBg: 'bg-teal-500/15 border-teal-500/30',
      iconColor: 'text-teal-400',
      accent: 'text-teal-400',
      button: 'bg-teal-600 hover:bg-teal-500 text-white'
    }
  },
  {
    mode: 'lorentz3d',
    presetKey: 'helix',
    roomNumber: 5,
    title: 'Fuerza de Lorentz 3D',
    subtitle: 'Partículas Cargadas en Campos E y B',
    bullets: [
      'Integrador simpléctico de Boris Pusher con conservación estricta de energía.',
      'Simula el Filtro de Wien, Botella Magnética, Deriva E×B y Ciclotrón.'
    ],
    formula: 'F⃗ = q·(E⃗ + v⃗ × B⃗)',
    badge: 'WebGL 3D Orbit',
    colorScheme: {
      border: 'border-sky-500/30 hover:border-sky-500/70',
      bgHover: 'hover:bg-sky-950/20',
      iconBg: 'bg-sky-500/15 border-sky-500/30',
      iconColor: 'text-sky-400',
      accent: 'text-sky-400',
      button: 'bg-sky-600 hover:bg-sky-500 text-white'
    }
  },
  {
    mode: 'faraday',
    presetKey: 'oscillate',
    roomNumber: 6,
    title: 'Faraday & Ley de Lenz',
    subtitle: 'Inducción, Galvanómetro y Bombilla',
    bullets: [
      'Mueve el imán dentro de la bobina para inducir fem ε = −N(dΦ_B/dt).',
      'Deflexión de aguja en galvanómetro central y osciloscopio de flujo en vivo.'
    ],
    formula: 'ε = −N · (dΦ_B / dt)',
    badge: 'Instrumentación & Lenz',
    colorScheme: {
      border: 'border-purple-500/30 hover:border-purple-500/70',
      bgHover: 'hover:bg-purple-950/20',
      iconBg: 'bg-purple-500/15 border-purple-500/30',
      iconColor: 'text-purple-400',
      accent: 'text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-500 text-white'
    }
  }
];

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartSimulation,
  onOpenSearch,
  onOpenTheory,
  onLaunchPractice
}) => {
  const getRoomIcon = (mode: SimulationMode) => {
    switch (mode) {
      case 'electrostatics':
        return <Zap className="w-5 h-5 text-rose-400" />;
      case 'gauss':
        return <CircleDot className="w-5 h-5 text-emerald-400" />;
      case 'capacitor':
        return <BatteryCharging className="w-5 h-5 text-amber-400" />;
      case 'magnetostatics':
        return <Compass className="w-5 h-5 text-teal-400" />;
      case 'lorentz3d':
        return <RotateCw className="w-5 h-5 text-sky-400" />;
      case 'faraday':
        return <Sparkles className="w-5 h-5 text-purple-400" />;
      default:
        return <FlaskConical className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full h-full bg-[#0b0f17] text-slate-100 flex flex-col p-4 md:p-6 overflow-hidden select-none">
      {/* Header compact desktop launcher bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between pb-4 border-b border-slate-800/80 gap-3 flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-slate-900 border border-emerald-500/40 rounded-xl shadow-lg shadow-emerald-950/40">
            <UpcLogo className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-bold tracking-tight text-white flex items-center gap-2">
                UNIVERSIDAD POPULAR DEL CESAR
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-semibold font-mono">
                  FIT • Física
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Estación de Laboratorios Virtuales de Electromagnetismo • Elige una sala para iniciar
            </p>
          </div>
        </div>

        {/* Global actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenSearch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-xs font-medium text-slate-300 hover:text-white transition-colors cursor-pointer shadow-sm"
          >
            <Search className="w-3.5 h-3.5 text-emerald-400" />
            <span>Buscar tema (Ctrl+K)</span>
          </button>

          <button
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-950/50 hover:bg-indigo-900/70 border border-indigo-500/40 text-xs font-medium text-indigo-300 transition-colors cursor-pointer shadow-sm"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
            <span>Teoría Explicada Fácil</span>
          </button>
        </div>
      </div>

      {/* Grid of 6 Laboratory Rooms */}
      <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 py-4 overflow-y-auto">
        {LAB_ROOMS.map((room) => (
          <div
            key={room.mode}
            onClick={() => onLaunchPractice(room.mode, room.presetKey)}
            className={`group flex flex-col justify-between bg-[#111827] ${room.colorScheme.bgHover} rounded-xl border ${room.colorScheme.border} p-4 transition-all duration-200 cursor-pointer shadow-md hover:shadow-lg hover:-translate-y-0.5`}
          >
            {/* Card Top */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-9 h-9 rounded-lg ${room.colorScheme.iconBg} flex items-center justify-center border`}
                  >
                    {getRoomIcon(room.mode)}
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-500 tracking-wider uppercase">
                      SALA 0{room.roomNumber}
                    </span>
                    <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-tight">
                      {room.title}
                    </h3>
                  </div>
                </div>

                <span className="text-[9px] font-medium px-2 py-0.5 rounded-full bg-slate-900 border border-slate-700/80 text-slate-300">
                  {room.badge}
                </span>
              </div>

              {/* Subtitle / summary */}
              <p className="text-[11px] text-slate-400 font-medium leading-snug">
                {room.subtitle}
              </p>

              {/* What will you learn / observe */}
              <ul className="space-y-1 text-[11px] text-slate-300">
                {room.bullets.map((b, idx) => (
                  <li key={idx} className="flex items-start gap-1.5 leading-snug">
                    <span className="text-emerald-400 mt-0.5">•</span>
                    <span>{b}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Card Bottom: Formula & Enter Button */}
            <div className="pt-3 border-t border-slate-800/80 mt-3 flex items-center justify-between gap-2">
              <div className="font-mono text-[10px] text-slate-400 bg-slate-950 px-2 py-1 rounded border border-slate-800/80 truncate max-w-[170px]">
                {room.formula}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onLaunchPractice(room.mode, room.presetKey);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${room.colorScheme.button} transition-all cursor-pointer shadow-sm group-hover:scale-105`}
              >
                <span>Entrar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop footer info bar */}
      <div className="h-9 px-3 border-t border-slate-800/80 bg-slate-950/60 rounded-lg flex items-center justify-between text-[11px] text-slate-400 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Atom className="w-3.5 h-3.5 text-emerald-400" />
          <span>Simulador Pedagógico de Física II • Universidad Popular del Cesar</span>
        </div>
        <div className="flex items-center gap-3 text-slate-500">
          <span>Atajo global: <kbd className="px-1 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-400 font-mono">Ctrl + K</kbd></span>
          <span>•</span>
          <button
            onClick={onStartSimulation}
            className="text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2 cursor-pointer"
          >
            Continuar simulación activa
          </button>
        </div>
      </div>
    </div>
  );
};
