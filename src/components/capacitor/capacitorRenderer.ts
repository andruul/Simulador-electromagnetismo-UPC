import type { CapacitorPhysicsResult } from '../../physics/capacitance';
import type { DielectricMaterial } from '../../types';
import type { CapacitorLayout, Point } from './capacitorLayout';

/**
 * Pure Canvas 2D renderer of the capacitor laboratory (PhET / MIT TEAL aesthetics).
 * Every function receives a drawing context and plain data: no React, no refs, no state.
 */

export interface CapacitorScene {
  width: number;
  height: number;
  layout: CapacitorLayout;
  plateAreaMm2: number;
  plateDistanceMm: number;
  activeKappa: number;
  material: DielectricMaterial;
  connectedToBattery: boolean;
  batteryVoltage: number;
  physics: CapacitorPhysicsResult;
  showVoltmeter: boolean;
  showFieldMeter: boolean;
  redProbe: Point;
  blackProbe: Point;
  fieldProbe: Point;
  /** Voltmeter reading (V) and field-probe reading (V/m). */
  measuredV: number;
  measuredE: number;
}

const BATTERY_X = 140;

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
  bgGrad.addColorStop(0, '#FAF7F2');
  bgGrad.addColorStop(1, '#EFE9DF');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  // Subtle grid lines
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

/** Battery, connecting wires and the (open/closed) switch. */
function drawBatteryCircuit(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  const { layout, connectedToBattery, batteryVoltage } = scene;
  const { centerY, topPlateY, botPlateY, plateThicknessPx, plateLeftX } = layout;
  const batteryX = BATTERY_X;
  const batteryY = centerY;
  const wireColor = connectedToBattery ? '#38bdf8' : '#475569';

  ctx.strokeStyle = wireColor;
  ctx.lineWidth = 3;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Top wire from battery to top plate
  ctx.beginPath();
  ctx.moveTo(batteryX, batteryY - 45);
  ctx.lineTo(batteryX, topPlateY + plateThicknessPx / 2);
  ctx.lineTo(plateLeftX, topPlateY + plateThicknessPx / 2);
  ctx.stroke();

  // Bottom wire from battery to bottom plate (with switch gap)
  ctx.beginPath();
  ctx.moveTo(batteryX, batteryY + 45);
  ctx.lineTo(batteryX, botPlateY + plateThicknessPx / 2);
  if (connectedToBattery) {
    ctx.lineTo(plateLeftX, botPlateY + plateThicknessPx / 2); // closed switch
  } else {
    const switchMidX = (batteryX + plateLeftX) / 2; // open switch gap
    ctx.lineTo(switchMidX - 15, botPlateY + plateThicknessPx / 2);
    ctx.moveTo(switchMidX + 15, botPlateY + plateThicknessPx / 2);
    ctx.lineTo(plateLeftX, botPlateY + plateThicknessPx / 2);
  }
  ctx.stroke();

  // Switch contacts and lever
  const switchX = (batteryX + plateLeftX) / 2;
  const switchY = botPlateY + plateThicknessPx / 2;
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.arc(switchX - 15, switchY, 4, 0, 2 * Math.PI);
  ctx.arc(switchX + 15, switchY, 4, 0, 2 * Math.PI);
  ctx.fill();

  // Switch blade
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(switchX - 15, switchY);
  if (connectedToBattery) {
    ctx.lineTo(switchX + 15, switchY);
  } else {
    ctx.lineTo(switchX + 8, switchY - 20); // angled open
  }
  ctx.stroke();

  // Battery body
  const batW = 42;
  const batH = 80;
  const batGrad = ctx.createLinearGradient(batteryX - batW / 2, 0, batteryX + batW / 2, 0);
  batGrad.addColorStop(0, '#1e293b');
  batGrad.addColorStop(0.5, '#334155');
  batGrad.addColorStop(1, '#0f172a');

  ctx.fillStyle = batGrad;
  ctx.beginPath();
  ctx.roundRect(batteryX - batW / 2, batteryY - batH / 2, batW, batH, 6);
  ctx.fill();
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Battery terminals
  ctx.fillStyle = '#ef4444'; // top positive (+)
  ctx.fillRect(batteryX - 10, batteryY - batH / 2 - 8, 20, 8);
  ctx.fillStyle = '#3b82f6'; // bottom negative (-)
  ctx.fillRect(batteryX - 10, batteryY + batH / 2, 20, 8);

  // Battery labels
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('+', batteryX, batteryY - batH / 2 + 14);
  ctx.fillText('−', batteryX, batteryY + batH / 2 - 14);
  ctx.font = '11px sans-serif';
  ctx.fillText(`${batteryVoltage.toFixed(1)}V`, batteryX, batteryY);
}

