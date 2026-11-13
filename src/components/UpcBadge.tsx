import React from 'react';

interface UpcBadgeProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
}

export const UpcLogo: React.FC<{ className?: string }> = ({ className = 'w-8 h-8' }) => {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Escudo Universidad Popular del Cesar"
    >
      <defs>
        <linearGradient id="upcGreenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10b981" />
          <stop offset="50%" stopColor="#059669" />
          <stop offset="100%" stopColor="#047857" />
        </linearGradient>
        <linearGradient id="upcGoldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="50%" stopColor="#eab308" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
        <linearGradient id="upcShieldGrad" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#0f172a" />
          <stop offset="100%" stopColor="#022c22" />
        </linearGradient>
        <filter id="upcGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* Outer heraldic shield */}
      <path
        d="M 50 6 C 78 6 92 14 92 38 C 92 68 50 94 50 94 C 50 94 8 68 8 38 C 8 14 22 6 50 6 Z"
        fill="url(#upcShieldGrad)"
        stroke="url(#upcGoldGrad)"
        strokeWidth="3.5"
        filter="url(#upcGlow)"
      />

      {/* Institutional green banner striping */}
      <path
        d="M 20 28 C 35 22 65 22 80 28 L 78 48 C 65 42 35 42 22 48 Z"
        fill="url(#upcGreenGrad)"
        opacity="0.9"
      />

      {/* Book of Science & Education */}
      <path
        d="M 50 56 C 42 50 30 52 24 55 L 24 70 C 30 67 42 66 50 71 C 58 66 70 67 76 70 L 76 55 C 70 52 58 50 50 56 Z"
        fill="#f8fafc"
        stroke="url(#upcGoldGrad)"
        strokeWidth="1.5"
      />
      <line x1="50" y1="56" x2="50" y2="71" stroke="#047857" strokeWidth="2" />

      {/* Torch of Knowledge / Atom flame */}
      <circle cx="50" cy="36" r="6" fill="url(#upcGoldGrad)" />
      <path
        d="M 50 24 C 47 30 45 33 50 38 C 55 33 53 30 50 24 Z"
        fill="#fbbf24"
      />

      {/* Golden Star of Academic Accreditation */}
      <path
        d="M 50 12 L 52 17 L 57 17 L 53 20 L 55 25 L 50 22 L 45 25 L 47 20 L 43 17 L 48 17 Z"
        fill="url(#upcGoldGrad)"
      />
    </svg>
  );
};

export const UpcBadge: React.FC<UpcBadgeProps> = ({
  className = '',
  size = 'md',
  showText = true
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-14 h-14',
    xl: 'w-20 h-20'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className="relative flex-shrink-0">
        <UpcLogo className={sizeMap[size]} />
      </div>

      {showText && (
        <div className="flex flex-col">
          <div className="flex items-center gap-2">
            <span className="font-extrabold tracking-wide text-white text-xs sm:text-sm font-sans">
              UNIVERSIDAD POPULAR DEL CESAR
            </span>
            <span className="hidden sm:inline-block text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              UPC
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/90 font-medium tracking-tight">
            Facultad de Ingenierías y Tecnologías • Departamento de Física
          </span>
        </div>
      )}
    </div>
  );
};
