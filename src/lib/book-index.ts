/** Accessible quick navigation in the eight-book library.
 * Only genuine PDF outline entries are allowed. Books with no metadata TOC
 * do not pretend that arbitrary intervals are real chapter or poem headings.
 */
export type BookIndexItem = { label: string; page: number; kind?: "poem" | "other" };
export type OriginalBookHeading = { title: string; page: number; kind?: "poem" | "other" };

export function summarizedBookIndex(
  pageCount: number,
  outline: OriginalBookHeading[] = [],
): BookIndexItem[] {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 10000) return [];
  const real: BookIndexItem[] = [];
  const seen = new Set<string>();
  for (const item of outline) {
    if (!item || !Number.isSafeInteger(item.page) || item.page < 1 || item.page > pageCount ||
        typeof item.title !== "string") continue;
    const title = item.title.replace(/\s+/g, " ").trim().slice(0, 240);
    if (!title || seen.has(`${item.page}:${title}`)) continue;
    real.push({ label: title, page: item.page, ...(item.kind ? { kind: item.kind } : {}) });
    seen.add(`${item.page}:${title}`);
  }
  // Only authentic author/book publisher-provided headings are index entries.
  // Never replace the index with synthetic quarter/half/end markers.
  return real.sort((a, b) => a.page - b.page);
}


/** Inclusive ranges based ONLY on real source headings. The next verified
 * heading ends the preceding poem/chapter. This does not invent new chapters.
 * Multiple authentic bookmarks on one page remain distinct entries. */
export type BookReadingSection = BookIndexItem & { endPage: number };
export function readingSections(
  pageCount: number,
  entries: BookIndexItem[],
): BookReadingSection[] {
  if (!Number.isSafeInteger(pageCount) || pageCount < 1 || pageCount > 10000) return [];
  const pages = entries.filter(e =>
    Number.isSafeInteger(e.page) && e.page >= 1 && e.page <= pageCount);
  return pages.map((entry,i) => {
    const next = pages.slice(i + 1).find(item => item.page > entry.page);
    return { ...entry, endPage: Math.max(entry.page, Math.min(pageCount, (next?.page ?? (pageCount + 1)) - 1)) };
  });
}
/** Highlight the active poem even on its second or later page. */
export function currentReadingSection(
  sections: BookReadingSection[],
  currentPage: number,
): BookReadingSection | null {
  let active: BookReadingSection | null = null;
  for (const item of sections) {
    if (item.page <= currentPage && item.endPage >= currentPage) active = item;
  }
  return active;
}
