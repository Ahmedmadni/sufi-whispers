import { describe, expect, test } from "bun:test";
import { loadLocalBookPdf } from "../src/lib/book-pdf-source";
import { getPrintedPageCrop, validateOfflineMushafManifest, APPROVED_MUSHAF_SHA256 } from "../src/lib/printed-mushaf-pages";
import { playDhikrTap } from "../src/lib/dhikr-sound";

describe("Actual Android device regression gates", () => {
  test("book reader checks genuine offline PDF bytes without HTTP range requests", async () => {
    const original = new TextEncoder().encode("%PDF-1.6\n" + "x".repeat(1024));
    const previous = globalThis.fetch;
    let requestUrl = "";
    globalThis.fetch = (async (url: string | URL | Request) => {
      requestUrl = String(url);
      return new Response(original, { status: 200, headers: { "content-type": "application/pdf" } });
    }) as typeof fetch;
    try {
      const bytes = await loadLocalBookPdf("/mobile-assets/al-murabbi.pdf");
      expect(bytes).toEqual(original);
      expect(requestUrl).toBe("/mobile-assets/al-murabbi.pdf");
    } finally { globalThis.fetch = previous; }
  });

  test("book loader rejects HTML masquerading as PDF, bad paths and missing books", async () => {
    const previous = globalThis.fetch;
    globalThis.fetch = (async () => new Response("<html>" + "x".repeat(1000), { status: 200 })) as typeof fetch;
    try {
      await expect(loadLocalBookPdf("/mobile-assets/book.pdf")).rejects.toThrow(/PDF/);
      await expect(loadLocalBookPdf("https://outside.example/book.pdf")).rejects.toThrow(/مسار/);
      await expect(loadLocalBookPdf("/../secret")).rejects.toThrow(/مسار/);
    } finally { globalThis.fetch = previous; }
  });

  test("offline pages expose safe independent gutter crops without altering PNG data", () => {
    const entry = Object.fromEntries(Array.from({ length: 604 }, (_, i) => [
      String(i + 1), {
        name: `${String(i + 1).padStart(3, "0")}.webp`,
        bytes: 2048,
        sha256: "a".repeat(64),
        crop: [40, 48, 90, 55],
      },
    ]));
    const approved = validateOfflineMushafManifest({
      format: 1, sourceSha256: APPROVED_MUSHAF_SHA256,
      pageCount: 604, pages: entry,
    });
    expect(getPrintedPageCrop(100, approved)).toEqual([40,48,90,55]);
    expect(getPrintedPageCrop(100)).toEqual([38,0,19,0]);
    expect(getPrintedPageCrop(99)).toEqual([19,0,38,0]);
    entry["604"].crop = [-1, 0, 0, 0];
    expect(() => validateOfflineMushafManifest({
      format: 1, sourceSha256: APPROVED_MUSHAF_SHA256, pageCount: 604, pages: entry,
    })).toThrow();
  });

  test("audio effects do not crash in non-browser or SSR environments", () => {
    expect(playDhikrTap()).toBe(false);
  });
});
