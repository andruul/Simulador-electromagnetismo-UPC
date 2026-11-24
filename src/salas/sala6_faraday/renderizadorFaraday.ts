import type { Vector2D } from '../../tipos';
import {
  getMagnetPoles,
  traceMagneticFieldLine,
  type BarMagnet,
  type InductionCoil
} from '../../fisica/faraday';

/**
 * Pure Canvas 2D renderer of the Faraday induction laboratory.
 * Every function receives a drawing context and plain data: no React, no refs, no state.
 */

export type OutputDevice = 'both' | 'galvanometer' | 'lightbulb';

export interface HistorySample {
  time: number;
  flux: number; // mWb
  emf: number; // V
}

/** Screen layout: 1 meter = pixelsPerMeter px, world origin at (originX, originY). */
export interface Viewport {
  width: number;
  height: number;
  originX: number;
  originY: number;
  pixelsPerMeter: number;
}

export interface FaradayFrame {
  viewport: Viewport;
  magnet: BarMagnet;
  coil: InductionCoil;
  /** Instantaneous results of the induction solver for this frame. */
  induction: { inducedCurrent: number; dFluxDt: number; bulbBrightness: number };
  animTime: number;
  /** Smoothed galvanometer deflection in [-1, 1]. */
  needle: number;
  history: readonly HistorySample[];
  outputDevice: OutputDevice;
}

export const OSCILLOSCOPE_POINTS = 120;
/** Oscilloscope vertical gain: pixels per mWb (flux trace) and per volt (EMF trace). */
const OSC_FLUX_PX_PER_MWB = 6.5;
const OSC_EMF_PX_PER_V = 65;

export function createViewport(width: number, height: number, pixelsPerMeter: number): Viewport {
  return { width, height, originX: width / 2, originY: height / 2, pixelsPerMeter };
}

export function toPixels(vp: Viewport, mx: number, my: number): { px: number; py: number } {
  return { px: vp.originX + mx * vp.pixelsPerMeter, py: vp.originY + my * vp.pixelsPerMeter };
}

export function toMeters(vp: Viewport, px: number, py: number): { mx: number; my: number } {
  return { mx: (px - vp.originX) / vp.pixelsPerMeter, my: (py - vp.originY) / vp.pixelsPerMeter };
}

/** Geometry shared by the coil, the circuit wires and the instruments. */
interface CoilLayout {
  centerPx: number;
  centerPy: number;
  radiusPx: number;
  widthPx: number;
  loopSpacing: number;
  deviceX: number;
  deviceY: number;
}

function layoutCoil(vp: Viewport, coil: InductionCoil): CoilLayout {
  const center = toPixels(vp, coil.x, coil.y);
  const widthPx = 40 + coil.turns * 18;
  return {
    centerPx: center.px,
    centerPy: center.py,
    radiusPx: coil.radius * vp.pixelsPerMeter,
    widthPx,
    loopSpacing: widthPx / (coil.turns + 1),
    deviceX: center.px + 180,
    deviceY: center.py
  };
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 80, w / 2, h / 2, Math.max(w, h));
  bgGrad.addColorStop(0, '#FAF7F2');
  bgGrad.addColorStop(1, '#EFE9DF');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(80, 70, 60, 0.08)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }
}

