import React from 'react';
import {
  Play,
  Search,
  BookOpen,
  Zap,
  RotateCw,
  Compass,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  GraduationCap,
  Atom,
  Flame,
  Globe,
  Layers,
  Cpu
} from 'lucide-react';
import { UpcBadge, UpcLogo } from './UpcBadge';
import { COURSE_UNITS } from '../data/topics';
import type { SimulationMode } from '../types';

interface WelcomeScreenProps {
  onStartSimulation: () => void;
  onOpenSearch: () => void;
  onOpenTheory: () => void;
  onLaunchPractice: (mode: SimulationMode | 'theory', presetKey?: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({
  onStartSimulation,
  onOpenSearch,
  onOpenTheory,
  onLaunchPractice
}) => {
  const getUnitIcon = (unitNumber: number) => {
    switch (unitNumber) {
      case 1:
        return <Zap className="w-5 h-5 text-rose-400" />;
      case 2:
        return <Globe className="w-5 h-5 text-emerald-400" />;
      case 3:
        return <Layers className="w-5 h-5 text-sky-400" />;
      case 4:
        return <Cpu className="w-5 h-5 text-amber-400" />;
      case 5:
        return <RotateCw className="w-5 h-5 text-indigo-400" />;
      case 6:
        return <Compass className="w-5 h-5 text-teal-400" />;
      case 7:
        return <Flame className="w-5 h-5 text-orange-400" />;
      case 8:
        return <Atom className="w-5 h-5 text-cyan-400" />;
      default:
        return <Sparkles className="w-5 h-5 text-emerald-400" />;
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#070b14] text-slate-100 flex flex-col font-sans select-none scroll-smooth">
      {/* Institutional Top Ribbon */}
      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 border-b border-emerald-500/30 px-6 py-2.5 flex items-center justify-between text-xs text-emerald-300/90 shadow-md">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold tracking-wide">
            Universidad Popular del Cesar • Institución de Educación Superior Acreditada
          </span>
        </div>
        <div className="hidden md:flex items-center gap-4 text-[11px] text-slate-400">
          <span>Sedes Sabanas & Hurtado • Valledupar, Cesar</span>
          <span className="w-1 h-1 rounded-full bg-emerald-500" />
          <span>Física II & Electromagnetismo Computacional</span>
        </div>
      </div>

      {/* Hero Presentation Header */}
      <section className="relative px-6 py-12 md:py-16 max-w-7xl mx-auto w-full flex flex-col items-center text-center">
        {/* Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Institutional Badges & Crest */}
        <div className="flex flex-col items-center gap-4 mb-6">
          <div className="p-3 bg-slate-900/90 border border-emerald-500/40 rounded-2xl shadow-2xl shadow-emerald-950/60 backdrop-blur-md">
            <UpcLogo className="w-16 h-16 md:w-20 md:h-20" />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Facultad de Ingenierías y Tecnologías (FIT)
            </span>
            <span className="px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-medium">
              Departamento de Física
            </span>
            <span className="px-3 py-1 rounded-full bg-sky-500/15 border border-sky-500/30 text-sky-300 text-xs font-semibold">
              Ingenierías UPC
            </span>
          </div>
        </div>

        {/* Project Title */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-100 to-emerald-200 tracking-tight max-w-4xl leading-tight">
          Universidad Popular del Cesar
        </h1>
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-emerald-400 mt-2 tracking-wide">
          Laboratorio Virtual de Electromagnetismo
        </h2>

        {/* Presentation Text */}
        <p className="mt-5 text-sm sm:text-base md:text-lg text-slate-300/90 max-w-3xl leading-relaxed font-normal">
          Plataforma avanzada de física computacional y simulación numérica diseñada para enriquecer la formación
          teórico-práctica de los estudiantes de Ingeniería Agroindustrial, Ambiental, Electrónica, Sistemas y Mecánica.
          Permite visualizar campos vectoriales, analizar potenciales electrostáticos, integrar trayectorias relativistas en 3D
          mediante algoritmos Boris y explorar las Leyes de Maxwell con rigor analítico.
        </p>

        {/* Primary Action Buttons */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3 w-full max-w-xl">
          <button
            onClick={onStartSimulation}
            className="flex items-center gap-2.5 px-6 py-3.5 rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Iniciar Simulación Libre</span>
          </button>

          <button
            onClick={onOpenSearch}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-800/90 hover:bg-slate-750 text-slate-200 border border-slate-700/80 font-semibold text-sm transition-all hover:border-emerald-500/50 cursor-pointer"
          >
            <Search className="w-4 h-4 text-emerald-400" />
            <span>Buscar Concepto</span>
            <kbd className="hidden sm:inline-block px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-slate-400 ml-1">
              Ctrl+K
            </kbd>
          </button>

          <button
            onClick={onOpenTheory}
            className="flex items-center gap-2 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-300 border border-slate-800 font-semibold text-sm transition-all cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-sky-400" />
            <span>Guía Teórica & Fórmulas</span>
          </button>
        </div>

        {/* Academic Highlights Bar */}
        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-3 w-full max-w-4xl text-left">
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider block">
              Syllabus Completo
            </span>
            <span className="text-base font-extrabold text-white">8 Unidades Temáticas</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Desde Coulomb hasta las Leyes de Maxwell</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider block">
              Física Computacional
            </span>
            <span className="text-base font-extrabold text-white">Boris Pusher & RK4</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Integración numérica conservativa de energía</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-rose-400 tracking-wider block">
              Instrumentación
            </span>
            <span className="text-base font-extrabold text-white">Sonda Multímetro</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Medición instantánea de |E|, V(r) y ángulo</p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <span className="text-[10px] uppercase font-bold text-amber-400 tracking-wider block">
              Acreditación FIT
            </span>
            <span className="text-base font-extrabold text-white">UPC Valledupar</span>
            <p className="text-[11px] text-slate-400 mt-0.5">Diseñado para la excelencia en ingeniería</p>
          </div>
        </div>
      </section>

      {/* Course Units / Syllabus Directory */}
      <section className="px-6 py-10 bg-slate-950/60 border-t border-slate-800/80 flex-1">
        <div className="max-w-7xl mx-auto">
          {/* Section Heading */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
                <GraduationCap className="w-4 h-4" />
                <span>Plan de Asignatura de Física II & Electromagnetismo</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                Directorio Académico de Unidades Temáticas
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-2xl">
                Selecciona cualquier unidad para revisar sus fundamentos analíticos o haz clic en{' '}
                <strong className="text-slate-200">Lanzar Práctica</strong> para abrir de inmediato la simulación con el preset cargado.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenSearch}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-slate-700 transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5 text-emerald-400" />
                <span>Búsqueda rápida por concepto</span>
              </button>
            </div>
          </div>

          {/* Unit Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {COURSE_UNITS.map((unit) => (
              <div
                key={unit.unitNumber}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between hover:border-emerald-500/40 transition-all hover:shadow-xl hover:shadow-emerald-950/30 group"
              >
                <div>
                  {/* Card Header */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-black px-2.5 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                      Unidad {unit.unitNumber}
                    </span>
                    <div className="p-2 rounded-xl bg-slate-800/80 group-hover:bg-slate-800 transition-colors">
                      {getUnitIcon(unit.unitNumber)}
                    </div>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="font-bold text-base text-white group-hover:text-emerald-300 transition-colors leading-snug">
                    {unit.title}
                  </h3>
                  <p className="text-[11px] text-emerald-400/80 font-medium mt-0.5 mb-2.5">
                    {unit.subtitle}
                  </p>

                  {/* Description */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-3 mb-3">
                    {unit.description}
                  </p>

                  {/* Formula Box */}
                  <div className="p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 font-mono text-[10px] text-emerald-300 text-center mb-3 overflow-x-auto whitespace-nowrap">
                    {unit.keyFormula}
                  </div>

                  {/* Core Concepts Badges */}
                  <div className="flex flex-wrap gap-1 mb-4">
                    {unit.coreConcepts.map((concept, idx) => (
                      <span
                        key={idx}
                        className="text-[10px] px-2 py-0.5 rounded bg-slate-800/60 text-slate-300 border border-slate-700/50"
                      >
                        {concept}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Practices Launchers */}
                <div className="pt-3 border-t border-slate-800/80 space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block mb-1">
                    Prácticas de Laboratorio:
                  </span>
                  {unit.practices.map((practice, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => onLaunchPractice(practice.mode, practice.presetKey)}
                      className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg bg-slate-950/70 hover:bg-emerald-600/20 border border-slate-800/80 hover:border-emerald-500/50 text-left transition-all group/btn cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-emerald-300 flex-shrink-0">
                          {practice.badge}
                        </span>
                        <span className="text-xs text-slate-300 group-hover/btn:text-white truncate">
                          {practice.title}
                        </span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover/btn:text-emerald-400 flex-shrink-0 ml-1 transition-transform group-hover/btn:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Quick Interactive Experiments Strip */}
      <section className="px-6 py-8 bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-950 border-t border-emerald-500/20">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-1 text-center md:text-left">
            <h4 className="text-base font-bold text-white flex items-center gap-2 justify-center md:justify-start">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span>Accesos Directos a Fenómenos Clave</span>
            </h4>
            <p className="text-xs text-slate-400">
              Lanza directamente configuraciones emblemáticas de examen y prácticas de laboratorio
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            {[
              { label: 'Dipolo Eléctrico', mode: 'electrostatics' as const, preset: 'dipole' },
              { label: 'Condensador Plano', mode: 'electrostatics' as const, preset: 'capacitor' },
              { label: 'Filtro de Wien', mode: 'lorentz3d' as const, preset: 'velocity_selector' },
              { label: 'Ciclotrón 3D', mode: 'lorentz3d' as const, preset: 'cyclotron' },
              { label: 'Botella Magnética', mode: 'lorentz3d' as const, preset: 'magnetic_bottle' },
              { label: 'Hilos de Ampère', mode: 'magnetostatics' as const, preset: 'parallel_attraction' },
              { label: 'Solenoide', mode: 'magnetostatics' as const, preset: 'solenoid' }
            ].map((btn, bIdx) => (
              <button
                key={bIdx}
                onClick={() => onLaunchPractice(btn.mode, btn.preset)}
                className="px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-emerald-600/30 text-xs font-medium text-slate-200 border border-slate-700/80 hover:border-emerald-500/50 transition-all cursor-pointer"
              >
                {btn.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Institutional Footer */}
      <footer className="px-6 py-8 bg-slate-950 border-t border-slate-800 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div className="flex items-center gap-3">
            <UpcBadge size="sm" showText={true} />
          </div>

          <div className="text-[11px] text-slate-500 space-y-0.5">
            <p>Universidad Popular del Cesar • Sede Sabanas & Hurtado • Valledupar, Cesar, Colombia</p>
            <p>Laboratorio Virtual de Física Computacional • Facultad de Ingenierías y Tecnologías</p>
          </div>

          <button
            onClick={onStartSimulation}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md transition-all cursor-pointer"
          >
            <span>Ir a la Simulación</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>
    </div>
  );
};
