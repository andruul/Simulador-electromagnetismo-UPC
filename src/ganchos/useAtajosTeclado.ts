import { useEffect } from 'react';

export interface GlobalShortcutHandlers {
  onToggleSearch: () => void; // Ctrl+K / Cmd+K
  onToggleTheory: () => void; // F1
  onTogglePlay: () => void; // Space
  onReset: () => void; // R
  onToggleViewMode: () => void; // M
  onToggleZenMode?: () => void; // Z (Modo Enfoque / Lienzo Limpio)
  onUndo?: () => void; // Ctrl+Z / Cmd+Z
  onRedo?: () => void; // Ctrl+Y / Ctrl+Shift+Z
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
    onToggleZenMode,
    onUndo,
    onRedo
  } = handlers;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target as HTMLElement | null)) return;

      const key = e.key.toLowerCase();
      const hasMod = e.ctrlKey || e.metaKey;

      if (hasMod && key === 'k') {
        e.preventDefault();
        onToggleSearch();
      } else if (hasMod && key === 'z' && !e.shiftKey && onUndo) {
        e.preventDefault();
        onUndo();
      } else if (hasMod && (key === 'y' || (key === 'z' && e.shiftKey)) && onRedo) {
        e.preventDefault();
        onRedo();
      } else if (e.key === 'F1') {
        e.preventDefault();
        onToggleTheory();
      } else if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (!hasMod && key === 'r') {
        e.preventDefault();
        onReset();
      } else if (!hasMod && key === 'm') {
        e.preventDefault();
        onToggleViewMode();
      } else if (!hasMod && key === 'z' && onToggleZenMode) {
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
    onToggleZenMode,
    onUndo,
    onRedo
  ]);
}