/** Electric field lines and direction arrows in the gap. */
function drawFieldVectors(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  const { physics, layout } = scene;
  if (physics.electricField <= 10) return;

  const { plateWidthPx, plateLeftX, topPlateY, plateThicknessPx, botPlateY, slabX, slabWidthPx } = layout;
  const eLinesCount = Math.max(5, Math.min(22, Math.round(plateWidthPx / 20)));
  const eStepX = plateWidthPx / (eLinesCount + 1);
  const isPositiveV = physics.voltage >= 0;

  for (let i = 1; i <= eLinesCount; i++) {
    const lx = plateLeftX + i * eStepX;
    const lyTop = topPlateY + plateThicknessPx + 4;
    const lyBot = botPlateY - 4;

    // In dielectric slab?
    const isInsideSlab = lx >= slabX && lx <= slabX + slabWidthPx;
    const lineAlpha = isInsideSlab ? 0.45 : 0.75;

    ctx.strokeStyle = isInsideSlab
      ? 'rgba(245, 158, 11, ' + lineAlpha + ')'
      : 'rgba(56, 189, 248, ' + lineAlpha + ')';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    ctx.moveTo(lx, lyTop);
    ctx.lineTo(lx, lyBot);
    ctx.stroke();

    // Arrow indicating E-field direction
    const arrowY = (lyTop + lyBot) / 2;
    const dir = isPositiveV ? 1 : -1;
    ctx.fillStyle = isInsideSlab ? '#f59e0b' : '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(lx, arrowY + dir * 6);
    ctx.lineTo(lx - 4, arrowY - dir * 4);
    ctx.lineTo(lx + 4, arrowY - dir * 4);
    ctx.closePath();
    ctx.fill();
  }
}

/** Dielectric slab with its handle, label, induced charge and bound dipoles. */
function drawDielectricSlab(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  const { activeKappa, material, physics, layout } = scene;
  if (activeKappa <= 1.0) return;

  const { slabX, slabY, slabWidthPx, slabHeightPx, plateLeftX, plateRightX } = layout;

  ctx.save();
  ctx.fillStyle = material.color;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(slabX, slabY, slabWidthPx, slabHeightPx, 4);
  ctx.fill();
  ctx.stroke();

  // Handle and grip
  ctx.fillStyle = '#d97706';
  ctx.fillRect(slabX + slabWidthPx - 10, slabY + slabHeightPx / 2 - 20, 8, 40);
  ctx.strokeStyle = '#fef3c7';
  ctx.lineWidth = 1;
  for (let g = -12; g <= 12; g += 6) {
    ctx.beginPath();
    ctx.moveTo(slabX + slabWidthPx - 8, slabY + slabHeightPx / 2 + g);
    ctx.lineTo(slabX + slabWidthPx - 4, slabY + slabHeightPx / 2 + g);
    ctx.stroke();
  }

  // Material watermark and induced charge
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 11px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `${material.name} (κ = ${activeKappa})`,
    slabX + slabWidthPx / 2,
    slabY + slabHeightPx / 2 - 8
  );
  ctx.font = '10px monospace';
  ctx.fillStyle = '#fde68a';
  ctx.fillText(
    `Q_inducida: ${physics.polarizationChargePC.toFixed(1)} pC`,
    slabX + slabWidthPx / 2,
    slabY + slabHeightPx / 2 + 10
  );

  // Bound dipoles inside the dielectric slab
  const dipolesCount = 6;
  for (let di = 0; di < dipolesCount; di++) {
    const dipX = slabX + (di + 0.5) * (slabWidthPx / dipolesCount);
    if (dipX >= plateLeftX && dipX <= plateRightX) {
      // Top surface bound charge (negative if top plate positive)
      ctx.fillStyle = physics.voltage >= 0 ? '#38bdf8' : '#fb7185';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('⊖', dipX, slabY + 12);

      // Bottom surface bound charge (positive if bottom plate negative)
      ctx.fillStyle = physics.voltage >= 0 ? '#fb7185' : '#38bdf8';
      ctx.fillText('⊕', dipX, slabY + slabHeightPx - 8);
    }
  }
  ctx.restore();
}

