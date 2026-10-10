import { describe, expect, test } from "bun:test";
import { SURA_INDEX } from "../src/data/quran/suras";
import { PRINTED_PDF_SURA_START_PAGES } from "../src/data/quran/printed-pdf-pages";
import {
  PRINTED_MUSHAF, toPdfPage, toMushafPage, clampMushafPage,
  parsePrintedBookmarks, togglePrintedBookmark, parseLastPrintedPage, suraAtMushafPage,
  surasOnMushafPage, matchesSuraFilter,
} from "../src/lib/printed-mushaf";

describe("Madinah printed PDF — independently validated page mapping", () => {
  test("original 640-page PDF maps all 604 printed pages with three front pages", () => {
    expect(PRINTED_MUSHAF.documentPages).toBe(640);
    expect(PRINTED_MUSHAF.quranPages).toBe(604);
    expect(PRINTED_MUSHAF.frontMatterPages).toBe(3);
    expect(toPdfPage(1)).toBe(4);
    expect(toPdfPage(604)).toBe(607);
    expect(toPdfPage(50)).toBe(53);
    expect(toMushafPage(4)).toBe(1);
    expect(toMushafPage(607)).toBe(604);
    expect(toMushafPage(1)).toBeNull();
    expect(toMushafPage(608)).toBeNull();
    expect(toMushafPage(640)).toBeNull();
  });

  test("every one of 114 PDF sura bookmarks matches the independent Quran sura index", () => {
    expect(PRINTED_PDF_SURA_START_PAGES).toHaveLength(114);
    expect(SURA_INDEX).toHaveLength(114);
    SURA_INDEX.forEach((sura, i) => {
      expect(sura.no).toBe(i + 1);
      expect(toPdfPage(sura.startPage)).toBe(PRINTED_PDF_SURA_START_PAGES[i]);
    });
    expect(PRINTED_PDF_SURA_START_PAGES.at(-1)).toBe(607);
  });

  test("page clamping never points into PDF cover, index or appendix", () => {
    for (const [value, expected] of [[-20, 1], [0, 1], [0.9, 1], [605, 604], [1e7, 604]] as const) {
      expect(clampMushafPage(value)).toBe(expected);
    }
    expect(clampMushafPage(Infinity)).toBe(1);
    expect(suraAtMushafPage(1).no).toBe(1);
  });

  test("page 604 displays all three final suras; name filtering ignores tashkeel only in the index", () => {
    expect(surasOnMushafPage(604).map((s) => s.no)).toEqual([112, 113, 114]);
    expect(matchesSuraFilter(SURA_INDEX[0].nameAr, "الفاتحة")).toBe(true);
    expect(matchesSuraFilter(SURA_INDEX[1].nameAr, "البقره")).toBe(false);
    expect(matchesSuraFilter(SURA_INDEX[1].nameAr, "البقرة")).toBe(true);
  });

  test("bookmarks are unique, validated and kept in stable recent-first order", () => {
    const bookmarks = togglePrintedBookmark([], 604, 100);
    expect(bookmarks).toEqual([{ page: 604, createdAt: 100 }]);
    const another = togglePrintedBookmark(bookmarks, 50, 200);
    expect(another.map((b) => b.page)).toEqual([50, 604]);
    expect(togglePrintedBookmark(another, 50, 300)).toEqual(bookmarks);
    expect(parsePrintedBookmarks(JSON.stringify([
      { page: 50, createdAt: 200 }, { page: 900, createdAt: 1 },
      { page: 604, createdAt: 100 }, { page: 50, createdAt: 200 },
      { page: 0, createdAt: 333 }, { page: "4", createdAt: 100 },
    ]))).toEqual(another);
    expect(parsePrintedBookmarks("invalid")).toEqual([]);
  });

  test("restored reading position must stay within the 604 printed pages", () => {
    expect(parseLastPrintedPage("604")).toBe(604);
    expect(parseLastPrintedPage("1")).toBe(1);
    for (const input of [null, "0", "605", "1.9", "999999999999999999"]) {
      expect(parseLastPrintedPage(input)).toBe(1);
    }
  });
});
