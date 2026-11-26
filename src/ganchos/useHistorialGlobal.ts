import { useCallback, useEffect, useRef, useState } from 'react';

export interface HistoryController<T> {
  canUndo: boolean;
  canRedo: boolean;
  undo: () => T | null;
  redo: () => T | null;
  commitNow: (snapshot: T) => void;
}

const MAX_HISTORY = 40;

/**
 * Historial global de Deshacer / Rehacer para todas las salas del simulador.
 * Registra instantáneas del estado con un breve debounce (320 ms) para agrupar
 * movimientos continuos de deslizadores en un solo paso deshacible.
 */
export function useGlobalHistory<T>(currentState: T): HistoryController<T> {
  const [past, setPast] = useState<string[]>([]);
  const [future, setFuture] = useState<string[]>([]);

  const serializedCurrent = JSON.stringify(currentState);
  const lastCommittedRef = useRef<string>(serializedCurrent);
  const isRestoringRef = useRef<boolean>(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isRestoringRef.current) {
      isRestoringRef.current = false;
      lastCommittedRef.current = serializedCurrent;
      return;
    }

    if (serializedCurrent === lastCommittedRef.current) return;

    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }

    const previousSnapshot = lastCommittedRef.current;
    timerRef.current = window.setTimeout(() => {
      setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), previousSnapshot]);
      setFuture([]);
      lastCommittedRef.current = serializedCurrent;
      timerRef.current = null;
    }, 320);

    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [serializedCurrent]);

  const commitNow = useCallback((snapshot: T) => {
    const nextStr = JSON.stringify(snapshot);
    if (nextStr === lastCommittedRef.current) return;
    const prevStr = lastCommittedRef.current;
    setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), prevStr]);
    setFuture([]);
    lastCommittedRef.current = nextStr;
  }, []);

  const undo = useCallback((): T | null => {
    if (past.length === 0) return null;
    const previousStr = past[past.length - 1];
    const currentStr = lastCommittedRef.current;

    setPast((prev) => prev.slice(0, -1));
    setFuture((prev) => [currentStr, ...prev.slice(0, MAX_HISTORY - 1)]);
    isRestoringRef.current = true;
    lastCommittedRef.current = previousStr;

    try {
      return JSON.parse(previousStr) as T;
    } catch {
      return null;
    }
  }, [past]);

  const redo = useCallback((): T | null => {
    if (future.length === 0) return null;
    const nextStr = future[0];
    const currentStr = lastCommittedRef.current;

    setFuture((prev) => prev.slice(1));
    setPast((prev) => [...prev.slice(-(MAX_HISTORY - 1)), currentStr]);
    isRestoringRef.current = true;
    lastCommittedRef.current = nextStr;

    try {
      return JSON.parse(nextStr) as T;
    } catch {
      return null;
    }
  }, [future]);

  return {
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    undo,
    redo,
    commitNow
  };
}
