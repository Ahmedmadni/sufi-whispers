import { describe, expect, test } from "bun:test";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import chunk0 from "../src/assets/approved-poster-scene-part0";
import chunk1 from "../src/assets/approved-poster-scene-part1";
import chunk2 from "../src/assets/approved-poster-scene-part2";
import chunk3 from "../src/assets/approved-poster-scene-part3";

const poster = Buffer.from(chunk0 + chunk1 + chunk2 + chunk3, "base64");
const css = readFileSync("src/rihab-identity.css", "utf8");
const hero = readFileSync("src/components/HomeHero.tsx", "utf8");

describe("approved user-poster actual imagery and text correctness", () => {
  test("the original user-approved blue-sky and Sheikh-scene raster is faithfully transferred", () => {
    expect(poster.byteLength).toBe(10456);
    expect(poster.subarray(0, 4).toString()).toBe("RIFF");
    expect(poster.subarray(8, 12).toString()).toBe("WEBP");
    expect(createHash("sha256").update(poster).digest("hex"))
      .toBe("c6a290ee5dd29fbb26b49ac9183cac7463c3dcfa6474f0770a796c56be014b79");
    expect(hero).toContain('className="hero-approved-scene"');
    expect(hero).toContain("src={approvedSceneImage}");
    expect(hero).toContain('"data:image/webp;base64,"');
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
