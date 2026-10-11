import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const polish = readFileSync("src/premium-ui.css", "utf8");

describe("Home hero shadow and minimal navigation", () => {
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
