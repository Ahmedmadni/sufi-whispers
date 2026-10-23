import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
const read = (name: string) => readFileSync(name, "utf8");

describe("Seven requested interface revisions", () => {
  test("left vertical rail remains available on phones and desktop without bottom padding", () => {
    const nav=read("src/components/BottomNav.tsx");
    const css=read("src/styles.css");
    const mobile=read("mobile/mobile.css");
    expect(nav).toContain('className="bottom-nav left-rail-nav"');
    expect(nav).toContain('className="left-rail-nav__links flex flex-col');
    expect(nav).not.toContain("lg:hidden");
    expect(css).toContain(".bottom-nav.left-rail-nav");
    expect(css).toContain("left: 0; right: auto;");
    expect(css).toContain("padding-left: var(--rihab-rail-width)");
    expect(mobile).toContain("padding-left: var(--rihab-rail-width, 76px)");
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
  test("no book paging buttons, sensitivity sliders or continuous/paged mode toggles", () => {
    for (const path of ["src/components/OfflineBookPages.tsx", "src/components/PdfBookViewer.tsx"]) {
      const source=read(path);
      expect(source).not.toContain("BookReaderNavigation");
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
