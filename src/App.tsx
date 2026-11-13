import React, { useState, useCallback } from 'react';
import type {
  SimulationMode,
  PointCharge,
  ElectrostaticsSettings,
  Lorentz3DSettings
} from './types';
import { TopNavbar } from './components/TopNavbar';
import { ControlPanel } from './components/ControlPanel';
import { ElectrostaticsCanvas } from './components/ElectrostaticsCanvas';
import { LorentzViewer3D } from './components/LorentzViewer3D';
import { MagnetostaticsCanvas } from './components/MagnetostaticsCanvas';
import { TheoryModal } from './components/TheoryModal';

export const App: React.FC = () => {
  const [mode, setMode] = useState<SimulationMode>('electrostatics');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Electrostatics state
  const [charges, setCharges] = useState<PointCharge[]>([
    { id: 'c1', x: 330, y: 300, charge: 2, fixed: false },
    { id: 'c2', x: 490, y: 300, charge: -2, fixed: false }
  ]);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [electroSettings, setElectroSettings] = useState<ElectrostaticsSettings>({
    showVectorField: true,
    showFieldLines: true,
    showPotentialHeatmap: true,
    showEquipotentialLines: true,
    fieldLinesPerCharge: 16,
    vectorGridDensity: 32,
    rk4StepSize: 4,
    maxFieldLineSteps: 260,
    kConstant: 89900
  });

  // Lorentz 3D state
  const [lorentzSettings, setLorentzSettings] = useState<Lorentz3DSettings>({
    eField: { x: 0, y: 0, z: 0 },
    bField: { x: 0, y: 0, z: 2.0 },
    fieldConfiguration: 'uniform',
    showVectorsOnParticle: true,
    showFieldVectors: true,
    timeStep: 0.04,
    trailLength: 350
  });

  // Reset current mode state
  const handleReset = useCallback(() => {
    if (mode === 'electrostatics') {
      setCharges([
        { id: 'c1', x: 330, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 490, y: 300, charge: -2, fixed: false }
      ]);
      setSelectedChargeId(null);
    } else if (mode === 'lorentz3d') {
      setLorentzSettings({
        eField: { x: 0, y: 0, z: 0 },
        bField: { x: 0, y: 0, z: 2.0 },
        fieldConfiguration: 'uniform',
        showVectorsOnParticle: true,
        showFieldVectors: true,
        timeStep: 0.04,
        trailLength: 350
      });
    }
  }, [mode]);

  // Take screenshot of active canvas
  const handleTakeScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    try {
      const dataUrl = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `electro-sim-${mode}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al capturar la imagen:', err);
    }
  }, [mode]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <TopNavbar
        mode={mode}
        setMode={setMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onTakeScreenshot={handleTakeScreenshot}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Active Simulation Viewport */}
        <main className="flex-1 h-full relative overflow-hidden">
          {mode === 'electrostatics' && (
            <ElectrostaticsCanvas
              charges={charges}
              setCharges={setCharges}
              selectedChargeId={selectedChargeId}
              setSelectedChargeId={setSelectedChargeId}
              settings={electroSettings}
              isPlaying={isPlaying}
            />
          )}

          {mode === 'lorentz3d' && (
            <LorentzViewer3D
              settings={lorentzSettings}
              setSettings={setLorentzSettings}
              isPlaying={isPlaying}
              setIsPlaying={setIsPlaying}
            />
          )}

          {mode === 'magnetostatics' && <MagnetostaticsCanvas />}
        </main>

        {/* Side Control Inspector */}
        <ControlPanel
          mode={mode}
          charges={charges}
          setCharges={setCharges}
          selectedChargeId={selectedChargeId}
          setSelectedChargeId={setSelectedChargeId}
          electroSettings={electroSettings}
          setElectroSettings={setElectroSettings}
          lorentzSettings={lorentzSettings}
          setLorentzSettings={setLorentzSettings}
        />
      </div>

      {/* Theory Guide Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
};

export default App;
