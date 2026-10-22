/**
 * Check built Capacitor web assets for missing/offline resources.
 * Call only after vite build; catches "APK opens but Quran is empty" failures.
 */
import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { resolve, join } from "node:path";
import { assertSafeAssetDescriptor, validateFile, validateQuranFile } from "./mobile-integrity.mjs";

const dist = resolve("dist-mobile");
const assetDir = join(dist, "mobile-assets");
for (const recording of [
  ["hizb-1.mp3", 9357687, "92f50015584fe52add33cc919e4371785957e9bacb54131597294b4a61a095c1"],
  ["hizb-2.mp3", 11343344, "e973da3691fd34f60f7047028c646226d9c205245ae7c5a819f6469a40b5abaf"],
]) {
  const file = join(dist, "audio", "wird", recording[0]);
  if (!existsSync(file) || statSync(file).size !== recording[1] ||
    createHash("sha256").update(readFileSync(file)).digest("hex") !== recording[2]) {
    throw new Error("Android/Windows bundle missing owner-approved audio: " + recording[0]);
  }
}
console.log("Verified both original Wird audio recordings bundled for offline playback.");
const required = [
  join(dist, "index.html"),
  join(dist, "book.pdf"),
  join(dist, "pdfjs/pdf.worker.min.mjs"),
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
const fontCss = readFileSync(join(fontDir, "fonts.css"), "utf8");
for (const [family, file] of [
  ["IBM Plex Sans Arabic", "ibm-regular.ttf"],
  ["Cairo", "cairo-variable.ttf"],
  ["Amiri", "amiri-regular.ttf"],
]) {
  if (!fontCss.includes(`font-family:"${family}"`) || !fontCss.includes(`/mobile-assets/fonts/${file}`)) {
    throw new Error(`Android offline font stylesheet does not declare ${family}`);
  }
}
const html = readFileSync(join(dist, "index.html"), "utf8");
if (!html.includes('href="/mobile-assets/fonts/fonts.css"')) {
  throw new Error("Android startup does not load its packaged Arabic font stylesheet");
}
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
// Android's seven scanned books use pre-rendered local page images, not their
// original PDFs. The originals are verified at build time and deliberately
// omitted after compaction; no Quran text, font or primary PDF may be omitted.
const originalBookPdfs = new Set([
  "ward-tuli.pdf", "sirah-khaliliyya.pdf", "kashf-al-ghita.pdf",
  "nafahat-khaliliyya.pdf", "al-murabbi.pdf", "manaqib-khaliliyya.pdf",
  "manahil-khaliliyya.pdf",
]);
const removed = manifest.compactedOriginalPdfs;
if (removed !== undefined &&
    (!Array.isArray(removed) || removed.length !== 7 ||
      new Set(removed).size !== 7 || removed.some(name => !originalBookPdfs.has(name)))) {
  throw new Error("Android compact payload has an unexpected omitted original");
}
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
  if (removed?.includes(filename)) {
    if (existsSync(file) || item.bytes !== size ||
        typeof item.sha256 !== "string" || !/^[a-f0-9]{64}$/.test(item.sha256)) {
      throw new Error(`Invalid deliberately excluded Android original: ${filename}`);
    }
    continue;
  }
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
// Fail APK packaging if any of the seven non-primary books lacks an offline page.
const offlineBooksFile = join(dist, "offline-books/manifest.json");
if (!existsSync(offlineBooksFile)) throw new Error("Offline book image manifest missing");
const offlineBooks = JSON.parse(readFileSync(offlineBooksFile, "utf8"));
if (offlineBooks.version !== 1 || Object.keys(offlineBooks.books ?? {}).length !== 7) {
  throw new Error("Offline book manifest must include seven books");
}
let totalOfflineBookPages = 0;
for (const [id, book] of Object.entries(offlineBooks.books)) {
  if (!Array.isArray(book.pages) || book.pageCount !== book.pages.length || book.pageCount < 1) {
    throw new Error(`Incomplete offline book: ${id}`);
  }
  const original = join(assetDir, book.source);
  const knownSource = actual.get(book.source);
  if (!originalBookPdfs.has(book.source) ||
      !knownSource || knownSource.sha256 !== book.sourceSha256) {
    throw new Error(`Unrecognized offline book original: ${id}`);
  }
  if (removed?.includes(book.source)) {
    if (existsSync(original)) {
      throw new Error(`Compacted Android book PDF unexpectedly still bundled: ${id}`);
    }
  } else if (!existsSync(original) ||
             validateFile(original, statSync(original).size).sha256 !== book.sourceSha256) {
    throw new Error(`Offline book source changed: ${id}`);
  }
  for (const [index, page] of book.pages.entries()) {
    const name = String(index + 1).padStart(4, "0") + ".webp";
    if (page.name !== name || !Number.isInteger(page.width) || !Number.isInteger(page.height)) {
      throw new Error(`Offline book page invalid: ${id} page ${index + 1}`);
    }
    const file = join(dist, "offline-books", id, name);
    if (!existsSync(file)) throw new Error(`Offline book page missing: ${id}/${name}`);
    const check = validateFile(file, page.bytes);
    if (check.sha256 !== page.sha256) throw new Error(`Offline book page modified: ${id}/${name}`);
  }
  totalOfflineBookPages += book.pageCount;
}
if (totalOfflineBookPages !== 1040) {
  throw new Error(`Offline library must have exactly 1040 book pages, found ${totalOfflineBookPages}`);
}
if (removed && Object.values(offlineBooks.books).some(book => !removed.includes(book.source))) {
  throw new Error("Compact Android package has an unaccounted book PDF original");
}
console.log("Verified all seven offline books and every rendered page.");
if (removed) console.log("Verified compact Android bundle: all seven redundant PDF originals safely excluded.");
console.log(`Verified self-contained Android web build: ${actual.size} media assets, PDF.js and Quran integrity.`);
