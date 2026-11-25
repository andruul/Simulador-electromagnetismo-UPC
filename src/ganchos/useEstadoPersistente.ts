import { useEffect } from 'react';
import type {
  ElectrostaticsSettings,
  Lorentz3DSettings,
  PointCharge,
  SimulationMode,
  ViewMode
} from '../tipos';

const STORAGE_KEY = 'simulador_em_upc_estado_v1';

const VALID_MODES: readonly SimulationMode[] = [
  'electrostatics',
  'gauss',
  'capacitor',
  'magnetostatics',
  'lorentz3d',
  'faraday'
];

export interface PersistedSimulatorState {
  mode: SimulationMode;
  viewMode: ViewMode;
  charges: PointCharge[];
  electroSettings: ElectrostaticsSettings;
  lorentzSettings: Lorentz3DSettings;
  gaussDimMode: '2d' | '3d';
}

export function isValidSimulationMode(val: string | null): val is SimulationMode {
  return val !== null && (VALID_MODES as readonly string[]).includes(val);
}

/**
 * Lee el estado inicial combinando parámetros de URL (?sala=...&vista=...&dim=...)
 * con la última sesión guardada en localStorage.
 */
export function loadInitialSimulatorState(defaults: PersistedSimulatorState): {
  state: PersistedSimulatorState;
  openedFromUrl: boolean;
} {
  let merged = { ...defaults };
  let openedFromUrl = false;

  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<PersistedSimulatorState>;
        if (parsed.mode && isValidSimulationMode(parsed.mode)) merged.mode = parsed.mode;
        if (parsed.viewMode === 'explore' || parsed.viewMode === 'lab') merged.viewMode = parsed.viewMode;
        if (Array.isArray(parsed.charges) && parsed.charges.length > 0) merged.charges = parsed.charges;
        if (parsed.electroSettings) merged.electroSettings = { ...merged.electroSettings, ...parsed.electroSettings };
        if (parsed.lorentzSettings) merged.lorentzSettings = { ...merged.lorentzSettings, ...parsed.lorentzSettings };
        if (parsed.gaussDimMode === '2d' || parsed.gaussDimMode === '3d') merged.gaussDimMode = parsed.gaussDimMode;
      }
    }

    if (typeof window !== 'undefined' && window.location?.search) {
      const params = new URLSearchParams(window.location.search);
      const sala = params.get('sala');
      const vista = params.get('vista');
      const dim = params.get('dim');
      if (isValidSimulationMode(sala)) {
        merged.mode = sala;
        openedFromUrl = true;
      }
      if (vista === 'explore' || vista === 'lab') {
        merged.viewMode = vista;
        openedFromUrl = true;
      }
      if (dim === '2d' || dim === '3d') {
        merged.gaussDimMode = dim;
      }
    }
  } catch {
    // En entornos sin acceso a almacenamiento se conservan los valores por defecto
  }

  return { state: merged, openedFromUrl };
}

/**
 * Construye una URL compartible con la sala y modo de vista actuales.
 */
export function buildShareableUrl(
  mode: SimulationMode,
  viewMode: ViewMode,
  gaussDimMode: '2d' | '3d'
): string {
  if (typeof window === 'undefined') return `?sala=${mode}&vista=${viewMode}`;
  const url = new URL(window.location.href);
  url.searchParams.set('sala', mode);
  url.searchParams.set('vista', viewMode);
  if (mode === 'gauss') {
    url.searchParams.set('dim', gaussDimMode);
  } else {
    url.searchParams.delete('dim');
  }
  return url.toString();
}

/**
 * Sincroniza automáticamente el estado del simulador en localStorage y en la barra de direcciones.
 */
export function usePersistedSimulatorSync(
  state: PersistedSimulatorState,
  isWelcomeOpen: boolean
): void {
  useEffect(() => {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      }
      if (!isWelcomeOpen && typeof window !== 'undefined' && window.history?.replaceState) {
        const nextUrl = buildShareableUrl(state.mode, state.viewMode, state.gaussDimMode);
        window.history.replaceState(null, '', nextUrl);
      }
    } catch {
      // Ignora bloqueos de almacenamiento privado
    }
  }, [state, isWelcomeOpen]);
}
