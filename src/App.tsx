import React, { useState, useCallback, useEffect } from 'react';
import type {
  SimulationMode,
  ViewMode,
  PointCharge,
  ElectrostaticsSettings,
  Lorentz3DSettings
} from './types';
import { TopNavbar } from './components/TopNavbar';
import { LeftGuidePanel } from './components/LeftGuidePanel';
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
  const [viewMode, setViewMode] = useState<ViewMode>('explore');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true); // Institutional launcher opens first
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // Preset communication requests for each laboratory room
  const [lorentzPresetRequest, setLorentzPresetRequest] = useState<string | null>(null);
  const [magnetoPresetRequest, setMagnetoPresetRequest] = useState<string | null>(null);
  const [gaussPresetRequest, setGaussPresetRequest] = useState<string | null>(null);
  const [capacitorPresetRequest, setCapacitorPresetRequest] = useState<string | null>(null);
  const [faradayPresetRequest, setFaradayPresetRequest] = useState<string | null>(null);

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
      } else if (targetMode === 'gauss' && presetKey) {
        setGaussPresetRequest(presetKey);
      } else if (targetMode === 'capacitor' && presetKey) {
        setCapacitorPresetRequest(presetKey);
      } else if (targetMode === 'faraday' && presetKey) {
        setFaradayPresetRequest(presetKey);
      }
    },
    [applyElectroPreset]
  );

  // Apply preset directly from LeftGuidePanel
  const handleApplyPreset = useCallback((presetKey: string) => {
    if (mode === 'electrostatics') {
      applyElectroPreset(presetKey);
    } else if (mode === 'lorentz3d') {
      setLorentzPresetRequest(presetKey);
    } else if (mode === 'magnetostatics') {
      setMagnetoPresetRequest(presetKey);
    } else if (mode === 'gauss') {
      setGaussPresetRequest(presetKey);
    } else if (mode === 'capacitor') {
      setCapacitorPresetRequest(presetKey);
    } else if (mode === 'faraday') {
      setFaradayPresetRequest(presetKey);
    }
  }, [mode, applyElectroPreset]);

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
    } else if (mode === 'gauss') {
      setGaussPresetRequest('monopole');
    } else if (mode === 'capacitor') {
      setCapacitorPresetRequest('vacuum');
    } else if (mode === 'faraday') {
      setFaradayPresetRequest('oscillate');
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
      {/* Top Application Header Bar */}
      <TopNavbar
        mode={mode}
        setMode={handleSelectMode}
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'explore' ? 'lab' : 'explore'))}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onTakeScreenshot={handleTakeScreenshot}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWelcome={() => setIsWelcomeOpen((prev) => !prev)}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleLeftPanel={() => setIsLeftPanelOpen((prev) => !prev)}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)}
      />

      {/* Main Workspace Layout (Fixed 4-block desktop arrangement) */}
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
            {/* Left Pedagogical Guide & 1-Click Presets Panel (280px) */}
            <LeftGuidePanel
              mode={mode}
              viewMode={viewMode}
              isOpen={isLeftPanelOpen}
              onToggle={() => setIsLeftPanelOpen((prev) => !prev)}
              onApplyPreset={handleApplyPreset}
              onOpenTheory={() => setIsTheoryOpen(true)}
            />

            {/* Center Interactive Simulation Viewport */}
            <main className="flex-1 h-full relative overflow-hidden bg-[#090d16]">
              {mode === 'electrostatics' && (
                <ElectrostaticsCanvas
                  charges={charges}
                  setCharges={setCharges}
                  selectedChargeId={selectedChargeId}
                  setSelectedChargeId={setSelectedChargeId}
                  settings={electroSettings}
                  isPlaying={isPlaying}
                  viewMode={viewMode}
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
                  viewMode={viewMode}
                />
              )}

              {mode === 'magnetostatics' && (
                <MagnetostaticsCanvas
                  presetRequest={magnetoPresetRequest}
                  onPresetHandled={() => setMagnetoPresetRequest(null)}
                  viewMode={viewMode}
                />
              )}

              {mode === 'gauss' && (
                <GaussFluxCanvas
                  presetRequest={gaussPresetRequest}
                  onPresetHandled={() => setGaussPresetRequest(null)}
                  viewMode={viewMode}
                />
              )}

              {mode === 'capacitor' && (
                <CapacitorLabCanvas
                  presetRequest={capacitorPresetRequest}
                  onPresetHandled={() => setCapacitorPresetRequest(null)}
                  viewMode={viewMode}
                />
              )}

              {mode === 'faraday' && (
                <FaradayInductionCanvas
                  presetRequest={faradayPresetRequest}
                  onPresetHandled={() => setFaradayPresetRequest(null)}
                  viewMode={viewMode}
                />
              )}
            </main>

            {/* Right Side Control Inspector (320px) */}
            {isSidebarOpen && (
              <ControlPanel
                mode={mode}
                viewMode={viewMode}
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
