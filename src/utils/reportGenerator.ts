import type { SimulationMode, ViewMode } from '../types';

export interface ReportData {
  mode: SimulationMode;
  viewMode: ViewMode;
  roomName: string;
  keyFormula: string;
  parameters: Record<string, string | number>;
  readings: Record<string, string | number>;
}

const ROOM_NAMES: Record<SimulationMode, { title: string; unit: string; formula: string }> = {
  electrostatics: {
    title: 'Sala 1 • Electrostática 2D y Ley de Coulomb',
    unit: 'Unidad 1',
    formula: 'F = (1 / 4πε₀) · (|q₁ · q₂| / r²)  |  E = -∇V'
  },
  gauss: {
    title: 'Sala 2 • Ley de Gauss y Flujo Eléctrico Superficial',
    unit: 'Unidad 2',
    formula: 'Φ_E = ∮ E⃗ · dA⃗ = Q_enc / ε₀'
  },
  capacitor: {
    title: 'Sala 3 • Capacitancia y Dieléctricos (PhET)',
    unit: 'Unidad 3',
    formula: 'C = κ · ε₀ · (A / d)  |  Q = C · V  |  U = ½ C V²'
  },
  magnetostatics: {
    title: 'Sala 4 • Magnetostática y Ley de Biot-Savart',
    unit: 'Unidad 4 / 6',
    formula: 'B = (μ₀ · I) / (2π · r)  |  ∮ B⃗ · dl⃗ = μ₀ · I_enc'
  },
  lorentz3d: {
    title: 'Sala 5 • Dinámica de Partículas 3D y Fuerza de Lorentz',
    unit: 'Unidad 5',
    formula: 'F⃗ = q · (E⃗ + v⃗ × B⃗)  |  r_L = (m · v_⊥) / (|q| · B)'
  },
  faraday: {
    title: 'Sala 6 • Ley de Inducción de Faraday y Ley de Lenz',
    unit: 'Unidad 7',
    formula: 'ε = -N · (dΦ_B / dt)  |  P = I² · R'
  },
  theory: {
    title: 'Fundamentos Teóricos y Leyes de Maxwell',
    unit: 'Unidad 8',
    formula: 'Ecuaciones de Maxwell Unificadas'
  },
  welcome: {
    title: 'Portal de Laboratorio Virtual UPC',
    unit: 'General',
    formula: 'Física Electromagnética'
  }
};

/** Outcome of an export operation; `message` is safe to show to the student. */
export type ExportResult = { ok: true } | { ok: false; message: string };

/**
 * Captures the current simulation canvas and composites an institutional
 * lab evidence card with UPC branding, timestamp, and metadata.
 */
