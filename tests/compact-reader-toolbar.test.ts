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
   expect(s).toContain("immersive={immersive}");
   expect(s).toContain("onJump={goTo}");
   expect(s.indexOf("reader-topbar__title")).toBeLessThan(s.indexOf("{/* Viewer */}")>=0?s.indexOf("{/* Viewer */}"):s.indexOf("{error ? ("));
  }
 });
 test("no persistent bottom navigation and fullscreen suppresses quick jump popovers",()=>{
   const css=read("src/printed-pdf-reader.css"),nav=read("src/components/BookReaderNavigation.tsx");
   expect(css).toContain(".book-reader--immersive .reader-page-form");
   expect(css).toContain(".book-reader--immersive .reader-nav-popover");
   expect(nav).toContain("{!immersive && (");
   expect(nav).toContain("aria-label=\"الصفحة التالية\"");
   expect(nav).not.toContain("انتقال سريع إلى صفحة");
 });
 test("settings allows independent time input and an explicit save",()=>{
   const s=read("src/routes/settings.tsx");
   expect(s).toContain('type="time"');
   expect(s).toContain("saveReminderTimes");
   expect(s).toContain("updateWirdTimes(wirdTimes)");
   expect(s).toContain("موعد تذكير الحزب الثاني");
 });
});
