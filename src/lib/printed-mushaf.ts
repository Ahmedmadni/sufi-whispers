import { SURA_INDEX } from "@/data/quran/suras";

/**
 * Unmodified user-supplied 1441H Madinah Mushaf, medium-quality green edition.
 * Its PDF pages 4..607 correspond to printed pages 1..604.
 * Pages 1..3 are front matter; PDF 608..640 are end matter.
 */
export const PRINTED_MUSHAF = {
  title: "مصحف المدينة النبوية — حفص، طبعة ١٤٤١هـ (الأخضر)",
  fileName: "MushafMadinaHafsGreen1441.pdf",
  sourceUrl:
    "https://archive.org/download/MushafMadinaHafsGreen1441/MushafMadinaHafsGreen1441.pdf",
  byteLength: 65008727,
  sha256: "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28",
  documentPages: 640,
  quranPages: 604,
  frontMatterPages: 3,
} as const;

export function clampMushafPage(value: number): number {
  if (!Number.isFinite(value)) return 1;
  return Math.max(1, Math.min(PRINTED_MUSHAF.quranPages, Math.trunc(value)));
}

export function toPdfPage(mushafPage: number): number {
  return clampMushafPage(mushafPage) + PRINTED_MUSHAF.frontMatterPages;
}

export function toMushafPage(pdfPage: number): number | null {
  if (!Number.isInteger(pdfPage) ||
      pdfPage <= PRINTED_MUSHAF.frontMatterPages ||
      pdfPage > PRINTED_MUSHAF.frontMatterPages + PRINTED_MUSHAF.quranPages) return null;
  return pdfPage - PRINTED_MUSHAF.frontMatterPages;
}

export function suraAtMushafPage(page: number) {
  const target = clampMushafPage(page);
  // The last preceding sura start is an approximate heading for a printed
  // page that can contain multiple suras. The index itself retains all 114.
  for (let i = SURA_INDEX.length - 1; i >= 0; i--) {
    if (SURA_INDEX[i].startPage <= target) return SURA_INDEX[i];
  }
  return SURA_INDEX[0];
}

/** Name filtering never touches canonical Quran verse text. */
export function matchesSuraFilter(name: string, query: string): boolean {
  const normalize = (text: string) =>
    text.replace(/[\u064B-\u065F\u0670]/g, "").replace(/[أإآٱ]/g, "ا").replace(/ى/g, "ي").trim();
  const q = normalize(query);
  return !q || normalize(name).includes(q);
}

/** Collect all suras starting on this page (a page can begin several suras). */
export function surasOnMushafPage(page: number) {
  const starting = SURA_INDEX.filter((s) => s.startPage === clampMushafPage(page));
  return starting.length > 0 ? starting : [suraAtMushafPage(page)];
}

export type PrintedBookmark = { page: number; createdAt: number };
export const PRINTED_BOOKMARK_KEY = "rihab:printed-mushaf:bookmarks:v1";
export const PRINTED_LAST_PAGE_KEY = "rihab:printed-mushaf:last-page:v1";

export function parsePrintedBookmarks(raw: string | null): PrintedBookmark[] {
  if (!raw) return [];
  try {
    const array: unknown = JSON.parse(raw);
    if (!Array.isArray(array)) return [];
    const unique = new Map<number, PrintedBookmark>();
    for (const value of array) {
      if (value == null || typeof value !== "object") continue;
      const v = value as Record<string, unknown>;
      if (typeof v.page !== "number" || !Number.isInteger(v.page) ||
          v.page < 1 || v.page > PRINTED_MUSHAF.quranPages ||
          typeof v.createdAt !== "number" || !Number.isFinite(v.createdAt)) continue;
      unique.set(v.page, { page: v.page, createdAt: v.createdAt });
    }
    return [...unique.values()].sort((a, b) => b.createdAt - a.createdAt);
  } catch { return []; }
}

export function togglePrintedBookmark(bookmarks: readonly PrintedBookmark[], page: number, now: number): PrintedBookmark[] {
  const value = clampMushafPage(page);
  return bookmarks.some((item) => item.page === value)
    ? bookmarks.filter((item) => item.page !== value)
    : [{ page: value, createdAt: now }, ...bookmarks];
}

export function parseLastPrintedPage(raw: string | null): number {
  if (raw == null || !/^[1-9]\d*$/.test(raw.trim())) return 1;
  const n = Number(raw);
  return Number.isSafeInteger(n) && n <= PRINTED_MUSHAF.quranPages ? n : 1;
}
