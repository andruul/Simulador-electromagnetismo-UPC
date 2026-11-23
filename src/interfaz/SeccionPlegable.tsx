import React from 'react';
import { ChevronDown } from 'lucide-react';

export interface CollapsibleSectionProps {
  title: string;
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  subtitle?: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  className?: string;
  headerClassName?: string;
}

/**
 * Clean glassmorphism collapsible container that prevents UI information overload.
 * Built according to the Antigravity UI/UX Standard for the UPC electromagnetism lab.
 */
export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  badge,
  subtitle,
  isOpen,
  onToggle,
  children,
  className = '',
  headerClassName = ''
}) => {
  return (
    <div
      className={`rounded-xl border border-[#D5CEC6] bg-white/80 backdrop-blur-md overflow-hidden transition-all duration-200 shadow-sm ${className}`}
    >
      <button
        type="button"
        onClick={onToggle}
        className={`w-full px-3 py-2.5 flex items-center justify-between text-left cursor-pointer hover:bg-[#EDE8DF]/60 transition-colors select-none group ${headerClassName}`}
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 pr-2">
          {icon && (
            <div className="flex-shrink-0 text-[#6B6560] group-hover:text-[#5B9E8A] transition-colors">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <span className="text-[11px] font-bold text-[#2D2A26] group-hover:text-[#1A1816] tracking-wide block truncate">
              {title}
            </span>
            {subtitle && !isOpen && (
              <span className="text-[10px] text-[#6B6560] block truncate font-normal">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {badge}
          <div
            className={`w-5 h-5 rounded flex items-center justify-center text-[#6B6560] group-hover:text-[#2D2A26] bg-[#EDE8DF]/60 transition-transform duration-200 ${
              isOpen ? 'rotate-0' : '-rotate-90'
            }`}
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </button>

      {isOpen && (
        <div className="px-3 pb-3 pt-1 border-t border-[#E0D8CF]/60 space-y-2.5 animate-fadeIn">
          {children}
        </div>
      )}
    </div>
  );
};

export default CollapsibleSection;
