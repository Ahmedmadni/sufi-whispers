/** Same page-turn direction as printed Arabic Mushaf: right advances.
 * Only applies to a deliberate unzoomed, horizontal single-finger swipe.
 */
export function rtlSwipePageDelta(deltaX: number, threshold = 75): -1 | 0 | 1 {
  if (!Number.isFinite(deltaX) || !Number.isFinite(threshold) || threshold < 30) return 0;
  if (deltaX >= threshold) return 1;
  if (deltaX <= -threshold) return -1;
  return 0;
}

/** A vertical gesture turns pages only if it STARTED at the scrolling edge.
 * Otherwise the book stays on the same page and the user can pan naturally.
 * Scrolling a tall/zoomed page must never immediately flip it.
 */
export type ScrollViewport = { scrollTop: number; scrollHeight: number; clientHeight: number };
export function verticalPageTurn(deltaY: number, threshold: number, start: ScrollViewport): -1 | 0 | 1 {
  if (!Number.isFinite(deltaY) || !Number.isFinite(threshold) || Math.abs(deltaY) < threshold || threshold < 1) return 0;
  const canScroll = start.scrollHeight > start.clientHeight + 3;
  if (deltaY < 0) {
    return !canScroll || start.scrollTop + start.clientHeight >= start.scrollHeight - 4 ? 1 : 0;
  }
  return !canScroll || start.scrollTop <= 4 ? -1 : 0;
}
