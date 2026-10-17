import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { compactAndroidBookPdfs, ORIGINAL_PDFS } from "../scripts/compact-android-book-pdfs.mjs";

const cases = [
  ["ward", 47], ["sirah", 159], ["kashf", 284],
  ["nafahat-khaliliyya", 70], ["murabbi", 241],
  ["manaqib", 167], ["manahil", 72],
];
function checksum(value: Buffer) {
  return createHash("sha256").update(value).digest("hex");
}
function write(path: string, bytes: Buffer | string) {
  mkdirSync(join(path, ".."), { recursive: true });
  writeFileSync(path, bytes);
}
function fixture() {
  const root = mkdtempSync(join(tmpdir(), "rihab-compact-"));
  const dist = join(root, "dist-mobile");
  const source = join(root, "mobile", ".public");
  const assets = [];
  const books: Record<string, unknown> = {};
  let originalBytes = 0;
  for (const [index, [id, count]] of cases.entries()) {
    const pdf = ORIGINAL_PDFS[index];
    const contents = Buffer.from("%PDF-1.7\n" + "verified source ".repeat(12) + id);
    const digest = checksum(contents);
    write(join(source, "mobile-assets", pdf), contents);
    write(join(dist, "mobile-assets", pdf), contents);
    assets.push({ filename: pdf, bytes: contents.length, sha256: digest });
    originalBytes += contents.length;
    const pages = [];
    for (let number = 1; number <= Number(count); number++) {
      const name = String(number).padStart(4, "0") + ".webp";
      const picture = Buffer.from("RIFF" + id + String(number));
      write(join(dist, "offline-books", String(id), name), picture);
      pages.push({ name, sha256: checksum(picture), bytes: picture.length, width: 900, height: 1200 });
    }
    books[String(id)] = { source: pdf, sourceSha256: digest, pageCount: Number(count), pages };
  }
  write(join(dist, "book.pdf"), "%PDF-1.7\n" + "primary reading text ".repeat(80));
  write(join(dist, "offline-books", "manifest.json"), JSON.stringify({ version: 1, books }));
  write(join(dist, "mobile-assets", "manifest.json"), JSON.stringify({ format: 2, assets }));
  return { root, dist, source, originalBytes };
}
const withFixture = (run: (f: ReturnType<typeof fixture>) => void) => {
  const f = fixture();
  try { run(f); } finally { rmSync(f.root, { recursive: true, force: true }); }
};

describe("Android PDF payload deduplication", () => {
  test("removes seven redundant APK PDFs, preserves original sources and all 1040 offline book pages", () => {
    withFixture(f => {
      expect(compactAndroidBookPdfs(f.dist, f.source)).toBe(f.originalBytes);
      for (const pdf of ORIGINAL_PDFS) {
        expect(existsSync(join(f.dist, "mobile-assets", pdf))).toBe(false);
        expect(existsSync(join(f.source, "mobile-assets", pdf))).toBe(true);
      }
      expect(existsSync(join(f.dist, "book.pdf"))).toBe(true);
      expect(existsSync(join(f.dist, "offline-books", "manahil", "0072.webp"))).toBe(true);
      const bundled = JSON.parse(readFileSync(join(f.dist, "mobile-assets", "manifest.json"), "utf8"));
      expect(bundled.compactedOriginalPdfs).toEqual(ORIGINAL_PDFS);
      expect(bundled.assets).toHaveLength(7);
      expect(() => compactAndroidBookPdfs(f.dist, f.source)).toThrow(/Already compacted/);
    });
  });
  test("fails closed before removing any PDF when a rendered page is missing", () => {
    withFixture(f => {
      rmSync(join(f.dist, "offline-books", "ward", "0001.webp"));
      expect(() => compactAndroidBookPdfs(f.dist, f.source)).toThrow(/verified offline pages/);
      for (const pdf of ORIGINAL_PDFS) expect(existsSync(join(f.dist, "mobile-assets", pdf))).toBe(true);
    });
  });
  test("fails closed if the retained backup original differs from packed manifest", () => {
    withFixture(f => {
      write(join(f.source, "mobile-assets", ORIGINAL_PDFS[0]), Buffer.from("corrupted original"));
      expect(() => compactAndroidBookPdfs(f.dist, f.source)).toThrow(/corrupted PDF original/);
      expect(existsSync(join(f.dist, "mobile-assets", ORIGINAL_PDFS[0]))).toBe(true);
    });
  });
  test("build verifies both original and compact variants, without changing web reader", () => {
    const build = readFileSync("package.json", "utf8");
    expect(build).toContain("bun run mobile:verify && node scripts/compact-android-book-pdfs.mjs && bun run mobile:verify");
    const verifier = readFileSync("scripts/verify-mobile-bundle.mjs", "utf8");
    expect(verifier).toContain("manifest.compactedOriginalPdfs");
    expect(verifier).toContain("totalOfflineBookPages !== 1040");
    expect(verifier).toContain("Verified all 604 offline Mushaf pages in APK web assets");
    const route = readFileSync("src/routes/books.$bookId.tsx", "utf8");
    expect(route).toContain('book.id !== "nafahat"');
    expect(route).toContain("<OfflineBookPages");
    expect(route).toContain("<PdfBookViewer");
  });
});
