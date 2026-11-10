import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const css = read("src/rihab-identity.css");

function luminance(hex: string): number {
  const channels = hex.slice(1).match(/.{2}/g);
  if (!channels || channels.length !== 3) throw new Error("Invalid color");
  const [r, g, b] = channels.map(code => {
    const sRGB = parseInt(code, 16) / 255;
    return sRGB <= .04045 ? sRGB / 12.92 : ((sRGB + .055) / 1.055) ** 2.4;
  });
  return .2126 * r + .7152 * g + .0722 * b;
}

function contrast(a: string, b: string): number {
  const x = luminance(a), y = luminance(b);
  return (Math.max(x, y) + .05) / (Math.min(x, y) + .05);
}

describe("Approved Rihab brand V3: mobile-first and high-contrast", () => {
  test("semantic palette accurately follows the user-approved reference", () => {
    const tokens: Record<string, string> = {
      "emerald-900": "#07362f",
      "emerald-800": "#0b4a40",
      "emerald-700": "#116055",
      "gold-500": "#d4a64a",
      "gold-400": "#e2be72",
      "gold-300": "#f0d79a",
      ivory: "#f7f2e7",
      cream: "#fff8ec",
      sky: "#2f8fcc",
      "sky-soft": "#87bfe6",
    };
    for (const [key, value] of Object.entries(tokens)) {
      expect(css).toContain(`--rihab-brand-${key}: ${value};`);
    }
    expect(css).toContain(".site-header,");
    expect(css).toContain(".bottom-nav,");
    expect(css).toContain(".rihab-shortcut-card");
    expect(css).toContain(".rihab-book-tile");
    expect(css).toContain(".rihab-library-search");
    expect(css).toContain(".dhikr-stage");
    expect(css).toContain(".reader-floating-index");
    expect(css).toContain(".wird-audio-player--dock");
  });

  test("real foreground/background pairs meet WCAG 2 AA normal text contrast", () => {
    expect(contrast("#203d32", "#f7f2e7")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#fff4de", "#07362f")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#775219", "#fff8ec")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#07362f", "#f0d79a")).toBeGreaterThanOrEqual(4.5);
    // Scenic blue has lower contrast; restrict it to atmospheric/background use.
    expect(css).toContain("never\n   put small white labels");
  });

  test("the identity stylesheet is offline-safe and loaded last on web and Android", () => {
    expect(css).not.toMatch(/@import|https?:\/\//);
    const web = read("src/routes/__root.tsx");
    const android = read("mobile/main.tsx");
    expect(web.indexOf('href: daylightCss')).toBeLessThan(web.indexOf('href: identityCss'));
    expect(android.indexOf('import "../src/rihab-daylight.css"')).toBeLessThan(
      android.indexOf('import "../src/rihab-identity.css"'),
    );
    expect(css).toContain("@media (max-width: 640px)");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("mobile navigation and highlighted controls keep accessible active states", () => {
    const nav = read("src/components/BottomNav.tsx");
    expect((nav.match(/<Link\s/g) ?? []).length).toBe(5);
    expect(nav).toContain('aria-label="التنقّل السريع"');
    expect(css).toContain(".rihab-nav-item[data-status=\"active\"] .rihab-nav-item__icon");
    expect(css).toContain(".rihab-nav-item[aria-current=\"page\"] .rihab-nav-item__icon");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("min-height: 44px");
  });

  test("approved photograph and exact original name stay unchanged", () => {
    const hero = read("src/components/HomeHero.tsx");
    expect(hero).toContain('import shaykhSaleh from "@/assets/shaykh-saleh-cutout.png"');
    expect(hero).toContain('import heroNabawi from "@/assets/green-dome.jpg"');
    expect(hero).toContain("تحت لواء فضيلة العارف بالله سيدي الشيخ صالح أحمد الشافعي محمد محمد أبو خليل");
    expect(css).toContain(".hero-sequence--approved-mobile");
    expect(read("src/styles.css")).toContain('--font-uthmani: "UthmanicHafs"');
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
  });
});
