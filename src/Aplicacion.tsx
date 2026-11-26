import React, { useState, useCallback, useMemo, Suspense } from 'react';
import type {
  SimulationMode,
  ViewMode,
  PointCharge,
  ElectrostaticsSettings,
  Lorentz3DSettings
} from './tipos';
import { TopNavbar } from './interfaz/BarraSuperior';
import { LeftGuidePanel } from './interfaz/PanelGuia';
import { ControlPanel } from './interfaz/PanelControles';
import { RoomViewport } from './interfaz/VisorSalas';
import { ErrorBoundary } from './interfaz/ControladorErrores';
import { NoticeToast } from './interfaz/AvisoNotificacion';
import { WelcomeScreen } from './interfaz/PantallaBienvenida';
import { BottomStatusBar } from './interfaz/BarraEstado';
import { useExportActions } from './ganchos/useAccionesExportar';
import { useGlobalShortcuts } from './ganchos/useAtajosTeclado';
import { useGlobalHistory } from './ganchos/useHistorialGlobal';
import { isPresetRoom, useRoomPresets, type PresetRoom } from './ganchos/usePresetsSalas';
import {
  buildShareableUrl,
  loadInitialSimulatorState,
  usePersistedSimulatorSync
} from './ganchos/useEstadoPersistente';
import {
  buildElectrostaticsPreset,
  createDefaultCharges,
  createDefaultElectrostaticsSettings,
  createDefaultLorentzSettings
} from './configuracion/valoresPorDefecto';
import type { TopicItem } from './datos/temas';

const TheoryModal = React.lazy(() =>
  import('./interfaz/ModalTeoria').then((m) => ({ default: m.TheoryModal }))
);
const SearchModal = React.lazy(() =>
  import('./interfaz/ModalBuscador').then((m) => ({ default: m.SearchModal }))
);

const RESET_PRESETS: Record<PresetRoom, string> = {
  lorentz3d: 'helix',
  magnetostatics: 'parallel_attraction',
  gauss: 'monopole',
  capacitor: 'vacuum',
  faraday: 'oscillate'
};

