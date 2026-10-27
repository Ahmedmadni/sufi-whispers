import { describe,expect,test } from "bun:test";
import { readFileSync } from "node:fs";
const read=(p:string)=>readFileSync(p,"utf8");
describe("Compact fullscreen navigation and editable wird settings",()=>{
 test("single toolbar shows book title, index and controls in both readers",()=>{
  for(const file of ["src/components/PdfBookViewer.tsx","src/components/OfflineBookPages.tsx"]){
   const s=read(file);
   expect(s).toContain("reader-topbar__title");
   expect(s).toContain("getBook(bookId)?.title");
   expect(s).toContain("BookReaderNavigation");
    expect(s).toContain("book-reader-page-rail");
   expect(s).toContain("const swipeThreshold = 80");
   expect(s).toContain("immersive={immersive}");
   expect(s).toContain("onJump={goTo}");
   expect(s.indexOf("reader-topbar__title")).toBeLessThan(s.indexOf("{/* Viewer */}")>=0?s.indexOf("{/* Viewer */}"):s.indexOf("{error ? ("));
  }
 });
 test("book page navigation lives in the left reader rail and gestures remain enabled",()=>{
   const pdf=read("src/components/PdfBookViewer.tsx");
   const offline=read("src/components/OfflineBookPages.tsx");
   for(const source of [pdf,offline]){
     expect(source).toContain("readerGesturePageDelta");
     expect(source).toContain("BookReaderNavigation");
     expect(source).toContain("ContinuousBookStack");
      expect(source).toContain("book-reader-page-rail");
     expect(source).not.toContain("reader.swipeThreshold");
     expect(source).not.toContain("setReaderMode");
   }
   const nav=read("src/components/BottomNav.tsx");
   expect(nav).toContain('className="bottom-nav lg:hidden"');
    expect(nav).toContain('aria-label="التنقّل السريع"');
 });
 test("settings allows independent time input and an explicit save",()=>{
   const s=read("src/routes/settings.tsx");
   expect(s).toContain('type="time"');
   expect(s).toContain("saveReminderTimes");
   expect(s).toContain("updateWirdTimes(wirdTimes)");
   expect(s).toContain("موعد تذكير الحزب الثاني");
 });
});
