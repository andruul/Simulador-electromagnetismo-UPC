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
  Camera
} from 'lucide-react';

interface TopNavbarProps {
  mode: SimulationMode;
  setMode: (mode: SimulationMode) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  onReset: () => void;
  onOpenTheory: () => void;
  onTakeScreenshot: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({
  mode,
  setMode,
  isPlaying,
  setIsPlaying,
  onReset,
  onOpenTheory,
  onTakeScreenshot
}) => {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-4 flex items-center justify-between z-30 select-none">
      {/* Brand */}
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-sm tracking-wide text-white flex items-center gap-2">
            ELECTRO-SIM <span className="text-[10px] px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-400 border border-sky-500/30 font-mono">v1.0</span>
          </h1>
          <p className="text-[10px] text-slate-400">Simulador de Electromagnetismo & Física Computacional</p>
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <nav className="flex items-center p-1 bg-slate-900 rounded-xl border border-slate-800">
        <button
          onClick={() => setMode('electrostatics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            mode === 'electrostatics'
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-md shadow-rose-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Electrostática 2D</span>
        </button>

        <button
          onClick={() => setMode('lorentz3d')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            mode === 'lorentz3d'
              ? 'bg-gradient-to-r from-sky-600 to-indigo-600 text-white shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <RotateCw className="w-3.5 h-3.5" />
          <span>Dinámica Lorentz 3D</span>
        </button>

        <button
          onClick={() => setMode('magnetostatics')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
            mode === 'magnetostatics'
              ? 'bg-gradient-to-r from-teal-600 to-cyan-600 text-white shadow-md shadow-teal-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Magnetostática (Biot-Savart)</span>
        </button>
      </nav>

      {/* Action Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsPlaying(!isPlaying)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
            isPlaying
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
          }`}
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span>{isPlaying ? 'Pausar' : 'Iniciar'}</span>
        </button>

        <button
          onClick={onReset}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Reiniciar parámetros"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          onClick={onTakeScreenshot}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          title="Capturar imagen"
        >
          <Camera className="w-4 h-4" />
        </button>

        <div className="h-5 w-px bg-slate-800 mx-1" />

        <button
          onClick={onOpenTheory}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-500/30 transition-colors cursor-pointer"
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Guía Teórica</span>
        </button>
      </div>
    </header>
  );
};
