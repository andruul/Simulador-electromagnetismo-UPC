import React, { useState, useCallback } from 'react';
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
import { RoomViewport } from './components/RoomViewport';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NoticeToast } from './components/NoticeToast';
import { TheoryModal } from './components/TheoryModal';
import { WelcomeScreen } from './components/WelcomeScreen';
import { SearchModal } from './components/SearchModal';
import { BottomStatusBar } from './components/BottomStatusBar';
import { useExportActions } from './hooks/useExportActions';
import { useGlobalShortcuts } from './hooks/useGlobalShortcuts';
import { isPresetRoom, useRoomPresets, type PresetRoom } from './hooks/useRoomPresets';
import {
  buildElectrostaticsPreset,
  createDefaultCharges,
  createDefaultElectrostaticsSettings,
  createDefaultLorentzSettings
} from './app/defaults';
import type { TopicItem } from './data/topics';

/** Preset each room returns to when the student presses Reset. */
const RESET_PRESETS: Record<PresetRoom, string> = {
  lorentz3d: 'helix',
  magnetostatics: 'parallel_attraction',
  gauss: 'monopole',
  capacitor: 'vacuum',
  faraday: 'oscillate'
};

export const App: React.FC = () => {
  const [mode, setMode] = useState<SimulationMode>('electrostatics');
  const [viewMode, setViewMode] = useState<ViewMode>('explore');
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(true); // Institutional launcher opens first
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [gaussDimMode, setGaussDimMode] = useState<'2d' | '3d'>('2d');

  // Preset requests for the laboratory rooms that own their own state
  const { requests: presetRequests, request: requestPreset, clear: clearPreset } = useRoomPresets();

  // Electrostatics and Lorentz state are shared with the control panel
  const [charges, setCharges] = useState<PointCharge[]>(createDefaultCharges);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [electroSettings, setElectroSettings] = useState<ElectrostaticsSettings>(
    createDefaultElectrostaticsSettings
  );
  const [lorentzSettings, setLorentzSettings] = useState<Lorentz3DSettings>(
    createDefaultLorentzSettings
  );

  const { notice, dismissNotice, takeScreenshot, generateReport } = useExportActions(mode, viewMode);

  // Apply preset to electrostatics charges
  const applyElectroPreset = useCallback((presetType: string) => {
    setSelectedChargeId(null);
    const preset = buildElectrostaticsPreset(presetType);
    if (preset) setCharges(preset);
  }, []);

  // Apply a preset to whichever room is the target
  const applyPresetTo = useCallback(
    (target: SimulationMode, presetKey: string) => {
      if (target === 'electrostatics') applyElectroPreset(presetKey);
      else if (isPresetRoom(target)) requestPreset(target, presetKey);
    },
    [applyElectroPreset, requestPreset]
  );

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
      if (presetKey) applyPresetTo(targetMode, presetKey);
    },
    [applyPresetTo]
  );

  // Apply preset directly from LeftGuidePanel
  const handleApplyPreset = useCallback(
    (presetKey: string) => applyPresetTo(mode, presetKey),
    [mode, applyPresetTo]
  );

  // Switch mode directly from navbar
  const handleSelectMode = useCallback((newMode: SimulationMode) => {
    setMode(newMode);
    setIsWelcomeOpen(false);
    // Smart focus: open right sidebar for modes needing inspector (electrostatics, lorentz3d);
    // for rooms with native canvas controls (gauss, capacitor, magnetostatics, faraday), keep canvas wide.
    if (newMode === 'electrostatics' || newMode === 'lorentz3d') {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, []);

  // Reset current mode state
  const handleReset = useCallback(() => {
    if (mode === 'electrostatics') {
      setCharges(createDefaultCharges());
      setSelectedChargeId(null);
    } else if (isPresetRoom(mode)) {
      if (mode === 'lorentz3d') setLorentzSettings(createDefaultLorentzSettings());
      requestPreset(mode, RESET_PRESETS[mode]);
    }
  }, [mode, requestPreset]);

  const toggleViewMode = useCallback(
    () => setViewMode((prev) => (prev === 'explore' ? 'lab' : 'explore')),
    []
  );
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const toggleTheory = useCallback(() => setIsTheoryOpen((prev) => !prev), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);

  const handleToggleLeftPanel = useCallback(() => {
    setIsLeftPanelOpen((prev) => !prev);
  }, []);

  const handleToggleSidebar = useCallback(() => {
    setIsSidebarOpen((prev) => !prev);
  }, []);

  // Global desktop shortcuts: [Space] Play/Pause, [R] Reset, [M] Mode, [F1] Theory, [Ctrl+K] Search
  useGlobalShortcuts({
    onToggleSearch: toggleSearch,
    onToggleTheory: toggleTheory,
    onTogglePlay: togglePlay,
    onReset: handleReset,
    onToggleViewMode: toggleViewMode
  });

  return (
    <div className="w-screen h-screen flex flex-col bg-[#070b14] text-slate-100 overflow-hidden font-sans">
      {/* Top Application Header Bar */}
      <TopNavbar
        mode={mode}
        setMode={handleSelectMode}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onReset={handleReset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onTakeScreenshot={takeScreenshot}
        onGenerateReport={generateReport}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWelcome={() => setIsWelcomeOpen((prev) => !prev)}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleLeftPanel={handleToggleLeftPanel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
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
              onToggle={handleToggleLeftPanel}
              onApplyPreset={handleApplyPreset}
              gaussDimMode={gaussDimMode}
              onGaussDimChange={setGaussDimMode}
            />

            {/* Center Interactive Simulation Viewport */}
            <main className="flex-1 h-full relative overflow-hidden bg-[#090d16]">
              <ErrorBoundary label="este laboratorio" resetKey={mode}>
                <RoomViewport
                  mode={mode}
                  viewMode={viewMode}
                  isPlaying={isPlaying}
                  setIsPlaying={setIsPlaying}
                  charges={charges}
                  setCharges={setCharges}
                  selectedChargeId={selectedChargeId}
                  setSelectedChargeId={setSelectedChargeId}
                  electroSettings={electroSettings}
                  lorentzSettings={lorentzSettings}
                  setLorentzSettings={setLorentzSettings}
                  presetRequests={presetRequests}
                  onPresetHandled={clearPreset}
                  gaussDimMode={gaussDimMode}
                  onGaussDimChange={setGaussDimMode}
                />
              </ErrorBoundary>
            </main>

            {/* Right Side Control Inspector (320px) */}
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
                onRequestLorentzPreset={(preset) => requestPreset('lorentz3d', preset)}
                onRequestMagnetoPreset={(preset) => requestPreset('magnetostatics', preset)}
                onClose={handleToggleSidebar}
              />
            )}
          </>
        )}
      </div>

      {/* Bottom Desktop Status Bar */}
      <BottomStatusBar mode={mode} />

      {/* Global Topic Search Modal */}
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectTopic={(topic: TopicItem) => handleLaunchPractice(topic.mode, topic.presetKey)}
      />

      {/* Theory Guide Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />

      {/* Visible export error notice */}
      <NoticeToast message={notice} onDismiss={dismissNotice} />
    </div>
  );
};

export default App;
