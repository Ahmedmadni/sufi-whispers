import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { summarizedBookIndex } from "../src/lib/book-index";
import { rtlSwipePageDelta } from "../src/lib/book-paging";

const read = (path: string) => readFileSync(path, "utf8");

describe("Phase 33: 8 book readers and source-grounded navigation", () => {
  test("real source headings become accurate, safely clamped and sorted index links", () => {
    expect(summarizedBookIndex(45, [
      { title: "  الافتتاحية   الأولى  ", page: 3 },
      { title: "الخاتمة", page: 41 },
      { title: "خارج المدى", page: 46 },
      { title: "الافتتاحية الأولى", page: 3 },
      { title: "العنوان الثاني", page: 18 },
    ])).toEqual([
      { label: "الافتتاحية الأولى", page: 3 },
      { label: "العنوان الثاني", page: 18 },
      { label: "الخاتمة", page: 41 },
    ]);
  });

  test("never invents quarter/half-book markers when original PDF has no headings", () => {
    expect(summarizedBookIndex(425)).toEqual([]);
    expect(summarizedBookIndex(1)).toEqual([]);
    expect(summarizedBookIndex(-1)).toEqual([]);
  });

  test("Quran-aligned right swipe moves forward; left swipe backward", () => {
    expect(rtlSwipePageDelta(90)).toBe(1);
    expect(rtlSwipePageDelta(-90)).toBe(-1);
    expect(rtlSwipePageDelta(10)).toBe(0);
    expect(rtlSwipePageDelta(Number.NaN)).toBe(0);
  });

  test("offline Android books keep original 1040 images and add real PDF TOC metadata", () => {
    const renderer = read("scripts/prepare-offline-books.py");
    expect(renderer).toContain("document.get_toc()");
    expect(renderer).toContain("seen.add((page_number, title))");
    expect(renderer).toContain('"toc": toc');
    expect(renderer).toContain('"pageCount": len(pages), "pages": pages');
    const offline = read("src/components/OfflineBookPages.tsx");
    expect(offline).toContain("BookReaderLayout immersive={immersive}");
    expect(offline).toContain('aria-label={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}');
    expect(offline).toContain("BookQuickIndex");
    expect(offline).toContain("readerGesturePageDelta({");
    expect(offline).toContain('event.key === "ArrowRight"');
  });

  test("primary Madih PDF retains PDF.js, discovers real bookmarks and supports exit", () => {
    const source = read("src/components/PdfBookViewer.tsx");
    expect(source).toContain("document.getOutline()");
    expect(source).toContain("if (item.items?.length) queue.splice(i + 1, 0, ...item.items);");
    expect(source).toContain("document.getDestination(item.dest)");
    expect(source).toContain("document.getPageIndex(dest[0])");
    expect(source).toContain('aria-label={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}');
    expect(source).toContain("BookQuickIndex");
    expect(source).toContain("BookReaderLayout immersive={immersive}");
    expect(source).toContain("readerGesturePageDelta({");
    expect(source).toContain('e.key === "ArrowRight"');
    expect(source).toContain('if (!numPages || isOfflineAndroid || mode==="continuous") return [];');
  });

  test("reader uses portal to escape animated mobile ancestors and keeps visible exit", () => {
    const shell = read("src/components/BookReaderLayout.tsx");
    const styles = read("src/printed-pdf-reader.css");
    expect(shell).toContain("createPortal(content, document.body)");
    expect(shell).toContain('event.key === "Escape"');
    expect(styles).toContain(".book-reader--immersive");
    expect(styles).toContain("height: 100dvh");
    expect(styles).toContain("safe-area-inset-bottom");
    expect(styles).toContain(".book-pdf-stage");
    expect(styles).toContain(".offline-book-stage");
  });

  test("APK remains compact, with all original sources kept in cloud backup", () => {
    const packageJson = read("package.json");
    expect(packageJson).toContain("compact-android-book-pdfs.mjs");
    const verify = read("scripts/verify-mobile-bundle.mjs");
    expect(verify).toContain("totalOfflineBookPages !== 1040");
    expect(verify).toContain("offlineManifest.pageCount !== 604");
  });
});
