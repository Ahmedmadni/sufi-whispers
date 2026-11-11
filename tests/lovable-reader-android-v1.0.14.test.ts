import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
const css = read("src/rihab-identity.css");
const readerCss = read("src/printed-pdf-reader.css");
const card = read("src/components/VerseCardDialog.tsx");

describe("Lovable 2026-11-11 Android follow-through", () => {
  test("floating toolbar and audio share viewport positioning origin", () => {
    expect(readerCss).toContain(".reader-floating-index {");
    expect(readerCss).toContain("position: absolute;");
    // The final identity stylesheet MUST override the old absolute positioning.
    expect(css).toContain("Lovable follow-through: the reader viewport");
    expect(css).toContain(".book-reader-layout.book-reader--with-wird .reader-floating-index {\n  position: fixed;");
    expect(css).toContain("--wird-dock-viewport-bottom: 77px");
    expect(css).toContain("--wird-dock-visual-height: 102px");
    expect(css).toContain("--wird-reader-toolbar-gap: 8px");
    expect(css).toContain("var(--wird-dock-viewport-bottom) +");
    expect(css).toContain("var(--wird-dock-visual-height) +");
    expect(css).toContain("var(--wird-reader-toolbar-gap) +");
    expect(css).toContain("z-index: 160;");
    expect(css).toContain("padding-bottom: 206px;");
    expect(css).toContain("scroll-padding-bottom: 195px;");
    const finalIndex = css.lastIndexOf(".book-reader-layout.book-reader--with-wird .reader-floating-index");
    const legacyIndex = css.indexOf("bottom: calc(192px");
    expect(finalIndex).toBeGreaterThan(legacyIndex);
  });

  test("fullscreen, desktop and device safe-area never overlap bottom playback", () => {
    expect(css).toContain(".book-reader-layout.book-reader--immersive.book-reader--with-wird {");
    expect(css).toContain("--wird-dock-viewport-bottom: 12px;");
    expect(css).toContain("@media (min-width: 1024px)");
    expect(css).toContain("--wird-dock-viewport-bottom: 18px;");
    expect(css).toContain("env(safe-area-inset-bottom, 0px)");
    expect(css).toContain("max-height: min(46dvh, 440px);");
    const layout = read("src/components/BookReaderLayout.tsx");
    expect(layout).toContain('audioPage !== undefined ? "book-reader--with-wird"');
    expect(layout).toContain("createPortal(content, document.body)");
  });

  test("verse cards exist in both offline Android books and web PDF reader", () => {
    const web = read("src/components/PdfBookViewer.tsx");
    const android = read("src/components/OfflineBookPages.tsx");
    for (const src of [web, android]) {
      expect(src).toContain('import { VerseCardButton } from "@/components/VerseCardDialog"');
      expect(src).toContain("<VerseCardButton bookId={bookId} page={page} />");
    }
    expect(card).toContain('aria-label="تصميم بطاقة أبيات"');
    expect(card).toContain('className="verse-card-dialog');
    expect(card).toContain("drawVerseCard(canvas");
    expect(card).toContain('navigator.canShare?.({ files: [file] })');
    expect(card).toContain("navigator.share({ files: [file]");
    expect(card).toContain('link.download = fileName'); // Keep browser download without false save confirmation
  });

  test("Android image export does not claim that WebView definitely saved a file", () => {
    expect(card).not.toContain('toast.success("حُفظت البطاقة على جهازك")');
    expect(card).toContain("تم طلب تنزيل البطاقة");
    expect(card).toContain("تعذّر تجهيز صورة البطاقة");
    expect(card).toContain("جرّب المشاركة أو نسخ الأبيات");
    expect(card).toContain('navigator.clipboard.writeText');
    const verse = read("src/lib/verse-card.ts");
    expect(verse).toContain("VERSE_CARD_MAX_LINES = 8");
    expect(verse).toContain("square: { width: 1080, height: 1080 }");
    expect(verse).toContain("story: { width: 1080, height: 1920 }");
    expect(verse).toContain('const VERSE_FONT = "Amiri"');
  });

  test("next Android version is a compatible upgrade preserving signing identity", () => {
    const oldTag = read(".github/workflows/publish-signed-android-v1.0.13.yml");
    const metadata = JSON.parse(read("config/android-release.json"));
    expect(metadata.versionName).toBe("1.0.14");
    expect(metadata.versionCode).toBe(15);
    expect(metadata.applicationId).toBe("com.rihabalkhaliliyya.app");
    expect(metadata.signing.keyAlias).toBe("rihab-production");
    expect(metadata.signing.keystoreFileName).toBe("rihab-production.jks");
    expect(oldTag).toContain("false &&");
    const publisher = read(".github/workflows/publish-signed-android-v1.0.14.yml");
    expect(publisher).toContain("v1.0.14-android-rc1");
    expect(publisher).toContain("workflow_run:");
    expect(publisher).toContain("head_branch == 'main'");
    expect(publisher).toContain("signed-release");
    expect(publisher).toContain("Enforce release APK security flags and minimal permissions");
    expect(publisher).toContain("sha256sum");
    expect(publisher).toContain("gh release create");
    expect(publisher).not.toContain("RIHAB_SIGNING_MASTER_PASSWORD");
  });

  test("offline Quran remains untouched by UI improvements", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(read("src/styles.css")).toContain('--font-uthmani: "UthmanicHafs"');
    expect(read("src/printed-pdf-reader.css")).toContain(".offline-book-stage");
  });
});
