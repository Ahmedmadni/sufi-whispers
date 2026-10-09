/**
 * Prepare a fully local Android content package.
 * No asset failure may silently degrade a Quran/reading release.
 * A previously exported original file can be placed under
 * mobile/.public/mobile-assets/ to build without network access.
 */
import {
  cpSync, existsSync, mkdirSync, readFileSync, readdirSync,
  statSync, writeFileSync,
} from "node:fs";
import { join, resolve } from "node:path";
import { createHash } from "node:crypto";
import {
  assertSafeAssetDescriptor,
  validateFile,
  validateQuranFile,
} from "./mobile-integrity.mjs";

const root = resolve(".");
const output = resolve("mobile/.public");
const assetsDir = join(output, "mobile-assets");
const sourceOrigin = process.env.CONTENT_ASSET_ORIGIN || "https://sufi-whispers.lovable.app";
const originUrl = new URL(sourceOrigin);
if (originUrl.protocol !== "https:") throw new Error("CONTENT_ASSET_ORIGIN must use HTTPS");

function descriptorsIn(folder) {
  return readdirSync(resolve(folder))
    .filter((file) => file.endsWith(".asset.json"))
    .sort()
    .map((file) => resolve(folder, file));
}
const paths = [
  resolve("src/data/quran/hafsData_v2-0.json.asset.json"),
  resolve("src/assets/quran/uthmanic_hafs_v20.ttf.asset.json"),
  ...descriptorsIn("src/assets/books"),
];
const descriptors = paths.map((file) => ({
  ...assertSafeAssetDescriptor(JSON.parse(readFileSync(file, "utf8"))),
  descriptorPath: file,
}));
const names = descriptors.map((asset) => asset.filename);
if (new Set(names).size !== names.length) {
  throw new Error("Duplicate mobile asset filenames would overwrite one another");
}
if (!names.includes("hafsData_v2-0.json") || !names.includes("uthmanic_hafs_v20.ttf")) {
  throw new Error("Missing official Quran data or font descriptor");
}
mkdirSync(assetsDir, { recursive: true });

// Keep source public resources, including the /book.pdf catalog entry.
cpSync(join(root, "public"), output, { recursive: true, force: true });

const checksums = [];
for (const asset of descriptors) {
  const { filename, size, url } = asset;
  const target = join(assetsDir, filename);
  if (!existsSync(target)) {
    const remote = new URL(url, originUrl);
    if (remote.origin !== originUrl.origin) {
      throw new Error(`Asset origin mismatch for ${filename}`);
    }
    let response;
    try {
      response = await fetch(remote, {
        signal: AbortSignal.timeout(120_000),
        headers: { Accept: "application/octet-stream,application/pdf,application/json,*/*" },
      });
    } catch (error) {
      throw new Error(
        `Cannot retrieve ${filename}. Export the original from Lovable to ${target}: ${error}`,
      );
    }
    if (!response.ok) {
      throw new Error(
        `Cannot retrieve ${filename} (HTTP ${response.status}). Export the original Lovable asset to ${target}.`,
      );
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length !== size) {
      throw new Error(`Incorrect byte length for ${filename}: ${bytes.length} vs ${size}`);
    }
    writeFileSync(target, bytes);
  }
  const { bytes, sha256 } = validateFile(target, size);
  if (filename === "hafsData_v2-0.json") {
    const report = validateQuranFile(target);
    console.log(`Validated Quran data: ${report.verses} verses, ${report.suras} suras, ${report.pages} pages`);
    const expected = process.env.QURAN_EXPECTED_SHA256?.toLowerCase();
    if (expected && expected !== sha256) {
      throw new Error("Quran SHA-256 does not match the authoritative checksum");
    }
    if (!expected) {
      console.warn("QURAN_EXPECTED_SHA256 was not provided; publisher-level checksum still needs verification.");
    }
  }
  checksums.push({ filename, bytes, sha256 });
  console.log(`Verified: ${filename} (${Math.round(bytes / 1024)} KiB)`);
}
const pdfjsPath = join(output, "pdfjs");
if (!existsSync(join(pdfjsPath, "cmaps")) ||
    !existsSync(join(pdfjsPath, "standard_fonts"))) {
  throw new Error("Missing local PDF.js resources; run scripts/prepare-pdf-assets.mjs first");
}
if (!existsSync(join(output, "book.pdf")) || statSync(join(output, "book.pdf")).size < 1000) {
  throw new Error("The principal /book.pdf has not been staged");
}
writeFileSync(
  join(assetsDir, "manifest.json"),
  JSON.stringify({ format: 2, createdAt: new Date().toISOString(), assets: checksums }, null, 2),
);
console.log(`Prepared ${checksums.length} verified local assets for Android.`);
