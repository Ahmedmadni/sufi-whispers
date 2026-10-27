import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
const read = (name: string) => readFileSync(name, "utf8");

describe("Seven requested interface revisions", () => {
  test("site navigation stays at the bottom and only book-page navigation moves to the reader's left", () => {
    const nav=read("src/components/BottomNav.tsx");
    const css=read("src/styles.css");
    const mobile=read("mobile/mobile.css");
    const readerCss=read("src/printed-pdf-reader.css");
    expect(nav).toContain('className="bottom-nav lg:hidden"');
    expect(nav).toContain('aria-label="التنقّل السريع"');
    expect(nav).not.toContain("left-rail-nav");
    expect(css).not.toContain(".bottom-nav.left-rail-nav");
    expect(css).not.toContain("body { padding-left: var(--rihab-rail-width)");
    expect(mobile).not.toContain("padding-left: var(--rihab-rail-width");
    expect(mobile).toContain("padding-bottom: calc(72px + env(safe-area-inset-bottom, 0px))");
    expect(readerCss).toContain(".book-reader-page-rail");
    expect(readerCss).toContain(".book-reader-workspace");
    for (const path of ["src/components/OfflineBookPages.tsx", "src/components/PdfBookViewer.tsx"]) {
      const source=read(path);
      expect(source).toContain("BookReaderNavigation");
      expect(source).toContain("book-reader-page-rail");
    }
  });
  test("font-size controls live in Settings and the saved scale is applied at startup", () => {
    const header=read("src/components/SiteHeader.tsx");
    const settings=read("src/routes/settings.tsx");
    const font=read("src/components/FontSizeControl.tsx");
    const root=read("src/routes/__root.tsx");
    expect(header).not.toContain("FontSizeControl");
    expect(settings).toContain("<FontSizeControl />");
    expect(font).toContain('aria-label="تصغير الخط"');
    expect(font).toContain('aria-label="تكبير الخط"');
    expect(root).toContain("applySavedFontScale()");
  });
  test("continuous pages fit the full available width and the page rail works in every reader state", () => {
    const pdf=read("src/components/PdfBookViewer.tsx");
    const offline=read("src/components/OfflineBookPages.tsx");
    const navigation=read("src/components/BookReaderNavigation.tsx");
    const layout=read("src/components/BookReaderLayout.tsx");
    const route=read("src/routes/books.$bookId.tsx");
    const readerCss=read("src/printed-pdf-reader.css");
    expect(layout).toContain("max-w-none flex-col");
    expect(route).toContain("w-full max-w-none");
    expect(pdf).not.toContain("Math.min(900, Math.max(200, w))");
    expect(pdf).toContain("containerRef.current.clientWidth - 16");
    expect(pdf).toContain("indexMode={printedIndexOpen}");
    expect(pdf).toContain("NAFAHAT_INDEX_LAST - NAFAHAT_INDEX_FIRST + 1");
    expect(navigation).toContain("indexMode = false");
    expect(navigation).toContain("!indexMode && bookId === \"nafahat-khaliliyya\"");
    for (const source of [pdf,offline]) {
      expect(source).toContain("BookReaderNavigation");
      expect(source).toContain("ContinuousBookStack");
      expect(source).toContain("persistReaderMode(bookId, mode)");
    }
    expect(readerCss).not.toContain(".book-reader--chrome-hidden .book-reader-page-rail {\n  display: none");
    expect(readerCss).toContain(".book-reader--immersive .book-reader-page-rail__popover");
  });
  test("all interface typography uses IBM Plex Sans Arabic with authentic Quran exception", () => {
    const root=read("src/routes/__root.tsx");
    const styles=read("src/styles.css");
    const androidSplash=read("mobile/index.html");
    expect(root).toContain("family=IBM+Plex+Sans+Arabic");
    expect(root).not.toContain("Noto+Kufi+Arabic");
    expect(styles).toContain('--font-display: "IBM Plex Sans Arabic"');
    expect(styles).toContain('--font-body: "IBM Plex Sans Arabic"');
    expect(androidSplash).toContain('font-family: "IBM Plex Sans Arabic"');
    expect(styles).toContain('font-family: "UthmanicHafs"');
  });
  test("book paging rail coexists with gestures without sensitivity sliders or mode toggles", () => {
    for (const path of ["src/components/OfflineBookPages.tsx", "src/components/PdfBookViewer.tsx"]) {
      const source=read(path);
      expect(source).toContain("BookReaderNavigation");
      expect(source).not.toContain('reader.swipeThreshold');
      expect(source).not.toContain("changeReaderMode(");
      expect(source).not.toContain("setReaderMode(");
      expect(source).toContain("const swipeThreshold = 80");
      expect(source).toContain("rtlSwipePageDelta(-");
      expect(source).toContain("verticalPageTurn(-");
      expect(source).toContain("readerGesturePageDelta(");
    }
  });
  test("dhikr header is concise and 24h saved prayer times are visible", () => {
    const dhikr=read("src/routes/dhikr.tsx");
    const home=read("src/components/DhikrCard.tsx");
    expect(dhikr).not.toContain("تابع وردك، واحفظ عدّك ومدّتك");
    expect(dhikr).toContain('type="time" lang="en-GB" dir="ltr" step={60}');
    expect(dhikr).toContain("wirdTimeWindowLabel(wird.phase, prayerTimes)");
    expect(home).toContain("wirdTimeWindowLabel(wird.phase, savedTimes)");
  });
  test("tasbih dial uses carved wooden CSS and only ASCII Latin numerals", () => {
    const dhikr=read("src/routes/dhikr.tsx");
    const visual=read("src/visual-experience.css");
    expect(dhikr).toContain('.toLocaleString("en-US")');
    expect(dhikr).toContain('<span lang="en" dir="ltr" className="dhikr-dial__number');
    expect(visual).toContain("repeating-radial-gradient");
    expect(visual).toContain(".dhikr-dial__button::before");
    expect(visual).toContain(".dhikr-dial__button::after");
  });
});
