import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");

describe("Android final UI and offline library gates", () => {
  test("seven external books use packaged pages without touching the primary PDF", () => {
    const route = read("src/routes/books.$bookId.tsx");
    expect(route).toContain('book.id !== "nafahat"');
    expect(route).toContain("<OfflineBookPages");
    expect(route).toContain("<PdfBookViewer");
    const renderer = read("scripts/prepare-offline-books.py");
    for (const id of ["ward", "sirah", "kashf", "nafahat-khaliliyya", "murabbi", "manaqib", "manahil"]) {
      expect(renderer).toContain('"' + id + '":');
    }
    expect(renderer).not.toContain('"nafahat":');
    const verifier = read("scripts/verify-mobile-bundle.mjs");
    expect(verifier).toContain("Verified all seven offline books and every rendered page.");
    expect(verifier).toContain("sourceSha256");
  });

  test("library has a top search overlay and no category chips", () => {
    const library = read("src/routes/library.tsx");
    expect(library).toContain('role="dialog"');
    expect(library).toContain('type="search"');
    expect(library).toContain("library-islamic-frame");
    expect(library).not.toContain("categoryChips");
    expect(library).not.toContain("rihab-ornament");
    expect(library).toContain('aria-label="الكتب المتوفرة"');
  });

  test("surah virtues are collapsed until their title is tapped", () => {
    const virtues = read("src/components/SurahVirtues.tsx");
    expect(virtues).toContain("<details");
    expect(virtues).toContain("<summary");
    expect(virtues).not.toContain('Star className=');
  });

  test("Android footer disappears, Facebook is in top header and developer contact is in Path tab", () => {
    expect(read("src/components/SiteFooter.tsx")).toContain('VITE_MOBILE === "true") return null');
    const header = read("src/components/SiteHeader.tsx");
    expect(header).toContain("https://www.facebook.com/groups/alkhaleelih/");
    const path = read("src/routes/shaykh.tsx");
    expect(path).toContain("<DeveloperSignature />");
    expect(read("src/components/DeveloperSignature.tsx")).toContain("https://www.facebook.com/elmadni1998");
    expect(read("mobile/mobile.css")).toContain("font-size: clamp(14px, 3.65vw, 16px)");
  });
});
