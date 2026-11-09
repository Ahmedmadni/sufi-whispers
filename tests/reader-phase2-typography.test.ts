import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import {
  createContinuousLayout, preserveContinuousScroll, pageAtContinuousOffset, sourcePageRatio,
} from "../src/lib/reader-continuous";

describe("approved Arabic typography without source-book mutations", () => {
  test("Cairo is display-only; IBM remains body; original Hafs script stays isolated", () => {
    const css = readFileSync("src/styles.css", "utf8");
    const light = readFileSync("src/rihab-daylight.css", "utf8");
    const web = readFileSync("src/routes/__root.tsx", "utf8");
    const android = readFileSync("scripts/prepare-android-fonts.mjs", "utf8");
    expect(css).toContain('--font-display: "Cairo", "IBM Plex Sans Arabic"');
    expect(css).toContain('--font-body: "IBM Plex Sans Arabic"');
    expect(css).toContain('--font-uthmani: "UthmanicHafs"');
    expect(light).toContain('font-family: "Cairo", "IBM Plex Sans Arabic"');
    expect(light).toContain('font-family: "UthmanicHafs", serif');
    expect(web).toContain("family=Cairo:wght@600;700&family=IBM+Plex+Sans+Arabic");
    expect(android).toContain('"cairo-variable.ttf"');
    expect(readFileSync("mobile/index.html", "utf8")).toContain("/mobile-assets/fonts/fonts.css");
    expect(readFileSync("mobile/mobile.css", "utf8")).toContain("clamp(15px, 3.65vw, 16px)");
  });
});

describe("phase-two full-width, continuous reader regressions", () => {
  test("mixed landscape and portrait pages retain their own geometry", () => {
    const dimensions = [[1200, 600], [600, 1200], [800, 1000]] as const;
    const ratios = dimensions.map(([width, height]) => sourcePageRatio(width, height));
    const oldLayout = createContinuousLayout(3, 320, page => ratios[page - 1]);
    const newLayout = createContinuousLayout(3, 480, page => ratios[page - 1]);
    expect(oldLayout.heights).toEqual([160, 640, 400]);
    expect(newLayout.heights).toEqual([240, 960, 600]);
    const saved = oldLayout.starts[1] + oldLayout.heights[1] * .625;
    const restored = preserveContinuousScroll(oldLayout, newLayout, saved);
    expect(pageAtContinuousOffset(newLayout, restored)).toBe(2);
    expect(restored).toBe(newLayout.starts[1] + Math.round(newLayout.heights[1] * .625));
  });
  test("layout correction reads the live scroll position, never a stale render snapshot", () => {
    const component = readFileSync("src/components/ContinuousBookStack.tsx", "utf8");
    expect(component).toContain("preserveContinuousScroll(previousLayout.current,layout,el.scrollTop)");
    expect(component).not.toContain("preserveContinuousScroll(previousLayout.current,layout,snapshot.top)");
    expect(component).toContain("setSnapshot(previous=>");
  });
  test("verified offline page dimensions and image retries protect continuous reading", () => {
    const component = readFileSync("src/components/OfflineBookPages.tsx", "utf8");
    expect(component).toContain("Number.isSafeInteger(item.width)");
    expect(component).toContain("Number.isSafeInteger(item.height)");
    expect(component).toContain("?retry=");
    expect(component).toContain("createContinuousLayout(");
  });
});
