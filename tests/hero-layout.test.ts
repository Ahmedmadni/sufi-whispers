import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const polish = readFileSync("src/premium-ui.css", "utf8");

describe("Home hero shadow and minimal navigation", () => {

  test("keeps the exact Sheikh attribution once for accessibility and duplicates only the visual ticker", () => {
    expect(hero).toContain("تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل");
    expect(hero).toContain('<p className="sr-only">{SHAYKH_BANNER}</p>');
    expect(hero).toContain('className="hero-mandate__viewport" aria-hidden="true"');
    expect(hero).toContain("hero-mandate__duplicate");
    expect(hero).toContain('dir="rtl"');
    expect(hero).not.toContain("رحاب الخليلية · نور المعرفة وهدوء القراءة");
    expect(hero).not.toContain("المصحف الشريف، وكتب الطريق الخليلي، والأوراد والذكر.");
  });

  test("automatically scrolls the full-width framed phrase and respects reduced-motion", () => {
    const style = readFileSync("src/visual-experience.css", "utf8");
    expect(style).toContain(".hero-mandate__frame");
    expect(style).toContain("width: 100%");
    expect(style).toContain("animation: hero-mandate-flow 32s linear infinite");
    expect(style).toContain("to { transform: translate3d(-50%, 0, 0); }");
    expect(style).toContain("font-family: \"IBM Plex Sans Arabic\", sans-serif");
    expect(style).toContain(".hero-mandate__track {");
    expect(style).toContain("animation: none !important");
    expect(style).toContain(".hero-mandate__duplicate { display: none; }");
    expect(style).toContain(".hero-shaykh");
    expect(hero).toContain("id=\"home-title\"");
  });

  test("retains cinematic background and original portrait without altering image assets", () => {
    expect(hero).toContain("from-velvet/80 via-velvet/55 to-velvet/95");
    expect(hero).toContain("sm:from-velvet/95 sm:via-velvet/70 sm:to-velvet/45");
    expect(polish).toContain("rgb(7 21 18 / .96)");
    expect(hero).toContain("src={heroNabawi}");
    expect(hero).toContain("src={shaykhSaleh}");
  });

  test("navigation only appears in BottomNav; hero no longer duplicates buttons or stars", () => {
    expect(hero).not.toContain("hero-links hero-actions");
    expect(hero).not.toContain("to=\"/library\"");
    expect(hero).not.toContain("to=\"/quran\"");
    expect(hero).not.toContain("to=\"/shaykh\"");
    expect(hero).not.toContain("✦");
    const bottom = readFileSync("src/components/BottomNav.tsx", "utf8");
    expect(bottom).toContain(">الطريق</span>");
    expect(bottom).toContain('to="/quran/printed"');
    expect(bottom).toContain('to="/library"');
  });
});
