import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const css = readFileSync("src/rihab-identity.css", "utf8");

describe("Approved hero 02 — authentic Sheikh and mobile-first rendering", () => {
  test("the opening scene carries no name plaque; the portrait keeps its full caption", () => {
    expect(hero).not.toContain("hero-mandate");
    expect(hero).toContain('alt="تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل"');
    expect(hero).toContain('alt="فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل"');
    expect(hero).not.toContain("صالح الجعفري الخلوتي");
    expect(hero).not.toContain("المنصة الرسمية لفضيلة الشيخ");
  });

  test("composes from immutable, already-owned portrait and genuine mosque sources", () => {
    expect(hero).toContain('import shaykhSaleh from "@/assets/shaykh-saleh-cutout.png"');
    expect(hero).toContain('import heroNabawi from "@/assets/green-dome.jpg"');
    expect(hero).toContain('src={shaykhSaleh}');
    expect(hero).toContain('src={heroNabawi}');
    expect(existsSync("src/assets/shaykh-saleh-cutout.png")).toBe(true);
    expect(existsSync("src/assets/green-dome.jpg")).toBe(true);
    expect(existsSync("public/fonts/aref-ruqaa-ink-regular.ttf")).toBe(true);
  });

  test("mobile shows the full approved 941x1672 poster and its inscription without a second plaque", () => {
    expect(hero).toContain("hero-sequence--approved-mobile");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-intro { display: none; }");
    expect(css).toContain("min-height: 0;\n    height: auto;");
    expect(css).toContain("height: auto;\n    max-height: none;");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-approved-scene {");
    expect(css).toContain("object-position: center 0%;");
    expect(hero).toContain('className="hero-approved-scene"');
    expect(hero).toContain("src={approvedSceneImage}");
    expect(hero).toContain('import approvedSceneImage from "@/assets/rihab-approved-full-mobile-poster.webp"');
    expect(hero).toContain("width={941}");
    expect(hero).toContain("height={1672}");
    expect(css).toContain("aspect-ratio: 941 / 1672;");
    expect(css).toContain("object-fit: contain;");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-scene {");
    expect(css).toContain("animation: none;");
    expect(hero).toContain('src={logo}');
    expect(css).toContain('@media (max-width: 359px)');
  });

  test("the approved poster includes its own inscription, with semantic alt and no duplicate HTML", () => {
    expect(css).not.toContain('font-family: "Aref Ruqaa Ink"');
    expect(hero).not.toContain("hero-mandate");
    expect(hero).toContain('id="home-title"');
    expect(readFileSync("src/styles.css", "utf8")).toContain('url("/fonts/aref-ruqaa-ink-regular.ttf")');
  });

  test("honors original Quran typography, book images and audio boundaries", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css", "utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
