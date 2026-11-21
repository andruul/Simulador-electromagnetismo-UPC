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
      className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 max-w-lg flex items-start gap-3 rounded-lg border border-rose-500/40 bg-slate-900/95 px-4 py-3 text-sm text-rose-200 shadow-xl"
    >
      <span className="flex-1">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-slate-400 hover:text-white"
        aria-label="Cerrar aviso"
      >
        ✕
      </button>
    </div>
  );
};
