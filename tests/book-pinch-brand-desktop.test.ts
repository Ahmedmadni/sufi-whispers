import { describe, test, expect } from "bun:test";
import { readFileSync } from "node:fs";
import { boundedBookZoom, twoFingerDistance, twoFingerCenter, zoomFromPinch, zoomFromWheel } from "../src/lib/book-pinch";
const read = (p: string) => readFileSync(p,"utf8");
const fingers = (a:number,b:number) => [{clientX:a,clientY:0},{clientX:b,clientY:0}];
describe("Reliable 2 finger zoom in both book readers",()=>{
  test("math, bounds and touch positions",()=>{
    expect(twoFingerDistance(fingers(0,80))).toBe(80);
    expect(twoFingerDistance([fingers(0,80)[0]])).toBe(0);
    expect(twoFingerCenter(fingers(0,100))).toEqual({x:50,y:0});
    expect(zoomFromPinch({distance:80,zoom:1},fingers(0,160))).toBe(2);
    expect(zoomFromPinch({distance:80,zoom:1},fingers(0,700))).toBe(4);
    expect(zoomFromPinch({distance:80,zoom:2},fingers(0,1))).toBe(1);
    expect(boundedBookZoom(Number.POSITIVE_INFINITY)).toBe(1);
    expect(zoomFromWheel(2,-100)).toBeGreaterThan(2);
    expect(zoomFromWheel(2,100)).toBeLessThan(2);
  });
  test("PDF including printed TOC uses non passive touch and wheel",()=>{
    const t=read("src/components/PdfBookViewer.tsx");
    expect(t).toContain('touchmove", onMove, { passive: false }');
    expect(t).toContain('wheel", onWheel, { passive: false }');
    expect(t).toContain("e.preventDefault()");
    expect(t).toContain("zoomFromPinch(pinchRef.current");
    expect(t).toContain("setPrintedIndexZoom(next)");
    expect(t).toContain("setScale(next)");
  });
  test("offline WebP pages use non passive touch and preserve scroll",()=>{
    const t=read("src/components/OfflineBookPages.tsx");
    expect(t).toContain('touchmove", onMove, { passive: false }');
    expect(t).toContain('wheel", onWheel, { passive: false }');
    expect(t).toContain("event.preventDefault()");
    expect(t).toContain("zoomFromPinch(pinch.current, event.touches)");
    expect(t).toContain('touchAction: "pan-x pan-y"');
  });
});
describe("Brand readability and desktop",()=>{
  test("high contrast icon styles and disabled/hover/focus",()=>{
    const css=read("src/rihab-daylight.css");
    const tsx=read("src/components/FontSizeControl.tsx");
    expect(tsx).toContain("header-font-controls__button");
    expect(css).toContain("color: #fff1cd;");
    expect(css).toContain("border: 1.5px solid #c7a36e;");
    expect(css).toContain(".header-font-controls__button:disabled");
    expect(css).toContain(".header-font-controls__button:focus-visible");
  });
  test("Windows offline security boundaries and packaging",()=>{
    const main=read("desktop/main.cjs"),server=read("desktop/server.cjs"),pipeline=read(".github/workflows/windows-desktop.yml");
    expect(main).toContain("nodeIntegration: false");
    expect(main).toContain("contextIsolation: true");
    expect(main).toContain("sandbox: true");
    expect(server).toContain('server.listen(0,"127.0.0.1"');
    expect(server).toContain("object-src 'none'");
    expect(pipeline).toContain("bun run mobile:build");
    expect(pipeline).toContain("package:win");
    expect(pipeline).toContain("verify-bundle.cjs");
  });
});
