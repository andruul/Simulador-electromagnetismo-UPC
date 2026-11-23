import React from 'react';
import type { SimulationMode } from '../types';
import { Sparkles } from 'lucide-react';

interface BottomStatusBarProps {
  mode: SimulationMode;
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

export const BottomStatusBar: React.FC<BottomStatusBarProps> = ({ mode }) => {
  return (
    <footer className="h-6 w-full bg-white/80 backdrop-blur-sm border-t border-[#E0D8CF] flex items-center justify-between px-3 text-[11px] select-none z-30 font-mono text-[#6B6560] app-no-drag">
      {/* Left: Current Room */}
      <div className="flex items-center gap-1 text-[#4A4540]">
        <Sparkles className="w-3 h-3 text-[#5B9E8A]" />
        <span>{MODE_LABELS[mode] || 'Laboratorio'}</span>
      </div>

      {/* Right: Institutional Branding */}
      <div className="flex items-center gap-2">
        <span className="text-[#6B6560] hidden sm:inline">Universidad Popular del Cesar</span>
      </div>
    </footer>
  );
};
export default BottomStatusBar;
