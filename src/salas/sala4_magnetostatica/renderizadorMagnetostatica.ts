import type { WireCurrent, Vector2D, ViewMode } from '../../tipos';
import {
  MAGNETOSTATICS_PIXELS_PER_METER,
  calculateMagneticField2D,
  calculateMagneticFieldSI2D,
  traceMagneticLine
} from '../../fisica/biotsavart';

export interface AmperianLoop {
  x: number;
  y: number;
  radiusPx: number;
}

export interface MagnetostaticsScene {
  width: number;
  height: number;
  wires: WireCurrent[];
  selectedWireId: string | null;
  compass: Vector2D;
  isDraggingCompass: boolean;
  showVectors: boolean;
  showLines: boolean;
  showAmpereLoop: boolean;
  ampereLoop: AmperianLoop;
  viewMode: ViewMode;
}

/**
 * Renderizador puro Canvas 2D de la Sala 4 (Magnetostática: Biot-Savart y Ley de Ampère).
 */
export function drawMagnetostaticsScene(
  ctx: CanvasRenderingContext2D,
  scene: MagnetostaticsScene
): void {
  const {
    width,
    height,
    wires,
    selectedWireId,
    compass,
    isDraggingCompass,
    showVectors,
    showLines,
    showAmpereLoop,
    ampereLoop,
    viewMode
  } = scene;

  // 1. Fondo cálido marfil hueso
  ctx.fillStyle = '#FAF7F2';
  ctx.fillRect(0, 0, width, height);

  // 2. Cuadrícula métrica sutil
  ctx.strokeStyle = 'rgba(120, 108, 94, 0.11)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 3. Malla vectorial de campo magnético B
  if (showVectors && wires.length > 0) {
    const step = 32;
    for (let x = step / 2; x < width; x += step) {
      for (let y = step / 2; y < height; y += step) {
        const B = calculateMagneticField2D(x, y, wires);
        const mag = Math.hypot(B.x, B.y);
        if (mag < 0.01) continue;

        const angle = Math.atan2(B.y, B.x);
        const length = Math.min(step * 0.75, Math.max(8, Math.log10(mag + 1) * 7.5));
        const strength = Math.min(1, Math.log10(mag + 1) / 3.0);

        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(angle);
        ctx.strokeStyle = `rgba(${Math.floor(35 + 20 * strength)}, ${Math.floor(
          115 + 30 * strength
        )}, ${Math.floor(135 - 20 * strength)}, 0.56)`;
        ctx.fillStyle = ctx.strokeStyle;
        ctx.lineWidth = 1.3;

        ctx.beginPath();
        ctx.moveTo(-length / 2, 0);
        ctx.lineTo(length / 2, 0);
        ctx.stroke();

        const head = Math.max(3, length * 0.28);
        ctx.beginPath();
        ctx.moveTo(length / 2, 0);
        ctx.lineTo(length / 2 - head, -head * 0.55);
        ctx.lineTo(length / 2 - head, head * 0.55);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      }
    }
  }

  // 4. Líneas cerradas de campo magnético B
  if (showLines && wires.length > 0) {
    ctx.strokeStyle = 'rgba(31, 122, 122, 0.62)';
    ctx.lineWidth = 1.6;

    for (const w of wires) {
      const radii = [25, 50, 85, 130, 190, 270];
      for (const r of radii) {
        const points = traceMagneticLine(w.x + r, w.y, 1, wires, width, height, 3, 300);
        if (points.length > 2) {
          ctx.beginPath();
          ctx.moveTo(points[0].x, points[0].y);
          for (let i = 1; i < points.length; i++) {
            ctx.lineTo(points[i].x, points[i].y);
          }
          ctx.stroke();

          if (points.length > 15) {
            const mid = Math.floor(points.length / 2);
            const p1 = points[mid];
            const p2 = points[mid + 1] || points[mid];
            const arrAngle = Math.atan2(p2.y - p1.y, p2.x - p1.x);

            ctx.save();
            ctx.translate(p1.x, p1.y);
            ctx.rotate(arrAngle);
            ctx.fillStyle = '#1F7A7A';
            ctx.beginPath();
            ctx.moveTo(5, 0);
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

  // 5. Curva Amperiana interactiva (∮_C B · dl = μ₀ I_enc)
  if (showAmpereLoop) {
    ctx.save();
    ctx.fillStyle = 'rgba(109, 76, 159, 0.05)';
    ctx.strokeStyle = '#6D4C9F';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.beginPath();
    ctx.arc(ampereLoop.x, ampereLoop.y, ampereLoop.radiusPx, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.setLineDash([]);

    // 8 vectores tangentes dl a lo largo de la curva amperiana
    const tangents = 8;
    for (let k = 0; k < tangents; k++) {
      const th = (2 * Math.PI * k) / tangents;
      const px = ampereLoop.x + ampereLoop.radiusPx * Math.cos(th);
      const py = ampereLoop.y + ampereLoop.radiusPx * Math.sin(th);
      const tx = -Math.sin(th);
      const ty = Math.cos(th);
      const tAngle = Math.atan2(ty, tx);

      ctx.save();
      ctx.translate(px, py);
      ctx.rotate(tAngle);
      ctx.fillStyle = '#6D4C9F';
      ctx.beginPath();
      ctx.moveTo(6, 0);
      ctx.lineTo(-4, -3.5);
      ctx.lineTo(-4, 3.5);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.fillStyle = 'rgba(255, 253, 249, 0.92)';
    ctx.strokeStyle = '#C4B5FD';
    ctx.lineWidth = 1;
    const lbl = `Curva Amperiana C (r = ${(ampereLoop.radiusPx / MAGNETOSTATICS_PIXELS_PER_METER).toFixed(2)} m)`;
    ctx.font = 'bold 10.5px system-ui, sans-serif';
    const lw = ctx.measureText(lbl).width;
    ctx.beginPath();
    ctx.roundRect(ampereLoop.x - lw / 2 - 6, ampereLoop.y - ampereLoop.radiusPx - 24, lw + 12, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#5B3E87';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(lbl, ampereLoop.x, ampereLoop.y - ampereLoop.radiusPx - 15);
    ctx.restore();
  }

  // 6. Conductores (alambres con notación ⊙ / ⊗ y cápsula marfil legible)
  for (const w of wires) {
    const isSelected = w.id === selectedWireId;
    const isOut = w.current > 0;
    const radius = 17;

    ctx.save();
    ctx.shadowColor = isOut ? 'rgba(31, 122, 122, 0.45)' : 'rgba(180, 83, 9, 0.45)';
    ctx.shadowBlur = isSelected ? 18 : 10;

    const grad = ctx.createRadialGradient(w.x - 3, w.y - 3, 2, w.x, w.y, radius);
    if (isOut) {
      grad.addColorStop(0, '#81E6D9');
      grad.addColorStop(0.55, '#1F7A7A');
      grad.addColorStop(1, '#134E4A');
    } else {
      grad.addColorStop(0, '#FDE68A');
      grad.addColorStop(0.55, '#D97706');
      grad.addColorStop(1, '#78350F');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(w.x, w.y, radius, 0, Math.PI * 2);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#231F1C';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    if (isOut) {
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(w.x, w.y, 4.5, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      const s = 6;
      ctx.moveTo(w.x - s, w.y - s);
      ctx.lineTo(w.x + s, w.y + s);
      ctx.moveTo(w.x + s, w.y - s);
      ctx.lineTo(w.x - s, w.y + s);
      ctx.stroke();
    }
    ctx.restore();

    const wireText = `${w.label || 'I'}: ${Math.abs(w.current)} A (${isOut ? '⊙' : '⊗'})`;
    ctx.font = 'bold 10.5px system-ui, sans-serif';
    const tw = ctx.measureText(wireText).width;
    ctx.fillStyle = 'rgba(255, 253, 249, 0.92)';
    ctx.strokeStyle = '#DDD5C8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(w.x - tw / 2 - 5, w.y + radius + 5, tw + 10, 17, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#231F1C';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(wireText, w.x, w.y + radius + 13.5);
  }

  // 7. Brújula / Magnetómetro SI exacto (B = μ₀ I / 2πr)
  const B_si = calculateMagneticFieldSI2D(compass.x, compass.y, wires, MAGNETOSTATICS_PIXELS_PER_METER);
  const B_microTesla = Math.hypot(B_si.x, B_si.y) * 1e6;
  const needleAngle = Math.atan2(B_si.y, B_si.x);

  ctx.save();
  ctx.translate(compass.x, compass.y);
  ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
  ctx.strokeStyle = isDraggingCompass ? '#2D7A64' : '#8C8275';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, 24, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#8C8275';
  ctx.fillRect(-1, -22, 2, 4);
  ctx.fillRect(-1, 18, 2, 4);
  ctx.fillRect(-22, -1, 4, 2);
  ctx.fillRect(18, -1, 4, 2);

  ctx.rotate(needleAngle);
  ctx.fillStyle = '#D9534F';
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(19, 0);
  ctx.lineTo(0, 3.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#94A3B8';
  ctx.beginPath();
  ctx.moveTo(0, -3.5);
  ctx.lineTo(-19, 0);
  ctx.lineTo(0, 3.5);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#231F1C';
  ctx.beginPath();
  ctx.arc(0, 0, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const tagW = 178;
  const tagH = 56;
  const tagX = compass.x + 30 + tagW > width - 8 ? compass.x - tagW - 30 : compass.x + 30;
  const tagY = Math.max(10, compass.y - 26);

  ctx.save();
  ctx.shadowColor = 'rgba(60, 50, 40, 0.12)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  ctx.fillStyle = 'rgba(255, 253, 249, 0.96)';
  ctx.strokeStyle = '#D6CCBE';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.roundRect(tagX, tagY, tagW, tagH, 8);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = viewMode === 'explore' ? '#2D7A64' : '#2B6CB0';
  ctx.font = 'bold 10.5px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(viewMode === 'explore' ? 'BRÚJULA DE EXPLORACIÓN' : 'MAGNETÓMETRO (SI)', tagX + 10, tagY + 16);

  ctx.fillStyle = '#231F1C';
  ctx.font = 'bold 11px monospace';
  if (viewMode === 'explore') {
    const magLevel = B_microTesla > 3.0 ? 'Intenso 🧲' : B_microTesla > 0.8 ? 'Moderado' : 'Débil';
    ctx.fillText(`Intensidad: ${magLevel}`, tagX + 10, tagY + 33);
    ctx.fillText(`Giro: ${((needleAngle * 180) / Math.PI).toFixed(0)}°`, tagX + 10, tagY + 48);
  } else {
    ctx.fillText(`|B|: ${B_microTesla.toFixed(2)} µT`, tagX + 10, tagY + 33);
    ctx.fillText(`θ:   ${((needleAngle * 180) / Math.PI).toFixed(1)}°`, tagX + 10, tagY + 48);
  }

  // 8. Regla de escala métrica SI explícita (1.00 m = 100 px)
  if (width > 260) {
    const barPx = MAGNETOSTATICS_PIXELS_PER_METER;
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
