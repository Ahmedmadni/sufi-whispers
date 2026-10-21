import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, SlidersHorizontal, Rows3, BookOpen } from "lucide-react";
import { BookQuickIndex } from "@/components/BookQuickIndex";
import { ContinuousBookStack, type ContinuousBookHandle } from "@/components/ContinuousBookStack";
import { createContinuousLayout, persistReaderMode, storedReaderMode, type ReaderMode } from "@/lib/reader-continuous";
import { getBook } from "@/data/books";
import { verifiedNafahatKhaliliyyaHeadings } from "@/lib/nafahat-khaliliyya-index";
import { BookReaderNavigation } from "@/components/BookReaderNavigation";
import { BookReaderLayout, useBookImmersive, useBookReaderChrome } from "@/components/BookReaderLayout";
import { verticalPageTurn, type ScrollViewport } from "@/lib/book-paging";
import { readerGesturePageDelta, captureReaderPinchAnchor, scrollToReaderPinchAnchor } from "@/lib/reader-interaction";
import { twoFingerDistance, twoFingerCenter, zoomFromPinch, zoomFromWheel, boundedBookZoom } from "@/lib/book-pinch";
import { clampPage, parseSavedPage } from "@/lib/reading-page";
import { requestedWirdPage } from "@/lib/wird-reminders";

type PageEntry = { name: string; sha256: string; bytes: number; width: number; height: number };
type ManifestEntry = { pageCount: number; source: string; sourceSha256?: string; pages: PageEntry[]; toc?: { title: string; page: number }[] };
type Manifest = { version: number; books: Record<string, ManifestEntry> };
type Props = { bookId: string };

