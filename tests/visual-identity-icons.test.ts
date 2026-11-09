import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("Rihab app visual identity v2", () => {
  test("preserves the five native destinations and improves navigation glyphs", () => {
    const nav = read("src/components/BottomNav.tsx");
    expect((nav.match(/<Link\s/g) ?? []).length).toBe(5);
    for (const dest of ['to="/"', 'to="/quran/printed"', 'to="/dhikr"', 'to="/library"', 'to="/shaykh"']) {
      expect(nav).toContain(dest);
    }
    for (const name of ["الرئيسية", "المصحف", "الذكر", "المكتبة", "الطريق"]) {
      expect(nav).toContain(name);
    }
    expect(nav).toContain('aria-label="التنقّل السريع"');
    expect(nav).toContain('className="bottom-nav lg:hidden"');
    expect(nav).toContain('strokeWidth={2.25}');
    expect(nav).toContain('className="h-[22px] w-[22px]"');
    expect(nav).toContain('className="rihab-nav-item__icon"');
    expect(nav).toContain("TasbihIcon");
  });

  test("keeps the approved authentic logo and fixes hidden desktop navigation", () => {
    const header = read("src/components/SiteHeader.tsx");
    expect(header).toContain('import logo from "@/assets/rihab-logo-clean.png"');
    expect(header).toContain('alt="شعار الجمعية الخليلية الإسلامية"');
    expect(header).toContain('hidden lg:inline-flex');
    expect(header).toContain('aria-label="التنقل الرئيسي"');
    expect(header).toContain('aria-label="الإعدادات والنسخ الاحتياطي"');
    expect(header).toContain('h-[22px] w-[22px]');
    expect(header).toContain('h-11 w-11');
  });

  test("web SSR and packaged Android load the same offline-safe style last", () => {
    const root = read("src/routes/__root.tsx");
    const mobile = read("mobile/main.tsx");
    expect(root).toContain('import identityCss from "../rihab-identity.css?url"');
    expect(root).toContain('{ rel: "stylesheet", href: identityCss }');
    expect(root.indexOf('{ rel: "stylesheet", href: daylightCss }')).toBeLessThan(root.indexOf('{ rel: "stylesheet", href: identityCss }'));
    expect(mobile.indexOf('import "../src/rihab-daylight.css"')).toBeLessThan(mobile.indexOf('import "../src/rihab-identity.css"'));
    const style = read("src/rihab-identity.css");
    expect(style).not.toMatch(/@import|https?:\/\//);
    expect(style).toContain("--rihab-ui-emerald");
    expect(style).toContain("--rihab-ui-brass");
  });

  test("active navigation has shape AND contrast; all focusable icons have visible keyboard focus", () => {
    const style = read("src/rihab-identity.css");
    expect(style).toContain('.rihab-nav-item[data-status="active"] .rihab-nav-item__icon');
    expect(style).toContain('.rihab-nav-item[data-status="active"] .rihab-nav-item__label');
    expect(style).toContain('.rihab-nav-item[aria-current="page"]');
    expect(style).toContain('min-height: 68px');
    expect(style).toContain('.rihab-header-action:focus-visible');
    expect(style).toContain('.rihab-nav-item:focus-visible');
    expect(style).toContain('.rihab-dialog-close:focus-visible');
    expect(style).toContain('@media (prefers-reduced-motion: reduce)');
  });

  test("clearer library search and book entry cards preserve real covers", () => {
    const lib = read("src/routes/library.tsx");
    const home = read("src/routes/index.tsx");
    const style = read("src/rihab-identity.css");
    expect(lib).toContain("rihab-library-search__icon");
    expect(lib).toContain("rihab-library-search__count");
    expect(lib).toContain("rihab-book-tile__action");
    expect(lib).toContain('aria-label="البحث في الكتب"');
    expect(lib).toContain("<BookCover");
    expect(home).toContain("rihab-shortcut-card__icon");
    expect(home).toContain("rihab-book-tile");
    expect(style).toContain("min-height: 58px");
    expect(style).toContain(".reader-floating-index");
    expect(style).toContain(".printed-immersive__button svg");
    expect(style).not.toContain(".mushaf-sheet");
    expect(style).not.toContain(".mushaf-text");
    expect(style).not.toContain(".react-pdf__Page");
  });

  test("existing Cairo title and IBM text choices are unchanged", () => {
    const source = read("src/styles.css");
    expect(source).toContain('--font-display: "Cairo", "IBM Plex Sans Arabic"');
    expect(source).toContain('--font-body: "IBM Plex Sans Arabic"');
    expect(source).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
