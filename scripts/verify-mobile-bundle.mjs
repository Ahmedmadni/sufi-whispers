/**
 * Check built Capacitor web assets for missing/offline resources.
 * Call only after vite build; catches "APK opens but Quran is empty" failures.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { resolve, join } from "node:path";
import { assertSafeAssetDescriptor, validateFile, validateQuranFile } from "./mobile-integrity.mjs";

const dist = resolve("dist-mobile");
const assetDir = join(dist, "mobile-assets");
const required = [
  join(dist, "index.html"),
  join(dist, "book.pdf"),
  join(dist, "pdfjs/cmaps"),
  join(dist, "pdfjs/standard_fonts"),
  join(assetDir, "manifest.json"),
];
for (const path of required) {
  if (!existsSync(path)) throw new Error(`Mobile build is missing ${path}`);
}
const html = readFileSync(join(dist, "index.html"), "utf8");
if (!html.includes('id="root"') || !html.includes('lang="ar"')) {
  throw new Error("Mobile HTML lacks the React root or Arabic document language");
}
const jsDir = join(dist, "assets");
if (!existsSync(jsDir) ||
    !readdirSync(jsDir).some((name) => name.endsWith(".js"))) {
  throw new Error("Mobile Javascript output is missing");
}
const manifest = JSON.parse(readFileSync(join(assetDir, "manifest.json"), "utf8"));
if (manifest.format !== 2 || !Array.isArray(manifest.assets)) {
  throw new Error("Mobile content integrity manifest format is unsupported");
}
const actual = new Map(manifest.assets.map((entry) => [entry.filename, entry]));
const descriptors = [
  resolve("src/data/quran/hafsData_v2-0.json.asset.json"),
  resolve("src/assets/quran/uthmanic_hafs_v20.ttf.asset.json"),
  ...readdirSync(resolve("src/assets/books"))
    .filter((name) => name.endsWith(".asset.json"))
    .sort()
    .map((name) => resolve("src/assets/books", name)),
];
if (actual.size !== descriptors.length) {
  throw new Error("The mobile package omits an expected content asset");
}
for (const path of descriptors) {
  const { filename, size } = assertSafeAssetDescriptor(JSON.parse(readFileSync(path, "utf8")));
  const item = actual.get(filename);
  if (!item) throw new Error(`Missing content asset: ${filename}`);
  const file = join(assetDir, filename);
  const value = validateFile(file, size);
  if (item.bytes !== value.bytes || item.sha256 !== value.sha256) {
    throw new Error(`Content integrity mismatch: ${filename}`);
  }
  if (filename === "hafsData_v2-0.json") validateQuranFile(file);
}
if (statSync(join(dist, "book.pdf")).size < 1000) {
  throw new Error("The main book PDF is empty");
}
console.log(`Verified self-contained Android web build: ${actual.size} media assets, PDF.js and Quran integrity.`);
