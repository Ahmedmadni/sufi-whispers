/** Same page-turn direction as printed Arabic Mushaf: right advances.
 * Only applies to a deliberate unzoomed, horizontal single-finger swipe.
 */
export function rtlSwipePageDelta(deltaX: number, threshold = 75): -1 | 0 | 1 {
  if (!Number.isFinite(deltaX) || !Number.isFinite(threshold) || threshold < 30) return 0;
  if (deltaX >= threshold) return 1;
  if (deltaX <= -threshold) return -1;
  return 0;
}
