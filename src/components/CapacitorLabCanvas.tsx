import React, { useRef, useEffect, useState, useMemo } from 'react';
import type { ViewMode } from '../types';
import {
  DIELECTRIC_MATERIALS,
  computeCapacitorState,
  sampleLocalPotential
} from '../physics/capacitance';
import {
  BatteryCharging,
  Unplug,
  Layers
} from 'lucide-react';

export interface CapacitorLabCanvasProps {
  presetRequest?: string | null;
  onPresetHandled?: () => void;
  viewMode?: ViewMode;
}

export const CapacitorLabCanvas: React.FC<CapacitorLabCanvasProps> = ({
  presetRequest,
  onPresetHandled,
  viewMode = 'explore'
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [dimensions, setDimensions] = useState({ width: 900, height: 650 });

  // Capacitor Parameters
  const [plateAreaMm2, setPlateAreaMm2] = useState<number>(200);     // 100 to 400 mm²
  const [plateDistanceMm, setPlateDistanceMm] = useState<number>(5.0); // 2.0 to 10.0 mm
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('teflon');
  const [customKappa] = useState<number>(2.1);
  const [insertionFraction, setInsertionFraction] = useState<number>(0.8); // 0.0 to 1.0

  // Battery State
  const [connectedToBattery, setConnectedToBattery] = useState<boolean>(true);
  const [batteryVoltage, setBatteryVoltage] = useState<number>(1.5); // Volts (-3.0 to +3.0)
  const [trappedCharge, setTrappedCharge] = useState<number>(0);

  // Instruments
  const [showVoltmeter, setShowVoltmeter] = useState<boolean>(true);
  const [showFieldMeter, setShowFieldMeter] = useState<boolean>(true);

  // Probe positions (in canvas coordinates)
  const [redProbePos, setRedProbePos] = useState({ x: 340, y: 190 });
  const [blackProbePos, setBlackProbePos] = useState({ x: 340, y: 390 });
  const [fieldProbePos, setFieldProbePos] = useState({ x: 420, y: 290 });

  // Dragging state
  type DragTarget = 'redProbe' | 'blackProbe' | 'fieldProbe' | 'dielectric' | null;
  const [dragTarget, setDragTarget] = useState<DragTarget>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Update canvas size dynamically
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setDimensions({ width: Math.floor(width), height: Math.floor(height) });
        }
      }
    });

    ro.observe(container);
    return () => ro.disconnect();
  }, []);

  // Material selection
  const currentMaterial = useMemo(() => {
    return DIELECTRIC_MATERIALS.find((m) => m.id === selectedMaterialId) || DIELECTRIC_MATERIALS[0];
  }, [selectedMaterialId]);

  const activeKappa = selectedMaterialId === 'custom' ? customKappa : currentMaterial.kappa;

  // Handle toggling battery connection
  const toggleBattery = () => {
    if (connectedToBattery) {
      // Disconnecting: save current charge so Q stays constant!
      const currentPhys = computeCapacitorState({
        plateAreaMm2,
        plateDistanceMm,
        kappa: activeKappa,
        insertionFraction,
        connectedToBattery: true,
        batteryVoltage
      });
      setTrappedCharge(currentPhys.storedCharge);
      setConnectedToBattery(false);
    } else {
      // Reconnecting to battery
      setConnectedToBattery(true);
    }
  };

  // Compute physics state
  const physics = useMemo(() => {
    return computeCapacitorState({
      plateAreaMm2,
      plateDistanceMm,
      kappa: activeKappa,
      insertionFraction,
      connectedToBattery,
      batteryVoltage,
      disconnectedCharge: trappedCharge
    });
  }, [
    plateAreaMm2,
    plateDistanceMm,
    activeKappa,
    insertionFraction,
    connectedToBattery,
    batteryVoltage,
    trappedCharge
  ]);

  // Handle 1-click presets from LeftGuidePanel or Search
  useEffect(() => {
    if (!presetRequest) return;
    if (presetRequest === 'vacuum') {
      setSelectedMaterialId('vacuum');
      setInsertionFraction(0);
      setConnectedToBattery(true);
      setBatteryVoltage(1.5);
    } else if (presetRequest === 'teflon') {
      setSelectedMaterialId('teflon');
      setInsertionFraction(1.0);
      setConnectedToBattery(true);
      setBatteryVoltage(1.5);
    } else if (presetRequest === 'glass') {
      setSelectedMaterialId('glass');
      setInsertionFraction(1.0);
      setConnectedToBattery(true);
      setBatteryVoltage(2.0);
    } else if (presetRequest === 'trapped') {
      setSelectedMaterialId('glass');
      setInsertionFraction(0.85);
      const currentPhys = computeCapacitorState({
        plateAreaMm2,
        plateDistanceMm,
        kappa: 5.6,
        insertionFraction: 0.85,
        connectedToBattery: true,
        batteryVoltage: 1.5
      });
      setTrappedCharge(currentPhys.storedCharge);
      setConnectedToBattery(false);
    }
    onPresetHandled?.();
  }, [presetRequest, onPresetHandled, plateAreaMm2, plateDistanceMm]);

  // Layout Geometry of the Capacitor in Canvas
  const centerX = dimensions.width / 2;
  const centerY = dimensions.height / 2;

  // Visual scaling: plate width proportional to area, gap proportional to distance
  const plateWidthPx = 180 + (plateAreaMm2 / 400) * 140; // 225px to 320px
  const plateThicknessPx = 14;
  const gapPx = 40 + (plateDistanceMm / 10) * 130;       // 66px to 170px

  const topPlateY = centerY - gapPx / 2 - plateThicknessPx;
  const botPlateY = centerY + gapPx / 2;
  const plateLeftX = centerX - plateWidthPx / 2;
  const plateRightX = centerX + plateWidthPx / 2;

  // Dielectric slab coordinates
  const slabWidthPx = plateWidthPx * 0.95;
  const slabHeightPx = gapPx;
  // insertionFraction = 0 -> slab is outside to the right; 1 -> slab completely inside
  const slabX = plateLeftX + (1 - insertionFraction) * plateWidthPx;
  const slabY = centerY - gapPx / 2;

  // Voltmeter reading: potential difference between probes
  const measuredV = useMemo(() => {
    const vRed = sampleLocalPotential(
      redProbePos.x,
      redProbePos.y,
      topPlateY + plateThicknessPx,
      botPlateY,
      plateLeftX,
      plateRightX,
      physics.voltage
    );
    const vBlack = sampleLocalPotential(
      blackProbePos.x,
      blackProbePos.y,
      topPlateY + plateThicknessPx,
      botPlateY,
      plateLeftX,
      plateRightX,
      physics.voltage
    );
    return vRed - vBlack;
  }, [redProbePos, blackProbePos, topPlateY, botPlateY, plateThicknessPx, plateLeftX, plateRightX, physics.voltage]);

  // Field probe reading
  const measuredE = useMemo(() => {
    const inX = fieldProbePos.x >= plateLeftX && fieldProbePos.x <= plateRightX;
    const inY = fieldProbePos.y >= topPlateY + plateThicknessPx && fieldProbePos.y <= botPlateY;
    if (inX && inY) {
      // Check if inside dielectric portion
      const inDielectric = fieldProbePos.x >= slabX && fieldProbePos.x <= slabX + slabWidthPx;
      if (inDielectric && activeKappa > 1) {
        // E field in dielectric
        return connectedToBattery ? physics.electricField : physics.electricField / activeKappa;
      }
      return physics.electricField;
    }
    // Fringe outside
    const dist = Math.min(
      Math.hypot(fieldProbePos.x - plateLeftX, fieldProbePos.y - centerY),
      Math.hypot(fieldProbePos.x - plateRightX, fieldProbePos.y - centerY)
    );
    return physics.electricField * Math.exp(-dist / 40);
  }, [
    fieldProbePos,
    plateLeftX,
    plateRightX,
    topPlateY,
    plateThicknessPx,
    botPlateY,
    slabX,
    slabWidthPx,
    activeKappa,
    connectedToBattery,
    physics.electricField,
    centerY
  ]);

  // Mouse event handlers for interactive probes and dielectric
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Check Red probe
    if (showVoltmeter && Math.hypot(mx - redProbePos.x, my - redProbePos.y) < 20) {
      setDragTarget('redProbe');
      setDragOffset({ x: mx - redProbePos.x, y: my - redProbePos.y });
      return;
    }

    // Check Black probe
    if (showVoltmeter && Math.hypot(mx - blackProbePos.x, my - blackProbePos.y) < 20) {
      setDragTarget('blackProbe');
      setDragOffset({ x: mx - blackProbePos.x, y: my - blackProbePos.y });
      return;
    }

    // Check E-field probe
    if (showFieldMeter && Math.hypot(mx - fieldProbePos.x, my - fieldProbePos.y) < 24) {
      setDragTarget('fieldProbe');
      setDragOffset({ x: mx - fieldProbePos.x, y: my - fieldProbePos.y });
      return;
    }

    // Check Dielectric slab handle
    if (mx >= slabX && mx <= slabX + slabWidthPx && my >= slabY && my <= slabY + slabHeightPx) {
      setDragTarget('dielectric');
      setDragOffset({ x: mx - slabX, y: my - slabY });
      return;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragTarget) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    if (dragTarget === 'redProbe') {
      setRedProbePos({ x: mx - dragOffset.x, y: my - dragOffset.y });
    } else if (dragTarget === 'blackProbe') {
      setBlackProbePos({ x: mx - dragOffset.x, y: my - dragOffset.y });
    } else if (dragTarget === 'fieldProbe') {
      setFieldProbePos({ x: mx - dragOffset.x, y: my - dragOffset.y });
    } else if (dragTarget === 'dielectric') {
      const newSlabX = mx - dragOffset.x;
      // Convert newSlabX to insertion fraction
      // slabX = plateLeftX + (1 - frac) * plateWidthPx
      // => (1 - frac) = (slabX - plateLeftX) / plateWidthPx
      // => frac = 1 - (slabX - plateLeftX) / plateWidthPx
      const rawFrac = 1 - (newSlabX - plateLeftX) / plateWidthPx;
      setInsertionFraction(Math.max(0, Math.min(1, rawFrac)));
    }
  };

  const handleMouseUp = () => {
    setDragTarget(null);
  };

  // ==========================================
  // Render Canvas (PhET / MIT TEAL Aesthetics)
  // ==========================================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = dimensions.width;
    const h = dimensions.height;
    canvas.width = w;
    canvas.height = h;

    // Background
    const bgGrad = ctx.createLinearGradient(0, 0, 0, h);
    bgGrad.addColorStop(0, '#090d16');
    bgGrad.addColorStop(1, '#05070d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Subtle grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
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

    // ------------------------------------------
    // Draw Battery & Connecting Circuit Wires
    // ------------------------------------------
    const batteryX = 140;
    const batteryY = centerY;
    const wireColor = connectedToBattery ? '#38bdf8' : '#475569';

    ctx.strokeStyle = wireColor;
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Top Wire from Battery to Top Plate
    ctx.beginPath();
    ctx.moveTo(batteryX, batteryY - 45);
    ctx.lineTo(batteryX, topPlateY + plateThicknessPx / 2);
    ctx.lineTo(plateLeftX, topPlateY + plateThicknessPx / 2);
    ctx.stroke();

    // Bottom Wire from Battery to Bottom Plate (with switch gap)
    ctx.beginPath();
    ctx.moveTo(batteryX, batteryY + 45);
    ctx.lineTo(batteryX, botPlateY + plateThicknessPx / 2);
    if (connectedToBattery) {
      // Closed switch
      ctx.lineTo(plateLeftX, botPlateY + plateThicknessPx / 2);
    } else {
      // Open switch gap
      const switchMidX = (batteryX + plateLeftX) / 2;
      ctx.lineTo(switchMidX - 15, botPlateY + plateThicknessPx / 2);
      ctx.moveTo(switchMidX + 15, botPlateY + plateThicknessPx / 2);
      ctx.lineTo(plateLeftX, botPlateY + plateThicknessPx / 2);
    }
    ctx.stroke();

    // Draw Switch contacts and lever
    const switchX = (batteryX + plateLeftX) / 2;
    const switchY = botPlateY + plateThicknessPx / 2;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(switchX - 15, switchY, 4, 0, 2 * Math.PI);
    ctx.arc(switchX + 15, switchY, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Switch Blade
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

    // Battery Body
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

    // Battery Terminals
    ctx.fillStyle = '#ef4444'; // Top positive (+)
    ctx.fillRect(batteryX - 10, batteryY - batH / 2 - 8, 20, 8);
    ctx.fillStyle = '#3b82f6'; // Bottom negative (-)
    ctx.fillRect(batteryX - 10, batteryY + batH / 2, 20, 8);

    // Battery Labels
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('+', batteryX, batteryY - batH / 2 + 14);
    ctx.fillText('−', batteryX, batteryY + batH / 2 - 14);
    ctx.font = '11px sans-serif';
    ctx.fillText(`${batteryVoltage.toFixed(1)}V`, batteryX, batteryY);

    // ------------------------------------------
    // Draw Electric Field Vectors in Gap
    // ------------------------------------------
    if (physics.electricField > 10) {
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

        ctx.strokeStyle = isInsideSlab ? 'rgba(245, 158, 11, ' + lineAlpha + ')' : 'rgba(56, 189, 248, ' + lineAlpha + ')';
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

    // ------------------------------------------
    // Draw Dielectric Slab
    // ------------------------------------------
    if (activeKappa > 1.0) {
      ctx.save();
      ctx.fillStyle = currentMaterial.color;
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(slabX, slabY, slabWidthPx, slabHeightPx, 4);
      ctx.fill();
      ctx.stroke();

      // Dielectric slab handle & grip
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

      // Material watermark & bound charges inside dielectric
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${currentMaterial.name} (κ = ${activeKappa})`, slabX + slabWidthPx / 2, slabY + slabHeightPx / 2 - 8);
      ctx.font = '10px monospace';
      ctx.fillStyle = '#fde68a';
      ctx.fillText(`Q_inducida: ${physics.polarizationChargePC.toFixed(1)} pC`, slabX + slabWidthPx / 2, slabY + slabHeightPx / 2 + 10);

      // Draw Bound Dipoles inside the dielectric slab
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

    // ------------------------------------------
    // Draw Metal Plates
    // ------------------------------------------
    const drawPlate = (y: number, isTop: boolean) => {
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

      // Free Charges on plates
      const numCharges = Math.min(24, Math.max(3, Math.round(Math.abs(physics.storedChargePC) / 1.5)));
      const isPositive = isTop ? physics.voltage >= 0 : physics.voltage < 0;
      const chargeSign = isPositive ? '+' : '−';
      const chargeColor = isPositive ? '#ef4444' : '#3b82f6';

      ctx.fillStyle = chargeColor;
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      const stepC = plateWidthPx / (numCharges + 1);
      const chargeY = isTop ? y + plateThicknessPx / 2 : y + plateThicknessPx / 2;

      for (let c = 1; c <= numCharges; c++) {
        const cx = plateLeftX + c * stepC;
        ctx.fillText(chargeSign, cx, chargeY);
      }
      ctx.restore();
    };

    drawPlate(topPlateY, true);
    drawPlate(botPlateY, false);

    // Dimension Annotations (Plate Separation d and Area A)
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

    // Area Label under bottom plate
    ctx.textAlign = 'center';
    ctx.fillText(`Área de Placas: A = ${plateAreaMm2.toFixed(0)} mm²`, centerX, botPlateY + plateThicknessPx + 20);
    ctx.restore();

    // ------------------------------------------
    // Draw Draggable Voltmeter Device & Leads
    // ------------------------------------------
    if (showVoltmeter) {
      const vMeterX = w - 180;
      const vMeterY = 160;

      // Voltmeter Body
      ctx.save();
      ctx.fillStyle = '#1e293b';
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(vMeterX - 60, vMeterY - 50, 120, 100, 10);
      ctx.fill();
      ctx.stroke();

      // Digital Screen
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
      ctx.fillStyle = '#ef4444'; // Red (+)
      ctx.beginPath();
      ctx.arc(vMeterX - 25, vMeterY + 40, 6, 0, 2 * Math.PI);
      ctx.fill();

      ctx.fillStyle = '#1e293b'; // Black (-)
      ctx.strokeStyle = '#64748b';
      ctx.beginPath();
      ctx.arc(vMeterX + 25, vMeterY + 40, 6, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Red Lead Wire
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(vMeterX - 25, vMeterY + 40);
      ctx.bezierCurveTo(
        vMeterX - 70, vMeterY + 90,
        redProbePos.x + 30, redProbePos.y - 40,
        redProbePos.x, redProbePos.y
      );
      ctx.stroke();

      // Black Lead Wire
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(vMeterX + 25, vMeterY + 40);
      ctx.bezierCurveTo(
        vMeterX - 20, vMeterY + 120,
        blackProbePos.x + 40, blackProbePos.y + 40,
        blackProbePos.x, blackProbePos.y
      );
      ctx.stroke();

      // Red Probe Tip
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(redProbePos.x, redProbePos.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px monospace';
      ctx.fillText('+', redProbePos.x, redProbePos.y);

      // Black Probe Tip
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.arc(blackProbePos.x, blackProbePos.y, 8, 0, 2 * Math.PI);
      ctx.fill();
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText('−', blackProbePos.x, blackProbePos.y);
      ctx.restore();
    }

    // ------------------------------------------
    // Draw Electric Field Sensor Probe
    // ------------------------------------------
    if (showFieldMeter) {
      ctx.save();
      const fx = fieldProbePos.x;
      const fy = fieldProbePos.y;

      // Probe Body
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

  }, [
    dimensions,
    plateAreaMm2,
    plateDistanceMm,
    currentMaterial,
    activeKappa,
    insertionFraction,
    connectedToBattery,
    batteryVoltage,
    physics,
    showVoltmeter,
    showFieldMeter,
    redProbePos,
    blackProbePos,
    fieldProbePos,
    measuredV,
    measuredE,
    centerX,
    centerY,
    plateWidthPx,
    plateThicknessPx,
    gapPx,
    topPlateY,
    botPlateY,
    plateLeftX,
    plateRightX,
    slabX,
    slabY,
    slabWidthPx,
    slabHeightPx
  ]);

  return (
    <div ref={containerRef} className="w-full h-full relative flex flex-col bg-slate-950 select-none overflow-hidden">
      {/* Top HUD: Real-time Physical Readings */}
      <div className="absolute top-3 left-4 z-20 flex flex-wrap items-center gap-3 bg-slate-900/90 backdrop-blur-md px-4 py-2.5 rounded-xl border border-slate-700/70 shadow-2xl">
        <div className="flex items-center gap-2 border-r border-slate-700/80 pr-4">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 font-bold">
            C
          </div>
          <div>
            <div className="text-xs font-bold text-white tracking-wide">LABORATORIO DE CAPACITANCIA</div>
            <div className="text-[11px] font-mono text-cyan-400">
              C = κ ε₀ A / d &nbsp;|&nbsp; Q = C·V &nbsp;|&nbsp; U = ½ C·V²
            </div>
          </div>
        </div>

        {/* Real-time Values Bar */}
        {viewMode === 'explore' ? (
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 font-medium">
              Capacitancia: {physics.capacitancePF > 1.2 ? '⚡ Alta' : physics.capacitancePF > 0.5 ? '🔹 Media' : '🔸 Baja'} ({physics.capacitancePF.toFixed(1)} pF)
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 font-medium">
              {connectedToBattery ? '🔋 Batería Activa (V Fijo)' : '🔒 Carga Atrapada (Q Fija)'}
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-950/80 border border-amber-500/40 text-amber-300 font-medium">
              Dieléctrico: {currentMaterial.name} ({Math.round(insertionFraction * 100)}% dentro)
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-4 text-xs font-mono">
            <div>
              <span className="text-slate-400">Capacitancia C: </span>
              <span className="text-cyan-300 font-bold">{physics.capacitancePF.toFixed(2)} pF</span>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400">Carga Q: </span>
              <span className="text-rose-400 font-bold">{physics.storedChargePC.toFixed(2)} pC</span>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400">Voltaje V: </span>
              <span className="text-amber-400 font-bold">{physics.voltage.toFixed(2)} V</span>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400">Energía U: </span>
              <span className="text-emerald-400 font-bold">{physics.storedEnergyPJ.toFixed(2)} pJ</span>
            </div>

            <div className="border-l border-slate-800 pl-3">
              <span className="text-slate-400">Campo E: </span>
              <span className="text-purple-300 font-bold">{physics.electricFieldKVm.toFixed(2)} kV/m</span>
            </div>
          </div>
        )}
      </div>

      {/* Battery & Circuit Control HUD (Top Right) */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-2 bg-slate-900/90 backdrop-blur-md p-2 rounded-xl border border-slate-700/70 shadow-2xl">
        {/* Toggle Battery Connection */}
        <button
          onClick={toggleBattery}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
            connectedToBattery
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30'
              : 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
          }`}
        >
          {connectedToBattery ? (
            <>
              <BatteryCharging className="w-4 h-4 text-emerald-400" />
              <span>Conectado (V = cte)</span>
            </>
          ) : (
            <>
              <Unplug className="w-4 h-4 text-rose-400" />
              <span>Desconectado (Q = cte)</span>
            </>
          )}
        </button>

        {/* Battery Voltage Slider */}
        {connectedToBattery && (
          <div className="flex items-center gap-2 px-2 text-xs text-slate-300 border-l border-slate-800">
            <span className="text-[11px]">Batería:</span>
            <input
              type="range"
              min="-3.0"
              max="3.0"
              step="0.1"
              value={batteryVoltage}
              onChange={(e) => setBatteryVoltage(parseFloat(e.target.value))}
              className="w-20 accent-cyan-500 cursor-pointer"
            />
            <span className="font-mono w-10 text-right">{batteryVoltage.toFixed(1)}V</span>
          </div>
        )}
      </div>

      {/* Bottom Controls Bar: Dielectrics & Geometry */}
      <div className="absolute bottom-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 bg-slate-900/95 backdrop-blur-md px-4 py-3 rounded-xl border border-slate-700/70 shadow-2xl">
        {/* Material Selector */}
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-amber-400" />
          <span className="text-xs font-semibold text-slate-300">Dieléctrico:</span>
          <select
            value={selectedMaterialId}
            onChange={(e) => setSelectedMaterialId(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs rounded-lg px-2.5 py-1 focus:ring-1 focus:ring-cyan-500 cursor-pointer"
          >
            {DIELECTRIC_MATERIALS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name} (κ = {m.kappa})
              </option>
            ))}
          </select>
        </div>

        {/* Dielectric Insertion Slider */}
        <div className="flex items-center gap-2 text-xs text-slate-300 border-l border-slate-800 pl-4">
          <span className="text-[11px]">Inserción de Placa:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={insertionFraction}
            onChange={(e) => setInsertionFraction(parseFloat(e.target.value))}
            className="w-24 accent-amber-500 cursor-pointer"
          />
          <span className="font-mono text-amber-400 font-bold">{(insertionFraction * 100).toFixed(0)}%</span>
        </div>

        {/* Plate Distance d Slider */}
        <div className="flex items-center gap-2 text-xs text-slate-300 border-l border-slate-800 pl-4">
          <span className="text-[11px]">Distancia d:</span>
          <input
            type="range"
            min="2.0"
            max="10.0"
            step="0.5"
            value={plateDistanceMm}
            onChange={(e) => setPlateDistanceMm(parseFloat(e.target.value))}
            className="w-24 accent-sky-500 cursor-pointer"
          />
          <span className="font-mono text-cyan-300 font-bold">{plateDistanceMm.toFixed(1)} mm</span>
        </div>

        {/* Plate Area A Slider */}
        <div className="flex items-center gap-2 text-xs text-slate-300 border-l border-slate-800 pl-4">
          <span className="text-[11px]">Área A:</span>
          <input
            type="range"
            min="100"
            max="400"
            step="10"
            value={plateAreaMm2}
            onChange={(e) => setPlateAreaMm2(parseFloat(e.target.value))}
            className="w-24 accent-indigo-500 cursor-pointer"
          />
          <span className="font-mono text-indigo-300 font-bold">{plateAreaMm2.toFixed(0)} mm²</span>
        </div>

        {/* Instruments Toggle */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4 text-xs">
          <button
            onClick={() => setShowVoltmeter(!showVoltmeter)}
            className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
              showVoltmeter ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Voltímetro
          </button>
          <button
            onClick={() => setShowFieldMeter(!showFieldMeter)}
            className={`px-2.5 py-1 rounded cursor-pointer transition-all ${
              showFieldMeter ? 'bg-cyan-600 text-white shadow' : 'bg-slate-800 text-slate-400'
            }`}
          >
            Sensor E
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="w-full h-full cursor-crosshair"
      />
    </div>
  );
};
export default CapacitorLabCanvas;
