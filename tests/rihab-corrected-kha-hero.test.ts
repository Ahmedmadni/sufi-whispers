import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const css = readFileSync("src/rihab-identity.css", "utf8");

describe("Approved full-height poster — precise Arabic khāʾ dot", () => {
  test("the exact approved photo and golden-name plaque stay visible as one 941×1672 image", () => {
    expect(hero).toContain('import approvedSceneImage from "@/assets/rihab-approved-full-mobile-poster.webp"');
    expect(hero).toContain('src={approvedSceneImage}');
    expect(hero).toContain('className="hero-approved-poster-frame"');
    expect(hero).toContain('className="hero-approved-scene"');
    expect(hero).toContain('width={941}');
    expect(hero).toContain('height={1672}');
    expect(hero).not.toContain("hero-mandate");
    expect(css).toContain("aspect-ratio: 941 / 1672;");
    expect(css).toContain("object-fit: contain;");
  });

  test("ONLY a single scaled point above the actual khāʾ is added without changing original letters", () => {
    expect(hero).toContain('className="hero-approved-kha-correction"');
    expect(hero).toContain('viewBox="0 0 941 1672"');
    expect(hero).toContain('M 585.5 1297.6 L 590.6 1303 L 585.5 1308.4 L 580.4 1303 Z');
    expect(hero).toContain('fill="#fcfaf8"');
    expect(hero).toContain('aria-hidden="true"');
    expect(hero).toContain('تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل');
    expect(hero).not.toContain("الشيح");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-approved-kha-correction");
    expect(css).toContain("pointer-events: none;");
  });

  test("the optical correction tracks the poster on narrow devices, not the viewport", () => {
    expect(css).toContain(".hero-approved-poster-frame,");
    expect(css).toContain(".hero-approved-kha-correction { display: none; }");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-approved-poster-frame");
    expect(css).toContain("position: relative;");
    expect(css).toContain("isolation: isolate;");
    expect(css).toContain("position: absolute;");
    expect(css).toContain("height: 100%;");
    expect(css).toContain("@media (max-width: 640px)");
  });

  test("no changes to Quran or original book typography", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css","utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
