import { describe,expect,test } from "bun:test";
import { readFileSync } from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Floating reader controls and editable wird settings",()=>{
 test("one site header carries the title while page control and index float over the reading surface",()=>{
  for(const file of ["src/components/PdfBookViewer.tsx","src/components/OfflineBookPages.tsx"]){
   const s=read(file);
   expect(s).not.toContain("reader-topbar");
   expect(s).not.toContain("book-reader-page-rail");
   expect(s).toContain("reader-floating-index");
   expect(s).toContain("BookReaderNavigation");
   expect(s).toContain("const swipeThreshold = 80");
   expect(s).toContain("immersive={immersive}");
   expect(s).toContain("onJump={");
   expect(s.indexOf("reader-floating-index")).toBeLessThan(s.indexOf("{error ? (")>=0?s.indexOf("{error ? ("):s.length);
  }
 });
 test("book page navigation floats on the far side of the page and gestures remain enabled",()=>{
   const pdf=read("src/components/PdfBookViewer.tsx");
   const offline=read("src/components/OfflineBookPages.tsx");
   for(const source of [pdf,offline]){
     expect(source).toContain("readerGesturePageDelta");
     expect(source).toContain("BookReaderNavigation");
     expect(source).toContain("ContinuousBookStack");
     expect(source).toContain("reader-floating-index");
     expect(source).not.toContain("reader.swipeThreshold");
     expect(source).not.toContain("setReaderMode");
   }
   const nav=read("src/components/BottomNav.tsx");
   expect(nav).toContain('className="bottom-nav lg:hidden"');
   expect(nav).toContain('aria-label="\u0627\u0644\u062a\u0646\u0642\u0651\u0644 \u0627\u0644\u0633\u0631\u064a\u0639"');
 });
 test("page zoom lives only in Settings while the floating group keeps page turns and fullscreen",()=>{
   const pdf=read("src/components/PdfBookViewer.tsx");
   const offline=read("src/components/OfflineBookPages.tsx");
   const settings=read("src/routes/settings.tsx");
   const nav=read("src/components/BookReaderNavigation.tsx");
   expect(pdf).not.toContain('aria-label="\u062a\u0643\u0628\u064a\u0631 \u0627\u0644\u0635\u0641\u062d\u0629"');
   expect(offline).not.toContain('aria-label="\u062a\u0643\u0628\u064a\u0631 \u0627\u0644\u0635\u0641\u062d\u0629"');
   expect(settings).toContain("<BookPageZoomControl />");
   expect(settings).toContain("<FontSizeControl />");
   expect(nav).toContain('aria-label="\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u0633\u0627\u0628\u0642\u0629"');
   expect(nav).toContain('aria-label="\u0627\u0644\u0635\u0641\u062d\u0629 \u0627\u0644\u062a\u0627\u0644\u064a\u0629"');
 });
 test("settings allows independent time input and an explicit save",()=>{
   const s=read("src/routes/settings.tsx");
   expect(s).toContain('type="time"');
   expect(s).toContain("saveReminderTimes");
   expect(s).toContain("updateWirdTimes(wirdTimes)");
   expect(s).toContain("موعد تذكير الحزب الثاني");
 });
});
