import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const css = readFileSync("src/rihab-identity.css", "utf8");
const svg = readFileSync("src/assets/rihab-ornate-name-frame.svg", "utf8");

describe("Approved ornamental Sheikh name cartouche", () => {
  test("preserves user-approved pointed scallops and mirrored ornaments in a scalable frame", () => {
    expect(svg).toContain('viewBox="0 0 940 480"');
    expect(svg).toContain('preserveAspectRatio="none"');
    expect(svg).toContain('id="outline"');
    expect(svg).toContain('M 15 255');
    expect(svg).toContain('L 926 255');
    expect(svg).toContain('fill="url(#plaque)"');
    expect(svg).toContain('stroke="url(#gold)"');
    expect(svg).toContain('transform="translate(0 480) scale(1 -1)"');
    expect(svg).toContain('M470 38');
    expect(svg).not.toMatch(/<text[ >]/);
  });
  test("SVG actually renders behind the precise Arabic name without creating a second caption", () => {
    expect(hero).toContain('import approvedNameFrame from "@/assets/rihab-ornate-name-frame.svg";');
    expect(hero).toContain('src={approvedNameFrame}');
    expect(hero).toContain('className="hero-mandate__ornate-art"');
    expect(hero).toContain('alt=""');
    expect(hero).toContain('<p className="sr-only">{SHAYKH_BANNER}</p>');
    expect(hero).toContain("تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل");
    expect(hero).toContain("hero-mandate__kicker");
    expect(hero).toContain("hero-mandate__name");
    expect(hero).toContain("hero-mandate__surname");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-mandate__ornate-art");
    expect(css).toContain("object-fit: fill;");
    expect(css).toContain("pointer-events: none;");
  });
  test("does not render the old rectangular background, badge or line on the mobile cartouche", () => {
    expect(css).toContain("V5 — the APPROVED ornamental name plaque");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-mandate__frame::before,");
    expect(css).toContain("content: none !important;");
    expect(css).toContain("border: 0;");
    expect(css).toContain("border-radius: 0;");
    expect(css).toContain("background: transparent;");
    expect(css).toContain("box-shadow: none;");
    expect(css).toContain("height: clamp(178px, 49vw, 214px);");
    expect(css).toContain("@media (max-width: 359px)");
    expect(css).toContain("height: 172px;");
  });
  test("keeps original images and Quran fonts untouched and readable", () => {
    expect(hero).toContain('src={approvedSceneImage}');
    expect(hero).toContain('src={heroNabawi}');
    expect(hero).toContain('src={shaykhSaleh}');
    expect(css).toContain("-webkit-text-fill-color: #fff8ec;");
    expect(css).toContain("-webkit-text-fill-color: #f3cf84;");
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css", "utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
