import {describe,expect,test} from "bun:test";
import {readFileSync} from "node:fs";
import {books} from "../src/data/books";
import {parsePersonalBackup} from "../src/lib/personal-backup";
const src=(p:string)=>readFileSync(p,"utf8");
describe("G2 continuous mode integration in eight books",()=>{
 test("both PDF and WebP readers offer opt-in mode with paged default",()=>{
  const pdf=src("src/components/PdfBookViewer.tsx"),offline=src("src/components/OfflineBookPages.tsx");
  for(const view of [pdf,offline]){
    expect(view).toContain("storedReaderMode(bookId)");
    expect(view).toContain('mode==="paged"?"continuous":"paged"');
    expect(view).toContain('mode==="continuous"');
    expect(view).toContain("<ContinuousBookStack");
    expect(view).toContain("onActivePage={setPage}");
    expect(view).toContain("continuousRef.current?.jumpToPage");
    expect(view).toContain('aria-label={mode==="paged"?"القراءة المتواصلة":"وضع تقليب الصفحات"}');
    expect(view).toContain("persistReaderMode(bookId");
  }
  expect(books).toHaveLength(8);
 });
 test("continuous mode never falls into gesture wheel page turns",()=>{
  const pdf=src("src/components/PdfBookViewer.tsx"),offline=src("src/components/OfflineBookPages.tsx");
  expect(pdf).toContain('if (turn && mode==="paged")');
  expect(offline).toContain('if (direction && mode==="paged")');
  expect(pdf).toContain('printedIndexOpen || mode==="continuous"');
  expect(offline).toContain('if(mode==="continuous")return;');
  expect(pdf).toContain('mode==="continuous") return []');
 });
 test("offline book uses authentic per-page WebP aspect ratios and only visible images",()=>{
  const offline=src("src/components/OfflineBookPages.tsx");
  expect(offline).toContain("item.height/item.width");
  expect(offline).toContain('loading="lazy"');
  expect(offline).toContain("const item=entry.pages[target-1]");
  expect(offline).toContain("<ContinuousBookStack");
 });
 test("PDF worker keeps same source and only renders pages near scroll viewport",()=>{
  const pdf=src("src/components/PdfBookViewer.tsx");
  expect(pdf).toContain("document.getPage(1)");
  expect(pdf).toContain("ContinuousBookStack");
  expect(pdf).toContain("<Page key={target}");
  expect(pdf).toContain('renderTextLayer={false}');
  expect(pdf).toContain('renderAnnotationLayer={false}');
  expect(pdf).toContain("NafahatPrintedIndex");
 });
 test("mode is backed up with strict value whitelist, one entry per known book",()=>{
  const backup=src("src/lib/personal-backup.ts");
  expect(backup).toContain("...books.map((book) => readerModeKey(book.id))");
  const data:Object=Object.fromEntries(books.map(b=>[`reader.mode.${b.id}`,"continuous"]));
  const json=(items:object)=>JSON.stringify({format:"rihab-khaliliyya-personal-data",version:1,createdAt:"2026-10-21T10:00:00Z",data:items});
  expect(Object.keys(parsePersonalBackup(json(data)).data)).toHaveLength(8);
  expect(()=>parsePersonalBackup(json({"reader.mode.ward":"night"}))).toThrow();
  expect(()=>parsePersonalBackup(json({"reader.mode.fake":"continuous"}))).toThrow();
 });
});
