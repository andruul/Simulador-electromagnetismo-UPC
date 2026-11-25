import type {
  PointCharge,
  TestParticle2D,
  Sensor2D,
  ElectrostaticsSettings,
  ViewMode
} from '../../tipos';
import {
  ELECTROSTATICS_PIXELS_PER_METER,
  calculateElectricField,
  calculateElectricFieldSI,
  calculateElectricPotential,
  calculateElectricPotentialSI,
  traceFieldLine,
  traceEquipotentialLine
} from '../../fisica/electrostatica';

export interface ElectrostaticsScene {
  width: number;
  height: number;
  charges: PointCharge[];
  selectedChargeId: string | null;
  settings: ElectrostaticsSettings;
  sensor: Sensor2D;
  isDraggingSensor: boolean;
  testParticles: TestParticle2D[];
  viewMode: ViewMode;
}

// Reutiliza un lienzo fuera de pantalla para interpolar suavemente el mapa de calor del potencial
let heatmapCanvas: HTMLCanvasElement | null = null;

function formatSI(value: number, baseUnit: string, kiloUnit: string): string {
  const abs = Math.abs(value);
  if (abs >= 1000) {
    return `${(value / 1000).toFixed(2)} ${kiloUnit}`;
  }
  return `${value.toFixed(2)} ${baseUnit}`;
}

/**
 * Renderizador puro Canvas 2D de la Sala 1 (Electrostática).
 * Incluye mapa de potencial suavizado por interpolación bilineal, escala métrica explícita
 * y lecturas SI exactas (k_e = 8.98755×10⁹ N·m²/C², 100 px = 1.00 m).
 */
