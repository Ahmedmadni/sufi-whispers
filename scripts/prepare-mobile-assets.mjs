/**
 * Prepare a truly local Quran, book collection and PDF.js resources for
 * the standalone Android bundle. A failed download MUST fail the build:
 * silently shipping empty Quran/book files would be worse than no APK.
 *
 * Existing files are reusable when their byte size matches the original
 * Lovable descriptors. To work offline in CI, provide the verified files
 * in mobile/.public/mobile-assets before invoking this script.
 */
import {
  copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync,
  statSync, writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";

const root = resolve(".");
const output = resolve("mobile/.public");
const assetsDir = join(output, "mobile-assets");
const sourceOrigin = process.env.CONTENT_ASSET_ORIGIN || "https://sufi-whispers.lovable.app";

function descriptorsIn(folder) {
  return readdirSync(resolve(folder))
    .filter((file) => file.endsWith(".asset.json"))
    .map((file) => resolve(folder, file));
}
const descriptors = [
  resolve("src/data/quran/hafsData_v2-0.json.asset.json"),
  resolve("src/assets/quran/uthmanic_hafs_v20.ttf.asset.json"),
  ...descriptorsIn("src/assets/books"),
];
mkdirSync(assetsDir, { recursive: true });

// Copy existing public assets including the main /book.pdf and PDF.js resources.
// Avoid recursively copying generated mobile assets into the staging directory.
cpSync(join(root, "public"), output, { recursive: true, force: true });

const checksums = [];
for (const source of descriptors) {
  const asset = JSON.parse(readFileSync(source, "utf8"));
  const { original_filename: filename, size, url } = asset;
  if (
    !filename || filename.includes("/") || filename.includes("\\") ||
    !Number.isSafeInteger(size) || size < 1 ||
    !url.startsWith("/__l5e/assets-v1/")
  ) throw new Error(`Invalid Lovable asset descriptor: ${source}`);

  const target = join(assetsDir, filename);
  if (!existsSync(target) || statSync(target).size !== size) {
    const assetUrl = new URL(url, sourceOrigin);
    const response = await fetch(assetUrl, { signal: AbortSignal.timeout(120_000) });
    if (!response.ok) throw new Error(`Failed downloading ${filename}: HTTP ${response.status}`);
    const data = Buffer.from(await response.arrayBuffer());
    if (data.length !== size) {
      throw new Error(`Asset size mismatch for ${filename}: expected ${size}, got ${data.length}`);
    }
    if (filename === "hafsData_v2-0.json") {
      const verses = JSON.parse(data.toString("utf8"));
      if (!Array.isArray(verses) || verses.length !== 6236 ||
          !verses.every((a) => Number.isInteger(a.page) && a.page >= 1 &&
            a.page <= 604 && typeof a.aya_text === "string")) {
        throw new Error("Quran dataset shape validation failed; refusing to package");
      }
    }
    writeFileSync(target, data);
  }
  const bytes = readFileSync(target);
  checksums.push({
    filename,
    bytes: bytes.length,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  });
}
writeFileSync(
  join(assetsDir, "manifest.json"),
  JSON.stringify({ format: 1, createdAt: new Date().toISOString(), assets: checksums }, null, 2),
);
console.log(`Prepared ${checksums.length} local mobile assets for Android.`);
