import {describe,expect,test} from "bun:test";
import {readFileSync} from "node:fs";
import {createContinuousLayout,continuousWindow,pageAtContinuousOffset,preserveContinuousScroll,storedReaderMode,persistReaderMode} from "../src/lib/reader-continuous";
describe("G2 bounded continuous book geometry",()=>{
  const lay=createContinuousLayout(1040,360,()=>1.5,12);
  test("does not render or allocate page pixels to create a full scroll geometry",()=>{
    expect(lay.pageCount).toBe(1040);
    expect(lay.starts).toHaveLength(1041);
    expect(lay.heights).toHaveLength(1040);
    expect(lay.totalHeight).toBe(1040*540+1039*12);
  });
  test("only two to five pages near the viewport render, even on 1040-page book",()=>{
    for(const p of [1,50,250,500,1030,1040]){
      const snap=continuousWindow(lay,lay.starts[p-1],760);
      expect(snap.rendered).toBeLessThanOrEqual(5);
      expect(snap.first).toBeGreaterThanOrEqual(1);
      expect(snap.last).toBeLessThanOrEqual(1040);
      expect(snap.first).toBeLessThanOrEqual(p);
      expect(snap.last).toBeGreaterThanOrEqual(p);
    }
  });
  test("boundary offsets and active page are stable",()=>{
    expect(pageAtContinuousOffset(lay,0)).toBe(1);
    expect(pageAtContinuousOffset(lay,lay.starts[50])).toBe(51);
    expect(pageAtContinuousOffset(lay,Infinity)).toBe(1);
    expect(pageAtContinuousOffset(lay,lay.totalHeight)).toBe(1040);
    expect(continuousWindow(createContinuousLayout(0,360,()=>1),0,300).rendered).toBe(0);
  });
  test("rotation preserves current page and percentage-of-page even when dimensions change",()=>{
    const before=createContinuousLayout(800,360,()=>1.4);
    const after=createContinuousLayout(800,560,()=>1.4);
    const previous=before.starts[249]+before.heights[249]*.35;
    const target=preserveContinuousScroll(before,after,previous);
    expect(pageAtContinuousOffset(after,target)).toBe(250);
    expect(Math.abs((target-after.starts[249])/after.heights[249]-.35)).toBeLessThan(.02);
    expect(preserveContinuousScroll(createContinuousLayout(0,360,()=>1),after,200)).toBe(0);
  });
  test("different source image page dimensions generate correct independent offsets",()=>{
    const g=createContinuousLayout(3,200,p=>p===2?2:1,10);
    expect(g.heights).toEqual([200,400,200]);
    expect(g.starts).toEqual([0,210,620,820]);
  });
  test("invalid geometry is safely clamped",()=>{
    expect(createContinuousLayout(25000,300,()=>1).pageCount).toBe(0);
    const x=createContinuousLayout(2,NaN,()=>NaN,-4);
    expect(x.heights).toEqual([509,509]);
  });
  test("reading mode is opt-in and can be backed up without overriding older state",()=>{
    const values=new Map<string,string>();
    const storage={getItem:(key:string)=>values.get(key)??null,setItem:(key:string,v:string)=>{values.set(key,v)}};
    expect(storedReaderMode("ward",storage)).toBe("paged");
    persistReaderMode("ward","continuous",storage);
    expect(storedReaderMode("ward",storage)).toBe("continuous");
    values.set("reader.mode.ward","random");
    expect(storedReaderMode("ward",storage)).toBe("paged");
  });
  test("the component never mounts every source image or PDF canvas",()=>{
    const s=readFileSync("src/components/ContinuousBookStack.tsx","utf8");
    expect(s).toContain("pages.map(page=>(");
    expect(s).toContain("continuousWindow(layout,snapshot.top,snapshot.height)");
    expect(s).toContain("scrollTo({top,behavior:\"auto\"})");
    expect(s).not.toContain("Array.from({length:layout.pageCount}");
  });
});