export function drawElectrostaticsScene(
  ctx: CanvasRenderingContext2D,
  scene: ElectrostaticsScene
): void {
  const {
    width,
    height,
    charges,
    selectedChargeId,
    settings,
    sensor,
    isDraggingSensor,
    testParticles,
    viewMode
  } = scene;

  // 1. Fondo cálido marfil hueso
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, width, height);

  // 2. Cuadrícula métrica sutil (40 px = 0.40 m, 100 px = 1.00 m)
  ctx.strokeStyle = 'rgba(120, 108, 94, 0.11)';
  ctx.lineWidth = 1;
  const gridSize = 40;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Mapa de calor continuo del potencial V (interpolación bilineal suave sin pixelado)
  if (settings.showPotentialHeatmap && charges.length > 0 && typeof document !== 'undefined') {
    const scale = 8;
    const lowW = Math.max(2, Math.ceil(width / scale));
    const lowH = Math.max(2, Math.ceil(height / scale));
    if (!heatmapCanvas) heatmapCanvas = document.createElement('canvas');
    if (heatmapCanvas.width !== lowW || heatmapCanvas.height !== lowH) {
      heatmapCanvas.width = lowW;
      heatmapCanvas.height = lowH;
    }
    const hCtx = heatmapCanvas.getContext('2d');
    if (hCtx) {
      const img = hCtx.createImageData(lowW, lowH);
      const data = img.data;
      let idx = 0;
      for (let gy = 0; gy < lowH; gy++) {
        const py = (gy + 0.5) * scale;
        for (let gx = 0; gx < lowW; gx++) {
          const px = (gx + 0.5) * scale;
          const V = calculateElectricPotential(px, py, charges, settings.kConstant);
          const normV = Math.tanh(V / 600);
          const alpha = Math.round(Math.min(0.26, Math.abs(normV) * 0.30) * 255);
          if (normV >= 0) {
            data[idx] = 229;
            data[idx + 1] = 107;
            data[idx + 2] = 111;
            data[idx + 3] = alpha;
          } else {
            data[idx] = 74;
            data[idx + 1] = 144;
            data[idx + 2] = 184;
            data[idx + 3] = alpha;
          }
          idx += 4;
        }
      }
      hCtx.putImageData(img, 0, 0);
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(heatmapCanvas, 0, 0, lowW, lowH, 0, 0, width, height);
      ctx.restore();
    }
  }

  // 4. Líneas equipotenciales (V = cte)
  if (settings.showEquipotentialLines && charges.length > 0) {
    ctx.strokeStyle = 'rgba(45, 122, 100, 0.50)';
    ctx.lineWidth = 1.25;
    ctx.setLineDash([4, 4]);

    for (const c of charges) {
      const radii = [35, 70, 120, 180, 260];
      for (const r of radii) {
        const eqPoints = traceEquipotentialLine(
          c.x + r,
          c.y,
          charges,
          width,
          height,
          4,
          250,
          settings.kConstant
        );

        if (eqPoints.length > 2) {
          ctx.beginPath();
          ctx.moveTo(eqPoints[0].x, eqPoints[0].y);
          for (let i = 1; i < eqPoints.length; i++) {
            ctx.lineTo(eqPoints[i].x, eqPoints[i].y);
          }
          ctx.stroke();
        }
      }
    }
    ctx.setLineDash([]);
  }

  // 5. Malla vectorial de campo eléctrico E
  if (settings.showVectorField && charges.length > 0) {
    const step = Math.max(25, settings.vectorGridDensity);
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        const E = calculateElectricField(x, y, charges, settings.kConstant);
        const mag = Math.hypot(E.x, E.y);
        if (mag < 0.01) continue;

        const angle = Math.atan2(E.y, E.x);
        const length = Math.min(step * 0.75, Math.max(8, Math.log10(mag + 1) * 7));
        const strength = Math.min(1, Math.log10(mag + 1) / 3.5);
        const red = Math.floor(82 + strength * 124);
        const green = Math.floor(96 - strength * 18);
        const blue = Math.floor(138 - strength * 58);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = `rgba(${red}, ${green}, ${blue}, 0.55)`;
        ctx.fillStyle = `rgba(${red}, ${green}, ${blue}, 0.72)`;
        ctx.lineWidth = 1.3;

        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.stroke();

        const headSize = Math.max(3, length * 0.28);
        ctx.beginPath();
        ctx.moveTo(length / 2, 0);
        ctx.lineTo(length / 2 - headSize, -headSize * 0.55);
        ctx.lineTo(length / 2 - headSize, headSize * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // 6. Líneas de campo continuas (RK4)
  if (settings.showFieldLines && charges.length > 0) {
    const linesPerCharge = settings.fieldLinesPerCharge || 16;
    ctx.lineWidth = 1.6;

    for (const c of charges) {
      if (c.charge > 0) {
        ctx.strokeStyle = 'rgba(196, 86, 82, 0.72)';
        const count = Math.round(linesPerCharge * Math.abs(c.charge));
        for (let i = 0; i < count; i++) {
          const angle = (2 * Math.PI * i) / count;
          const points = traceFieldLine(
            c.x + 16 * Math.cos(angle),
            c.y + 16 * Math.sin(angle),
            1,
            charges,
            width,
            height,
            settings.rk4StepSize || 4,
            settings.maxFieldLineSteps || 250,
            settings.kConstant
          );

          if (points.length > 1) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, points[0].y);
            for (let p = 1; p < points.length; p++) {
              ctx.lineTo(points[p].x, points[p].y);
            }
            ctx.stroke();

            if (points.length > 20) {
              const mid = Math.floor(points.length / 2);
              const p1 = points[mid];
              const p2 = points[mid + 1] || points[mid];
              const arrAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

              ctx.save();
              ctx.translate(p1.x, p1.y);
              ctx.rotate(arrAngle);
              ctx.fillStyle = '#B84844';
              ctx.beginPath();
              ctx.moveTo(5.5, 0);
              ctx.lineTo(-4, -3.5);
              ctx.lineTo(-4, 3.5);
              ctx.closePath();
              ctx.fill();
              ctx.restore();
            }
          }
        }
      }
    }

    const hasPositive = charges.some((c) => c.charge > 0);
    if (!hasPositive) {
      ctx.strokeStyle = 'rgba(58, 124, 165, 0.72)';
      for (const c of charges) {
        if (c.charge < 0) {
          const count = Math.round(linesPerCharge * Math.abs(c.charge));
          for (let i = 0; i < count; i++) {
            const angle = (2 * Math.PI * i) / count;
            const points = traceFieldLine(
              c.x + 16 * Math.cos(angle),
              c.y + 16 * Math.sin(angle),
              -1,
              charges,
              width,
              height,
              settings.rk4StepSize || 4,
              settings.maxFieldLineSteps || 250,
              settings.kConstant
            );

            if (points.length > 1) {
              ctx.beginPath();
              ctx.moveTo(points[0].x, points[0].y);
              for (let p = 1; p < points.length; p++) {
                ctx.lineTo(points[p].x, points[p].y);
              }
              ctx.stroke();
            }
          }
        }
      }
    }
  }

  // 7. Partículas de prueba dinámicas
  for (const tp of testParticles) {
    if (tp.trail.length > 1) {
      ctx.beginPath();
      ctx.moveTo(tp.trail[0].x, tp.trail[0].y);
      for (let i = 1; i < tp.trail.length; i++) {
        ctx.lineTo(tp.trail[i].x, tp.trail[i].y);
      }
      ctx.strokeStyle = tp.color;
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    ctx.save();
    ctx.shadowBlur = 8;
    ctx.shadowColor = tp.color;
    ctx.fillStyle = tp.color;
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 8. Cargas puntuales y etiquetas accesibles
  for (const c of charges) {
    const isSelected = c.id === selectedChargeId;
    const isPositive = c.charge > 0;
    const radius = 18;

    ctx.save();
    ctx.shadowColor = isPositive ? 'rgba(217, 83, 79, 0.45)' : 'rgba(58, 124, 165, 0.45)';
    ctx.shadowBlur = isSelected ? 18 : 10;

    const grad = ctx.createRadialGradient(c.x - 4, c.y - 4, 2, c.x, c.y, radius);
    if (isPositive) {
      grad.addColorStop(0, '#F5A3A5');
      grad.addColorStop(0.55, '#D95B5F');
      grad.addColorStop(1, '#A93A3E');
    } else {
      grad.addColorStop(0, '#96CBE5');
      grad.addColorStop(0.55, '#3E82AA');
      grad.addColorStop(1, '#255878');
    }

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(c.x, c.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#231F1C';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 20px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPositive ? '+' : '−', c.x, c.y);

    const chargeLabel = `${c.charge > 0 ? '+' : ''}${c.charge} µC`;
    ctx.font = 'bold 11px system-ui, sans-serif';
    const labelW = ctx.measureText(chargeLabel).width;
    ctx.fillStyle = 'rgba(255, 253, 249, 0.92)';
    ctx.strokeStyle = '#DDD5C8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(c.x - labelW / 2 - 6, c.y + radius + 5, labelW + 12, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#231F1C';
    ctx.fillText(chargeLabel, c.x, c.y + radius + 14);
  }

  // 9. Sensor explorador / Multímetro Digital SI exacto
  if (sensor.active) {
    const Evis = calculateElectricField(sensor.x, sensor.y, charges, settings.kConstant);
    const EmagVis = Math.hypot(Evis.x, Evis.y);
    const Esi = calculateElectricFieldSI(sensor.x, sensor.y, charges, ELECTROSTATICS_PIXELS_PER_METER);
    const EmagSI = Math.hypot(Esi.x, Esi.y);
    const Vsi = calculateElectricPotentialSI(sensor.x, sensor.y, charges, ELECTROSTATICS_PIXELS_PER_METER);
    const angleDeg = (Math.atan2(Esi.y, Esi.x) * 180) / Math.PI;

    ctx.save();
    ctx.fillStyle = 'rgba(254, 243, 199, 0.78)';
    ctx.strokeStyle = isDraggingSensor ? '#2D7A64' : '#B45309';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(sensor.x, sensor.y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(sensor.x - 16, sensor.y);
    ctx.lineTo(sensor.x + 16, sensor.y);
    ctx.moveTo(sensor.x, sensor.y - 16);
    ctx.lineTo(sensor.x, sensor.y + 16);
    ctx.stroke();

    if (EmagVis > 0.05) {
      const arrowLen = Math.min(70, Math.max(20, Math.log10(EmagVis + 1) * 22));
      const arrAngle = Math.atan2(Evis.y, Evis.x);
      const endX = sensor.x + arrowLen * Math.cos(arrAngle);
      const endY = sensor.y + arrowLen * Math.sin(arrAngle);

      ctx.strokeStyle = '#B45309';
      ctx.fillStyle = '#B45309';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(sensor.x, sensor.y);
      ctx.lineTo(endX, endY);
      ctx.stroke();

      ctx.beginPath();
      const headSize = 8;
      ctx.moveTo(endX, endY);
      ctx.lineTo(
        endX - headSize * Math.cos(arrAngle - Math.PI / 6),
        endY - headSize * Math.sin(arrAngle - Math.PI / 6)
      );
      ctx.lineTo(
        endX - headSize * Math.cos(arrAngle + Math.PI / 6),
        endY - headSize * Math.sin(arrAngle + Math.PI / 6)
      );
      ctx.closePath();
      ctx.fill();
    }

    const boxW = 196;
    const boxH = 74;
    let boxX = sensor.x + 22;
    let boxY = sensor.y - 37;
    if (boxX + boxW > width - 8) boxX = sensor.x - boxW - 22;
    if (boxY < 10) boxY = 10;

    ctx.shadowColor = 'rgba(60, 50, 40, 0.14)';
    ctx.shadowBlur = 12;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
    ctx.strokeStyle = '#D6CCBE';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, 8);
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    ctx.fillStyle = viewMode === 'explore' ? '#2D7A64' : '#2B6CB0';
    ctx.font = 'bold 11px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(
      viewMode === 'explore' ? 'SENSOR EXPLORADOR' : 'MULTÍMETRO DIGITAL (SI)',
      boxX + 10,
      boxY + 17
    );

    ctx.fillStyle = '#231F1C';
    ctx.font = 'bold 11px monospace';
    if (viewMode === 'explore') {
      const fieldLevel = EmagSI > 25000 ? 'Muy Fuerte' : EmagSI > 6000 ? 'Medio' : 'Suave';
      const voltLevel = Vsi > 2000 ? 'Alto (+)' : Vsi < -2000 ? 'Bajo (−)' : 'Cercano a 0V';
      ctx.fillText(`Campo: ${fieldLevel}`, boxX + 10, boxY + 34);
      ctx.fillText(`Potencial: ${voltLevel}`, boxX + 10, boxY + 49);
      ctx.fillText(`Ángulo: ${angleDeg.toFixed(0)}°`, boxX + 10, boxY + 64);
    } else {
      ctx.fillText(`|E|: ${formatSI(EmagSI, 'N/C', 'kN/C')}`, boxX + 10, boxY + 34);
      ctx.fillText(`V:   ${formatSI(Vsi, 'V', 'kV')}`, boxX + 10, boxY + 49);
      ctx.fillText(`θ:   ${angleDeg.toFixed(1)}°`, boxX + 10, boxY + 64);
    }
    ctx.restore();
  }

  // 10. Regla de escala métrica SI explícita (1.00 m = 100 px) en esquina inferior derecha
  if (width > 260) {
    const barPx = ELECTROSTATICS_PIXELS_PER_METER;
    const xRight = width - 18;
    const xLeft = xRight - barPx;
    const yBase = height - 18;

    ctx.save();
    ctx.fillStyle = 'rgba(255, 253, 249, 0.90)';
    ctx.strokeStyle = '#DDD5C8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(xLeft - 10, yBase - 22, barPx + 20, 30, 7);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#5C554E';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(xLeft, yBase);
    ctx.lineTo(xRight, yBase);
    ctx.moveTo(xLeft, yBase - 4);
    ctx.lineTo(xLeft, yBase + 4);
    ctx.moveTo(xRight, yBase - 4);
    ctx.lineTo(xRight, yBase + 4);
    ctx.stroke();

    ctx.fillStyle = '#231F1C';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('1.00 m (SI)', (xLeft + xRight) / 2, yBase - 8);
    ctx.restore();
  }
}
