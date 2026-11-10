import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const css = readFileSync("src/rihab-identity.css", "utf8");

describe("Approved hero 02 — authentic Sheikh and mobile-first rendering", () => {
  test("the Sheikh's exact original full name remains unchanged and screen-reader readable", () => {
    const exact = "تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل";
    expect(hero).toContain(exact);
    expect(hero).toContain('<p className="sr-only">{SHAYKH_BANNER}</p>');
    expect(hero).toContain('<p className="hero-mandate__mobile" aria-hidden="true">{SHAYKH_BANNER}</p>');
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

  test("mobile portrait gets a static full caption; desktop keeps prior ticker and logo", () => {
    expect(hero).toContain("hero-sequence--approved-mobile");
    expect(hero).toContain("hero-mandate__mobile");
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-intro { display: none; }");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-mandate__viewport { display: none; }");
    expect(css).toContain("height: clamp(560px, calc(100svh - 116px), 780px)");
    expect(css).toContain("object-position: 68% center");
    expect(css).toContain(".hero-sequence--approved-mobile .hero-scene {");
    expect(css).toContain("animation: none;");
    expect(hero).toContain("hero-mandate__duplicate");
    expect(hero).toContain('src={logo}');
    expect(css).toContain('@media (max-width: 359px)');
  });

  test("Arabic text is an actual Cairo/Ruqaa webfont layout and not AI-written pixels", () => {
    expect(css).toContain('font-family: "Aref Ruqaa Ink", "Cairo", "IBM Plex Sans Arabic", serif');
    expect(css).toContain(".hero-sequence--approved-mobile .hero-mandate__mobile");
    expect(css).toContain("text-wrap: balance");
    expect(css).toContain("white-space: normal");
    expect(css).toContain("overflow-wrap: normal");
    expect(css).toContain("color: #fff2d6");
    expect(hero).toContain('id="home-title"');
    expect(readFileSync("src/styles.css", "utf8")).toContain('url("/fonts/aref-ruqaa-ink-regular.ttf")');
  });

  test("honors original Quran typography, book images and audio boundaries", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(readFileSync("src/styles.css", "utf8")).toContain('--font-uthmani: "UthmanicHafs"');
  });
});
