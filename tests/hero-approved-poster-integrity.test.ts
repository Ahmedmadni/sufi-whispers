import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
const poster = readFileSync("src/assets/rihab-approved-mobile-scene.webp");
const css = readFileSync("src/rihab-identity.css", "utf8");
const hero = readFileSync("src/components/HomeHero.tsx", "utf8");

describe("approved user-poster actual imagery and text correctness", () => {
  test("the sharp user-approved Sheikh-scene raster is losslessly transported into GitHub", () => {
    expect(poster.byteLength).toBe(105244);
    expect(poster.subarray(0, 4).toString()).toBe("RIFF");
    expect(poster.subarray(8, 12).toString()).toBe("WEBP");
    // Native VP8 width and height prove this is not the original 360px thumbnail.
    expect(poster.subarray(12, 16).toString()).toBe("VP8 ");
    expect(poster.readUInt16LE(26) & 0x3fff).toBe(800);
    expect(poster.readUInt16LE(28) & 0x3fff).toBe(935);
    expect(createHash("sha256").update(poster).digest("hex"))
      .toBe("cd20b2fee2ded511f0aea10a0287096a86cd64eb4272ac244fbd957c71fa9bb9");
    expect(hero).toContain('className="hero-approved-scene"');
    expect(hero).toContain("src={approvedSceneImage}");
    expect(hero).toContain("width={800}");
    expect(hero).toContain("height={935}");
    expect(hero).toContain('fetchPriority="high"');
    expect(hero).toContain('import approvedSceneImage from "@/assets/rihab-approved-mobile-scene.webp"');
  });

  test("original assets stay intact for desktop and the actual poster is shown on mobile", () => {
    expect(hero).toContain('src={heroNabawi}');
    expect(hero).toContain('src={shaykhSaleh}');
    expect(css).toContain(".hero-approved-scene { display: none; }");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-approved-scene {");
    expect(css).toContain("object-position: center 0%;");
    expect(css).toContain("display: none !important;");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-heading,");
  });

  test("red embedded-color Ink Ruqaa is replaced by monochrome Amiri with explicit ivory/gold", () => {
    expect(css).not.toContain('font-family: "Aref Ruqaa Ink"');
    expect(css).toContain('font-family: "Amiri", "Cairo", serif;');
    expect(css).toContain("-webkit-text-fill-color: #f0d79a");
    expect(css).toContain("-webkit-text-fill-color: #fff8ec");
    expect(readFileSync("src/routes/__root.tsx", "utf8"))
      .toContain("family=Amiri:wght@400;700");
    expect(readFileSync("scripts/prepare-android-fonts.mjs", "utf8"))
      .toContain('"amiri-regular.ttf"');
  });

  test("exact, accessible Sheikh name stays real text and no typography touches the Quran", () => {
    expect(hero).toContain("تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل");
    expect(hero).toContain('<p className="sr-only">{SHAYKH_BANNER}</p>');
    expect(hero).toContain("hero-mandate__kicker");
    expect(hero).toContain("hero-mandate__name");
    expect(hero).toContain("hero-mandate__surname");
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css", "utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
