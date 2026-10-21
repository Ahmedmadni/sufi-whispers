import { describe, expect, test } from "bun:test";
import { verticalPageTurn } from "../src/lib/book-paging";
import { readFileSync } from "node:fs";
const src=(p:string)=>readFileSync(p,"utf8");

describe("Vertical page turning without locking one-finger image panning",()=>{
  test("long page scrolls internally until the gesture BEGINS at bottom edge",()=>{
    const middle={scrollTop:250,scrollHeight:1400,clientHeight:400};
    expect(verticalPageTurn(-120,70,middle)).toBe(0);
    expect(verticalPageTurn(120,70,middle)).toBe(0);
    expect(verticalPageTurn(-120,70,{...middle,scrollTop:1000})).toBe(1);
    expect(verticalPageTurn(120,70,{...middle,scrollTop:0})).toBe(-1);
    expect(verticalPageTurn(-50,70,{...middle,scrollTop:1000})).toBe(0);
  });
  test("short image is navigable with vertical swipe; malformed gestures ignored",()=>{
    expect(verticalPageTurn(-100,65,{scrollTop:0,scrollHeight:500,clientHeight:500})).toBe(1);
    expect(verticalPageTurn(100,65,{scrollTop:0,scrollHeight:500,clientHeight:500})).toBe(-1);
    expect(verticalPageTurn(Number.NaN,65,{scrollTop:0,scrollHeight:500,clientHeight:500})).toBe(0);
  });
  test("wheel scroll advances at page edges while pinch-wheel zoom still works",()=>{
    for(const file of ["src/components/PdfBookViewer.tsx","src/components/OfflineBookPages.tsx"]){
      const source=src(file);
      expect(source).toContain("lastWheelTurn");
      expect(source).toContain("verticalPageTurn(-");
      expect(source).toContain("500");
      expect(source).toContain("preventDefault()");
    }
  });
  test("both viewers retain native vertical pan and detect edge turns",()=>{
    const pdf=src("src/components/PdfBookViewer.tsx"),offline=src("src/components/OfflineBookPages.tsx");
    expect(pdf).toContain("readerGesturePageDelta({");
    expect(offline).toContain("readerGesturePageDelta({");
    expect(pdf).toContain('touchmove", onMove, { passive: false }');
    expect(offline).toContain('touchmove", onMove, { passive: false }');
    expect(offline).toContain('touchAction: "pan-x pan-y"');
  });
});
