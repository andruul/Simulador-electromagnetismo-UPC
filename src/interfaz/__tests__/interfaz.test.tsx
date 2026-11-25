import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TopNavbar } from '../BarraSuperior';
import { BottomStatusBar } from '../BarraEstado';
import { WelcomeScreen } from '../PantallaBienvenida';
import { NoticeToast } from '../AvisoNotificacion';
import { CapacitorHud } from '../../salas/sala3_capacitancia/TelemetriaCapacitor';
import { FaradayHud } from '../../salas/sala6_faraday/TelemetriaFaraday';
import { LorentzTelemetryHud } from '../../salas/sala5_lorentz3d/TelemetriaLorentz';
import { DIELECTRIC_MATERIALS, computeCapacitorState } from '../../fisica/capacitancia';
import {
  buildShareableUrl,
  isValidSimulationMode,
  loadInitialSimulatorState
} from '../../ganchos/useEstadoPersistente';
import {
  createDefaultCharges,
  createDefaultElectrostaticsSettings,
  createDefaultLorentzSettings
} from '../../configuracion/valoresPorDefecto';

describe('Pruebas de Interfaz de Usuario (Renderizado y Reglas Contextuales)', () => {
  const baseNavProps = {
    setMode: vi.fn(),
    viewMode: 'explore' as const,
    onToggleViewMode: vi.fn(),
    isPlaying: true,
    setIsPlaying: vi.fn(),
    onReset: vi.fn(),
    onOpenTheory: vi.fn(),
    onTakeScreenshot: vi.fn(),
    onGenerateReport: vi.fn(),
    onShareLink: vi.fn(),
    onOpenSearch: vi.fn(),
    onOpenWelcome: vi.fn(),
    isSidebarOpen: true,
    onToggleSidebar: vi.fn()
  };

  it('muestra pausa y panel lateral en Electrostática, pero los oculta en Faraday y Gauss', () => {
    const htmlElectro = renderToStaticMarkup(
      <TopNavbar {...baseNavProps} mode="electrostatics" />
    );
    expect(htmlElectro).toContain('Pausar simulación');
    expect(htmlElectro).toContain('Ocultar panel de controles');

    const htmlFaraday = renderToStaticMarkup(<TopNavbar {...baseNavProps} mode="faraday" />);
    expect(htmlFaraday).not.toContain('Pausar simulación');
    expect(htmlFaraday).not.toContain('Ocultar panel de controles');
    expect(htmlFaraday).toContain('Compartir enlace de la sala actual');
  });

  it('renderiza la Pantalla de Bienvenida institucional de la UPC con las 6 salas', () => {
    const html = renderToStaticMarkup(
      <WelcomeScreen
        onStartSimulation={vi.fn()}
        onOpenSearch={vi.fn()}
        onOpenTheory={vi.fn()}
        onLaunchPractice={vi.fn()}
      />
    );
    expect(html).toContain('Universidad Popular del Cesar');
    expect(html).toContain('Electrostática');
    expect(html).toContain('Faraday');
  });

  it('renderiza Telemetría de Capacitancia incluyendo corrección de borde de Kirchhoff en Modo Medición', () => {
    const phys = computeCapacitorState({
      plateAreaMm2: 200,
      plateDistanceMm: 5,
      kappa: 2.1,
      insertionFraction: 0.5,
      connectedToBattery: true,
      batteryVoltage: 1.5
    });
    const html = renderToStaticMarkup(
      <CapacitorHud
        viewMode="lab"
        physics={phys}
        connectedToBattery={true}
        material={DIELECTRIC_MATERIALS[1]}
        insertionFraction={0.5}
        plateAreaMm2={200}
        plateDistanceMm={5}
      />
    );
    expect(html).toContain('C ideal:');
    expect(html).toContain('C Kirchhoff:');
    expect(html).toContain('pF');
  });

  it('renderiza Telemetría de Faraday con ancho fijo tabular y Telemetría de Lorentz con escala SI explícita', () => {
    const faradayHtml = renderToStaticMarkup(
      <FaradayHud
        viewMode="lab"
        coilTurns={3}
        values={{
          flux: 0.00012,
          dFluxDt: -0.045,
          emf: 0.135,
          current: 0.011,
          bulbPower: 0.0012,
          bulbBrightness: 0.3
        }}
      />
    );
    expect(faradayHtml).toContain('w-[770px]');
    expect(faradayHtml).toContain('tabular-nums');

    const lorentzHtml = renderToStaticMarkup(
      <LorentzTelemetryHud
        viewMode="lab"
        bFieldZ={2}
        isExpanded={true}
        onToggle={vi.fn()}
        telemetry={{
          speed: 3.0,
          force: 6.0,
          kineticEnergy: 4.5,
          larmorRadius: 1.5,
          cyclotronFreq: 0.32,
          pos: { x: 1, y: 0, z: 0 }
        }}
      />
    );
    expect(lorentzHtml).toContain('1.00 C/kg');
    expect(lorentzHtml).toContain('Radio de Larmor');
  });

  it('renderiza BarraEstado y AvisoNotificacion sin errores', () => {
    const statusHtml = renderToStaticMarkup(<BottomStatusBar mode="magnetostatics" />);
    expect(statusHtml.length).toBeGreaterThan(20);

    const toastHtml = renderToStaticMarkup(
      <NoticeToast message="Enlace copiado" onDismiss={vi.fn()} />
    );
    expect(toastHtml).toContain('Enlace copiado');
  });
});

describe('Persistencia y Serialización de Estado Compartible por URL', () => {
  it('valida modos de simulación permitidos y construye URL compartibles', () => {
    expect(isValidSimulationMode('faraday')).toBe(true);
    expect(isValidSimulationMode('inexistente')).toBe(false);
    expect(buildShareableUrl('faraday', 'lab', '2d')).toContain('sala=faraday');
    expect(buildShareableUrl('faraday', 'lab', '2d')).toContain('vista=lab');
  });

  it('recupera valores por defecto de forma segura en entorno sin window/localStorage', () => {
    const defaults = {
      mode: 'electrostatics' as const,
      viewMode: 'explore' as const,
      charges: createDefaultCharges(),
      electroSettings: createDefaultElectrostaticsSettings(),
      lorentzSettings: createDefaultLorentzSettings(),
      gaussDimMode: '2d' as const
    };
    const loaded = loadInitialSimulatorState(defaults);
    expect(loaded.state.mode).toBe('electrostatics');
    expect(loaded.openedFromUrl).toBe(false);
  });
});
