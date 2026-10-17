/**
 * Android-only post-build deduplication for seven rendered books.
 *
 * Production PDF originals are intentionally preserved in mobile/.public and
 * in the GitHub cloud backup. Only the 7 duplicates inside dist-mobile are
 * removed AFTER successful PDF->WebP rendering and full integrity validation.
 * The primary /book.pdf remains untouched: its Android reader uses PDF.js.
 */
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync, unlinkSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

export const ORIGINAL_PDFS = Object.freeze([
  "ward-tuli.pdf", "sirah-khaliliyya.pdf", "kashf-al-ghita.pdf",
  "nafahat-khaliliyya.pdf", "al-murabbi.pdf", "manaqib-khaliliyya.pdf",
  "manahil-khaliliyya.pdf",
]);

function json(file) { return JSON.parse(readFileSync(file, "utf8")); }
function sha(file) { return createHash("sha256").update(readFileSync(file)).digest("hex"); }

export function compactAndroidBookPdfs(distRoot = resolve("dist-mobile"), sourceRoot = resolve("mobile/.public")) {
  const assetDir = join(distRoot, "mobile-assets");
  const originalDir = join(sourceRoot, "mobile-assets");
  const manifestFile = join(assetDir, "manifest.json");
  const manifest = json(manifestFile);
  const books = json(join(distRoot, "offline-books", "manifest.json"));
  if (manifest.format !== 2 || !Array.isArray(manifest.assets) ||
      books.version !== 1 || Object.keys(books.books ?? {}).length !== 7) {
    throw new Error("Cannot compact unverified Android book assets");
  }
  if (manifest.compactedOriginalPdfs !== undefined) {
    throw new Error("Already compacted: never silently repeat Android PDF removal");
  }
  const expected = new Set(ORIGINAL_PDFS);
  const bookSources = Object.values(books.books).map(book => book.source);
  if (bookSources.length !== expected.size || new Set(bookSources).size !== expected.size ||
      bookSources.some(source => !expected.has(source))) {
    throw new Error("Offline book sources differ from expected seven PDF originals");
  }
  if (!existsSync(join(distRoot, "book.pdf")) || statSync(join(distRoot, "book.pdf")).size < 1000) {
    throw new Error("Primary PDF reader source is missing; refusing compaction");
  }

  if (Object.values(books.books).reduce((sum, book) => sum + book.pageCount, 0) !== 1040) {
    throw new Error("Cannot compact incomplete offline library: expected all 1040 pages");
  }
  let saved = 0;
  // ALL safety/integrity checks happen before the first deletion.
  const removals = [];
  for (const [bookId, book] of Object.entries(books.books)) {
    const entry = manifest.assets.find(asset => asset.filename === book.source);
    const packageFile = join(assetDir, book.source);
    const sourceFile = join(originalDir, book.source);
    if (!entry || basename(book.source) !== book.source ||
        !Number.isSafeInteger(entry.bytes) || entry.bytes < 100 ||
        !/^[a-f0-9]{64}$/.test(entry.sha256) ||
        entry.sha256 !== book.sourceSha256 ||
        !Array.isArray(book.pages) || book.pages.length !== book.pageCount || book.pageCount === 0) {
      throw new Error(`Invalid staged original metadata: ${bookId}`);
    }
    for (const file of [packageFile, sourceFile]) {
      if (!existsSync(file) || !statSync(file).isFile() ||
          statSync(file).size !== entry.bytes || sha(file) !== entry.sha256) {
        throw new Error(`Missing or corrupted PDF original: ${bookId}`);
      }
    }
    for (const page of book.pages) {
      const pageFile = join(distRoot, "offline-books", bookId, page.name);
      if (!/^\d{4}\.webp$/.test(page.name) || !existsSync(pageFile) ||
          statSync(pageFile).size !== page.bytes || sha(pageFile) !== page.sha256) {
        throw new Error(`Cannot remove PDF without complete verified offline pages: ${bookId}`);
      }
    }
    saved += entry.bytes;
    removals.push(packageFile);
  }
  // Prevent deleting the principal book or any non-approved source.
  if (removals.length !== expected.size || removals.some(file => !expected.has(basename(file)))) {
    throw new Error("Unsafe Android compaction target list");
  }
  for (const file of removals) unlinkSync(file);
  // Preserve original SHA-256 provenance in manifest while marking intentional
  // removal from APK. All other source assets are still physically bundled.
  manifest.compactedOriginalPdfs = [...ORIGINAL_PDFS];
  writeFileSync(manifestFile, JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Compacted Android package: removed 7 redundant book PDFs (${saved} bytes, ${(saved / 1048576).toFixed(2)} MiB).`);
  console.log("All 1040 scanned book pages, primary PDF and 604 original printed Quran pages remain bundled.");
  return saved;
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(new URL(import.meta.url).pathname)) {
  compactAndroidBookPdfs();
}
