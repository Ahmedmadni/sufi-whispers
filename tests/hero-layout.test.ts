import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const hero = readFileSync("src/components/HomeHero.tsx", "utf8");
const polish = readFileSync("src/premium-ui.css", "utf8");

describe("Home hero shadow and navigation placement", () => {
  test("deeper background photo shadow without changing the original image", () => {
    expect(hero).toContain("from-velvet/80 via-velvet/55 to-velvet/95");
    expect(hero).toContain("sm:from-velvet/95 sm:via-velvet/70 sm:to-velvet/45");
    expect(polish).toContain("rgb(7 21 18 / .96)");
    expect(hero).toContain("src={heroNabawi}");
  });

  test("action buttons are a bottom sibling, not embedded next to the hero text", () => {
    const contentAt = hero.indexOf('className="hero-content');
    const lastTextAt = hero.indexOf("الأوراد</span>", contentAt);
    const actionsAt = hero.indexOf('className="hero-links hero-actions', contentAt);
    const footerAt = hero.indexOf("</motion.div>", actionsAt);
    expect(contentAt).toBeGreaterThan(-1);
    expect(lastTextAt).toBeGreaterThan(contentAt);
    expect(actionsAt).toBeGreaterThan(lastTextAt);
    expect(footerAt).toBeGreaterThan(actionsAt);
    expect(hero).toContain("flex-col justify-between");
    for (const page of ['/quran', '/library', '/shaykh']) {
      expect(hero.slice(actionsAt, footerAt)).toContain(`to="${page}"`);
    }
  });
});
