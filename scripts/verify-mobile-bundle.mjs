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
const premiumFonts = ["ibm-light.ttf","ibm-regular.ttf","ibm-medium.ttf",
  "ibm-semibold.ttf","ibm-bold.ttf","cairo-variable.ttf",
  "amiri-regular.ttf","amiri-bold.ttf","fonts.css"];
const fontDir = join(assetDir, "fonts");
for (const name of premiumFonts) {
  const file = join(fontDir, name);
  if (!existsSync(file) || statSync(file).size < 300) {
    throw new Error(`Android premium Arabic font missing: ${name}`);
  }
}
console.log("Verified all premium Arabic fonts are packaged for offline Android.");
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
// Fail the Android build unless all 604 printed pages are physically
// present in the final WebView bundle and match their packed SHA-256.
const offlineRoot = join(dist, "printed-mushaf");
const offlineManifestFile = join(offlineRoot, "manifest.json");
if (!existsSync(offlineManifestFile)) {
  throw new Error("Android bundle has no packaged offline Mushaf");
}
const offlineManifest = JSON.parse(readFileSync(offlineManifestFile, "utf8"));
if (offlineManifest.format !== 1 ||
    offlineManifest.sourceSha256 !== "2f0b03925568fca326f47a5ec756df2c3eecc8b29f75471f3a0815a5a3e58d28" ||
    offlineManifest.pageCount !== 604 ||
    Object.keys(offlineManifest.pages ?? {}).length !== 604) {
  throw new Error("Offline Android Quran manifest mismatch");
}
let pageBytes = 0;
for (let page = 1; page <= 604; page++) {
  const item = offlineManifest.pages[String(page)];
  const stem = String(page).padStart(3, "0");
  if (!item || ![stem + ".webp", stem + ".png"].includes(item.name)) {
    throw new Error(`Offline Quran page index invalid at ${page}`);
  }
  const image = join(offlineRoot, "pages", item.name);
  if (!existsSync(image)) throw new Error(`Offline Quran image ${page} is missing`);
  const result = validateFile(image, item.bytes);
  if (result.sha256 !== item.sha256) {
    throw new Error(`Offline Quran page ${page} hash mismatch`);
  }
  pageBytes += item.bytes;
}
if (pageBytes !== offlineManifest.storedBytes) {
  throw new Error("Offline Quran image size accounting mismatch");
}
console.log(`Verified all 604 offline Mushaf pages in APK web assets: ${(pageBytes / 1048576).toFixed(2)} MiB.`);

if (statSync(join(dist, "book.pdf")).size < 1000) {
  throw new Error("The main book PDF is empty");
}
console.log(`Verified self-contained Android web build: ${actual.size} media assets, PDF.js and Quran integrity.`);
