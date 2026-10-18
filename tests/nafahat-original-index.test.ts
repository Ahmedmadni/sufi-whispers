import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import nafahatMap from "../src/data/nafahat-printed-index.json";
import { summarizedBookIndex } from "../src/lib/book-index";

const read = (path: string) => readFileSync(path, "utf8");

describe("Phase 34: genuine complete Jami al-Nafahat printed index", () => {
  test("all 458 printed references are linked from all seven authentic index pages", () => {
    expect(nafahatMap.format).toBe(1);
    expect(nafahatMap.sourcePages).toBe(432);
    expect(nafahatMap.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    expect(nafahatMap.printedIndexFirstPage).toBe(425);
    expect(nafahatMap.printedIndexLastPage).toBe(431);
    const sheets = Object.entries(nafahatMap.sheets);
    expect(sheets.map(([page]) => page)).toEqual(["425", "426", "427", "428", "429", "430", "431"]);
    const rows = sheets.flatMap(([, value]) => value);
    expect(rows.length).toBe(458);
    expect(nafahatMap.references).toBe(rows.length);
    expect(Math.max(...rows.map(item => item.page))).toBe(420);
    expect(Math.min(...rows.map(item => item.page))).toBe(6);
    for (const item of rows) {
      expect(item.page).toBeGreaterThanOrEqual(6);
      expect(item.page).toBeLessThanOrEqual(420);
      expect(item.column === "left" || item.column === "right").toBe(true);
      expect(item.top).toBeGreaterThan(0);
      expect(item.top + item.height).toBeLessThan(1);
    }
  });
  test("printed Arabic titles remain their original untouched PDF pixels, each row is tappable", () => {
    const page = read("src/components/NafahatPrintedIndex.tsx");
    const reader = read("src/components/PdfBookViewer.tsx");
    expect(page).toContain("<Page");
    expect(page).toContain("pageNumber={sheet}");
    expect(page).toContain("rows.map((item, i)");
    expect(page).toContain("onClick={() => onJump(item.page)}");
    expect(page).toContain('aria-label={`فتح العنوان المطبوع في صفحة ${item.page}`}');
    expect(reader).toContain("NafahatPrintedIndex");
    expect(reader).toContain('bookId === "nafahat" && printedIndexOpen');
    expect(reader).toContain("setPrintedIndexOpen(false)");
    expect(reader).toContain("NAFAHAT_INDEX_REFERENCES");
  });
  test("no fake quarter/half index; full PDF bookmark titles are not cut to 60", () => {
    expect(summarizedBookIndex(432)).toEqual([]);
    const headings = Array.from({ length: 96 }, (_, i) => ({ title: `العنوان ${i + 1}`, page: i + 1 }));
    expect(summarizedBookIndex(432, headings)).toHaveLength(96);
    const bookIndex = read("src/components/BookQuickIndex.tsx");
    const srcIndex = read("src/lib/book-index.ts");
    const renderer = read("scripts/prepare-offline-books.py");
    expect(bookIndex).not.toContain("تنقّل سريع حسب موضع الصفحة");
    expect(srcIndex).not.toContain('"ربع الكتاب"');
    expect(srcIndex).not.toContain('"منتصف الكتاب"');
    expect(renderer).not.toContain("len(toc) >= 60");
  });
  test("existing archival calligraphy remains bundled; hero switches to offline Noto Kufi", () => {
    const fontScript = read("scripts/prepare-calligraphy-font.mjs");
    const pkg = read("package.json");
    const css = read("src/styles.css");
    const hero = read("src/visual-experience.css");
    const offlineFonts = read("scripts/prepare-android-fonts.mjs");
    expect(fontScript).toContain("aref-ruqaa-ink-regular.ttf");
    expect(fontScript).toContain("SIL OPEN FONT LICENSE");
    expect(fontScript).toContain('resolve("public/fonts")');
    expect(fontScript).toContain('resolve("mobile/.public/fonts")');
    expect(pkg).toContain("prepare-calligraphy-font.mjs");
    expect(css).toContain('font-family: "Aref Ruqaa Ink"');
    expect(hero).toContain('font-family: "Noto Kufi Arabic", "IBM Plex Sans Arabic", sans-serif');
    expect(offlineFonts).toContain("noto-kufi-variable.ttf");
  });
});
