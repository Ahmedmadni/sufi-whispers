import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const read = (path: string) => readFileSync(path, "utf8");
const signature = read("src/components/DeveloperSignature.tsx");
const about = read("src/routes/about.tsx");

describe("Developer contact and brand-consistent Facebook icons", () => {
  test("shows only 'تواصل مع المطور' without visible developer name", () => {
    expect(signature).toContain("تواصل مع المطور");
    expect(signature).toContain('href="https://www.facebook.com/elmadni1998"');
    expect(signature).not.toContain("برمجة وتطوير:");
    expect(signature).not.toContain("أحمد المدني");
    expect(about).toContain(">تواصل مع المطور</h2>");
    expect(about).not.toContain("أحمد المدني");
    expect(about).not.toContain("ahmedelmadni.com");
    expect(about).toContain('aria-label="تواصل مع المطور عبر فيسبوك"');
  });

  test("all visible Facebook icons use official blue and retain links", () => {
    const files = [
      "src/components/DeveloperSignature.tsx",
      "src/components/SiteHeader.tsx",
      "src/components/SiteFooter.tsx",
      "src/routes/index.tsx",
      "src/routes/shaykh.tsx",
      "src/routes/about.tsx",
    ];
    for (const file of files) {
      const source = read(file);
      const icons = source.match(/<Facebook\b[^>]*\/>/g) ?? [];
      expect(icons.length).toBeGreaterThan(0);
      for (const icon of icons) {
        expect(icon).toContain("text-[#0866FF]");
        expect(icon).toContain('aria-hidden="true"');
      }
      expect(source).toContain("facebook.com");
    }
  });
});
