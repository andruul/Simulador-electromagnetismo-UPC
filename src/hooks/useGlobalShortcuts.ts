import { useEffect } from 'react';

export interface GlobalShortcutHandlers {
  onToggleSearch: () => void; // Ctrl+K / Cmd+K
  onToggleTheory: () => void; // F1
  onTogglePlay: () => void; // Space
  onReset: () => void; // R
  onToggleViewMode: () => void; // M
  onToggleZenMode?: () => void; // Z (Modo Enfoque / Lienzo Limpio)
}

function isTypingTarget(target: HTMLElement | null): boolean {
  return (
    !!target &&
    (target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable)
  );
}

/**
 * Desktop keyboard shortcuts:
 * - [Space]: Play/Pause
 * - [R]: Reset current room
 * - [M]: Toggle Explore/Measurement mode
 * - [Z]: Toggle Zen / Clean Canvas Focus mode
 * - [F1]: Theory guide
 * - [Ctrl+K]: Search topics
 * Ignored while the student is typing in an input field.
 */
export function useGlobalShortcuts(handlers: GlobalShortcutHandlers): void {
  const {
    onToggleSearch,
    onToggleTheory,
    onTogglePlay,
    onReset,
    onToggleViewMode,
    onToggleZenMode
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onToggleSearch();
      } else if (e.key === 'F1') {
        e.preventDefault();
        onToggleTheory();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        onReset();
      } else if (e.key.toLowerCase() === 'm') {
        e.preventDefault();
        onToggleViewMode();
      } else if (e.key.toLowerCase() === 'z' && onToggleZenMode) {
        e.preventDefault();
        onToggleZenMode();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    onToggleSearch,
    onToggleTheory,
    onTogglePlay,
    onReset,
    onToggleViewMode,
    onToggleZenMode
  ]);
}
