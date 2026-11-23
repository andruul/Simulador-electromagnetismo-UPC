import React from 'react';

interface NoticeToastProps {
  message: string | null;
  onDismiss: () => void;
}

/** Visible, student-friendly error notice (announced to screen readers as an alert). */
export const NoticeToast: React.FC<NoticeToastProps> = ({ message, onDismiss }) => {
  if (!message) return null;

  return (
    <div
      role="alert"
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 max-w-lg flex items-start gap-3 rounded-lg border border-rose-400/40 bg-white/95 backdrop-blur-md px-4 py-3 text-sm text-rose-700 shadow-xl"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-[#6B6560] hover:text-[#2D2A26]"
        aria-label="Cerrar aviso"
      >
        ✕
      </button>
    </div>
  );
};
