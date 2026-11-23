import { sampleLocalPotential } from '../../physics/capacitance';

/**
 * Pure geometry of the capacitor laboratory (screen pixels) and of the virtual probes.
 * No React and no canvas: these functions can be unit-tested on their own.
 */

export interface Point {
  x: number;
  y: number;
}

export interface CapacitorLayout {
  centerX: number;
  centerY: number;
  plateWidthPx: number;
  plateThicknessPx: number;
  gapPx: number;
  topPlateY: number;
  botPlateY: number;
  plateLeftX: number;
  plateRightX: number;
  slabWidthPx: number;
  slabHeightPx: number;
  slabX: number;
  slabY: number;
}

/**
 * Visual scaling: plate width proportional to area, gap proportional to distance.
 * `insertionFraction` = 0 puts the dielectric slab outside to the right, 1 completely inside.
 */
export function computeCapacitorLayout(
  width: number,
  height: number,
  plateAreaMm2: number,
  plateDistanceMm: number,
  insertionFraction: number
): CapacitorLayout {
  const centerX = width / 2;
  const centerY = height / 2;

  const plateWidthPx = 180 + (plateAreaMm2 / 400) * 140; // 225px to 320px
  const plateThicknessPx = 14;
  const gapPx = 40 + (plateDistanceMm / 10) * 130; // 66px to 170px

  const topPlateY = centerY - gapPx / 2 - plateThicknessPx;
  const botPlateY = centerY + gapPx / 2;
  const plateLeftX = centerX - plateWidthPx / 2;
  const plateRightX = centerX + plateWidthPx / 2;

  const slabWidthPx = plateWidthPx * 0.95;
  const slabHeightPx = gapPx;
  const slabX = plateLeftX + (1 - insertionFraction) * plateWidthPx;
  const slabY = centerY - gapPx / 2;

  return {
    centerX,
    centerY,
    plateWidthPx,
    plateThicknessPx,
    gapPx,
    topPlateY,
    botPlateY,
    plateLeftX,
    plateRightX,
    slabWidthPx,
    slabHeightPx,
    slabX,
    slabY
  };
}

/** Potential difference (V) between the red (+) and black (−) voltmeter probes. */
export function measureProbeVoltage(
  layout: CapacitorLayout,
  redProbe: Point,
  blackProbe: Point,
  voltage: number
): number {
  const sample = (p: Point): number =>
    sampleLocalPotential(
      p.x,
      p.y,
      layout.topPlateY + layout.plateThicknessPx,
      layout.botPlateY,
      layout.plateLeftX,
      layout.plateRightX,
      voltage
    );
  return sample(redProbe) - sample(blackProbe);
}

/**
 * Electric field magnitude (V/m) read by the field probe: uniform inside the plates
 * (reduced by κ inside the dielectric when the charge is trapped) and with an
 * exponential fringe decay outside.
 */
export function measureProbeField(
  layout: CapacitorLayout,
  probe: Point,
  fieldVm: number,
  kappa: number,
  connectedToBattery: boolean
): number {
  const { plateLeftX, plateRightX, topPlateY, plateThicknessPx, botPlateY, slabX, slabWidthPx, centerY } =
    layout;
  const inX = probe.x >= plateLeftX && probe.x <= plateRightX;
  const inY = probe.y >= topPlateY + plateThicknessPx && probe.y <= botPlateY;
  if (inX && inY) {
    const inDielectric = probe.x >= slabX && probe.x <= slabX + slabWidthPx;
    if (inDielectric && kappa > 1) {
      return connectedToBattery ? fieldVm : fieldVm / kappa;
    }
    return fieldVm;
  }
  // Fringe outside
  const dist = Math.min(
    Math.hypot(probe.x - plateLeftX, probe.y - centerY),
    Math.hypot(probe.x - plateRightX, probe.y - centerY)
  );
  return fieldVm * Math.exp(-dist / 40);
}