export async function generateLabEvidenceReport(
  mode: SimulationMode,
  viewMode: ViewMode
): Promise<ExportResult> {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    return {
      ok: false,
      message: 'No hay ningún laboratorio visible para capturar. Entre a una sala e inténtelo de nuevo.'
    };
  }

  const roomInfo = ROOM_NAMES[mode] || ROOM_NAMES.electrostatics;
  const now = new Date();
  const timestampStr = now.toLocaleString('es-CO', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  const fileDateStr = now.toISOString().replace(/[:.]/g, '-').slice(0, 19);

  // Create composite offscreen canvas
  const headerHeight = 90;
  const footerHeight = 60;
  const compW = Math.max(canvas.width, 1000);
  const compH = canvas.height + headerHeight + footerHeight;

  const compCanvas = document.createElement('canvas');
  compCanvas.width = compW;
  compCanvas.height = compH;
  const ctx = compCanvas.getContext('2d');
  if (!ctx) {
    return { ok: false, message: 'Este equipo no permite generar la imagen de evidencia.' };
  }

  // Background
  ctx.fillStyle = '#0B0F17';
  ctx.fillRect(0, 0, compW, compH);

  // Header Banner
  const headerGrad = ctx.createLinearGradient(0, 0, compW, 0);
  headerGrad.addColorStop(0, '#064e3b'); // Emerald dark
  headerGrad.addColorStop(0.5, '#0f172a'); // Slate dark
  headerGrad.addColorStop(1, '#1e1b4b'); // Indigo dark
  ctx.fillStyle = headerGrad;
  ctx.fillRect(0, 0, compW, headerHeight);

  // Institutional Title
  ctx.fillStyle = '#10B981'; // UPC Emerald
  ctx.font = 'bold 15px system-ui, sans-serif';
  ctx.fillText('UNIVERSIDAD POPULAR DEL CESAR • DEPARTAMENTO DE FÍSICA', 24, 28);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 18px system-ui, sans-serif';
  ctx.fillText(`FICHA DE LABORATORIO: ${roomInfo.title.toUpperCase()}`, 24, 54);

  // Metadata subline
  ctx.fillStyle = '#94A3B8';
  ctx.font = '12px monospace';
  const modeLabel = viewMode === 'explore' ? 'Modo Exploración (Básico)' : 'Modo Medición Cuantitativa (SI)';
  ctx.fillText(`Fecha: ${timestampStr}  |  Régimen: ${modeLabel}  |  Ecuación: ${roomInfo.formula}`, 24, 76);

  // Border between header and canvas
  ctx.strokeStyle = '#10B981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, headerHeight);
  ctx.lineTo(compW, headerHeight);
  ctx.stroke();

  // Draw active canvas content centered
  const offsetX = (compW - canvas.width) / 2;
  ctx.drawImage(canvas, offsetX, headerHeight);

  // Footer Banner
  const footerY = headerHeight + canvas.height;
  ctx.fillStyle = '#111827';
  ctx.fillRect(0, footerY, compW, footerHeight);

  ctx.strokeStyle = '#1F2937';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, footerY);
  ctx.lineTo(compW, footerY);
  ctx.stroke();

  // Footer text
  ctx.fillStyle = '#A7F3D0';
  ctx.font = 'bold 12px system-ui, sans-serif';
  ctx.fillText('Simulador de Electromagnetismo UPC • Edición de Laboratorio de Escritorio', 24, footerY + 26);

  ctx.fillStyle = '#94A3B8';
  ctx.font = '11px system-ui, sans-serif';
  ctx.fillText(
    'Evidencia válida para adjuntar en informe formal de prácticas de física electromagnética.',
    24,
    footerY + 45
  );

  // Integrity stamp
  const stampCode = `UPC-FIS-${mode.toUpperCase().slice(0, 4)}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
  ctx.textAlign = 'right';
  ctx.fillStyle = '#38BDF8';
  ctx.font = 'bold 12px monospace';
  ctx.fillText(`Código de Validación: ${stampCode}`, compW - 24, footerY + 28);
  ctx.textAlign = 'left';

  // Trigger download of PNG evidence image
  try {
    const dataUrl = compCanvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `Evidencia_UPC_${mode}_${fileDateStr}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch {
    return { ok: false, message: 'No se pudo exportar la imagen de evidencia (PNG).' };
  }

  // Generate accompanying text report slip for student
  try {
    const textReport = `====================================================================
UNIVERSIDAD POPULAR DEL CESAR - FACULTAD DE INGENIERÍAS Y CIENCIAS
DEPARTAMENTO DE CIENCIAS BÁSICAS Y FÍSICA
LABORATORIO VIRTUAL DE ELECTROMAGNETISMO (VERSIÓN ESCRITORIO v2.0)
====================================================================

PRÁCTICA: ${roomInfo.title}
UNIDAD TEMÁTICA: ${roomInfo.unit}
FECHA Y HORA DE REGISTRO: ${timestampStr}
MODALIDAD: ${viewMode === 'explore' ? 'Modo Exploración (Conceptos Cualitativos)' : 'Modo Medición (Precisión Numérica SI)'}
FORMULACIÓN MATEMÁTICA: ${roomInfo.formula}

--------------------------------------------------------------------
INSTRUCCIONES PARA EL ESTUDIANTE:
1. Adjunte el archivo de imagen "Evidencia_UPC_${mode}_${fileDateStr}.png" en su informe final de laboratorio.
2. Registre en la sección de análisis cuantitativo la relación entre las variables manipuladas y los resultados observados.
3. Compare los valores simulados con el cálculo teórico analítico.

NOTAS Y OBSERVACIONES DEL EXPERIMENTO:
- Experimento ejecutado con el motor físico computacional de precisión.
- Trazador numérico: Boris Pusher (3D) / RK4 (Campo) / Cuadratura Gaussiana.
- Código de comprobación: ${stampCode}
====================================================================
`;

    const blob = new Blob([textReport], { type: 'text/plain;charset=utf-8' });
    const textUrl = URL.createObjectURL(blob);
    const textLink = document.createElement('a');
    textLink.href = textUrl;
    textLink.download = `Ficha_Informe_UPC_${mode}_${fileDateStr}.txt`;
    document.body.appendChild(textLink);
    textLink.click();
    document.body.removeChild(textLink);
    URL.revokeObjectURL(textUrl);
  } catch {
    return {
      ok: false,
      message: 'La imagen se guardó, pero no se pudo exportar la ficha de texto (.txt).'
    };
  }

  return { ok: true };
}

/**
 * Downloads the active simulation canvas as a plain PNG screenshot.
 */
export function captureCanvasScreenshot(mode: SimulationMode): ExportResult {
  const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
  if (!canvas) {
    return { ok: false, message: 'No hay ningún laboratorio visible para capturar.' };
  }

  try {
    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `electro-sim-upc-${mode}-${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { ok: true };
  } catch {
    return { ok: false, message: 'No se pudo guardar la captura de pantalla.' };
  }
}
