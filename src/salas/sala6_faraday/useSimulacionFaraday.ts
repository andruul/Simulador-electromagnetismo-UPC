import { useEffect, useRef, useState, type Dispatch, type RefObject, type SetStateAction } from 'react';
import {
  calculateCoilFlux,
  computeFaradayInduction,
  type BarMagnet,
  type InductionCoil
} from '../../fisica/faraday';
import {
  OSCILLOSCOPE_POINTS,
  drawFaradayFrame,
  type HistorySample,
  type OutputDevice,
  type Viewport
} from './renderizadorFaraday';

/** Resistance of the connected bulb (Ω). */
const BULB_RESISTANCE_OHM = 10;
/** Radial Gauss-Legendre nodes of the flux quadrature (see physics tests: error < 0.5 %). */
const FLUX_RADIAL_NODES = 32;
/**
 * Galvanometer full-scale deflection (V). Sized for the real EMF range of the lab
 * (peak ≈ 0.35 V with N = 3 while oscillating), so the needle swings visibly.
 */
const GALVANOMETER_FULL_SCALE_V = 0.7;

export interface InstantValues {
  flux: number; // Wb
  dFluxDt: number; // Wb/s
  emf: number; // V
  current: number; // A
  bulbPower: number; // W
  bulbBrightness: number; // [0, 1]
}

const INITIAL_VALUES: InstantValues = {
  flux: 0,
  dFluxDt: 0,
  emf: 0,
  current: 0,
  bulbPower: 0,
  bulbBrightness: 0
};

export interface FaradaySimulationOptions {
  canvasRef: RefObject<HTMLCanvasElement | null>;
  viewport: Viewport;
  magnet: BarMagnet;
  setMagnet: Dispatch<SetStateAction<BarMagnet>>;
  coil: InductionCoil;
  isOscillating: boolean;
  oscillationFreq: number; // Hz
  oscillationAmp: number; // m
  outputDevice: OutputDevice;
}

/**
 * Runs the requestAnimationFrame loop of the Faraday laboratory: moves the magnet when
 * oscillating, solves flux / EMF / current, damps the galvanometer needle, records the
 * oscilloscope history and draws every frame. Returns the instantaneous readings for the HUD.
 */
export function useFaradaySimulation({
  canvasRef,
  viewport,
  magnet,
  setMagnet,
  coil,
  isOscillating,
  oscillationFreq,
  oscillationAmp,
  outputDevice
}: FaradaySimulationOptions): InstantValues {
  const [instantValues, setInstantValues] = useState<InstantValues>(INITIAL_VALUES);

  // Dynamic tracking state that must survive across animation frames
  const prevFluxRef = useRef(0);
  const prevTimeRef = useRef<number | null>(null);
  const smoothedNeedleRef = useRef(0);
  const animTimeRef = useRef(0);
  const historyRef = useRef<HistorySample[]>([]);

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const dt =
        prevTimeRef.current === null
          ? 1 / 60
          : Math.min(0.05, Math.max(0.002, (now - prevTimeRef.current) / 1000));
      prevTimeRef.current = now;
      animTimeRef.current += dt;

      // Harmonic auto-oscillation of the magnet
      const curMagnet = { ...magnet };
      if (isOscillating) {
        const omega = 2 * Math.PI * oscillationFreq;
        curMagnet.x = coil.x - 0.05 + oscillationAmp * Math.sin(omega * animTimeRef.current);
        setMagnet(curMagnet);
      }

      // 1. Magnetic flux through the coil, 2. induction (Faraday-Lenz)
      const flux = calculateCoilFlux(coil, curMagnet, FLUX_RADIAL_NODES);
      const induction = computeFaradayInduction(
        flux,
        prevFluxRef.current,
        dt,
        coil,
        BULB_RESISTANCE_OHM
      );
      prevFluxRef.current = flux;

      // 3. Damped galvanometer needle
      const targetNeedle = Math.max(
        -1,
        Math.min(1, induction.inducedEmf / GALVANOMETER_FULL_SCALE_V)
      );
      smoothedNeedleRef.current += (targetNeedle - smoothedNeedleRef.current) * Math.min(1, dt * 14);

      // 4. Rolling oscilloscope history
      historyRef.current.push({
        time: animTimeRef.current,
        flux: flux * 1000, // milli-Webers
        emf: induction.inducedEmf
      });
      if (historyRef.current.length > OSCILLOSCOPE_POINTS) {
        historyRef.current.shift();
      }

      setInstantValues({
        flux,
        dFluxDt: induction.dFluxDt,
        emf: induction.inducedEmf,
        current: induction.inducedCurrent,
        bulbPower: induction.bulbPower,
        bulbBrightness: induction.bulbBrightness
      });

      // Draw the frame
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (canvas && ctx) {
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        drawFaradayFrame(ctx, {
          viewport,
          magnet: curMagnet,
          coil,
          induction,
          animTime: animTimeRef.current,
          needle: smoothedNeedleRef.current,
          history: historyRef.current,
          outputDevice
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [
    canvasRef,
    viewport,
    magnet,
    setMagnet,
    coil,
    isOscillating,
    oscillationFreq,
    oscillationAmp,
    outputDevice
  ]);

  return instantValues;
}
