import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { freshMobileAppUrl, isModuleLoadFailure } from "../src/lib/mobile-route-recovery";

const read = (path: string) => readFileSync(path, "utf8");

describe("Android 1.0.18 book reader WebView recovery", () => {
  test("detects failed dynamic imports and preserves other failures for diagnostics", () => {
    expect(isModuleLoadFailure(new TypeError("Failed to fetch dynamically imported module"))).toBe(true);
    expect(isModuleLoadFailure(new Error("Importing a module script failed."))).toBe(true);
    expect(isModuleLoadFailure(new Error("Loading chunk ABC failed"))).toBe(true);
    expect(isModuleLoadFailure(new Error("book page image missing"))).toBe(false);
  });

  test("cache bust is bounded and preserves the active offline book hash", () => {
    const source = "https://localhost/#/books/ward?wird=4";
    const retry = freshMobileAppUrl(source, "android-1.0.18");
    expect(retry).toBe("https://localhost/?rihab-assets=android-1.0.18#/books/ward?wird=4");
    expect(freshMobileAppUrl(retry!, "android-1.0.18")).toBeNull();
    expect(freshMobileAppUrl("file:///books/ward", "android-1.0.18")).toBeNull();
  });

  test("Capacitor bootstrap recovers a failed preload only once", () => {
    const script = read("mobile/main.tsx");
    expect(script).toContain('window.addEventListener("vite:preloadError"');
    expect(script).toContain('window.location.replace(next)');
    expect(script).toContain('freshMobileAppUrl(window.location.href, "android-1.0.18")');
    expect(script).toMatch(/^document[.]documentElement[.]classList[.]add[(]"rihab-android"[)];$/m);
  });

  test("PDF.js native compatibility polyfill runs BEFORE the reader modules", () => {
    const html = read("mobile/index.html");
    expect(html).toContain('typeof Promise.withResolvers !== "function"');
    expect(html.indexOf("Promise.withResolvers = function()")).toBeLessThan(html.indexOf('<script type="module" src="/main.tsx">'));
    expect(html).toContain('return { promise: promise, resolve: resolve, reject: reject };');
  });

  test("Android route error is actionable instead of an opaque dead end", () => {
    const root = read("src/routes/__root.tsx");
    expect(root).toContain('data-testid="rihab-reader-error-detail"');
    expect(root).toContain("if (isAndroid) window.location.reload()");
    expect(root).toContain("diagnostic.slice(0, 400)");
  });

  test("zoom fallback catches blocked Android WebView storage access", () => {
    const code = read("src/lib/book-zoom-preference.ts");
    expect(code).toContain("try {\\n      setZoom(readBookZoom(window.localStorage));\\n    } catch {\\n      setZoom(1);");
    expect(code).toContain('try { window.localStorage.setItem(BOOK_ZOOM_KEY');
  });

  test("all eight original source books and safety gates remain unchanged", () => {
    const books = read("src/data/books.ts");
    for (const id of ["nafahat", "ward", "sirah", "kashf", "nafahat-khaliliyya", "murabbi", "manaqib", "manahil"]) {
      expect(books).toContain(`id: "${id}"`);
    }
    const verifier = read("scripts/verify-mobile-bundle.mjs");
    expect(verifier).toContain("Verified all 604 offline Mushaf pages");
    expect(verifier).toContain("totalOfflineBookPages !== 1040");
  });
});
