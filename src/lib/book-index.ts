/** Accessible quick navigation in the eight-book library.
 * Genuine PDF outline entries are preferred; otherwise use explicitly generic
 * progress markers, never fabricated poem/chapter names or page claims.
 */
export type BookIndexItem = { label: string; page: number };
export type OriginalBookHeading = { title: string; page: number };

export function summarizedBookIndex(
  pageCount: number,
  outline: OriginalBookHeading[] = [],
): BookIndexItem[] {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 10000) return [];
  const real: BookIndexItem[] = [];
  const seen = new Set<number>();
  for (const item of outline.slice(0, 500)) {
    if (!item || !Number.isSafeInteger(item.page) || item.page < 1 || item.page > pageCount ||
        typeof item.title !== "string") continue;
    const title = item.title.replace(/\s+/g, " ").trim().slice(0, 70);
    if (!title || seen.has(item.page)) continue;
    real.push({ label: title, page: item.page });
    seen.add(item.page);
    if (real.length === 60) break;
  }
  if (real.length > 0) return real.sort((a, b) => a.page - b.page);

  // These are reading-position landmarks, not claims about book contents.
  const markers = [
    { label: "بداية الكتاب", fraction: 0 },
    { label: "ربع الكتاب", fraction: 0.25 },
    { label: "منتصف الكتاب", fraction: 0.5 },
    { label: "ثلاثة أرباع الكتاب", fraction: 0.75 },
    { label: "نهاية الكتاب", fraction: 1 },
  ];
  const fallback: BookIndexItem[] = [];
  for (const marker of markers) {
    const page = Math.min(pageCount, Math.max(1, Math.round(1 + (pageCount - 1) * marker.fraction)));
    if (!fallback.some(item => item.page === page)) fallback.push({ label: marker.label, page });
  }
  return fallback;
}
