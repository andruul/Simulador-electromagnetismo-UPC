import React from 'react';
import type { SimulationMode, ViewMode } from '../types';
import {
  Zap,
  RotateCw,
  Compass,
  BookOpen,
  Play,
  Pause,
  RotateCcw,
  Search,
  PanelRightClose,
  PanelRightOpen,
  PanelLeftClose,
  PanelLeftOpen,
  Command,
  CircleDot,
  BatteryCharging,
  Sparkles,
  LayoutGrid,
  FlaskConical,
  Eye,
  FileDown,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { UpcLogo } from './UpcBadge';

interface TopNavbarProps {
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  viewMode: ViewMode;
  onToggleViewMode: () => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onReset: () => void;
  onOpenTheory: () => void;
  onTakeScreenshot: () => void;
  onGenerateReport?: () => void;
  onOpenSearch: () => void;
  onOpenWelcome: () => void;
  isLeftPanelOpen: boolean;
  onToggleLeftPanel: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  isZenMode?: boolean;
  onToggleZenMode?: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  mode,
  setMode,
  viewMode,
  onToggleViewMode,
  isPlaying,
  setIsPlaying,
  onReset,
  onOpenTheory,
  onTakeScreenshot,
  onGenerateReport,
  onOpenSearch,
  onOpenWelcome,
  isLeftPanelOpen,
  onToggleLeftPanel,
  isSidebarOpen,
  onToggleSidebar,
  isZenMode = false,
  onToggleZenMode
}) => {
  return (
    <header className="h-12 bg-[#090d16] border-b border-slate-800/90 pl-3 pr-3 sm:pr-[148px] flex items-center justify-between z-30 select-none gap-2 flex-shrink-0 app-drag-region">
      {/* 1. Brand & Launcher Button */}
      <div className="flex items-center gap-2 flex-shrink-0 app-no-drag">
        <button
          onClick={onOpenWelcome}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/70 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-300 transition-all cursor-pointer group shadow-sm"
          title="Abrir Launcher de Salas de Laboratorio UPC"
        >
          <UpcLogo className="w-5 h-5 flex-shrink-0" />
          <span className="font-extrabold text-[11px] tracking-wide text-white group-hover:text-emerald-200 flex items-center gap-1">
            <LayoutGrid className="w-3 h-3 text-emerald-400" />
            <span className="hidden sm:inline">Salas UPC</span>
          </span>
        </button>

        {/* Left Panel Toggle Button */}
        <button
          onClick={onToggleLeftPanel}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isLeftPanelOpen
              ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isLeftPanelOpen ? 'Ocultar panel de guía' : 'Mostrar panel de guía'}
        >
          {isLeftPanelOpen ? (
            <PanelLeftClose className="w-3.5 h-3.5" />
          ) : (
            <PanelLeftOpen className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* 2. Laboratory Room Tabs */}
      <nav className="flex items-center p-0.5 bg-slate-900/90 rounded-xl border border-slate-800/90 overflow-x-auto max-w-full app-no-drag">
        <button
          onClick={() => setMode('electrostatics')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'electrostatics'
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-sm shadow-rose-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Sala 1: Electrostática 2D (Coulomb)"
        >
          <Zap className="w-3.5 h-3.5 text-rose-300" />
          <span className="hidden md:inline">Electrostática</span>
          <span className="md:hidden">Electro</span>
        </button>

        <button
          onClick={() => setMode('gauss')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'gauss'
              ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-white shadow-sm shadow-emerald-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Sala 2: Ley de Gauss & Flujo Eléctrico"
        >
          <CircleDot className="w-3.5 h-3.5 text-emerald-300" />
          <span className="hidden md:inline">Ley de Gauss</span>
          <span className="md:hidden">Gauss</span>
        </button>

        <button
          onClick={() => setMode('capacitor')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'capacitor'
              ? 'bg-gradient-to-r from-amber-600 to-yellow-500 text-white shadow-sm shadow-amber-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Sala 3: Capacitancia & Dieléctricos"
        >
          <BatteryCharging className="w-3.5 h-3.5 text-amber-300" />
          <span className="hidden md:inline">Capacitancia</span>
          <span className="md:hidden">Capacitor</span>
        </button>

        <button
          onClick={() => setMode('magnetostatics')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'magnetostatics'
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-sm shadow-teal-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Sala 4: Magnetostática (Biot-Savart)"
        >
          <Compass className="w-3.5 h-3.5 text-teal-300" />
          <span className="hidden md:inline">Magnetostática</span>
          <span className="md:hidden">Magneto</span>
        </button>

        <button
          onClick={() => setMode('lorentz3d')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'lorentz3d'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-sm shadow-sky-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Sala 5: Dinámica Lorentz 3D"
        >
          <RotateCw className="w-3.5 h-3.5 text-sky-300" />
          <span className="hidden md:inline">Lorentz 3D</span>
          <span className="md:hidden">Lorentz</span>
        </button>

        <button
          onClick={() => setMode('faraday')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'faraday'
              ? 'bg-gradient-to-r from-purple-600 to-pink-500 text-white shadow-sm shadow-purple-500/30 font-semibold'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850'
          }`}
          title="Sala 6: Ley de Faraday & Lenz"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-300" />
          <span className="hidden md:inline">Faraday & Lenz</span>
          <span className="md:hidden">Faraday</span>
        </button>
      </nav>

      {/* 3. View Mode Toggle, Tools & Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0 app-no-drag">
        {/* PROMINENT TOGGLE: MODO EXPLORACIÓN (BÁSICO) vs MODO MEDICIÓN (AVANZADO) */}
        <button
          onClick={onToggleViewMode}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer shadow-sm ${
            viewMode === 'explore'
              ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50 hover:bg-emerald-900'
              : 'bg-sky-950/80 text-sky-300 border-sky-500/50 hover:bg-sky-900'
          }`}
          title={
            viewMode === 'explore'
              ? 'Actualmente en Modo Exploración (Básico). Clic o presiona [M] para Modo Medición (Avanzado).'
              : 'Actualmente en Modo Medición (Avanzado SI). Clic o presiona [M] para Modo Exploración.'
          }
        >
          {viewMode === 'explore' ? (
            <>
              <Eye className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Modo Exploración</span>
              <span className="sm:hidden text-[10px]">Básico</span>
            </>
          ) : (
            <>
              <FlaskConical className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Modo Medición (SI)</span>
              <span className="sm:hidden text-[10px]">Medición</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-slate-800" />

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-slate-900 hover:bg-slate-850 text-slate-300 border border-slate-700/80 hover:border-emerald-500/40 transition-colors cursor-pointer group"
          title="Buscar tema o concepto (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform" />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-slate-950 border border-slate-800 text-[9px] font-mono text-slate-400">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Theory Modal Button */}
        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 hover:bg-indigo-500/25 transition-colors cursor-pointer"
          title="Teoría Explicada Fácil (F1)"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-400" />
          <span className="hidden xl:inline">Teoría Fácil</span>
        </button>

        {/* Generate Lab Evidence / Report Button */}
        <button
          onClick={onGenerateReport || onTakeScreenshot}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-all cursor-pointer"
          title="Generar Ficha de Evidencia y Reporte de Laboratorio con membrete UPC"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Ficha Evidencia</span>
        </button>

        {/* Play / Pause */}
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isPlaying ? 'Pausar simulación [Espacio]' : 'Iniciar simulación [Espacio]'}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
        </button>

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Reiniciar experimento actual [R]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Right Sidebar Toggle */}
        <button
          onClick={onToggleSidebar}
          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
            isSidebarOpen
              ? 'bg-slate-900 text-slate-300 border-slate-800 hover:bg-slate-850'
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
          title={isSidebarOpen ? 'Ocultar panel de controles' : 'Mostrar panel de controles'}
        >
          {isSidebarOpen ? (
            <PanelRightClose className="w-3.5 h-3.5" />
          ) : (
            <PanelRightOpen className="w-3.5 h-3.5" />
          )}
        </button>

        {/* Master Zen / Clean Canvas Focus Mode */}
        {onToggleZenMode && (
          <button
            onClick={onToggleZenMode}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isZenMode
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 hover:bg-slate-850'
            }`}
            title={
              isZenMode
                ? 'Restaurar paneles laterales [Z]'
                : 'Lienzo Limpio / Modo Enfoque: Ocultar paneles para máxima amplitud [Z]'
            }
          >
            {isZenMode ? (
              <Minimize2 className="w-3.5 h-3.5 text-emerald-400" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
