/** Accessible quick navigation in the eight-book library.
 * Only genuine PDF outline entries are allowed. Books with no metadata TOC
 * do not pretend that arbitrary intervals are real chapter or poem headings.
 */
export type BookIndexItem = { label: string; page: number };
export type OriginalBookHeading = { title: string; page: number };

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
    const title = item.title.replace(/\s+/g, " ").trim().slice(0, 70);
    if (!title || seen.has(`${item.page}:${title}`)) continue;
    real.push({ label: title, page: item.page });
    seen.add(`${item.page}:${title}`);
  }
  // Only authentic author/book publisher-provided headings are index entries.
  // Never replace the index with synthetic quarter/half/end markers.
  return real.sort((a, b) => a.page - b.page);
}
