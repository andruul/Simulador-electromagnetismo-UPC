import { useEffect, useRef, useState } from 'react';

/**
 * Applies one-click presets requested by the parent (guide panel or search modal).
 *
 * - `apply` runs while rendering (the React-recommended way to adjust state in
 *   response to a changed prop) instead of inside an effect, which would trigger a
 *   cascading re-render. It may only update the component's OWN state.
 * - `commit` (optional) runs in an effect once the preset has been committed. Use it
 *   for updates that belong to the parent (e.g. a shared `setSettings`).
 * - Afterwards the parent is notified through `onPresetHandled`, so the same preset
 *   can be requested again.
 */
export function usePresetRequest(
  presetRequest: string | null | undefined,
  onPresetHandled: (() => void) | undefined,
  apply: (preset: string) => void,
  commit?: (preset: string) => void
): void {
  const [appliedPreset, setAppliedPreset] = useState<string | null>(null);
  const requested = presetRequest ?? null;

  if (requested !== appliedPreset) {
    setAppliedPreset(requested);
    if (requested) apply(requested);
  }

  // Latest callbacks, so the effect below only re-runs when the request changes
  const callbacks = useRef({ onPresetHandled, commit });
  useEffect(() => {
    callbacks.current = { onPresetHandled, commit };
  });

  useEffect(() => {
    if (!presetRequest) return;
    callbacks.current.commit?.(presetRequest);
    callbacks.current.onPresetHandled?.();
  }, [presetRequest]);
}
