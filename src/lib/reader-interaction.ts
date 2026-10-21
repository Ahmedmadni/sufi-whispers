/** G1/R-01: book-agnostic gesture policy. Keep DOM/React out of this module.
 * A page can turn vertically only when the gesture began at a scroll edge;
 * a zoomed image can always be panned without a horizontal page turn.
 */
import { rtlSwipePageDelta, verticalPageTurn, type ScrollViewport } from "./book-paging";
import { boundedBookZoom } from "./book-pinch";

export type ReaderState = {
  page: number;
  maxPage: number;
  zoom: number;
  scroll: ScrollViewport;
};
export type ReaderGesture = { dx: number; dy: number; threshold: number; indexOpen?: boolean };
export function readerGesturePageDelta(state: ReaderState, gesture: ReaderGesture): -1 | 0 | 1 {
  if (gesture.indexOpen || !Number.isFinite(state.zoom) || !Number.isFinite(gesture.dx) || !Number.isFinite(gesture.dy)) return 0;
  if (Math.abs(gesture.dy) >= Math.abs(gesture.dx)) {
    return verticalPageTurn(gesture.dy, gesture.threshold, state.scroll);
  }
  // Enlarged content must be scrollable in both axes: never steal horizontal pans.
  return state.zoom > 1 ? 0 : rtlSwipePageDelta(gesture.dx, gesture.threshold);
}
export function readerNextPage(state: ReaderState, delta: number): number {
  if (!Number.isSafeInteger(state.maxPage) || state.maxPage < 1) return 1;
  return Math.max(1, Math.min(state.maxPage, state.page + delta));
}
export function zoomOnDoubleTap(currentZoom: number): number {
  return boundedBookZoom(currentZoom >= 1.75 ? 1 : 2);
}
export type ZoomFocal = { x: number; y: number; left: number; top: number; scrollLeft: number; scrollTop: number; currentZoom: number; nextZoom: number };
export function focalScrollAfterZoom(input: ZoomFocal): { left: number; top: number } {
  const ratio = input.currentZoom > 0 ? input.nextZoom / input.currentZoom : 1;
  return {
    left: Math.max(0, (input.scrollLeft + input.x - input.left) * ratio - (input.x - input.left)),
    top: Math.max(0, (input.scrollTop + input.y - input.top) * ratio - (input.y - input.top)),
  };
}

export type ReaderPinchAnchor = { contentX: number; contentY: number };
export type ReaderViewportRect = { left: number; top: number };
/** Capture the exact document point below the beginning two-finger midpoint. */
export function captureReaderPinchAnchor(
  viewport: ReaderViewportRect & { scrollLeft: number; scrollTop: number },
  center: {x: number; y: number},
  zoom: number,
): ReaderPinchAnchor {
  const safeZoom = zoom > 0 && Number.isFinite(zoom) ? zoom : 1;
  return {
    contentX: (Math.max(0, viewport.scrollLeft) + center.x - viewport.left) / safeZoom,
    contentY: (Math.max(0, viewport.scrollTop) + center.y - viewport.top) / safeZoom,
  };
}
/** Focal point remains under the moving midpoint, even during two-finger pan. */
export function scrollToReaderPinchAnchor(
  anchor: ReaderPinchAnchor, center: {x: number;y: number}, viewport: ReaderViewportRect, zoom: number,
): {left: number;top: number} {
  return {
    left: Math.max(0, anchor.contentX * zoom - (center.x - viewport.left)),
    top: Math.max(0, anchor.contentY * zoom - (center.y - viewport.top)),
  };
}
