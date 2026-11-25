import React, { Suspense } from 'react';
import type {
  ElectrostaticsSettings,
  Lorentz3DSettings,
  PointCharge,
  SimulationMode,
  ViewMode
} from '../tipos';
import type { PresetRoom } from '../ganchos/usePresetsSalas';

// Carga diferida (Code Splitting) sala por sala: Three.js solo se descarga al abrir Gauss 3D o Lorentz 3D
const ElectrostaticsCanvas = React.lazy(() =>
  import('../salas/sala1_electrostatica/LienzoElectrostatica').then((m) => ({
    default: m.ElectrostaticsCanvas
  }))
);
const GaussFluxCanvas = React.lazy(() =>
  import('../salas/sala2_gauss/LienzoGauss2D').then((m) => ({
    default: m.GaussFluxCanvas
  }))
);
const CapacitorLabCanvas = React.lazy(() =>
  import('../salas/sala3_capacitancia/LienzoCapacitor').then((m) => ({
    default: m.CapacitorLabCanvas
  }))
);
const MagnetostaticsCanvas = React.lazy(() =>
  import('../salas/sala4_magnetostatica/LienzoMagnetostatica').then((m) => ({
    default: m.MagnetostaticsCanvas
  }))
);
const LorentzViewer3D = React.lazy(() =>
  import('../salas/sala5_lorentz3d/VisorLorentz3D').then((m) => ({
    default: m.LorentzViewer3D
  }))
);
const FaradayInductionCanvas = React.lazy(() =>
  import('../salas/sala6_faraday/LienzoFaraday').then((m) => ({
    default: m.FaradayInductionCanvas
  }))
);

interface RoomViewportProps {
  mode: SimulationMode;
  viewMode: ViewMode;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  charges: PointCharge[];
  setCharges: React.Dispatch<React.SetStateAction<PointCharge[]>>;
  selectedChargeId: string | null;
  setSelectedChargeId: (id: string | null) => void;
  electroSettings: ElectrostaticsSettings;
  lorentzSettings: Lorentz3DSettings;
  setLorentzSettings: React.Dispatch<React.SetStateAction<Lorentz3DSettings>>;
  presetRequests: Record<PresetRoom, string | null>;
  onPresetHandled: (room: PresetRoom) => void;
  gaussDimMode?: '2d' | '3d';
  onGaussDimChange?: (dim: '2d' | '3d') => void;
}

const RoomLoadingFallback: React.FC = () => (
  <div className="w-full h-full flex items-center justify-center bg-[#FAF7F2] text-[#5C554E] text-xs font-medium select-none">
    <div className="px-4 py-2.5 rounded-xl bg-white/90 border border-[#DDD5C8] shadow-sm flex items-center gap-2">
      <span className="w-2 h-2 rounded-full bg-[#2D7A64] animate-pulse" />
      <span>Preparando sala de laboratorio...</span>
    </div>
  </div>
);

/** Visor central interactivo con división automática de código por sala. */
export const RoomViewport: React.FC<RoomViewportProps> = ({
  mode,
  viewMode,
  isPlaying,
  setIsPlaying,
  charges,
  setCharges,
  selectedChargeId,
  setSelectedChargeId,
  electroSettings,
  lorentzSettings,
  setLorentzSettings,
  presetRequests,
  onPresetHandled,
  gaussDimMode,
  onGaussDimChange
}) => {
  const renderRoom = () => {
    switch (mode) {
      case 'electrostatics':
        return (
          <ElectrostaticsCanvas
            charges={charges}
            setCharges={setCharges}
            selectedChargeId={selectedChargeId}
            setSelectedChargeId={setSelectedChargeId}
            settings={electroSettings}
            isPlaying={isPlaying}
            viewMode={viewMode}
          />
        );
      case 'lorentz3d':
        return (
          <LorentzViewer3D
            settings={lorentzSettings}
            setSettings={setLorentzSettings}
            isPlaying={isPlaying}
            setIsPlaying={setIsPlaying}
            presetRequest={presetRequests.lorentz3d}
            onPresetHandled={() => onPresetHandled('lorentz3d')}
            viewMode={viewMode}
          />
        );
      case 'magnetostatics':
        return (
          <MagnetostaticsCanvas
            presetRequest={presetRequests.magnetostatics}
            onPresetHandled={() => onPresetHandled('magnetostatics')}
            viewMode={viewMode}
          />
        );
      case 'gauss':
        return (
          <GaussFluxCanvas
            presetRequest={presetRequests.gauss}
            onPresetHandled={() => onPresetHandled('gauss')}
            viewMode={viewMode}
            dimMode={gaussDimMode}
            onDimModeChange={onGaussDimChange}
          />
        );
      case 'capacitor':
        return (
          <CapacitorLabCanvas
            presetRequest={presetRequests.capacitor}
            onPresetHandled={() => onPresetHandled('capacitor')}
            viewMode={viewMode}
          />
        );
      case 'faraday':
        return (
          <FaradayInductionCanvas
            presetRequest={presetRequests.faraday}
            onPresetHandled={() => onPresetHandled('faraday')}
            viewMode={viewMode}
          />
        );
      default:
        return null;
    }
  };

  return <Suspense fallback={<RoomLoadingFallback />}>{renderRoom()}</Suspense>;
};