/** One metal plate with its free charges. */
function drawPlate(
  ctx: CanvasRenderingContext2D,
  scene: CapacitorScene,
  y: number,
  isTop: boolean
): void {
  const { physics, layout } = scene;
  const { plateLeftX, plateWidthPx, plateThicknessPx } = layout;

  ctx.save();
  const pGrad = ctx.createLinearGradient(plateLeftX, y, plateLeftX, y + plateThicknessPx);
  pGrad.addColorStop(0, '#94a3b8');
  pGrad.addColorStop(0.5, '#cbd5e1');
  pGrad.addColorStop(1, '#64748b');

  ctx.fillStyle = pGrad;
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(plateLeftX, y, plateWidthPx, plateThicknessPx, 4);
  ctx.fill();
  ctx.stroke();

  // Free charges on plates
  const numCharges = Math.min(24, Math.max(3, Math.round(Math.abs(physics.storedChargePC) / 1.5)));
  const isPositive = isTop ? physics.voltage >= 0 : physics.voltage < 0;
  const chargeSign = isPositive ? '+' : '−';
  const chargeColor = isPositive ? '#ef4444' : '#3b82f6';

  ctx.fillStyle = chargeColor;
  ctx.font = 'bold 12px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const stepC = plateWidthPx / (numCharges + 1);
  const chargeY = y + plateThicknessPx / 2;
  for (let c = 1; c <= numCharges; c++) {
    ctx.fillText(chargeSign, plateLeftX + c * stepC, chargeY);
  }
  ctx.restore();
}

/** Plate separation d and area A annotations. */
function drawAnnotations(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  const { layout, plateDistanceMm, plateAreaMm2 } = scene;
  const { plateRightX, topPlateY, plateThicknessPx, botPlateY, centerY, centerX } = layout;

  ctx.save();
  ctx.strokeStyle = 'rgba(203, 213, 225, 0.5)';
  ctx.fillStyle = '#94a3b8';
  ctx.lineWidth = 1;
  ctx.font = '11px monospace';
  ctx.textAlign = 'left';

  // Separation arrow on the right
  const annotX = plateRightX + 25;
  ctx.beginPath();
  ctx.moveTo(annotX, topPlateY + plateThicknessPx);
  ctx.lineTo(annotX, botPlateY);
  ctx.stroke();
  // Arrow tips
  ctx.beginPath();
  ctx.moveTo(annotX - 4, topPlateY + plateThicknessPx + 6);
  ctx.lineTo(annotX, topPlateY + plateThicknessPx);
  ctx.lineTo(annotX + 4, topPlateY + plateThicknessPx + 6);
  ctx.moveTo(annotX - 4, botPlateY - 6);
  ctx.lineTo(annotX, botPlateY);
  ctx.lineTo(annotX + 4, botPlateY - 6);
  ctx.stroke();
  ctx.fillText(`d = ${plateDistanceMm.toFixed(1)} mm`, annotX + 8, centerY);

  // Area label under bottom plate
  ctx.textAlign = 'center';
  ctx.fillText(`Área de Placas: A = ${plateAreaMm2.toFixed(0)} mm²`, centerX, botPlateY + plateThicknessPx + 20);
  ctx.restore();
}

