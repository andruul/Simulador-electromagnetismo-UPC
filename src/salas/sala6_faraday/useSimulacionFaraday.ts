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

const BULB_RESISTANCE_OHM = 10;
const FLUX_RADIAL_NODES = 32;
const GALVANOMETER_FULL_SCALE_V = 0.7;

export interface InstantValues {
  flux: number;
  dFluxDt: number;
  emf: number;
  current: number;
  bulbPower: number;
  bulbBrightness: number;
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
  oscillationFreq: number;
  oscillationAmp: number;
  outputDevice: OutputDevice;
}

/**
 * Bucle continuo requestAnimationFrame del laboratorio de Faraday-Lenz.
 * Mantiene magnet/coil en refs para evitar reiniciar el rAF en cada fotograma,
 * inicializa Φ previo sin picos espurios y suaviza dΦ/dt ante arrastre manual.
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

  const magnetRef = useRef(magnet);
  const coilRef = useRef(coil);
  const viewportRef = useRef(viewport);
  const outputRef = useRef(outputDevice);
  const oscRef = useRef({ isOscillating, oscillationFreq, oscillationAmp });

  useEffect(() => {
    magnetRef.current = magnet;
    coilRef.current = coil;
    viewportRef.current = viewport;
    outputRef.current = outputDevice;
    oscRef.current = { isOscillating, oscillationFreq, oscillationAmp };
  }, [magnet, coil, viewport, outputDevice, isOscillating, oscillationFreq, oscillationAmp]);

  const prevFluxRef = useRef<number | null>(null);
  const prevTimeRef = useRef<number | null>(null);
  const smoothedEmfRef = useRef(0);
  const smoothedNeedleRef = useRef(0);
  const animTimeRef = useRef(0);
  const historyRef = useRef<HistorySample[]>([]);

  useEffect(() => {
    let animId: number;

    const tick = (now: number) => {
      const dt =
        prevTimeRef.current === null
          ? 1 / 60
          : Math.min(0.05, Math.max(0.004, (now - prevTimeRef.current) / 1000));
      prevTimeRef.current = now;
      animTimeRef.current += dt;

      const curCoil = coilRef.current;
      const curOsc = oscRef.current;
      let curMagnet = magnetRef.current;

      if (curOsc.isOscillating) {
        const omega = 2 * Math.PI * curOsc.oscillationFreq;
        curMagnet = {
          ...curMagnet,
          x: curCoil.x - 0.05 + curOsc.oscillationAmp * Math.sin(omega * animTimeRef.current)
        };
        magnetRef.current = curMagnet;
        setMagnet(curMagnet);
      }

      const flux = calculateCoilFlux(curCoil, curMagnet, FLUX_RADIAL_NODES);
      const prevFlux = prevFluxRef.current ?? flux;
      prevFluxRef.current = flux;

      const rawInduction = computeFaradayInduction(
        flux,
        prevFlux,
        dt,
        curCoil,
        BULB_RESISTANCE_OHM
      );

      // Filtro exponencial ligero en arrastre manual para eliminar ruido de muestreo de puntero
      const alpha = curOsc.isOscillating ? 1.0 : Math.min(1, dt * 22);
      smoothedEmfRef.current += (rawInduction.inducedEmf - smoothedEmfRef.current) * alpha;
      const totalR = curCoil.turns * curCoil.resistancePerTurn + BULB_RESISTANCE_OHM;
      const emf = smoothedEmfRef.current;
      const current = totalR > 0 ? emf / totalR : 0;
      const bulbPower = current * current * BULB_RESISTANCE_OHM;
      const induction = curOsc.isOscillating
        ? rawInduction
        : {
            ...rawInduction,
            dFluxDt: curCoil.turns > 0 ? -emf / curCoil.turns : 0,
            inducedEmf: emf,
            inducedCurrent: current,
            bulbPower,
            bulbBrightness: Math.min(1, Math.sqrt(bulbPower / 0.015))
          };

      const targetNeedle = Math.max(-1, Math.min(1, induction.inducedEmf / GALVANOMETER_FULL_SCALE_V));
      smoothedNeedleRef.current += (targetNeedle - smoothedNeedleRef.current) * Math.min(1, dt * 14);

      historyRef.current.push({
        time: animTimeRef.current,
        flux: flux * 1000,
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

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      const vp = viewportRef.current;
      if (canvas && ctx) {
        canvas.width = vp.width;
        canvas.height = vp.height;
        drawFaradayFrame(ctx, {
          viewport: vp,
          magnet: curMagnet,
          coil: curCoil,
          induction,
          animTime: animTimeRef.current,
          needle: smoothedNeedleRef.current,
          history: historyRef.current,
          outputDevice: outputRef.current
        });
      }

      animId = requestAnimationFrame(tick);
    };

    animId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animId);
  }, [canvasRef, setMagnet]);

  return instantValues;
}
