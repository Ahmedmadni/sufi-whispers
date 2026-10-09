/** Strictly parse a saved 1-based page number from storage. */
export function parseSavedPage(raw: string | null): number {
  if (raw === null || !/^[1-9]\d*$/.test(raw.trim())) return 1;
  const value = Number(raw.trim());
  return Number.isSafeInteger(value) ? value : 1;
}

/** Clamp the reader after the PDF reports its actual page count. */
export function clampPage(page: number, totalPages: number): number {
  if (!Number.isInteger(totalPages) || totalPages < 1 || !Number.isFinite(page)) return 1;
  return Math.min(totalPages, Math.max(1, Math.trunc(page)));
}
