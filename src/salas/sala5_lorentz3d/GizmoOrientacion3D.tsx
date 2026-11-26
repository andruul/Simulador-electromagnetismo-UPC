import React from 'react';
import * as THREE from 'three';

export type CameraPresetView = 'iso' | 'x' | 'y' | 'z';

interface GizmoOrientacion3DProps {
  /** Cuaternión inverso de la cámara [x, y, z, w] para proyectar los ejes en tiempo real */
  orientation: [number, number, number, number];
  isStudio: boolean;
  onSnapView: (view: CameraPresetView) => void;
}

interface AxisDef {
  id: 'x' | 'y' | 'z';
  label: string;
  unitVec: string;
  vec: THREE.Vector3;
  color: string;
}

const AXES: AxisDef[] = [
  { id: 'x', label: 'X', unitVec: 'î', vec: new THREE.Vector3(1, 0, 0), color: '#EF4444' },
  { id: 'y', label: 'Y', unitVec: 'ĵ', vec: new THREE.Vector3(0, 1, 0), color: '#22C55E' },
  { id: 'z', label: 'Z', unitVec: 'k̂', vec: new THREE.Vector3(0, 0, 1), color: '#3B82F6' }
];

/**
 * Cruz de orientación 3D estilo Unity / Unreal Engine.
 * Muestra en vivo hacia dónde apunta la cámara con ejes principales (X, Y, Z)
 * y versores unitarios (î, ĵ, k̂), permitiendo hacer clic para alinear la vista.
 */
export const GizmoOrientacion3D: React.FC<GizmoOrientacion3DProps> = ({
  orientation,
  isStudio,
  onSnapView
}) => {
  const invQuat = new THREE.Quaternion(
    orientation[0],
    orientation[1],
    orientation[2],
    orientation[3]
  );

  const center = 44;
  const radius = 26;

  const projected = AXES.map((axis) => {
    const v = axis.vec.clone().applyQuaternion(invQuat);
    return {
      ...axis,
      px: center + v.x * radius,
      py: center - v.y * radius,
      depth: v.z
    };
  }).sort((a, b) => a.depth - b.depth);

  return (
    <div
      className={`flex flex-col items-center rounded-xl border backdrop-blur-md shadow-md select-none px-2 py-1.5 transition-colors ${
        isStudio
          ? 'bg-[#0F1624]/85 border-white/15 text-slate-200'
          : 'bg-white/90 border-[#D5CEC6] text-[#231F1C]'
      }`}
      title="Gizmo de Orientación 3D (X, Y, Z / î, ĵ, k̂). Haz clic en un eje para alinear la cámara."
      onPointerDown={(e) => e.stopPropagation()}
    >
      <svg width="88" height="88" viewBox="0 0 88 88" className="overflow-visible">
        {/* Círculo de referencia sutil */}
        <circle
          cx={center}
          cy={center}
          r={radius + 9}
          fill="none"
          stroke={isStudio ? 'rgba(255,255,255,0.12)' : 'rgba(92,85,78,0.18)'}
          strokeDasharray="2 3"
        />
        {/* Origen */}
        <circle
          cx={center}
          cy={center}
          r={2.5}
          fill={isStudio ? '#CBD5E1' : '#5C554E'}
        />

        {projected.map((axis) => {
          const isBack = axis.depth < -0.15;
          return (
            <g
              key={axis.id}
              onClick={() => onSnapView(axis.id)}
              className="cursor-pointer group"
              opacity={isBack ? 0.52 : 1}
            >
              <line
                x1={center}
                y1={center}
                x2={axis.px}
                y2={axis.py}
                stroke={axis.color}
                strokeWidth={isBack ? 1.5 : 2.2}
                strokeLinecap="round"
              />
              <circle
                cx={axis.px}
                cy={axis.py}
                r={8.5}
                fill={axis.color}
                stroke={isStudio ? '#0B0F17' : '#FFFFFF'}
                strokeWidth="1.2"
              />
              <text
                x={axis.px}
                y={axis.py + 3}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight="700"
                fill="#FFFFFF"
                style={{ pointerEvents: 'none' }}
              >
                {axis.label}
              </text>
              {/* Versor unitario (î, ĵ, k̂) ligeramente más pequeño */}
              <text
                x={axis.px + (axis.px >= center ? 11.5 : -11.5)}
                y={axis.py + 2.5}
                textAnchor="middle"
                fontSize="7.5"
                fontWeight="600"
                fill={axis.color}
                style={{ pointerEvents: 'none', fontFamily: 'ui-monospace, monospace' }}
              >
                {axis.unitVec}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex items-center gap-1 -mt-1">
        <span className="text-[8.5px] font-mono opacity-70">î·ĵ·k̂</span>
        <button
          onClick={() => onSnapView('iso')}
          className={`px-1.5 py-0.5 rounded text-[8.5px] font-semibold border cursor-pointer transition-colors ${
            isStudio
              ? 'bg-white/10 hover:bg-white/20 border-white/15 text-slate-200'
              : 'bg-[#FAF7F2] hover:bg-[#EDE8DF] border-[#D5CEC6] text-[#4A4540]'
          }`}
          title="Restaurar vista 3D isométrica"
        >
          Iso
        </button>
      </div>
    </div>
  );
};
