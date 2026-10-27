/** G2: bounded geometry for a continuous document without mounting its pages.
 * No book pixels or PDF canvases are ever loaded by this pure module.
 */
export type ReaderMode = "paged" | "continuous";
export const readerModeKey = (bookId: string) => `reader.mode.${bookId}`;
/** Legacy "paged" preferences are migrated to continuous reading when a book opens. */
export function storedReaderMode(bookId: string, storage?: Pick<Storage,"getItem">): ReaderMode {
  try {
    const provider = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    if (provider?.getItem(readerModeKey(bookId)) === "continuous") return "continuous";
  } catch { /* default to continuous when storage is blocked */ }
  return "continuous";
}
export function persistReaderMode(bookId: string, mode: ReaderMode, storage?: Pick<Storage,"setItem">): void {
  if (mode !== "paged" && mode !== "continuous") return;
  try {
    const provider = storage ?? (typeof localStorage !== "undefined" ? localStorage : undefined);
    provider?.setItem(readerModeKey(bookId), mode);
  } catch { /* reader remains usable if storage is blocked */ }
}

export type ContinuousLayout = {
  starts: number[]; // 0-based page starts, plus the final end offset
  heights: number[];
  totalHeight: number;
  pageCount: number;
};
export function createContinuousLayout(
  count: number, width: number, ratioAt: (page: number) => number,
  gap = 12,
): ContinuousLayout {
  if (!Number.isSafeInteger(count) || count < 1 || count > 10000) {
    return {starts:[0],heights:[],totalHeight:0,pageCount:0};
  }
  const safeWidth = Number.isFinite(width) ? Math.min(5000, Math.max(100, width)) : 360;
  const safeGap = Number.isFinite(gap) ? Math.min(48, Math.max(0, gap)) : 12;
  const starts = [0], heights: number[] = [];
  for (let page=1;page<=count;page++) {
    const ratio = ratioAt(page);
    const safeRatio = Number.isFinite(ratio) && ratio>=0.45 && ratio<=4 ? ratio : 1.415;
    const height = Math.max(100,Math.round(safeWidth * safeRatio));
    heights.push(height);
    starts.push(starts[page-1] + height + (page===count?0:safeGap));
  }
  return {starts,heights,totalHeight:starts[count],pageCount:count};
}
/** Binary search, O(log N) irrespective of the size of the complete book. */
export function pageAtContinuousOffset(layout: ContinuousLayout, offset: number): number {
  const n = layout.pageCount;
  if(!n) return 1;
  const value = Number.isFinite(offset)?Math.max(0,offset):0;
  let low=0,high=n-1;
  while(low<high) {
    const mid=Math.ceil((low+high)/2);
    if(layout.starts[mid]<=value)low=mid;
    else high=mid-1;
  }
  return low+1;
}
export type ContinuousWindow = {first:number;last:number;current:number;rendered:number};
export function continuousWindow(
  layout: ContinuousLayout, scrollTop: number, viewportHeight: number, overscan=1,
): ContinuousWindow {
  if(!layout.pageCount) return {first:1,last:0,current:1,rendered:0};
  const top = Math.max(0,Number.isFinite(scrollTop)?scrollTop:0);
  const view = Math.max(1,Number.isFinite(viewportHeight)?viewportHeight:1);
  const buffer = Math.max(0,Math.min(3,Math.floor(overscan)));
  const first=Math.max(1,pageAtContinuousOffset(layout,top)-buffer);
  const last=Math.min(layout.pageCount,pageAtContinuousOffset(layout,top+view)+buffer);
  return {first,last,current:pageAtContinuousOffset(layout,top+view*.32),rendered:last-first+1};
}

/** Preserve the same part of the active source page after rotation, resizing
 * or lazy PDF ratio correction. Does NOT access DOM or preload more pages. */
export function preserveContinuousScroll(
  oldLayout: ContinuousLayout, nextLayout: ContinuousLayout, scrollTop: number,
): number {
  if(!oldLayout.pageCount || !nextLayout.pageCount)return 0;
  const page=Math.min(nextLayout.pageCount,pageAtContinuousOffset(oldLayout,scrollTop));
  const oldHeight=oldLayout.heights[page-1] || 1;
  const position=Math.max(0,Math.min(1,(scrollTop-oldLayout.starts[page-1])/oldHeight));
  return Math.max(0,Math.round(nextLayout.starts[page-1]+position*nextLayout.heights[page-1]));
}