/** Draggable voltmeter with its two leads and probe tips. */
function drawVoltmeter(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  const { width, redProbe, blackProbe, measuredV } = scene;
  const vMeterX = width - 180;
  const vMeterY = 160;

  // Voltmeter body
  ctx.save();
  ctx.fillStyle = '#1e293b';
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(vMeterX - 60, vMeterY - 50, 120, 100, 10);
  ctx.fill();
  ctx.stroke();

  // Digital screen
  ctx.fillStyle = '#020617';
  ctx.fillRect(vMeterX - 48, vMeterY - 38, 96, 42);
  ctx.strokeStyle = '#334155';
  ctx.strokeRect(vMeterX - 48, vMeterY - 38, 96, 42);

  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 18px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${measuredV.toFixed(2)} V`, vMeterX, vMeterY - 17);

  ctx.font = '10px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('VOLTÍMETRO', vMeterX, vMeterY + 22);

  // Terminal ports
  ctx.fillStyle = '#ef4444'; // red (+)
  ctx.beginPath();
  ctx.arc(vMeterX - 25, vMeterY + 40, 6, 0, 2 * Math.PI);
  ctx.fill();

  ctx.fillStyle = '#1e293b'; // black (-)
  ctx.strokeStyle = '#64748b';
  ctx.beginPath();
  ctx.arc(vMeterX + 25, vMeterY + 40, 6, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();

  // Red lead wire
  ctx.strokeStyle = '#ef4444';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(vMeterX - 25, vMeterY + 40);
  ctx.bezierCurveTo(vMeterX - 70, vMeterY + 90, redProbe.x + 30, redProbe.y - 40, redProbe.x, redProbe.y);
  ctx.stroke();

  // Black lead wire
  ctx.strokeStyle = '#64748b';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(vMeterX + 25, vMeterY + 40);
  ctx.bezierCurveTo(
    vMeterX - 20,
    vMeterY + 120,
    blackProbe.x + 40,
    blackProbe.y + 40,
    blackProbe.x,
    blackProbe.y
  );
  ctx.stroke();

  // Red probe tip
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(redProbe.x, redProbe.y, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 10px monospace';
  ctx.fillText('+', redProbe.x, redProbe.y);

  // Black probe tip
  ctx.fillStyle = '#0f172a';
  ctx.beginPath();
  ctx.arc(blackProbe.x, blackProbe.y, 8, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillText('−', blackProbe.x, blackProbe.y);
  ctx.restore();
}

/** Draggable electric field sensor. */
function drawFieldSensor(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  const { fieldProbe, measuredE } = scene;
  const fx = fieldProbe.x;
  const fy = fieldProbe.y;

  ctx.save();
  // Probe body
  ctx.fillStyle = '#0f172a';
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(fx - 45, fy - 22, 90, 44, 8);
  ctx.fill();
  ctx.stroke();

  // Sensor reading
  ctx.fillStyle = '#38bdf8';
  ctx.font = 'bold 11px monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`${(measuredE / 1000).toFixed(2)} kV/m`, fx, fy - 4);

  ctx.font = '9px sans-serif';
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('SENSOR CAMPO E', fx, fy + 11);

  // Small target crosshair on probe top
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(fx, fy - 26, 4, 0, 2 * Math.PI);
  ctx.moveTo(fx - 7, fy - 26);
  ctx.lineTo(fx + 7, fy - 26);
  ctx.moveTo(fx, fy - 33);
  ctx.lineTo(fx, fy - 19);
  ctx.stroke();
  ctx.restore();
}

/** Draws one complete frame of the laboratory. */
export function drawCapacitorScene(ctx: CanvasRenderingContext2D, scene: CapacitorScene): void {
  drawBackground(ctx, scene.width, scene.height);
  drawBatteryCircuit(ctx, scene);
  drawFieldVectors(ctx, scene);
  drawDielectricSlab(ctx, scene);
  drawPlate(ctx, scene, scene.layout.topPlateY, true);
  drawPlate(ctx, scene, scene.layout.botPlateY, false);
  drawAnnotations(ctx, scene);
  if (scene.showVoltmeter) drawVoltmeter(ctx, scene);
  if (scene.showFieldMeter) drawFieldSensor(ctx, scene);
}
