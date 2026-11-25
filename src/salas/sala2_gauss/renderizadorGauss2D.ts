import type { GaussianSurface, GaussCalculation, GaussSettings } from '../../tipos';
import { calculateElectricField2D, type ChargeSI } from '../../fisica/gauss';

export interface Gauss2DScene {
  width: number;
  height: number;
  pixelsPerMeter: number;
  originX: number;
  originY: number;
  surface: GaussianSurface;
  charges: ChargeSI[];
  settings: GaussSettings;
  gaussResult: GaussCalculation;
  selectedChargeId: string | null;
  toPixels: (mx: number, my: number) => { px: number; py: number };
  toMeters: (px: number, py: number) => { mx: number; my: number };
}

/**
 * Renderizador puro Canvas 2D de la Sala 2 (Ley de Gauss en 2D).
 */
export function drawGauss2DScene(ctx: CanvasRenderingContext2D, scene: Gauss2DScene): void {
  const {
    width: w,
    height: h,
    pixelsPerMeter,
    originX,
    originY,
    surface,
    charges,
    settings,
    gaussResult,
    selectedChargeId,
    toPixels,
    toMeters
  } = scene;

  const bgGrad = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h));
  bgGrad.addColorStop(0, '#FAF7F2');
  bgGrad.addColorStop(1, '#F2ECE1');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  ctx.strokeStyle = 'rgba(120, 108, 94, 0.10)';
  ctx.lineWidth = 1;
  const gridSpacing = pixelsPerMeter * 0.5;
  const startX = originX % gridSpacing;
  const startY = originY % gridSpacing;

  ctx.beginPath();
  for (let x = startX; x < w; x += gridSpacing) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = startY; y < h; y += gridSpacing) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(140, 128, 114, 0.25)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(originX, 0);
  ctx.lineTo(originX, h);
  ctx.moveTo(0, originY);
  ctx.lineTo(w, originY);
  ctx.stroke();

  if (settings.showVectorField && charges.length > 0) {
    const step = 45;
    for (let px = 25; px < w; px += step) {
      for (let py = 25; py < h; py += step) {
        const { mx, my } = toMeters(px, py);
        const E = calculateElectricField2D({ x: mx, y: my }, charges);
        const mag = Math.hypot(E.x, E.y);
        if (mag > 1e-5) {
          const angle = Math.atan2(E.y, E.x);
          const length = Math.min(24, Math.max(8, Math.log10(mag + 1) * 6));
          const alpha = Math.min(0.60, Math.max(0.16, Math.log10(mag + 1) * 0.15));
          ctx.strokeStyle = `rgba(58, 124, 165, ${alpha})`;
          ctx.fillStyle = `rgba(58, 124, 165, ${alpha})`;
          ctx.lineWidth = 1.2;

          const endX = px + Math.cos(angle) * length;
          const endY = py + Math.sin(angle) * length;

          ctx.beginPath();
          ctx.moveTo(px, py);
          ctx.lineTo(endX, endY);
          ctx.stroke();

          const arrowSize = 3.2;
          ctx.beginPath();
          ctx.moveTo(endX, endY);
          ctx.lineTo(
            endX - arrowSize * Math.cos(angle - Math.PI / 6),
            endY - arrowSize * Math.sin(angle - Math.PI / 6)
          );
          ctx.lineTo(
            endX - arrowSize * Math.cos(angle + Math.PI / 6),
            endY - arrowSize * Math.sin(angle + Math.PI / 6)
          );
          ctx.closePath();
          ctx.fill();
        }
      }
    }
  }

  const { px: sPx, py: sPy } = toPixels(surface.cx, surface.cy);
  ctx.save();
  if (surface.shape === 'circle') {
    const rPx = surface.radius * pixelsPerMeter;
    ctx.beginPath();
    ctx.arc(sPx, sPy, rPx, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(45, 122, 100, 0.05)';
    ctx.fill();
    ctx.strokeStyle = '#2D7A64';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else {
    const wPx = surface.width * pixelsPerMeter;
    const hPx = surface.height * pixelsPerMeter;
    ctx.beginPath();
    ctx.rect(sPx - wPx / 2, sPy - hPx / 2, wPx, hPx);
    ctx.fillStyle = 'rgba(45, 122, 100, 0.05)';
    ctx.fill();
    ctx.strokeStyle = '#2D7A64';
    ctx.lineWidth = 2.4;
    ctx.setLineDash([8, 6]);
    ctx.stroke();
    ctx.setLineDash([]);
  }
  ctx.restore();

  if (gaussResult.elements && gaussResult.elements.length > 0) {
    for (const el of gaussResult.elements) {
      const { px: elPx, py: elPy } = toPixels(el.x, el.y);
      const fluxDensity = el.fluxDensity;
      let segColor = 'rgba(140, 128, 114, 0.5)';
      if (fluxDensity > 10) segColor = '#2D7A64';
      else if (fluxDensity < -10) segColor = '#D9534F';

      ctx.fillStyle = segColor;
      ctx.beginPath();
      ctx.arc(elPx, elPy, 2.6, 0, 2 * Math.PI);
      ctx.fill();

      if (settings.showNormalVectors) {
        const nLen = 22;
        const endNx = elPx + el.nx * nLen;
        const endNy = elPy + el.ny * nLen;

        ctx.strokeStyle = '#C27803';
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        ctx.moveTo(elPx, elPy);
        ctx.lineTo(endNx, endNy);
        ctx.stroke();

        const nAngle = Math.atan2(el.ny, el.nx);
        const aSize = 3.5;
        ctx.fillStyle = '#C27803';
        ctx.beginPath();
        ctx.moveTo(endNx, endNy);
        ctx.lineTo(
          endNx - aSize * Math.cos(nAngle - Math.PI / 6),
          endNy - aSize * Math.sin(nAngle - Math.PI / 6)
        );
        ctx.lineTo(
          endNx - aSize * Math.cos(nAngle + Math.PI / 6),
          endNy - aSize * Math.sin(nAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }

      const eMag = Math.hypot(el.ex, el.ey);
      if (eMag > 1e-4) {
        const eAngle = Math.atan2(el.ey, el.ex);
        const eLen = Math.min(30, Math.max(10, Math.log10(eMag + 1) * 7));
        const endEx = elPx + Math.cos(eAngle) * eLen;
        const endEy = elPy + Math.sin(eAngle) * eLen;

        ctx.strokeStyle = '#2B6CB0';
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(elPx, elPy);
        ctx.lineTo(endEx, endEy);
        ctx.stroke();

        const aSize = 3.5;
        ctx.fillStyle = '#2B6CB0';
        ctx.beginPath();
        ctx.moveTo(endEx, endEy);
        ctx.lineTo(
          endEx - aSize * Math.cos(eAngle - Math.PI / 6),
          endEy - aSize * Math.sin(eAngle - Math.PI / 6)
        );
        ctx.lineTo(
          endEx - aSize * Math.cos(eAngle + Math.PI / 6),
          endEy - aSize * Math.sin(eAngle + Math.PI / 6)
        );
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  for (const c of charges) {
    const { px, py } = toPixels(c.x, c.y);
    const isPositive = c.charge > 0;
    const isSelected = c.id === selectedChargeId;

    const grad = ctx.createRadialGradient(px, py, 4, px, py, 24);
    if (isPositive) {
      grad.addColorStop(0, 'rgba(217, 91, 95, 0.85)');
      grad.addColorStop(0.5, 'rgba(217, 91, 95, 0.25)');
      grad.addColorStop(1, 'rgba(217, 91, 95, 0)');
    } else {
      grad.addColorStop(0, 'rgba(62, 130, 170, 0.85)');
      grad.addColorStop(0.5, 'rgba(62, 130, 170, 0.25)');
      grad.addColorStop(1, 'rgba(62, 130, 170, 0)');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(px, py, 24, 0, 2 * Math.PI);
    ctx.fill();

    ctx.fillStyle = isPositive ? '#D95B5F' : '#3E82AA';
    ctx.beginPath();
    ctx.arc(px, py, 14, 0, 2 * Math.PI);
    ctx.fill();

    if (isSelected) {
      ctx.strokeStyle = '#231F1C';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 15px system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isPositive ? '+' : '−', px, py);

    const qValStr = `${(c.charge * 1e9).toFixed(1)} nC`;
    ctx.font = 'bold 10px monospace';
    const tw = ctx.measureText(qValStr).width;
    ctx.fillStyle = 'rgba(255, 253, 249, 0.92)';
    ctx.strokeStyle = '#DDD5C8';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(px - tw / 2 - 5, py + 15, tw + 10, 15, 4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#231F1C';
    ctx.fillText(qValStr, px, py + 22.5);
  }

  ctx.save();
  ctx.fillStyle = 'rgba(255, 253, 249, 0.94)';
  ctx.strokeStyle = '#D6CCBE';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(14, h - 80, 200, 66, 10);
  ctx.fill();
  ctx.stroke();

  ctx.font = 'bold 10px system-ui, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';

  ctx.fillStyle = '#C27803';
  ctx.fillRect(24, h - 64, 12, 3);
  ctx.fillStyle = '#231F1C';
  ctx.fillText('Vector normal exterior n̂', 42, h - 63);

  ctx.fillStyle = '#2B6CB0';
  ctx.fillRect(24, h - 46, 12, 3);
  ctx.fillStyle = '#231F1C';
  ctx.fillText('Campo Eléctrico E', 42, h - 45);

  ctx.fillStyle = '#2D7A64';
  ctx.beginPath();
  ctx.arc(30, h - 28, 4, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = '#231F1C';
  ctx.fillText('Elemento de superficie dA', 42, h - 28);
  ctx.restore();
}
