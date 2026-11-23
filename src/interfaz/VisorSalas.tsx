import React from 'react';
import type {
  ElectrostaticsSettings,
  Lorentz3DSettings,
  PointCharge,
  SimulationMode,
  ViewMode
} from '../tipos';
import { ElectrostaticsCanvas } from '../salas/sala1_electrostatica/LienzoElectrostatica';
import { LorentzViewer3D } from '../salas/sala5_lorentz3d/VisorLorentz3D';
import { MagnetostaticsCanvas } from '../salas/sala4_magnetostatica/LienzoMagnetostatica';
import { GaussFluxCanvas } from '../salas/sala2_gauss/LienzoGauss2D';
import { CapacitorLabCanvas } from '../salas/sala3_capacitancia/LienzoCapacitor';
import { FaradayInductionCanvas } from '../salas/sala6_faraday/LienzoFaraday';
import type { PresetRoom } from '../ganchos/usePresetsSalas';

interface RoomViewportProps {
  mode: SimulationMode;
  viewMode: ViewMode;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  // Electrostatics state (shared with the control panel)
  charges: PointCharge[];
  setCharges: React.Dispatch<React.SetStateAction<PointCharge[]>>;
  selectedChargeId: string | null;
  setSelectedChargeId: (id: string | null) => void;
  electroSettings: ElectrostaticsSettings;
  // Lorentz state (shared with the control panel)
  lorentzSettings: Lorentz3DSettings;
  setLorentzSettings: React.Dispatch<React.SetStateAction<Lorentz3DSettings>>;
  // One-click preset requests of the rooms that own their state
  presetRequests: Record<PresetRoom, string | null>;
  onPresetHandled: (room: PresetRoom) => void;
  gaussDimMode?: '2d' | '3d';
  onGaussDimChange?: (dim: '2d' | '3d') => void;
}

/** The interactive simulation viewport: renders the room selected in the navbar. */
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
