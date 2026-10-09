import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  assertSafeAssetDescriptor, validateFile, validateQuranData, validateQuranFile,
} from "../scripts/mobile-integrity.mjs";

const fixture = () => {
  const rows = [];
  for (let sura = 1; sura <= 114; sura++) {
    const count = sura <= 80 ? 55 : 54;
    for (let aya = 1; aya <= count; aya++) {
      rows.push({
        sura_no: sura,
        aya_no: aya,
        page: Math.floor((rows.length * 604) / 6236) + 1,
        aya_text: "نص قرآني اختباري فقط",
        aya_text_emlaey: "نص اختباري",
      });
    }
  }
  return rows;
};

describe("offline Quran integrity gate", () => {
  it("accepts exactly 114 sequential suras, 6236 verses and 604 pages", () => {
    const result = validateQuranData(fixture());
    assert.deepEqual(result, { verses: 6236, suras: 114, pages: 604 });
  });
  it("rejects missing verses even if the row count stays unchanged", () => {
    const rows = fixture();
    rows[9].aya_no = 300;
    assert.throws(() => validateQuranData(rows), /aya order/);
  });
  it("rejects a corrupt string and a backward page", () => {
    const rows = fixture();
    rows[10].aya_text = "";
    assert.throws(() => validateQuranData(rows), /missing\/invalid/);
    rows[10].aya_text = "اختبار";
    rows[100].page = 1;
    assert.throws(() => validateQuranData(rows), /not ascending/);
  });
  it("rejects a malformed JSON file rather than quietly packaging it", () => {
    const dir = mkdtempSync(join(tmpdir(), "rihab-quran-"));
    try {
      const file = join(dir, "hafsData_v2-0.json");
      writeFileSync(file, JSON.stringify([{ aya_text: "incomplete" }]));
      assert.throws(() => validateQuranFile(file), /6236/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("local binary asset verification", () => {
  it("verifies the byte length and deterministic hash", () => {
    const dir = mkdtempSync(join(tmpdir(), "rihab-asset-"));
    try {
      const file = join(dir, "asset.pdf");
      writeFileSync(file, "hello");
      assert.equal(validateFile(file, 5).bytes, 5);
      assert.equal(validateFile(file, 5).sha256.length, 64);
      assert.throws(() => validateFile(file, 6), /length mismatch/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
  it("rejects unsafe filenames and non-Lovable URL sources", () => {
    const good = {
      original_filename: "ward-tuli.pdf",
      url: "/__l5e/assets-v1/uuid/ward-tuli.pdf",
      size: 1024,
    };
    assert.deepEqual(assertSafeAssetDescriptor(good), {
      filename: good.original_filename, url: good.url, size: good.size,
    });
    assert.throws(() => assertSafeAssetDescriptor({
      ...good, original_filename: "../escape.pdf",
    }), /descriptor/);
    assert.throws(() => assertSafeAssetDescriptor({
      ...good, url: "https://example.com/any.pdf",
    }), /descriptor/);
  });
});
