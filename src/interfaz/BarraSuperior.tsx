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
  Command,
  CircleDot,
  BatteryCharging,
  Sparkles,
  LayoutGrid,
  FlaskConical,
  Eye,
  FileDown
} from 'lucide-react';
import { UpcLogo } from './InsigniaUPC';

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
  isLeftPanelOpen?: boolean;
  onToggleLeftPanel?: () => void;
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
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
  isLeftPanelOpen: _isLeftPanelOpen,
  onToggleLeftPanel: _onToggleLeftPanel,
  isSidebarOpen,
  onToggleSidebar
}) => {
  // Modos que tienen sus propios controles de reproducción integrados en el canvas
  const needsPlayPause = mode === 'electrostatics' || mode === 'lorentz3d';
  // Modos que usan el panel derecho de controles
  const needsSidebar = mode === 'electrostatics' || mode === 'lorentz3d';

  return (
    <header className="h-12 bg-white/90 backdrop-blur-md border-b border-[#E0D8CF] pl-3 pr-3 sm:pr-[148px] flex items-center justify-between z-30 select-none gap-2 flex-shrink-0 app-drag-region shadow-sm">
      {/* 1. Brand & Launcher Button */}
      <div className="flex items-center gap-2 flex-shrink-0 app-no-drag">
        <button
          onClick={onOpenWelcome}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#5B9E8A]/15 hover:bg-[#5B9E8A]/25 border border-[#5B9E8A]/40 text-[#3D7A69] transition-all cursor-pointer group shadow-sm"
          title="Abrir Launcher de Salas de Laboratorio UPC"
        >
          <UpcLogo className="w-5 h-5 flex-shrink-0" />
          <span className="font-extrabold text-[11px] tracking-wide text-[#2D2A26] group-hover:text-[#3D7A69] flex items-center gap-1">
            <LayoutGrid className="w-3 h-3 text-[#5B9E8A]" />
            <span className="hidden sm:inline">Salas UPC</span>
          </span>
        </button>
      </div>

      {/* 2. Laboratory Room Tabs */}
      <nav className="flex items-center p-0.5 bg-[#EDE8DF] rounded-xl border border-[#D5CEC6] overflow-x-auto max-w-full app-no-drag">
        <button
          onClick={() => setMode('electrostatics')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'electrostatics'
              ? 'bg-rose-400/80 text-white shadow-sm font-semibold'
              : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
          }`}
          title="Sala 1: Electrostática 2D (Coulomb)"
        >
          <Zap className="w-3.5 h-3.5 text-rose-500" />
          <span className="hidden md:inline">Electrostática</span>
          <span className="md:hidden">Electro</span>
        </button>

        <button
          onClick={() => setMode('gauss')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'gauss'
              ? 'bg-[#5B9E8A]/80 text-white shadow-sm font-semibold'
              : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
          }`}
          title="Sala 2: Ley de Gauss & Flujo Eléctrico"
        >
          <CircleDot className="w-3.5 h-3.5 text-[#5B9E8A]" />
          <span className="hidden md:inline">Ley de Gauss</span>
          <span className="md:hidden">Gauss</span>
        </button>

        <button
          onClick={() => setMode('capacitor')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'capacitor'
              ? 'bg-amber-400/80 text-white shadow-sm font-semibold'
              : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
          }`}
          title="Sala 3: Capacitancia & Dieléctricos"
        >
          <BatteryCharging className="w-3.5 h-3.5 text-amber-500" />
          <span className="hidden md:inline">Capacitancia</span>
          <span className="md:hidden">Capacitor</span>
        </button>

        <button
          onClick={() => setMode('magnetostatics')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'magnetostatics'
              ? 'bg-teal-500/80 text-white shadow-sm font-semibold'
              : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
          }`}
          title="Sala 4: Magnetostática (Biot-Savart)"
        >
          <Compass className="w-3.5 h-3.5 text-teal-500" />
          <span className="hidden md:inline">Magnetostática</span>
          <span className="md:hidden">Magneto</span>
        </button>

        <button
          onClick={() => setMode('lorentz3d')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'lorentz3d'
              ? 'bg-sky-500/80 text-white shadow-sm font-semibold'
              : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
          }`}
          title="Sala 5: Dinámica Lorentz 3D"
        >
          <RotateCw className="w-3.5 h-3.5 text-sky-500" />
          <span className="hidden md:inline">Lorentz 3D</span>
          <span className="md:hidden">Lorentz</span>
        </button>

        <button
          onClick={() => setMode('faraday')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
            mode === 'faraday'
              ? 'bg-purple-400/80 text-white shadow-sm font-semibold'
              : 'text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF]'
          }`}
          title="Sala 6: Ley de Faraday & Lenz"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-500" />
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
              ? 'bg-[#5B9E8A]/15 text-[#3D7A69] border-[#5B9E8A]/40 hover:bg-[#5B9E8A]/25'
              : 'bg-sky-500/15 text-sky-700 border-sky-500/40 hover:bg-sky-500/25'
          }`}
          title={
            viewMode === 'explore'
              ? 'Actualmente en Modo Exploración (Básico). Clic o presiona [M] para Modo Medición (Avanzado).'
              : 'Actualmente en Modo Medición (Avanzado SI). Clic o presiona [M] para Modo Exploración.'
          }
        >
          {viewMode === 'explore' ? (
            <>
              <Eye className="w-3.5 h-3.5 text-[#5B9E8A]" />
              <span className="hidden sm:inline">Modo Exploración</span>
              <span className="sm:hidden text-[10px]">Básico</span>
            </>
          ) : (
            <>
              <FlaskConical className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden sm:inline">Modo Medición (SI)</span>
              <span className="sm:hidden text-[10px]">Medición</span>
            </>
          )}
        </button>

        <div className="h-4 w-px bg-[#D5CEC6]" />

        {/* Global Search Button */}
        <button
          onClick={onOpenSearch}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-[#EDE8DF] hover:bg-[#E0D8CF] text-[#4A4540] border border-[#D5CEC6] hover:border-[#5B9E8A]/40 transition-colors cursor-pointer group"
          title="Buscar tema o concepto (Ctrl+K)"
        >
          <Search className="w-3.5 h-3.5 text-[#5B9E8A] group-hover:scale-110 transition-transform" />
          <kbd className="hidden lg:inline-flex items-center gap-0.5 px-1 py-0.2 rounded bg-white border border-[#D5CEC6] text-[9px] font-mono text-[#6B6560]">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </button>

        {/* Theory Modal Button */}
        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-indigo-100/80 text-indigo-700 border border-indigo-300/60 hover:bg-indigo-100 transition-colors cursor-pointer"
          title="Teoría Explicada Fácil (F1)"
        >
          <BookOpen className="w-3.5 h-3.5 text-indigo-500" />
          <span className="hidden xl:inline">Teoría Fácil</span>
        </button>

        {/* Generate Lab Evidence / Report Button */}
        <button
          onClick={onGenerateReport || onTakeScreenshot}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#5B9E8A] hover:bg-[#4A8A77] text-white shadow-sm transition-all cursor-pointer"
          title="Generar Ficha de Evidencia y Reporte de Laboratorio con membrete UPC"
        >
          <FileDown className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Ficha Evidencia</span>
        </button>

        {/* Play / Pause — solo visible en salas que lo necesitan */}
        {needsPlayPause && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-100 text-amber-700 border-amber-300/70 hover:bg-amber-200'
                : 'bg-[#5B9E8A]/15 text-[#3D7A69] border-[#5B9E8A]/40 hover:bg-[#5B9E8A]/25'
            }`}
            title={isPlaying ? 'Pausar simulación [Espacio]' : 'Iniciar simulación [Espacio]'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
        )}

        {/* Reset */}
        <button
          onClick={onReset}
          className="p-1.5 text-[#6B6560] hover:text-[#2D2A26] hover:bg-[#E0D8CF] rounded-lg transition-colors cursor-pointer"
          title="Reiniciar experimento actual [R]"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>

        {/* Right Sidebar Toggle — solo en salas que usan el panel de controles */}
        {needsSidebar && (
          <button
            onClick={onToggleSidebar}
            className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
              isSidebarOpen
                ? 'bg-[#EDE8DF] text-[#6B6560] border-[#D5CEC6] hover:bg-[#E0D8CF]'
                : 'bg-[#5B9E8A]/15 text-[#3D7A69] border-[#5B9E8A]/40 hover:bg-[#5B9E8A]/25'
            }`}
            title={isSidebarOpen ? 'Ocultar panel de controles' : 'Mostrar panel de controles'}
          >
            {isSidebarOpen ? (
              <PanelRightClose className="w-3.5 h-3.5" />
            ) : (
              <PanelRightOpen className="w-3.5 h-3.5" />
            )}
          </button>
        )}
      </div>
    </header>
  );
};
