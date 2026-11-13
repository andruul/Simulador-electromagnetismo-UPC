import React, { useState, useCallback, useEffect } from 'react';
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
import { GaussFluxCanvas } from './components/GaussFluxCanvas';
import { CapacitorLabCanvas } from './components/CapacitorLabCanvas';
import { FaradayInductionCanvas } from './components/FaradayInductionCanvas';
import { TheoryModal } from './components/TheoryModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SearchModal } from './components/SearchModal';
import type { TopicItem } from './data/topics';

export const App: React.FC = () => {
  const [mode, setMode] = useState<SimulationMode>('electrostatics');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true); // Institutional portal opens first
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Preset communication requests
  const [lorentzPresetRequest, setLorentzPresetRequest] = useState<string | null>(null);
  const [magnetoPresetRequest, setMagnetoPresetRequest] = useState<string | null>(null);

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

  // Global Ctrl+K / Cmd+K listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Apply preset to electrostatics charges
  const applyElectroPreset = useCallback((presetType: string) => {
    setSelectedChargeId(null);
    if (presetType === 'single') {
      setCharges([{ id: 'c1', x: 400, y: 300, charge: 2, fixed: false }]);
    } else if (presetType === 'dipole') {
      setCharges([
        { id: 'c1', x: 320, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 480, y: 300, charge: -2, fixed: false }
      ]);
    } else if (presetType === 'repulsion') {
      setCharges([
        { id: 'c1', x: 320, y: 300, charge: 2, fixed: false },
        { id: 'c2', x: 480, y: 300, charge: 2, fixed: false }
      ]);
    } else if (presetType === 'quadrupole') {
      setCharges([
        { id: 'c1', x: 340, y: 240, charge: 2, fixed: false },
        { id: 'c2', x: 460, y: 240, charge: -2, fixed: false },
        { id: 'c3', x: 340, y: 360, charge: -2, fixed: false },
        { id: 'c4', x: 460, y: 360, charge: 2, fixed: false }
      ]);
    } else if (presetType === 'capacitor') {
      const plates: PointCharge[] = [];
      const count = 7;
      const startX = 260;
      const step = 45;
      for (let i = 0; i < count; i++) {
        plates.push({
          id: `top_${i}`,
          x: startX + i * step,
          y: 200,
          charge: 1.5,
          fixed: true
        });
        plates.push({
          id: `bot_${i}`,
          x: startX + i * step,
          y: 400,
          charge: -1.5,
          fixed: true
        });
      }
      setCharges(plates);
    }
  }, []);

  // Launch a practice from Welcome Screen or Search Modal
  const handleLaunchPractice = useCallback(
    (targetMode: SimulationMode | 'theory', presetKey?: string) => {
      setIsWelcomeOpen(false);
      setIsSearchOpen(false);

      if (targetMode === 'theory') {
        setIsTheoryOpen(true);
        return;
      }

      setMode(targetMode);

      if (targetMode === 'electrostatics' && presetKey) {
        applyElectroPreset(presetKey);
      } else if (targetMode === 'lorentz3d' && presetKey) {
        setLorentzPresetRequest(presetKey);
      } else if (targetMode === 'magnetostatics' && presetKey) {
        setMagnetoPresetRequest(presetKey);
      }
    },
    [applyElectroPreset]
  );

  // Switch mode directly from navbar
  const handleSelectMode = useCallback((newMode: SimulationMode) => {
    setMode(newMode);
    setIsWelcomeOpen(false);
  }, []);

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
      setLorentzPresetRequest('helix');
    } else if (mode === 'magnetostatics') {
      setMagnetoPresetRequest('parallel_attraction');
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
      a.download = `electro-sim-upc-${mode}-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('Error al capturar la imagen:', err);
    }
  }, [mode]);

  return (
    <div className="w-screen h-screen flex flex-col bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <TopNavbar
        mode={mode}
        setMode={handleSelectMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onTakeScreenshot={handleTakeScreenshot}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWelcome={() => setIsWelcomeOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {isWelcomeOpen ? (
          <WelcomeScreen
            onStartSimulation={() => setIsWelcomeOpen(false)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenTheory={() => setIsTheoryOpen(true)}
            onLaunchPractice={handleLaunchPractice}
          />
        ) : (
          <>
            {/* Active Simulation Viewport */}
            <main className="flex-1 h-full relative overflow-hidden bg-[#090d16]">
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
                  presetRequest={lorentzPresetRequest}
                  onPresetHandled={() => setLorentzPresetRequest(null)}
                />
              )}

              {mode === 'magnetostatics' && (
                <MagnetostaticsCanvas
                  presetRequest={magnetoPresetRequest}
                  onPresetHandled={() => setMagnetoPresetRequest(null)}
                />
              )}

              {mode === 'gauss' && <GaussFluxCanvas />}

              {mode === 'capacitor' && <CapacitorLabCanvas />}

              {mode === 'faraday' && <FaradayInductionCanvas />}
            </main>

            {/* Side Control Inspector */}
            {isSidebarOpen && (
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
                onRequestLorentzPreset={(preset) => setLorentzPresetRequest(preset)}
                onRequestMagnetoPreset={(preset) => setMagnetoPresetRequest(preset)}
                onClose={() => setIsSidebarOpen(false)}
              />
            )}
          </>
        )}
      </div>

      {/* Global Topic Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={(topic: TopicItem) => handleLaunchPractice(topic.mode, topic.presetKey)}
      />

      {/* Theory Guide Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
};

export default App;
