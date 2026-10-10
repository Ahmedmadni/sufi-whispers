import { describe, expect, test } from "bun:test";
import { SURA_INDEX } from "../src/data/quran/suras";
import { PRINTED_MUSHAF, toPdfPage } from "../src/lib/printed-mushaf";
import {
  adjacentPrintedPages, printedPageImageUrl,
  PRINTED_PAGE_IMAGE_BASE, PRINTED_PAGE_IMAGE_WIDTH, PRINTED_PAGE_IMAGE_HEIGHT,
} from "../src/lib/printed-mushaf-pages";

describe("Original Madinah printed page image delivery", () => {
  test("every canonical Mushaf page resolves to exactly one original PNG", () => {
    const urls = new Set<string>();
    for (let page = 1; page <= 604; page++) {
      const url = printedPageImageUrl(page);
      expect(url).toBe(`${PRINTED_PAGE_IMAGE_BASE}/${String(page).padStart(3, "0")}.png`);
      expect(url).not.toContain(".pdf");
      urls.add(url);
    }
    expect(urls.size).toBe(604);
    expect(PRINTED_PAGE_IMAGE_WIDTH).toBe(957);
    expect(PRINTED_PAGE_IMAGE_HEIGHT).toBe(1368);
    expect(PRINTED_MUSHAF.frontMatterPages).toBe(3);
    expect(toPdfPage(604)).toBe(607);
  });

  test("all 114 Quran chapter start pages point to their unchanged printed image", () => {
    expect(SURA_INDEX).toHaveLength(114);
    for (const s of SURA_INDEX) {
      const image = printedPageImageUrl(s.startPage);
      expect(image).toContain(`/${String(s.startPage).padStart(3, "0")}.png`);
    }
    expect(SURA_INDEX[0].startPage).toBe(1);
    expect(SURA_INDEX.at(-1)?.startPage).toBe(604);
  });

  test("preloading only visits existing adjacent pages, never all 604", () => {
    expect(adjacentPrintedPages(1)).toEqual([2]);
    expect(adjacentPrintedPages(3)).toEqual([2, 4]);
    expect(adjacentPrintedPages(603)).toEqual([602, 604]);
    expect(adjacentPrintedPages(604)).toEqual([603]);
    expect(adjacentPrintedPages(-10)).toEqual([2]);
    expect(adjacentPrintedPages(10000)).toEqual([603]);
  });

  test("invalid page indices stay within Quran, not cover or appendix", () => {
    expect(printedPageImageUrl(0)).toBe(printedPageImageUrl(1));
    expect(printedPageImageUrl(605)).toBe(printedPageImageUrl(604));
    expect(printedPageImageUrl(Number.NaN)).toBe(printedPageImageUrl(1));
  });
});
