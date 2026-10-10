import { describe, expect, test } from "bun:test";
import {
  validateOfflineMushafManifest, offlinePrintedPageImageUrl,
  APPROVED_MUSHAF_SHA256, PRINTED_PAGE_IMAGE_BASE,
  printedPageImageUrl,
} from "../src/lib/printed-mushaf-pages";

function manifest() {
  return {
    format: 1,
    sourceSha256: APPROVED_MUSHAF_SHA256,
    pageCount: 604,
    pages: Object.fromEntries(
      Array.from({ length: 604 }, (_, i) => [
        String(i + 1), {
          name: `${String(i + 1).padStart(3, "0")}.${i % 2 === 0 ? "webp" : "png"}`,
          bytes: i + 100,
          sha256: "a".repeat(64),
        },
      ]),
    ),
  };
}

describe("Android Quran — full offline image mapping", () => {
  test("all 604 pages point only to local WebView assets, without network fallbacks", () => {
    const approved = validateOfflineMushafManifest(manifest());
    const unique = new Set<string>();
    for (let page = 1; page <= 604; page++) {
      const url = offlinePrintedPageImageUrl(page, approved);
      expect(url).toMatch(/^\/printed-mushaf\/pages\/\d{3}\.(?:png|webp)$/);
      expect(url).not.toContain("github.com");
      unique.add(url);
    }
    expect(unique.size).toBe(604);
    expect(offlinePrintedPageImageUrl(0, approved)).toBe(offlinePrintedPageImageUrl(1, approved));
    expect(offlinePrintedPageImageUrl(605, approved)).toBe(offlinePrintedPageImageUrl(604, approved));
  });

  test("rejects missing or non-verified source manifest, not silently showing remote pages", () => {
    const data = manifest();
    delete (data.pages as Record<string, unknown>)["604"];
    expect(() => validateOfflineMushafManifest(data)).toThrow();

    const substituted = manifest();
    substituted.sourceSha256 = "0".repeat(64);
    expect(() => validateOfflineMushafManifest(substituted)).toThrow();

    const pathInjection = manifest();
    pathInjection.pages["12"].name = "../../index.html";
    expect(() => validateOfflineMushafManifest(pathInjection)).toThrow();

    const invalidHash = manifest();
    invalidHash.pages["50"].sha256 = "xyz";
    expect(() => validateOfflineMushafManifest(invalidHash)).toThrow();
  });

  test("website retains the original pinned image CDN and offline-mode resolver is separate", () => {
    const page = printedPageImageUrl(1);
    // These module tests run with VITE_MOBILE unset; web URL is unchanged.
    expect(page).toBe(`${PRINTED_PAGE_IMAGE_BASE}/001.png`);
    expect(page).toContain("0b944b349fd28295803a0a96fbf2906a14286245");
  });
});
