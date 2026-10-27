import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import index from "../src/data/nafahat-khaliliyya-poems.json";
import { verifiedNafahatKhaliliyyaHeadings } from "../src/lib/nafahat-khaliliyya-index";
import { currentReadingSection, readingSections, summarizedBookIndex } from "../src/lib/book-index";

const read = (path: string) => readFileSync(path,"utf8");

describe("Original 70-page Khaliliya Nafahat poetry index", () => {
  test("maps every separately verified poem and 3 non-poem parts to its own original page", () => {
    expect(index.format).toBe(1);
    expect(index.bookId).toBe("nafahat-khaliliyya");
    expect(index.sourceSha256).toMatch(/^[0-9a-f]{64}$/);
    expect(index.pageCount).toBe(70);
    const poems = index.entries.filter(x => x.kind === "poem");
    const extras = index.entries.filter(x => x.kind === "other");
    expect(poems).toHaveLength(13);
    expect(extras).toHaveLength(3);
    expect(poems.map(x => x.page)).toEqual([15,17,19,24,28,31,34,38,41,46,50,56,59]);
    expect(extras.map(x => x.page)).toEqual([6,12,67]);
    expect(poems.every(x => x.title.length >= 8)).toBe(true);
    expect(new Set(index.entries.map(x => x.page)).size).toBe(index.entries.length);
  });
  test("only source-matching Android offline manifest can load manual scanned TOC", () => {
    expect(verifiedNafahatKhaliliyyaHeadings("nafahat-khaliliyya",70,index.sourceSha256)).toHaveLength(16);
    expect(verifiedNafahatKhaliliyyaHeadings("nafahat-khaliliyya",70,"0".repeat(64))).toEqual([]);
    expect(verifiedNafahatKhaliliyyaHeadings("nafahat-khaliliyya",69)).toEqual([]);
    expect(verifiedNafahatKhaliliyyaHeadings("nafahat",432)).toEqual([]);
    expect(verifiedNafahatKhaliliyyaHeadings("ward",70)).toEqual([]);
    const mapped = summarizedBookIndex(70, verifiedNafahatKhaliliyyaHeadings("nafahat-khaliliyya",70));
    expect(mapped.filter(x => x.kind === "poem")).toHaveLength(13);
    expect(mapped.filter(x => x.kind === "other")).toHaveLength(3);
  });
  test("derives exact inclusive poem ranges and highlights the current chapter from any page", () => {
    const sections = readingSections(70, summarizedBookIndex(70,
      verifiedNafahatKhaliliyyaHeadings("nafahat-khaliliyya",70,index.sourceSha256)));
    expect(sections.find(x => x.page === 41)?.endPage).toBe(45);
    expect(sections.find(x => x.page === 46)?.endPage).toBe(49);
    expect(sections.find(x => x.page === 50)?.endPage).toBe(55);
    expect(sections.find(x => x.page === 59)?.endPage).toBe(66);
    expect(currentReadingSection(sections,48)?.page).toBe(46);
    expect(currentReadingSection(sections,49)?.page).toBe(46);
    expect(currentReadingSection(sections,52)?.page).toBe(50);
    expect(currentReadingSection(sections,67)?.kind).toBe("other");
  });
  test("provides search, stable poem numbers and page-range labels", () => {
    const toc = read("src/components/BookQuickIndex.tsx");
    expect(toc).toContain('type="search"');
    expect(toc).toContain("البحث في فهرس قصائد النفحات الخليلية");
    expect(toc).toContain("poems.findIndex(");
    expect(toc).toContain("currentReadingSection");
    expect(toc).toContain("item.endPage > item.page");
  });
  test("keeps the source-grounded poem index and puts page navigation in the left reader rail", () => {
    const offline = read("src/components/OfflineBookPages.tsx");
    expect(offline).toContain("BookReaderNavigation");
    expect(offline).toContain("book-reader-page-rail");
    expect(offline).toContain("BookQuickIndex");
    expect(offline).toContain("headings={entry?.toc?.length ? entry.toc : verifiedNafahatKhaliliyyaHeadings(");
    const pdf = read("src/components/PdfBookViewer.tsx");
    expect(pdf).toContain("BookReaderNavigation");
    expect(pdf).toContain("book-reader-page-rail");
    expect(pdf).toContain("headings={outline.length ? outline : verifiedNafahatKhaliliyyaHeadings(");
  });
  test("printed index is a continuous seven-sheet stack with its own working left rail", () => {
    const pdf = read("src/components/PdfBookViewer.tsx");
    const nav = read("src/components/BookReaderNavigation.tsx");
    expect(pdf).toContain("layout={printedIndexLayout}");
    expect(pdf).toContain("onActivePage={indexPage => setPrintedIndexSheet");
    expect(pdf).toContain("continuousRef.current?.jumpToPage(target)");
    expect(pdf).toContain("indexMode={printedIndexOpen}");
    expect(nav).toContain("indexMode = false");
    expect(nav).toContain("Math.min(limits, Math.max(1, page +");
  });
  test("scanned-book TOC appears on web and Android, not in Jami al-Nafahat reader", () => {
    const offline = read("src/components/OfflineBookPages.tsx");
    const pdf = read("src/components/PdfBookViewer.tsx");
    const toc = read("src/components/BookQuickIndex.tsx");
    expect(offline).toContain("verifiedNafahatKhaliliyyaHeadings(bookId, maxPage, entry?.sourceSha256)");
    expect(pdf).toContain("verifiedNafahatKhaliliyyaHeadings(bookId, numPages)");
    expect(toc).toContain("القصائد — اضغط على عنوان لفتحها");
    expect(toc).toContain("المقدمة والأوراد");
    expect(pdf).toContain("NafahatPrintedIndex"); // Jami source keeps its distinct printed 458-row index.
  });
});

describe("Hybrid daylight identity and hero title placement", () => {
  test("moves the single visible hero title to bottom-right immediately above ticker", () => {
    const hero = read("src/components/HomeHero.tsx");
    const css = read("src/visual-experience.css");
    expect(hero).toContain('className="hero-heading absolute inset-x-0 z-20');
    expect(hero).not.toContain("hero-heading absolute inset-x-0 top-0");
    expect(css).toContain("bottom: var(--hero-mandate-height)");
    expect(css).toContain("text-align: right;");
    expect(hero).toContain('id="home-title"');
  });
  test("keeps light reading canvas but uses dark navigation and editorial blocks", () => {
    const css = read("src/rihab-daylight.css");
    expect(css).toContain(".light .site-header {");
    expect(css).toContain("background: #19392e;");
    expect(css).toContain(".light .bottom-nav {");
    expect(css).toContain(".light .library-banner {");
    expect(css).toContain(".light .reader-surface { background: #f4eee1; }");
    expect(css).toContain(".light .hero-mandate__frame {");
    const toggle = read("src/components/SiteHeader.tsx");
    expect(toggle).not.toContain("ThemeToggle");
  });
});