function drawFieldLines(ctx: CanvasRenderingContext2D, frame: FaradayFrame): void {
  const { viewport: vp, magnet } = frame;
  const { north } = getMagnetPoles(magnet);
  const numLinesPerPole = 16;
  const bounds = {
    minX: toMeters(vp, 0, 0).mx,
    maxX: toMeters(vp, vp.width, 0).mx,
    minY: toMeters(vp, 0, 0).my,
    maxY: toMeters(vp, 0, vp.height).my
  };

  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.35)';
  ctx.lineWidth = 1.3;

  for (let i = 0; i < numLinesPerPole; i++) {
    const angle = (2 * Math.PI * i) / numLinesPerPole;
    const startDist = 0.012; // meters from pole center
    const startPos: Vector2D = {
      x: north.x + Math.cos(angle) * startDist,
      y: north.y + Math.sin(angle) * startDist
    };

    const linePts = traceMagneticFieldLine(startPos, magnet, 0.007, 120, bounds);
    if (linePts.length <= 2) continue;

    ctx.beginPath();
    const firstPx = toPixels(vp, linePts[0].x, linePts[0].y);
    ctx.moveTo(firstPx.px, firstPx.py);
    for (let j = 1; j < linePts.length; j++) {
      const ptPx = toPixels(vp, linePts[j].x, linePts[j].y);
      ctx.lineTo(ptPx.px, ptPx.py);
    }
    ctx.stroke();

    // Directional arrow on the field line
    if (linePts.length > 15) {
      const midIdx = Math.floor(linePts.length / 2);
      const p1 = toPixels(vp, linePts[midIdx].x, linePts[midIdx].y);
      const p2 = toPixels(vp, linePts[midIdx + 1].x, linePts[midIdx + 1].y);
      const dirAngle = Math.atan2(p2.py - p1.py, p2.px - p1.px);

      ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(
        p1.px - 6 * Math.cos(dirAngle - Math.PI / 6),
        p1.py - 6 * Math.sin(dirAngle - Math.PI / 6)
      );
      ctx.lineTo(
        p1.px - 6 * Math.cos(dirAngle + Math.PI / 6),
        p1.py - 6 * Math.sin(dirAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }
  }
  ctx.restore();
}

function drawCoil(ctx: CanvasRenderingContext2D, frame: FaradayFrame, layout: CoilLayout): void {
  const { coil, induction, animTime } = frame;
  const { centerPx, centerPy, radiusPx, widthPx, loopSpacing } = layout;

  // Coil core axis line
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)';
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(centerPx - widthPx / 2 - 40, centerPy);
  ctx.lineTo(centerPx + widthPx / 2 + 40, centerPy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Individual coil loops
  for (let turn = 1; turn <= coil.turns; turn++) {
    const lx = centerPx - widthPx / 2 + turn * loopSpacing;

    // Copper 3D tube gradient
    const copperGrad = ctx.createLinearGradient(lx - 8, 0, lx + 8, 0);
    copperGrad.addColorStop(0, '#b45309');
    copperGrad.addColorStop(0.4, '#f59e0b');
    copperGrad.addColorStop(0.7, '#d97706');
    copperGrad.addColorStop(1, '#78350f');

    ctx.save();
    ctx.strokeStyle = copperGrad;
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.ellipse(lx, centerPy, 12, radiusPx, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Inner highlight
    ctx.strokeStyle = 'rgba(254, 243, 199, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(lx - 2, centerPy, 10, radiusPx - 3, 0, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.restore();

    // Moving charge carriers along loops (Lenz current animation)
    if (Math.abs(induction.inducedCurrent) > 0.005) {
      const currentDir = Math.sign(induction.inducedCurrent);
      const speed = currentDir * animTime * 4;
      const dotCount = 8;

      ctx.fillStyle = '#38bdf8';
      for (let d = 0; d < dotCount; d++) {
        const theta = (2 * Math.PI * d) / dotCount + speed;
        const dotX = lx + 12 * Math.cos(theta);
        const dotY = centerPy + radiusPx * Math.sin(theta);

        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  }
}

function drawCircuitWires(
  ctx: CanvasRenderingContext2D,
  frame: FaradayFrame,
  layout: CoilLayout
): void {
  const { centerPx, centerPy, radiusPx, widthPx, loopSpacing, deviceX, deviceY } = layout;
  const topWireX = centerPx - widthPx / 2 + loopSpacing;
  const botWireX = centerPx - widthPx / 2 + frame.coil.turns * loopSpacing;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Top wire
  ctx.beginPath();
  ctx.moveTo(topWireX, centerPy - radiusPx);
  ctx.lineTo(topWireX, centerPy - radiusPx - 45);
  ctx.lineTo(deviceX - 50, centerPy - radiusPx - 45);
  ctx.lineTo(deviceX - 50, deviceY - 30);
  ctx.stroke();

  // Bottom wire
  ctx.beginPath();
  ctx.moveTo(botWireX, centerPy + radiusPx);
  ctx.lineTo(botWireX, centerPy + radiusPx + 45);
  ctx.lineTo(deviceX - 50, centerPy + radiusPx + 45);
  ctx.lineTo(deviceX - 50, deviceY + 30);
  ctx.stroke();
}

function drawBarMagnet(ctx: CanvasRenderingContext2D, frame: FaradayFrame): void {
  const { viewport: vp, magnet } = frame;
  const center = toPixels(vp, magnet.x, magnet.y);
  const lenPx = magnet.length * vp.pixelsPerMeter;
  const widPx = magnet.width * vp.pixelsPerMeter;

  ctx.save();
  ctx.translate(center.px, center.py);
  ctx.rotate(magnet.angle);

  // Body shadow
  ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
  ctx.shadowBlur = 18;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;

  // South half (blue, left)
  const southGrad = ctx.createLinearGradient(-lenPx / 2, -widPx / 2, -lenPx / 2, widPx / 2);
  southGrad.addColorStop(0, '#2563eb');
  southGrad.addColorStop(0.5, '#3b82f6');
  southGrad.addColorStop(1, '#1d4ed8');
  ctx.fillStyle = southGrad;
  ctx.beginPath();
  ctx.roundRect(-lenPx / 2, -widPx / 2, lenPx / 2, widPx, [8, 0, 0, 8]);
  ctx.fill();

  // North half (red, right)
  const northGrad = ctx.createLinearGradient(0, -widPx / 2, 0, widPx / 2);
  northGrad.addColorStop(0, '#dc2626');
  northGrad.addColorStop(0.5, '#ef4444');
  northGrad.addColorStop(1, '#b91c1c');
  ctx.fillStyle = northGrad;
  ctx.beginPath();
  ctx.roundRect(0, -widPx / 2, lenPx / 2, widPx, [0, 8, 8, 0]);
  ctx.fill();

  // Reset shadow
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;

  // Border and center seam
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-lenPx / 2, -widPx / 2, lenPx, widPx);
  ctx.beginPath();
  ctx.moveTo(0, -widPx / 2);
  ctx.lineTo(0, widPx / 2);
  ctx.stroke();

  // Pole labels
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('S', -lenPx / 4, 0);
  ctx.fillText('N', lenPx / 4, 0);
  ctx.restore();
}

function drawGalvanometer(
  ctx: CanvasRenderingContext2D,
  frame: FaradayFrame,
  layout: CoilLayout
): void {
  const galvX = layout.deviceX + 60;
  const galvY = layout.deviceY - 45;
  const galvR = 55;

  ctx.save();
  // Outer casing
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(galvX, galvY, galvR, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Dial face
  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.arc(galvX, galvY, galvR - 8, 0, 2 * Math.PI);
  ctx.fill();

  // Dial arc and tick marks (zero at top center, -π/2)
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1.5;
  for (let t = -4; t <= 4; t++) {
    const tickAngle = -Math.PI / 2 + (t / 4) * (Math.PI / 4);
    const innerR = t % 2 === 0 ? galvR - 22 : galvR - 17;
    const outerR = galvR - 12;

    ctx.beginPath();
    ctx.moveTo(galvX + innerR * Math.cos(tickAngle), galvY + innerR * Math.sin(tickAngle));
    ctx.lineTo(galvX + outerR * Math.cos(tickAngle), galvY + outerR * Math.sin(tickAngle));
    ctx.stroke();

    // Labels -, 0, +
    if (t === -4 || t === 0 || t === 4) {
      ctx.fillStyle = '#334155';
      ctx.font = 'bold 9px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const lblR = galvR - 28;
      const txt = t === 0 ? '0' : t < 0 ? '−' : '+';
      ctx.fillText(txt, galvX + lblR * Math.cos(tickAngle), galvY + lblR * Math.sin(tickAngle));
    }
  }

  // Brand symbol 'G'
  ctx.fillStyle = '#64748b';
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('G', galvX, galvY + 16);

  // Needle with damped angle
  const needleAngle = -Math.PI / 2 + frame.needle * (Math.PI / 4);
  const needleLen = galvR - 14;

  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(galvX, galvY);
  ctx.lineTo(galvX + needleLen * Math.cos(needleAngle), galvY + needleLen * Math.sin(needleAngle));
  ctx.stroke();

  // Center pivot cap
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(galvX, galvY, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.restore();
}

function drawLightbulb(
  ctx: CanvasRenderingContext2D,
  frame: FaradayFrame,
  layout: CoilLayout
): void {
  const bulbX = layout.deviceX + 60;
  const bulbY = layout.deviceY + 70;
  const bBright = frame.induction.bulbBrightness;

  ctx.save();
  // Radiating glow when active
  if (bBright > 0.05) {
    const glowGrad = ctx.createRadialGradient(bulbX, bulbY, 10, bulbX, bulbY, 70 * bBright + 20);
    glowGrad.addColorStop(0, `rgba(253, 224, 71, ${0.9 * bBright})`);
    glowGrad.addColorStop(0.5, `rgba(250, 204, 21, ${0.4 * bBright})`);
    glowGrad.addColorStop(1, 'rgba(250, 204, 21, 0)');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(bulbX, bulbY, 70 * bBright + 20, 0, 2 * Math.PI);
    ctx.fill();

    // Light rays
    ctx.strokeStyle = `rgba(254, 240, 138, ${0.7 * bBright})`;
    ctx.lineWidth = 2;
    const rayCount = 10;
    for (let r = 0; r < rayCount; r++) {
      const rAngle = (2 * Math.PI * r) / rayCount;
      ctx.beginPath();
      ctx.moveTo(bulbX + 24 * Math.cos(rAngle), bulbY + 24 * Math.sin(rAngle));
      ctx.lineTo(
        bulbX + (28 + 20 * bBright) * Math.cos(rAngle),
        bulbY + (28 + 20 * bBright) * Math.sin(rAngle)
      );
      ctx.stroke();
    }
  }

  // Glass bulb globe
  ctx.fillStyle =
    bBright > 0.1 ? `rgba(254, 240, 138, ${0.3 + 0.5 * bBright})` : 'rgba(148, 163, 184, 0.15)';
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(bulbX, bulbY, 20, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Filament (tungsten coil)
  ctx.strokeStyle = bBright > 0.05 ? '#fef08a' : '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(bulbX - 6, bulbY + 8);
  ctx.lineTo(bulbX - 4, bulbY - 6);
  ctx.lineTo(bulbX, bulbY - 10);
  ctx.lineTo(bulbX + 4, bulbY - 6);
  ctx.lineTo(bulbX + 6, bulbY + 8);
  ctx.stroke();

  // Screw base
  ctx.fillStyle = '#64748b';
  ctx.fillRect(bulbX - 8, bulbY + 20, 16, 12);
  ctx.strokeStyle = '#475569';
  ctx.strokeRect(bulbX - 8, bulbY + 20, 16, 12);
  ctx.restore();
}

function drawLenzVector(
  ctx: CanvasRenderingContext2D,
  frame: FaradayFrame,
  layout: CoilLayout
): void {
  const { dFluxDt } = frame.induction;
  if (Math.abs(dFluxDt) <= 0.001) return;

  const { centerPx, centerPy, radiusPx } = layout;
  ctx.save();
  const opposingDir = -Math.sign(dFluxDt);
  const arrowLen = Math.min(50, Math.max(16, Math.abs(dFluxDt) * 600));

  ctx.strokeStyle = '#a855f7'; // Purple for B_ind
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(centerPx, centerPy);
  ctx.lineTo(centerPx + opposingDir * arrowLen, centerPy);
  ctx.stroke();

  // Arrow head
  const tipX = centerPx + opposingDir * arrowLen;
  ctx.fillStyle = '#a855f7';
  ctx.beginPath();
  ctx.moveTo(tipX, centerPy);
  ctx.lineTo(tipX - opposingDir * 8, centerPy - 6);
  ctx.lineTo(tipX - opposingDir * 8, centerPy + 6);
  ctx.closePath();
  ctx.fill();

  // Label
  ctx.font = 'bold 11px sans-serif';
  ctx.fillStyle = '#c084fc';
  ctx.textAlign = 'center';
  ctx.fillText('B_inducido (Lenz)', centerPx, centerPy + radiusPx + 22);
  ctx.restore();
}

function drawOscilloscope(ctx: CanvasRenderingContext2D, frame: FaradayFrame): void {
  const oscW = 260;
  const oscH = 75;
  const oscX = 16;
  const oscY = frame.viewport.height - 90;

  ctx.save();
  ctx.fillStyle = 'rgba(255, 253, 249, 0.95)';
  ctx.strokeStyle = '#D6CCBE';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(oscX, oscY, oscW, oscH, 8);
  ctx.fill();
  ctx.stroke();

  // Center line
  ctx.strokeStyle = 'rgba(140, 128, 114, 0.28)';
  ctx.beginPath();
  ctx.moveTo(oscX, oscY + oscH / 2);
  ctx.lineTo(oscX + oscW, oscY + oscH / 2);
  ctx.stroke();

  // Flux (cerulean) and EMF (terracotta rose) traces
  const pts = frame.history;
  if (pts.length > 2) {
    const plot = (color: string, width: number, value: (s: HistorySample) => number): void => {
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.beginPath();
      for (let i = 0; i < pts.length; i++) {
        const px = oscX + (i / OSCILLOSCOPE_POINTS) * oscW;
        const py = oscY + oscH / 2 - value(pts[i]);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    };
    plot('#2B6CB0', 1.6, (s) => s.flux * OSC_FLUX_PX_PER_MWB);
    plot('#C53030', 1.9, (s) => s.emf * OSC_EMF_PX_PER_V);
  }

  // Legend
  ctx.font = 'bold 9.5px monospace';
  ctx.textAlign = 'left';
  ctx.fillStyle = '#2B6CB0';
  ctx.fillText('— Flujo Φ_B', oscX + 8, oscY + 14);
  ctx.fillStyle = '#C53030';
  ctx.fillText('— FEM ε (V)', oscX + 92, oscY + 14);
  ctx.restore();
}

/** Draws one complete frame of the laboratory. */
export function drawFaradayFrame(ctx: CanvasRenderingContext2D, frame: FaradayFrame): void {
  const { viewport: vp, coil, outputDevice } = frame;
  const layout = layoutCoil(vp, coil);

  drawBackground(ctx, vp.width, vp.height);
  drawFieldLines(ctx, frame);
  drawCoil(ctx, frame, layout);
  drawCircuitWires(ctx, frame, layout);
  drawBarMagnet(ctx, frame);
  if (outputDevice === 'both' || outputDevice === 'galvanometer') {
    drawGalvanometer(ctx, frame, layout);
  }
  if (outputDevice === 'both' || outputDevice === 'lightbulb') {
    drawLightbulb(ctx, frame, layout);
  }
  drawLenzVector(ctx, frame, layout);
  drawOscilloscope(ctx, frame);
}
