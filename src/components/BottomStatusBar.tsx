import React from 'react';
import type { SimulationMode, ViewMode } from '../types';
import { Activity, Pause, Sparkles, FlaskConical, Eye } from 'lucide-react';

interface BottomStatusBarProps {
  mode: SimulationMode;
  viewMode: ViewMode;
  isPlaying: boolean;
}

const MODE_LABELS: Record<SimulationMode, string> = {
  electrostatics: 'Sala 1 • Electrostática',
  gauss: 'Sala 2 • Ley de Gauss',
  capacitor: 'Sala 3 • Capacitancia',
  magnetostatics: 'Sala 4 • Magnetostática',
  lorentz3d: 'Sala 5 • Lorentz 3D',
  faraday: 'Sala 6 • Faraday & Lenz',
  theory: 'Teoría de Maxwell',
  welcome: 'Launcher de Salas'
};

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({
  mode,
  viewMode,
  isPlaying
}) => {
  return (
    <footer className="h-6 w-full bg-[#0B0F17] border-t border-slate-800/90 flex items-center justify-between px-3 text-[11px] select-none z-30 font-mono text-slate-400 app-no-drag">
      {/* Left: Physics Engine Status & Current Room */}
      <div className="flex items-center gap-3">
        {/* Engine status indicator */}
        <div className="flex items-center gap-1.5">
          {isPlaying ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <Activity className="w-3 h-3 inline" />
                Motor: 60 FPS
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
              <span className="text-amber-400 font-semibold flex items-center gap-1">
                <Pause className="w-3 h-3 inline" />
                En Pausa
              </span>
            </>
          )}
        </div>

        <span className="text-slate-600">|</span>

        {/* Current Lab Room */}
        <div className="flex items-center gap-1 text-slate-300">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span>{MODE_LABELS[mode] || 'Laboratorio'}</span>
        </div>

        <span className="text-slate-600">|</span>

        {/* Current View Mode */}
        <div className="flex items-center gap-1">
          {viewMode === 'explore' ? (
            <span className="text-emerald-300 font-medium flex items-center gap-1">
              <Eye className="w-3 h-3 text-emerald-400" />
              Modo Exploración
            </span>
          ) : (
            <span className="text-sky-300 font-medium flex items-center gap-1">
              <FlaskConical className="w-3 h-3 text-sky-400" />
              Modo Medición (SI)
            </span>
          )}
        </div>
      </div>

      {/* Center: Desktop Keyboard Shortcuts Help */}
      <div className="hidden lg:flex items-center gap-2 text-slate-400 text-[10px]">
        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">Espacio</span>
        <span>Play/Pausa</span>
        <span className="text-slate-700">•</span>
        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">R</span>
        <span>Reiniciar</span>
        <span className="text-slate-700">•</span>
        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">M</span>
        <span>Modo</span>
        <span className="text-slate-700">•</span>
        <span className="px-1.5 py-0.2 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold">F1 / Ctrl+K</span>
        <span>Guía & Búsqueda</span>
      </div>

      {/* Right: Institutional Software Version */}
      <div className="flex items-center gap-2">
        <span className="text-emerald-400/90 font-semibold">v2.0 Desktop</span>
        <span className="text-slate-600">•</span>
        <span className="text-slate-400 hidden sm:inline">Universidad Popular del Cesar</span>
      </div>
    </footer>
  );
};
export default BottomStatusBar;