export default function OfflineBookPages({ bookId }: Props) {
  const key = `reader.page.${bookId}`;
  const { immersive, setImmersive } = useBookImmersive();
  const [page, setPage] = useState(() => {
    const deepLink = requestedWirdPage(bookId, window.location);
    if (deepLink) return deepLink;
    try { return parseSavedPage(localStorage.getItem(key)); } catch { return 1; }
  });
  const [entry, setEntry] = useState<ManifestEntry | null>(null);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [imageRetry, setImageRetry] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [mode, setMode] = useState<ReaderMode>(() => storedReaderMode(bookId));
  const [viewportWidth, setViewportWidth] = useState(360);
  const continuousRef = useRef<ContinuousBookHandle>(null);
  const setReaderMode = (next: ReaderMode) => {
    persistReaderMode(bookId, next);
    setMode(next);
  };
  // Persist the gesture across every zoom-driven React render.
  const startX = useRef<number | null>(null);
  const startY = useRef<number | null>(null);
  const startScroll = useRef<ScrollViewport | null>(null);
  const pinch = useRef<{ distance: number; zoom: number; anchor: {contentX:number;contentY:number} } | null>(null);
  const multiTouch = useRef(false);
  const [swipeThreshold, setSwipeThreshold] = useState(75);
  useEffect(() => { try { const n = Number(localStorage.getItem("reader.swipeThreshold")); if (n >= 30 && n <= 200) setSwipeThreshold(n); } catch { /* optional */ } }, []);
  const scroll = useRef<HTMLDivElement>(null);
  const lastWheelTurn = useRef(0);
  useEffect(() => {
    const el=scroll.current;
    if(!el)return;
    const refresh=()=>setViewportWidth(el.clientWidth||360);
    refresh();
    const observer=typeof ResizeObserver!=="undefined"?new ResizeObserver(refresh):null;
    observer?.observe(el);
    return ()=>observer?.disconnect();
  },[entry,immersive,mode]);
  const continuousLayout=useMemo(()=>createContinuousLayout(
    entry?.pageCount??0,viewportWidth*zoom,
    target=>{
      const item=entry?.pages[target-1];
      return item?.width&&item?.height?item.height/item.width:1.414;
    },12
  ),[entry,viewportWidth,zoom]);
  const { toolbarVisible, setToolbarVisible, onSurfaceClick, onSurfaceKeyDown, suppressSurfaceTap } = useBookReaderChrome(immersive, scroll, zoom, setZoom);

  useEffect(() => {
    const controller = new AbortController();
    setError("");
    fetch("/offline-books/manifest.json", { signal: controller.signal }).then(async response => {
      if (!response.ok) throw new Error("تعذّر تحميل فهرس الكتب المدمج.");
      const manifest = await response.json() as Manifest;
      const record = manifest.books?.[bookId];
      if (manifest.version !== 1 || !record || record.pageCount !== record.pages.length ||
          !record.pages.length || !record.pages.every(item => /^\d{4}\.webp$/.test(item.name))) {
        throw new Error("ملف صفحات الكتاب غير مكتمل داخل التطبيق.");
      }
      if (!controller.signal.aborted) setEntry(record);
    }).catch((reason: unknown) => {
      if (!controller.signal.aborted) setError(reason instanceof Error ? reason.message : "تعذّر فتح الكتاب.");
    });
    return () => controller.abort();
  }, [bookId, retry]);

  const maxPage = entry?.pageCount ?? 0;
  // Desktop keyboard navigation follows the exact direction of the Mushaf.
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey ||
          (event.target instanceof Element &&
           event.target.closest('input,textarea,select,[contenteditable="true"]'))) return;
      if (event.key === "ArrowRight" && maxPage > 0) setPage(p => clampPage(p + 1, maxPage));
      if (event.key === "ArrowLeft" && maxPage > 0) setPage(p => clampPage(p - 1, maxPage));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [maxPage]);

  useEffect(() => {
    if (!maxPage) return;
    setPage(previous => clampPage(previous, maxPage));
  }, [maxPage]);
  useEffect(() => {
    if (!maxPage) return;
    try { localStorage.setItem(key, String(clampPage(page, maxPage))); } catch { /* optional persistence */ }
  }, [key, page, maxPage]);
  const goTo = (target: number) => {
    if (!maxPage) return;
    const destination=clampPage(target,maxPage);
    setPage(destination);
    if(mode==="continuous")continuousRef.current?.jumpToPage(destination);
    else scroll.current?.scrollTo({left:0,top:0});
  };
  const image = useMemo(() => entry?.pages[page - 1], [entry, page]);
  useEffect(() => { if(mode==="paged")scroll.current?.scrollTo({left:0,top:0}); }, [page, bookId, mode]);
  const imageUrl = image ? `/offline-books/${encodeURIComponent(bookId)}/${image.name}${imageRetry ? `?retry=${imageRetry}` : ""}` : "";

  // Native non-passive listeners are required: React's delegated touchmove
  // can be passive in Chromium. Do not allow a two-finger gesture to zoom the
  // entire WebView; zoom this actual book image and retain one-finger panning.
  useEffect(() => {
    const el = scroll.current;
    if (!el || !image) return;
    const onStart = (event: TouchEvent) => {
      if (event.touches.length === 2) {
        suppressSurfaceTap();
        const center = twoFingerCenter(event.touches);
        const rect = el.getBoundingClientRect();
        if (center) pinch.current = {
          distance: twoFingerDistance(event.touches), zoom,
          anchor: captureReaderPinchAnchor({left:rect.left,top:rect.top,scrollLeft:el.scrollLeft,scrollTop:el.scrollTop},center,zoom),
        };
        startX.current = null;
        startY.current = null;
        startScroll.current = null;
        multiTouch.current = true;
      } else if (event.touches.length === 1 && !multiTouch.current) {
        startX.current = event.touches[0].clientX;
        startY.current = event.touches[0].clientY;
        startScroll.current = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
      }
    };
    const onMove = (event: TouchEvent) => {
      if (event.touches.length !== 2) return;
      if (event.cancelable) event.preventDefault();
      startX.current = null;
      startY.current = null;
      startScroll.current = null;
      multiTouch.current = true;
      const center = twoFingerCenter(event.touches);
      if (!pinch.current && center) {
        const rect = el.getBoundingClientRect();
        pinch.current = {
          distance: twoFingerDistance(event.touches), zoom,
          anchor: captureReaderPinchAnchor({left:rect.left,top:rect.top,scrollLeft:el.scrollLeft,scrollTop:el.scrollTop},center,zoom),
        };
      }
      if (pinch.current?.distance && center) {
        const next = zoomFromPinch(pinch.current, event.touches);
        const rect = el.getBoundingClientRect();
        const target = scrollToReaderPinchAnchor(pinch.current.anchor,center,{left:rect.left,top:rect.top},next);
        setZoom(next);
        requestAnimationFrame(() => {
          if (el.isConnected) el.scrollTo({left:target.left,top:target.top,behavior:"auto"});
        });
      }
    };
    const onEnd = (event: TouchEvent) => {
      if (multiTouch.current) {
        if (event.touches.length === 0) { multiTouch.current = false; pinch.current = null; }
        startX.current = null;
        return;
      }
      if (event.touches.length || startX.current === null || startY.current === null ||
          event.changedTouches.length !== 1) return;
      const dx = event.changedTouches[0].clientX - startX.current;
      const dy = event.changedTouches[0].clientY - startY.current;
      if (Math.hypot(dx,dy) > 12) suppressSurfaceTap();
      const start = startScroll.current;
      startX.current = null;
      startY.current = null;
      startScroll.current = null;
      // Zoomed images should pan freely in both axes. Page turns require
      // an intentional vertical gesture starting at the top/bottom edge.
      const direction = start ? readerGesturePageDelta({
        page, maxPage, zoom, scroll: start,
      }, { dx, dy, threshold: swipeThreshold }) : 0;
      if (direction && mode==="paged") goTo(page + direction);
    };
    const onCancel = () => { suppressSurfaceTap(); pinch.current = null; startX.current = null; startY.current = null; startScroll.current = null; multiTouch.current = false; };
    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey || event.metaKey) {
        if (event.cancelable) event.preventDefault();
        setZoom(value => zoomFromWheel(value, event.deltaY));
        return;
      }
      if(mode==="continuous")return;
      // Native scrolling handles the page body. At the starting boundary,
      // a further wheel turn advances/returns the book, including on Windows.
      const now = Date.now();
      if (now - lastWheelTurn.current < 500 || Math.abs(event.deltaY) < 12) return;
      const direction = verticalPageTurn(-event.deltaY, 12, {
        scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
      });
      if (direction) {
        if (event.cancelable) event.preventDefault();
        lastWheelTurn.current = now;
        goTo(page + direction);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchcancel", onCancel, { passive: true });
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchcancel", onCancel);
      el.removeEventListener("wheel", onWheel);
    };
  }, [page, zoom, swipeThreshold, image?.name, suppressSurfaceTap, mode]);

  return (
    <BookReaderLayout immersive={immersive} toolbarVisible={toolbarVisible}
      onRevealToolbar={() => setToolbarVisible(true)} onExit={() => setImmersive(false)}
      label="قارئ الكتاب دون إنترنت">
      <div className="reader-topbar reader-toolbar glass mb-2 flex items-center gap-2 rounded-xl px-2 py-2" dir="rtl">
        <h2 className="reader-topbar__title font-display" title={getBook(bookId)?.title}>{getBook(bookId)?.title}</h2>
        <div className="reader-topbar__actions" dir="ltr">
          <BookQuickIndex compact maxPage={maxPage} page={page}
            headings={entry?.toc?.length ? entry.toc : verifiedNafahatKhaliliyyaHeadings(bookId, maxPage, entry?.sourceSha256)}
            onJump={goTo} />
          <button type="button" className="reader-icon-button"
            aria-label={mode==="paged"?"القراءة المتواصلة":"وضع تقليب الصفحات"}
            title={mode==="paged"?"عرض الصفحات متتابعة":"العودة إلى وضع الصفحات"}
            aria-pressed={mode==="continuous"}
            onClick={()=>setReaderMode(mode==="paged"?"continuous":"paged")}>
            {mode==="paged"?<Rows3 size={19}/>:<BookOpen size={19}/>}
          </button>
          <button type="button" className="reader-icon-button" aria-label="تصغير الكتاب" title="تصغير"
            disabled={zoom <= 1} onClick={() => setZoom(value => boundedBookZoom(value - .25))}><ZoomOut size={19}/></button>
          <button type="button" className="reader-icon-button" aria-label="تكبير الكتاب" title="تكبير"
            disabled={zoom >= 4} onClick={() => setZoom(value => boundedBookZoom(value + .25))}><ZoomIn size={19}/></button>
          {!immersive && <details className="reader-nav-popover">
            <summary className="reader-icon-button cursor-pointer" aria-label="إعداد حساسية تقليب الصفحات" title="الحساسية">
              <SlidersHorizontal size={19}/>
            </summary>
            <div className="reader-nav-popover__body" dir="rtl">
              <input type="range" min="30" max="200" step="5" value={swipeThreshold} aria-label="حساسية التقليب"
                onChange={event => { const v = Number(event.currentTarget.value); setSwipeThreshold(v);
                  try { localStorage.setItem("reader.swipeThreshold", String(v)); } catch { /* optional */ }
                }}/>
            </div>
          </details>}
          <BookReaderNavigation bookId={bookId} page={page} maxPage={maxPage} immersive={immersive}
            headings={entry?.toc?.length ? entry.toc : verifiedNafahatKhaliliyyaHeadings(bookId, maxPage, entry?.sourceSha256)} onJump={goTo} />
          <button type="button" onClick={() => setImmersive(value => !value)}
            className="reader-icon-button" aria-label={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
            title={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}>
            {immersive ? <Minimize2 size={19}/> : <Maximize2 size={19}/>}
          </button>
        </div>
      </div>
      {error ? (
        <div role="alert" className="glass rounded-xl p-6 text-center text-sm font-body">
          <p>{error}</p>
          <button type="button" className="mt-4 rounded-lg border border-gold/30 px-4 py-2 text-gold-soft"
            onClick={() => { setEntry(null); setRetry(n => n + 1); }}>إعادة المحاولة</button>
        </div>
      ) : !image ? (
        <p role="status" className="glass rounded-xl p-8 text-center text-sm">جارٍ تجهيز صفحات الكتاب المحفوظة…</p>
      ) : (
        <div ref={scroll}
          className="offline-book-stage mx-auto overflow-auto rounded-xl bg-[#ede5d5] text-center"
          onClick={onSurfaceClick}
          onKeyDown={onSurfaceKeyDown}
          tabIndex={0}
          role="region"
          aria-label="محتوى صفحة الكتاب — Enter أو المسافة لإظهار أدوات القراءة أو إخفائها"
          style={{ maxHeight: immersive ? "none" : "min(77dvh, 970px)", minHeight: immersive ? 0 : "min(55vh, 650px)", touchAction: "pan-x pan-y" }}

        >
          {mode==="continuous" && entry ? (
            <ContinuousBookStack ref={continuousRef} layout={continuousLayout} width={viewportWidth*zoom}
              initialPage={page} viewportRef={scroll} onActivePage={setPage}
              renderPage={(target)=>{
                const item=entry.pages[target-1];
                if(!item)return null;
                return <img key={item.name} draggable={false}
                  loading="lazy" decoding="async"
                  src={`/offline-books/${encodeURIComponent(bookId)}/${item.name}`}
                  alt={`صفحة ${target} من الكتاب`} width={item.width} height={item.height}
                  className="mx-auto block h-auto max-w-none select-none"
                  style={{width:viewportWidth*zoom}}
                  onError={()=>setError(`تعذّر تحميل صفحة ${target} من الكتاب.`)} />;
              }} />
          ) : (
            <img key={imageUrl} src={imageUrl} alt={`صفحة ${page} من الكتاب`}
              width={image.width} height={image.height} draggable={false}
              className="book-page-arrive mx-auto block h-auto max-w-none select-none"
              style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 100}%` : undefined }}
              onError={() => setError("تعذّر عرض صفحة الكتاب من الملفات المحلية.")}
            />
          )}
        </div>
      )}
      {error && image && <button type="button" className="mt-2 text-xs text-gold-soft"
        onClick={() => { setError(""); setImageRetry(n => n + 1); }}>أعد عرض الصفحة</button>}
    </BookReaderLayout>
  );
}
