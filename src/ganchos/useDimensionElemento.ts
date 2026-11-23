import { useEffect, useState, type RefObject } from 'react';

export interface ElementSize {
  width: number;
  height: number;
}

/**
 * Tracks the content-box size of an element with a ResizeObserver.
 * Sizes of 0 (hidden or not laid out yet) are ignored so canvases never collapse.
 *
 * @param ref      element to observe
 * @param initial  size used until the first measurement
 * @param rounding how fractional pixel sizes are converted to integers
 */
export function useElementSize(
  ref: RefObject<HTMLElement | null>,
  initial: ElementSize,
  rounding: 'floor' | 'round' = 'floor'
): ElementSize {
  const [size, setSize] = useState<ElementSize>(initial);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const round = rounding === 'floor' ? Math.floor : Math.round;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setSize({ width: round(width), height: round(height) });
        }
      }
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, rounding]);

  return size;
}
