/**
 * Independent byte-for-byte Quran release reference.
 *
 * This version of hafsData_v2-0.json is documented as originating from the
 * King Fahd Quran Printing Complex in Quran Meta's source catalog. It is
 * separately hosted at an immutable, pinned Git commit and Git blob.
 *
 * Run in CI to compare exactly the independently archived original and the
 * Lovable source delivered for the app. NEVER derive the "expected" digest
 * from the current application file alone.
 */
import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const COMMIT = "11a5c201c0994f22bae7e2863d0aac17fcad9bc9";
const GIT_BLOB_SHA1 = "19bb7462d41b2c0d987967457f8dd0b95e61ae59";
const URL = `https://raw.githubusercontent.com/quran-center/quran-meta/${COMMIT}/examples/data-check/data/hafsData_v2-0.json`;
const SOURCE = "https://sufi-whispers.lovable.app";
const EXPECTED_BYTES = 3594552;
const descriptor = JSON.parse(readFileSync(resolve("src/data/quran/hafsData_v2-0.json.asset.json"), "utf8"));
if (descriptor.original_filename !== "hafsData_v2-0.json" || descriptor.size !== EXPECTED_BYTES ||
    !descriptor.url.startsWith("/__l5e/assets-v1/")) {
  throw new Error("Unexpected Quran original asset descriptor");
}
const appURL = new URL(descriptor.url, SOURCE);

async function getBytes(url) {
  const res = await fetch(url, {signal: AbortSignal.timeout(90000)});
  if (!res.ok) throw new Error(`Reference asset unavailable (HTTP ${res.status}) at ${new URL(url).host}`);
  const data = Buffer.from(await res.arrayBuffer());
  if (data.length !== EXPECTED_BYTES) throw new Error(`Quran reference length mismatch: ${data.length}`);
  return data;
}

const [reference, appOriginal] = await Promise.all([getBytes(URL), getBytes(appURL)]);
const blobHash = createHash("sha1")
  .update(`blob ${reference.length}\0`)
  .update(reference).digest("hex");
if (blobHash !== GIT_BLOB_SHA1) {
  throw new Error("Immutable Git blob hash mismatch for independent Quran reference");
}
if (!reference.equals(appOriginal)) {
  throw new Error("Quran app text is NOT byte-identical to independently archived Hafs v2.0");
}
const sha256 = createHash("sha256").update(reference).digest("hex");
const json = JSON.parse(reference.toString("utf8"));
if (!Array.isArray(json) || json.length !== 6236) {
  throw new Error("Unexpected independent Quran text structure or verse count");
}
if (existsSync(resolve("mobile/.public/mobile-assets/hafsData_v2-0.json"))) {
  const local = readFileSync(resolve("mobile/.public/mobile-assets/hafsData_v2-0.json"));
  if (!reference.equals(local)) throw new Error("Built Quran file is not the same as verified independent source");
}
console.log("PASS independently hosted King Fahd-derived Hafs source and app bytes match.");
console.log("Pinned third-party Git commit:", COMMIT);
console.log("Pinned reference git blob:", GIT_BLOB_SHA1);
console.log("Verified canonical Hafs SHA-256:", sha256);
console.log("HAFS_REFERENCE_SHA256=" + sha256);