export const App: React.FC = () => {
  const initialSnapshot = useMemo(
    () =>
      loadInitialSimulatorState({
        mode: 'electrostatics',
        viewMode: 'explore',
        charges: createDefaultCharges(),
        electroSettings: createDefaultElectrostaticsSettings(),
        lorentzSettings: createDefaultLorentzSettings(),
        gaussDimMode: '2d'
      }),
    []
  );

  const [mode, setMode] = useState<SimulationMode>(initialSnapshot.state.mode);
  const [viewMode, setViewMode] = useState<ViewMode>(initialSnapshot.state.viewMode);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState<boolean>(!initialSnapshot.openedFromUrl);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState<boolean>(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);
  const [gaussDimMode, setGaussDimMode] = useState<'2d' | '3d'>(initialSnapshot.state.gaussDimMode);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const { requests: presetRequests, request: requestPreset, clear: clearPreset } = useRoomPresets();

  const [charges, setCharges] = useState<PointCharge[]>(initialSnapshot.state.charges);
  const [selectedChargeId, setSelectedChargeId] = useState<string | null>(null);
  const [electroSettings, setElectroSettings] = useState<ElectrostaticsSettings>(
    initialSnapshot.state.electroSettings
  );
  const [lorentzSettings, setLorentzSettings] = useState<Lorentz3DSettings>(
    initialSnapshot.state.lorentzSettings
  );

  const persistedPayload = useMemo(
    () => ({
      mode,
      viewMode,
      charges,
      electroSettings,
      lorentzSettings,
      gaussDimMode
    }),
    [mode, viewMode, charges, electroSettings, lorentzSettings, gaussDimMode]
  );
  usePersistedSimulatorSync(persistedPayload, isWelcomeOpen);

  const history = useGlobalHistory(persistedPayload);

  const handleUndo = useCallback(() => {
    const prev = history.undo();
    if (!prev) return;
    setMode(prev.mode);
    setViewMode(prev.viewMode);
    setCharges(prev.charges);
    setElectroSettings(prev.electroSettings);
    setLorentzSettings(prev.lorentzSettings);
    setGaussDimMode(prev.gaussDimMode);
  }, [history]);

  const handleRedo = useCallback(() => {
    const next = history.redo();
    if (!next) return;
    setMode(next.mode);
    setViewMode(next.viewMode);
    setCharges(next.charges);
    setElectroSettings(next.electroSettings);
    setLorentzSettings(next.lorentzSettings);
    setGaussDimMode(next.gaussDimMode);
  }, [history]);

  const { notice, dismissNotice, takeScreenshot, generateReport } = useExportActions(mode, viewMode);

  const applyElectroPreset = useCallback((presetType: string) => {
    setSelectedChargeId(null);
    const preset = buildElectrostaticsPreset(presetType);
    if (preset) setCharges(preset);
  }, []);

  const applyPresetTo = useCallback(
    (target: SimulationMode, presetKey: string) => {
      if (target === 'electrostatics') applyElectroPreset(presetKey);
      else if (isPresetRoom(target)) requestPreset(target, presetKey);
    },
    [applyElectroPreset, requestPreset]
  );

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

  const handleApplyPreset = useCallback(
    (presetKey: string) => applyPresetTo(mode, presetKey),
    [mode, applyPresetTo]
  );

  const handleSelectMode = useCallback((newMode: SimulationMode) => {
    setMode(newMode);
    setIsWelcomeOpen(false);
    if (newMode === 'electrostatics' || newMode === 'lorentz3d') {
      setIsSidebarOpen(true);
    } else {
      setIsSidebarOpen(false);
    }
  }, []);

  const handleReset = useCallback(() => {
    if (mode === 'electrostatics') {
      setCharges(createDefaultCharges());
      setSelectedChargeId(null);
    } else if (isPresetRoom(mode)) {
      if (mode === 'lorentz3d') setLorentzSettings(createDefaultLorentzSettings());
      requestPreset(mode, RESET_PRESETS[mode]);
    }
  }, [mode, requestPreset]);

  const handleShareLink = useCallback(() => {
    const link = buildShareableUrl(mode, viewMode, gaussDimMode);
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(link).then(
        () => {
          setShareToast('Enlace directo a esta sala copiado al portapapeles.');
          setTimeout(() => setShareToast(null), 4000);
        },
        () => {
          setShareToast(`Enlace directo: ${link}`);
          setTimeout(() => setShareToast(null), 6000);
        }
      );
    }
  }, [mode, viewMode, gaussDimMode]);

  const toggleViewMode = useCallback(
    () => setViewMode((prev) => (prev === 'explore' ? 'lab' : 'explore')),
    []
  );
  const toggleSearch = useCallback(() => setIsSearchOpen((prev) => !prev), []);
  const toggleTheory = useCallback(() => setIsTheoryOpen((prev) => !prev), []);
  const togglePlay = useCallback(() => setIsPlaying((prev) => !prev), []);
  const handleToggleLeftPanel = useCallback(() => setIsLeftPanelOpen((prev) => !prev), []);
  const handleToggleSidebar = useCallback(() => setIsSidebarOpen((prev) => !prev), []);

  useGlobalShortcuts({
    onToggleSearch: toggleSearch,
    onToggleTheory: toggleTheory,
    onTogglePlay: togglePlay,
    onReset: handleReset,
    onToggleViewMode: toggleViewMode,
    onUndo: handleUndo,
    onRedo: handleRedo
  });

  return (
    <div className="w-screen h-screen flex flex-col bg-[#F5F0E8] text-[#2D2A26] overflow-hidden font-sans">
      <TopNavbar
        mode={mode}
        setMode={handleSelectMode}
        viewMode={viewMode}
        onToggleViewMode={toggleViewMode}
        isPlaying={isPlaying}
        setIsPlaying={setIsPlaying}
        onReset={handleReset}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onTakeScreenshot={takeScreenshot}
        onGenerateReport={generateReport}
        onShareLink={handleShareLink}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenWelcome={() => setIsWelcomeOpen((prev) => !prev)}
        isLeftPanelOpen={isLeftPanelOpen}
        onToggleLeftPanel={handleToggleLeftPanel}
        isSidebarOpen={isSidebarOpen}
        onToggleSidebar={handleToggleSidebar}
      />

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
            <LeftGuidePanel
              mode={mode}
              viewMode={viewMode}
              isOpen={isLeftPanelOpen}
              onToggle={handleToggleLeftPanel}
              onApplyPreset={handleApplyPreset}
              gaussDimMode={gaussDimMode}
              onGaussDimChange={setGaussDimMode}
            />

            <main className="flex-1 h-full relative overflow-hidden bg-[#EDE8DF]">
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

            {(mode === 'electrostatics' || mode === 'lorentz3d') && isSidebarOpen && (
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

      <BottomStatusBar mode={mode} />

      <Suspense fallback={null}>
        {isSearchOpen && (
          <SearchModal
            isOpen={isSearchOpen}
            onClose={() => setIsSearchOpen(false)}
            onSelectTopic={(topic: TopicItem) => handleLaunchPractice(topic.mode, topic.presetKey)}
          />
        )}
        {isTheoryOpen && (
          <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
        )}
      </Suspense>

      <NoticeToast
        message={shareToast ?? notice}
        onDismiss={() => {
          setShareToast(null);
          dismissNotice();
        }}
      />
    </div>
  );
};

export default App;
