import source from "@/data/nafahat-khaliliyya-poems.json";
import type { OriginalBookHeading } from "@/lib/book-index";

export const NAFAHAT_KHALILIYYA_SOURCE_SHA256 = source.sourceSha256;
export const NAFAHAT_KHALILIYYA_PAGE_COUNT = source.pageCount;

export function verifiedNafahatKhaliliyyaHeadings(
  bookId: string,
  pageCount: number,
  sha256?: string,
): OriginalBookHeading[] {
  if (bookId !== source.bookId || pageCount !== source.pageCount ||
      (sha256 !== undefined && sha256 !== source.sourceSha256)) return [];
  // These are manually verified visible poem/chapter starts from the original
  // scanned source; it has no PDF outline and no reliable extractable text.
  return source.entries.map(entry => ({
    title: entry.title,
    page: entry.page,
    kind: entry.kind as "poem" | "other",
  }));
}
