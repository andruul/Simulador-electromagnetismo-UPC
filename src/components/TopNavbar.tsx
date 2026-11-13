import React from 'react';
import type { SimulationMode } from '../types';
import {
  Zap,
  RotateCw,
  Compass,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Search,
  PanelRightClose,
  PanelRightOpen,
  Command,
  CircleDot,
  BatteryCharging,
  Sparkles
} from 'lucide-react';
import { UpcLogo } from './UpcBadge';

interface TopNavbarProps {
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onReset: () => void;
  onOpenTheory: () => void;
  onTakeScreenshot: () => void;
  onOpenSearch: () => void;
  onOpenWelcome: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  mode,
  setMode,
  isPlaying,
  setIsPlaying,
  onReset,
  onOpenTheory,
  onTakeScreenshot,
  onOpenSearch,
  onOpenWelcome,
  isSidebarOpen,
  onToggleSidebar
}) => {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/90 px-3 md:px-4 flex items-center justify-between z-30 select-none gap-2 flex-shrink-0">
      {/* Brand & Portal UPC Button */}
      <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
        <button
          onClick={onOpenWelcome}
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/40 text-emerald-300 transition-all hover:scale-[1.02] cursor-pointer group shadow-sm shadow-emerald-950/50"
          title="Abrir Portal Institucional Universidad Popular del Cesar"
        >
          <UpcLogo className="w-5 h-5 flex-shrink-0" />
          <div className="text-left hidden sm:flex flex-col">
            <span className="font-extrabold text-[11px] tracking-wide text-white group-hover:text-emerald-200 leading-tight">
              PORTAL UPC
            </span>
            <span className="text-[9px] text-emerald-400 font-medium">Inicio & Guía</span>
          </div>
        </button>

        <div className="h-5 w-px bg-slate-800 hidden lg:block" />

        {/* Brand Title */}
        <div className="hidden xl:flex flex-col">
          <h1 className="font-bold text-xs tracking-wide text-white flex items-center gap-1.5">
            ELECTRO-SIM <span className="text-[9px] px-1 py-0.2 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">UPC v2.0</span>
          </h1>
          <p className="text-[9px] text-slate-400">Laboratorio Virtual de Electromagnetismo</p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <nav className="flex items-center p-1 bg-slate-900/90 rounded-xl border border-slate-800/80 overflow-x-auto max-w-full">
        <button
          onClick={() => setMode('electrostatics')}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'electrostatics'
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Electrostática 2D"
        >
          <Zap className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Electrostática 2D</span>
          <span className="sm:hidden text-[11px]">Electro</span>
        </button>

        <button
          onClick={() => setMode('lorentz3d')}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'lorentz3d'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Dinámica Lorentz 3D"
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Lorentz 3D</span>
          <span className="sm:hidden text-[11px]">Lorentz</span>
        </button>

        <button
          onClick={() => setMode('magnetostatics')}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'magnetostatics'
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Magnetostática (Biot-Savart)"
        >
          <Compass className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Magnetostática</span>
          <span className="sm:hidden text-[11px]">Magneto</span>
        </button>

        <button
          onClick={() => setMode('gauss')}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'gauss'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Ley de Gauss & Flujo Eléctrico"
        >
          <CircleDot className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden sm:inline">Ley de Gauss</span>
          <span className="sm:hidden text-[11px]">Gauss</span>
        </button>

        <button
          onClick={() => setMode('capacitor')}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'capacitor'
              ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Laboratorio de Capacitancia & Dieléctricos"
        >
          <BatteryCharging className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden sm:inline">Capacitancia</span>
          <span className="sm:hidden text-[11px]">Capacitor</span>
        </button>

        <button
          onClick={() => setMode('faraday')}
          className={`flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'faraday'
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
          title="Ley de Faraday & Lenz (Inducción)"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="hidden sm:inline">Faraday & Lenz</span>
          <span className="sm:hidden text-[11px]">Faraday</span>
        </button>
      </nav>

      {/* Action Controls & Search */}
      <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">
        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/80 hover:border-emerald-500/50 transition-colors cursor-pointer group"
          title="Buscar concepto o ley electromagnética (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <span className="hidden md:inline">Buscar tema</span>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Play/Pause Button */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isPlaying ? 'Pausar simulación' : 'Iniciar simulación'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{isPlaying ? 'Pausa' : 'Play'}</span>
        </button>

        {/* Reset Button */}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Reiniciar parámetros"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        {/* Screenshot Button */}
        <button
          onClick={onTakeScreenshot}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer hidden sm:block"
          title="Capturar imagen del canvas"
        >
          <Camera className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-0.5" />

        {/* Theory Guide Modal Button */}
        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1.5 px-2.5 md:px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors cursor-pointer"
          title="Abrir Guía Teórica y Fórmulas"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Teoría</span>
        </button>

        {/* Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isSidebarOpen
              ? 'bg-slate-850 text-slate-200 border-slate-700 hover:bg-slate-800'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isSidebarOpen ? 'Ocultar panel lateral' : 'Mostrar panel lateral'}
        >
          {isSidebarOpen ? (
            <PanelRightClose className="w-4 h-4" />
          ) : (
            <PanelRightOpen className="w-4 h-4" />
          )}
        </button>
      </div>
    </header>
  );
};
