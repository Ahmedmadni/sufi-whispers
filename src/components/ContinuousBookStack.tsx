import {useEffect, useImperativeHandle, useRef, useState, type ReactNode, type Ref, type RefObject} from "react";
import {continuousWindow, preserveContinuousScroll, type ContinuousLayout} from "@/lib/reader-continuous";

export type ContinuousBookHandle = { jumpToPage: (page: number) => void };
type Props = {
  layout: ContinuousLayout;
  width: number;
  initialPage: number;
  viewportRef: RefObject<HTMLDivElement | null>;
  onActivePage: (page: number) => void;
  renderPage: (page: number) => ReactNode;
  overscan?: number;
  ref?: Ref<ContinuousBookHandle>;
};

/** Render only the handful of visible pages; placeholders preserve the FULL
 * scroll geometry, but neither adjacent images nor PDF canvases are mounted.
 * Each page remains in its own original, unmodified source order.
 */
export function ContinuousBookStack({layout,width,initialPage,viewportRef,onActivePage,renderPage,overscan=1,ref}:Props) {
  const [snapshot,setSnapshot]=useState({top:0,height:760});
  const didInitialJump=useRef(false);
  const initialPageRef=useRef(initialPage);
  const previousLayout=useRef(layout);
  const liveCallback=useRef(onActivePage);
  const lastActive=useRef(initialPage);
  const frames=useRef<number|null>(null);
  liveCallback.current=onActivePage;

  useImperativeHandle(ref,()=>({
    jumpToPage:(page:number)=>{
      const el=viewportRef.current;
      if(!el || !layout.pageCount)return;
      const index=Math.min(layout.pageCount,Math.max(1,Math.round(page)))-1;
      const top=layout.starts[index];
      el.scrollTo({top,behavior:"auto"});
      setSnapshot({top,height:el.clientHeight||760});
    },
  }),[layout,viewportRef]);

  useEffect(()=>{
    const el=viewportRef.current;
    if(!el)return;
    // Position exactly at the saved page only when entering continuous mode;
    // zoom and render-window changes must NEVER snap reading back to start.
    if(!didInitialJump.current && layout.pageCount>0) {
      didInitialJump.current=true;
      const clamped=Math.min(layout.pageCount,Math.max(1,Math.round(initialPageRef.current)));
      el.scrollTop=layout.starts[clamped-1];
    } else if(previousLayout.current!==layout && didInitialJump.current) {
      el.scrollTop=preserveContinuousScroll(previousLayout.current,layout,el.scrollTop);
    }
    previousLayout.current=layout;
    const update=()=>{
      if(frames.current!==null)cancelAnimationFrame(frames.current);
      frames.current=requestAnimationFrame(()=>{
        frames.current=null;
        const top=el.scrollTop,height=el.clientHeight||760;
        setSnapshot(prev=>(prev.top===top && prev.height===height?prev:{top,height}));
        const current=continuousWindow(layout,top,height).current;
        if(current!==lastActive.current){
          lastActive.current=current;
          liveCallback.current(current);
        }
      });
    };
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(update):null;
    observer?.observe(el);
    el.addEventListener("scroll",update,{passive:true});
    update();
    return ()=> {
      el.removeEventListener("scroll",update);
      observer?.disconnect();
      if(frames.current!==null){cancelAnimationFrame(frames.current);frames.current=null;}
    };
  },[layout,viewportRef]);

  const view=continuousWindow(layout,snapshot.top,snapshot.height,overscan);
  const pages:number[]=[];
  for(let p=view.first;p<=view.last;p++)pages.push(p);
  return (
    <div className="continuous-book-stack relative flex-shrink-0" dir="ltr"
      style={{width:Math.round(width),height:layout.totalHeight}}
      role="list" aria-label="صفحات الكتاب بالقراءة المتواصلة">
      {pages.map(page=>(
        <div key={page} role="listitem" aria-label={`صفحة ${page} من ${layout.pageCount}`}
          className="continuous-book-page absolute inset-x-0"
          style={{top:layout.starts[page-1],height:layout.heights[page-1]}}>
          {renderPage(page)}
        </div>
      ))}
    </div>
  );
}
