import {describe, expect, test} from "bun:test";
import { readerGesturePageDelta, readerNextPage, zoomOnDoubleTap, focalScrollAfterZoom } from "../src/lib/reader-interaction";
import { readFileSync } from "node:fs";
const state = (scrollTop: number, zoom=1) => ({page:5, maxPage:25, zoom, scroll:{scrollTop,scrollHeight:1200,clientHeight:400}});
const read=(p:string)=>readFileSync(p,"utf8");
describe("G1 shared book ReaderGestureEngine",()=>{
  test("vertical swipe only turns if started at the edge; otherwise native pan",()=>{
    expect(readerGesturePageDelta(state(300), {dx:1,dy:-110,threshold:80})).toBe(0);
    expect(readerGesturePageDelta(state(800), {dx:1,dy:-110,threshold:80})).toBe(1);
    expect(readerGesturePageDelta(state(0), {dx:0,dy:110,threshold:80})).toBe(-1);
    expect(readerGesturePageDelta(state(800), {dx:0,dy:-30,threshold:80})).toBe(0);
  });
  test("zoomed books can pan horizontally without unexpected page flips",()=>{
    expect(readerGesturePageDelta(state(800,2), {dx:170,dy:1,threshold:80})).toBe(0);
    expect(readerGesturePageDelta(state(500,2), {dx:1,dy:-150,threshold:80})).toBe(0);
    expect(readerGesturePageDelta(state(500,1), {dx:170,dy:1,threshold:80})).toBe(1);
    expect(readerGesturePageDelta(state(800,1), {dx:170,dy:0,threshold:80,indexOpen:true})).toBe(0);
  });
  test("clamps page and zoom; double tap resets from 200 percent",()=>{
    expect(readerNextPage({...state(0),page:25},1)).toBe(25);
    expect(readerNextPage({...state(0),page:1},-1)).toBe(1);
    expect(zoomOnDoubleTap(1)).toBe(2);
    expect(zoomOnDoubleTap(2)).toBe(1);
    expect(zoomOnDoubleTap(3.5)).toBe(1);
  });
  test("zoom retains user focal position rather than resetting to page corner",()=>{
    expect(focalScrollAfterZoom({x:150,y:200,left:50,top:100,scrollLeft:70,scrollTop:210,currentZoom:1,nextZoom:2}))
      .toEqual({left:240,top:520});
  });
  test("fullscreen never traps users and does not rely on hidden text controls",()=>{
    const layout=read("src/components/BookReaderLayout.tsx");
    expect(layout).toContain("onSurfaceClick");
    expect(layout).toContain('aria-label="إظهار شريط أدوات الكتاب"');
    expect(layout).toContain('aria-label="الخروج من ملء الشاشة"');
    expect(layout).toContain("createPortal(content, document.body)");
    expect(layout).toContain('event.key === "Escape"');
  });
});
