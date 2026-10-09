/**
 * Invariant checks for locally packaged Quran and other mobile content.
 * Intentionally independent of React/Bun: usable from Node, Bun and CI.
 * The verified source text is never altered.
 */
import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";

export function validateQuranData(input) {
  if (!Array.isArray(input) || input.length !== 6236) {
    throw new Error("Quran data must contain exactly 6236 verses");
  }
  const pairs = new Set();
  const suras = new Set();
  const pages = new Set();
  let previousPage = 0;
  let currentSura = 1;
  let nextAya = 1;

  for (const [index, aya] of input.entries()) {
    if (aya == null || typeof aya !== "object") {
      throw new Error(`Invalid Quran verse at index ${index}`);
    }
    const { sura_no, aya_no, page, aya_text, aya_text_emlaey } = aya;
    if (!Number.isInteger(sura_no) || sura_no < 1 || sura_no > 114 ||
        !Number.isInteger(aya_no) || aya_no < 1 ||
        !Number.isInteger(page) || page < 1 || page > 604 ||
        typeof aya_text !== "string" || aya_text.trim() === "" ||
        typeof aya_text_emlaey !== "string" || aya_text_emlaey.trim() === "") {
      throw new Error(`Quran verse has missing/invalid data at index ${index}`);
    }
    if (sura_no !== currentSura) {
      if (sura_no !== currentSura + 1) {
        throw new Error(`Quran sura order mismatch at index ${index}`);
      }
      currentSura = sura_no;
      nextAya = 1;
    }
    if (aya_no !== nextAya++) {
      throw new Error(`Quran aya order mismatch in sura ${sura_no}`);
    }
    if (page < previousPage) {
      throw new Error(`Quran pages are not ascending at index ${index}`);
    }
    const key = `${sura_no}:${aya_no}`;
    if (pairs.has(key)) throw new Error(`Duplicate Quran verse ${key}`);
    pairs.add(key);
    suras.add(sura_no);
    pages.add(page);
    previousPage = page;
  }
  if (suras.size !== 114 || previousPage !== 604 || pages.size !== 604) {
    throw new Error("Quran must contain 114 ordered suras and all 604 pages");
  }
  return { verses: pairs.size, suras: suras.size, pages: previousPage };
}

export function validateFile(source, expectedSize) {
  if (!Number.isSafeInteger(expectedSize) || expectedSize <= 0) {
    throw new Error("Invalid expected asset byte count");
  }
  const size = statSync(source).size;
  if (size !== expectedSize) {
    throw new Error(`Asset length mismatch: ${source} expected ${expectedSize}, got ${size}`);
  }
  const bytes = readFileSync(source);
  if (source.endsWith(".pdf") &&
      !bytes.subarray(0, Math.min(bytes.length, 1024)).includes(Buffer.from("%PDF-"))) {
    throw new Error(`PDF file signature is invalid: ${source}`);
  }
  if (source.endsWith(".ttf")) {
    const fontSignature = bytes.subarray(0, 4).toString("hex");
    if (!["00010000", "4f54544f", "74727565", "74746366"].includes(fontSignature)) {
      throw new Error(`Font file signature is invalid: ${source}`);
    }
  }
  return {
    bytes: size,
    sha256: createHash("sha256").update(bytes).digest("hex"),
  };
}

export function assertSafeAssetDescriptor(descriptor) {
  const { url, original_filename: filename, size } = descriptor ?? {};
  if (typeof filename !== "string" || !/^[a-zA-Z0-9._-]+$/.test(filename) ||
      filename === "." || filename === ".." ||
      typeof url !== "string" || !url.startsWith("/__l5e/assets-v1/") ||
      url.includes("?") || url.includes("#") ||
      !Number.isSafeInteger(size) || size < 1) {
    throw new Error("Invalid content asset descriptor");
  }
  return { filename, url, size };
}

export function validateQuranFile(path) {
  return validateQuranData(JSON.parse(readFileSync(path, "utf8")));
}
