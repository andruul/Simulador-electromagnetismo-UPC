/** Relative error |actual - expected| / |expected|. */
export function relErr(actual: number, expected: number): number {
  return Math.abs(actual - expected) / Math.abs(expected);
}
