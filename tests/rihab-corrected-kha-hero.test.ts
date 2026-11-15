import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const css = readFileSync("src/rihab-identity.css", "utf8");
const poster = readFileSync("src/assets/rihab-approved-full-mobile-poster.webp");

describe("Approved full-height poster — baked Arabic khāʾ correction", () => {
  test("the corrected graphic is a standalone, lossless 941×1672 WebP asset", () => {
    expect(poster.length).toBe(1431622);
    expect(poster.subarray(0, 4).toString()).toBe("RIFF");
    expect(poster.subarray(8, 12).toString()).toBe("WEBP");
    expect(poster.subarray(12, 16).toString()).toBe("VP8L");
    expect((poster.readUInt32LE(21) & 0x3fff) + 1).toBe(941);
    expect(((poster.readUInt32LE(21) >>> 14) & 0x3fff) + 1).toBe(1672);
    expect(createHash("sha256").update(poster).digest("hex"))
      .toBe("3987f7f4fe27eaf9c68f677c91c09526f5f9854fbab252d402b413bc75b87598");
  });

  test("the literal approved poster is used as one image, without floating text or correction overlay", () => {
    expect(hero).toContain('import approvedSceneImage from "@/assets/rihab-approved-full-mobile-poster.webp"');
    expect(hero).toContain('src={approvedSceneImage}');
    expect(hero).toContain('className="hero-approved-scene"');
    expect(hero).toContain("width={941}");
    expect(hero).toContain("height={1672}");
    expect(hero).toContain("سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل");
    expect(hero).not.toContain("hero-approved-kha-correction");
    expect(hero).not.toContain("hero-approved-poster-frame");
    expect(hero).not.toContain("hero-mandate");
    expect(css).not.toContain(".hero-approved-kha-correction");
    expect(css).not.toContain(".hero-approved-poster-frame");
    expect(css).toContain("aspect-ratio: 941 / 1672;");
    expect(css).toContain("object-fit: contain;");
  });

  test("the original Quran and scanned book typography are not impacted", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css", "utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
