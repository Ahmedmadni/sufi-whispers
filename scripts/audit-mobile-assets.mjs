/**
 * Offline preflight for the original Lovable media.
 * Lists precisely which files are available, invalid or still missing
 * before attempting an Android build. Does not download or modify media.
 *
 * node scripts/audit-mobile-assets.mjs
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";
import {
  assertSafeAssetDescriptor,
  validateFile,
  validateQuranFile,
} from "./mobile-integrity.mjs";

const directories = [
  "src/data/quran",
  "src/assets/quran",
  "src/assets/books",
];
const descriptions = directories.flatMap((directory) =>
  readdirSync(resolve(directory))
    .filter((name) => name.endsWith(".asset.json"))
    .sort()
    .map((name) => join(directory, name)),
);
const rows = [];
for (const descriptorPath of descriptions) {
  const desc = assertSafeAssetDescriptor(JSON.parse(readFileSync(descriptorPath, "utf8")));
  const staged = resolve("mobile/.public/mobile-assets", desc.filename);
  if (!existsSync(staged)) {
    rows.push({ file: desc.filename, status: "MISSING", bytes: desc.size });
    continue;
  }
  try {
    const result = validateFile(staged, desc.size);
    if (desc.filename === "hafsData_v2-0.json") validateQuranFile(staged);
    if (desc.filename === "hafsData_v2-0.json" && process.env.QURAN_EXPECTED_SHA256) {
      if (result.sha256 !== process.env.QURAN_EXPECTED_SHA256.toLowerCase()) {
        throw new Error("official Quran checksum does not match");
      }
    }
    rows.push({ file: desc.filename, status: "READY", bytes: result.bytes });
  } catch (error) {
    rows.push({
      file: desc.filename,
      status: "CORRUPT",
      bytes: desc.size,
      cause: String(error.message ?? error),
    });
  }
}
console.table(rows);
const missing = rows.filter((r) => r.status !== "READY");
if (missing.length) {
  console.error(
    `Missing or invalid media: ${missing.length} of ${rows.length} files.\n` +
    "Place original exported files in mobile/.public/mobile-assets/ or run " +
    "'bun run mobile:prepare' to attempt downloading from Lovable.",
  );
  process.exitCode = 1;
} else {
  console.log(`All ${rows.length} original mobile media files passed local verification.`);
}
