import { useCallback, useState } from 'react';
import type { SimulationMode } from '../types';

/** Laboratory rooms whose presets travel as a "request" prop (they own their own state). */
export type PresetRoom = 'lorentz3d' | 'magnetostatics' | 'gauss' | 'capacitor' | 'faraday';

const PRESET_ROOMS: readonly SimulationMode[] = [
  'lorentz3d',
  'magnetostatics',
  'gauss',
  'capacitor',
  'faraday'
];

export function isPresetRoom(mode: SimulationMode): mode is PresetRoom {
  return PRESET_ROOMS.includes(mode);
}

type PresetRequests = Record<PresetRoom, string | null>;

const NO_REQUESTS: PresetRequests = {
  lorentz3d: null,
  magnetostatics: null,
  gauss: null,
  capacitor: null,
  faraday: null
};

/**
 * Pending one-click preset request of each room. A room consumes its request and calls
 * `clear` once handled, so the same preset can be requested again later.
 */
export function useRoomPresets(): {
  requests: PresetRequests;
  request: (room: PresetRoom, presetKey: string) => void;
  clear: (room: PresetRoom) => void;
} {
  const [requests, setRequests] = useState<PresetRequests>(NO_REQUESTS);

  const request = useCallback((room: PresetRoom, presetKey: string) => {
    setRequests((prev) => ({ ...prev, [room]: presetKey }));
  }, []);

  const clear = useCallback((room: PresetRoom) => {
    setRequests((prev) => (prev[room] === null ? prev : { ...prev, [room]: null }));
  }, []);

  return { requests, request, clear };
}
