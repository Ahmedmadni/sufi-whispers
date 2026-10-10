import type { Aya } from "@/lib/quran";

/** Printed Arabic books advance by turning the page to the RIGHT. */
export function rtlPageFromSwipe(
  currentPage: number,
  deltaX: number,
  deltaY: number,
  minDistance = 65,
): number {
  if (Math.abs(deltaX) < minDistance || Math.abs(deltaX) <= Math.abs(deltaY) * 1.25) {
    return currentPage;
  }
  return Math.max(1, Math.min(604, currentPage + (deltaX > 0 ? 1 : -1)));
}

export function distanceBetweenTouches(a: { clientX: number; clientY: number }, b: { clientX: number; clientY: number }) {
  return Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
}

export function clampReaderZoom(zoom: number): number {
  return Number.isFinite(zoom) ? Math.max(1, Math.min(3.5, zoom)) : 1;
}

export function pinchReaderZoom(initialZoom: number, initialDistance: number, newDistance: number) {
  if (initialDistance <= 0 || !Number.isFinite(newDistance)) return clampReaderZoom(initialZoom);
  return clampReaderZoom(initialZoom * newDistance / initialDistance);
}

/**
 * Selection/copy is sourced exclusively from the verified KFGQPC aya_text.
 * Don't normalize Unicode, trim, strip marks, use OCR or substitute search text.
 * Whitespace joining the separate verses is outside each immutable verse.
 */
export function originalVersesOnPage(quran: readonly Aya[], page: number): Aya[] {
  return quran.filter((aya) => aya.page === page);
}

export function exactVerseText(aya: Aya): string {
  return aya.aya_text;
}

export function exactPageText(quran: readonly Aya[], page: number): string {
  return originalVersesOnPage(quran, page).map(exactVerseText).join("\n");
}
