import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const poster = readFileSync("src/assets/rihab-approved-full-mobile-poster.webp");
const css = readFileSync("src/rihab-identity.css", "utf8");
const hero = readFileSync("src/components/HomeHero.tsx", "utf8");

describe("approved user-poster actual imagery and text correctness", () => {
  test("the exact approved FULL image is stored in the repository with verified transfer hash", () => {
    expect(poster.byteLength).toBe(1431622);
    expect(poster.subarray(0, 4).toString()).toBe("RIFF");
    expect(poster.subarray(8, 12).toString()).toBe("WEBP");
    // Lossless VP8L encodes the exact approved portrait geometry and the newly baked correction.
    expect(poster.subarray(12, 16).toString()).toBe("VP8L");
    expect(poster[20]).toBe(0x2f);
    expect((poster.readUInt32LE(21) & 0x3fff) + 1).toBe(941);
    expect(((poster.readUInt32LE(21) >>> 14) & 0x3fff) + 1).toBe(1672);
    expect(createHash("sha256").update(poster).digest("hex"))
      .toBe("3987f7f4fe27eaf9c68f677c91c09526f5f9854fbab252d402b413bc75b87598");
    expect(hero).toContain('className="hero-approved-scene"');
    expect(hero).toContain("src={approvedSceneImage}");
    expect(hero).toContain("width={941}");
    expect(hero).toContain("height={1672}");
    expect(hero).toContain('fetchPriority="high"');
    expect(hero).toContain('import approvedSceneImage from "@/assets/rihab-approved-full-mobile-poster.webp"');
  });

  test("original assets stay intact for desktop and the actual poster is shown on mobile", () => {
    expect(hero).toContain('src={heroNabawi}');
    expect(hero).toContain('src={shaykhSaleh}');
    expect(css).toContain(".hero-approved-scene { display: none; }");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-approved-scene {");
    expect(css).toContain("aspect-ratio: 941 / 1672;");
    expect(css).toContain("object-fit: contain;");
    expect(css).toContain(".hero-sequence--approved-mobile::after {");
    expect(css).toContain("content: none !important;");
    expect(css).toContain("display: none !important;");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-heading,");
  });

  test("red embedded-color Ink Ruqaa is replaced by monochrome Amiri", () => {
    expect(css).not.toContain('font-family: "Aref Ruqaa Ink"');
    expect(readFileSync("src/routes/__root.tsx", "utf8"))
      .toContain("family=Amiri:wght@400;700");
    expect(readFileSync("scripts/prepare-android-fonts.mjs", "utf8"))
      .toContain('"amiri-regular.ttf"');
  });

  test("the full original inscription is in one image with accurate accessible alt and no extra plaque", () => {
    expect(hero).not.toContain("hero-mandate");
    expect(hero).toContain('alt="تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل"');
    expect(hero).toContain('alt="فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل"');
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css", "utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
