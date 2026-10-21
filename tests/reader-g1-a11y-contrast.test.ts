import {describe,test,expect} from "bun:test";
import {readFileSync} from "node:fs";
const source=(p:string)=>readFileSync(p,"utf8");
function luminance(hex:string) {
  const rgb=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4);
  return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2];
}
function contrast(a:string,b:string) {
  const l1=luminance(a),l2=luminance(b);
  return (Math.max(l1,l2)+.05)/(Math.min(l1,l2)+.05);
}
describe("G1 contrast and quiet reader accessibility guardrails",()=>{
  test("icon-only toolbar and fullscreen rescue exceed WCAG AA text contrast",()=>{
    expect(contrast("#204937","#eaf1e8")).toBeGreaterThanOrEqual(4.5);
    expect(contrast("#fff1cd","#19392e")).toBeGreaterThanOrEqual(4.5);
  });
  test("44px touch targets and visible keyboard focus both modes",()=>{
    const css=source("src/printed-pdf-reader.css");
    expect(css).toContain("width: 44px;");
    expect(css).toContain("min-width: 44px;");
    expect(css).toContain("height: 44px;");
    expect(css).toContain(".reader-chrome-rescue__button:focus-visible");
    expect(css).toContain(".offline-book-stage:focus-visible");
  });
  test("multi-touch and panning cannot accidentally toggle reader chrome",()=>{
    const hook=source("src/components/BookReaderLayout.tsx");
    expect(hook).toContain("suppressSurfaceTap");
    for(const path of ["src/components/PdfBookViewer.tsx","src/components/OfflineBookPages.tsx"]){
      const text=source(path);
      expect(text).toContain("suppressSurfaceTap();");
      expect(text).toContain("onKeyDown={onSurfaceKeyDown}");
      expect(text).toContain("onClick={onSurfaceClick}");
    }
  });
});
