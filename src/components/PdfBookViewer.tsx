import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { clampPage, parseSavedPage } from "@/lib/reading-page";
import { loadLocalBookPdf } from "@/lib/book-pdf-source";
import { BookReaderLayout, useBookImmersive, useBookReaderChrome } from "@/components/BookReaderLayout";
import { BookQuickIndex } from "@/components/BookQuickIndex";
import { BookReaderNavigation } from "@/components/BookReaderNavigation";
import { ContinuousBookStack, type ContinuousBookHandle } from "@/components/ContinuousBookStack";
import { availableReaderWidth, sourcePageRatio, createContinuousLayout, persistReaderMode, type ReaderMode } from "@/lib/reader-continuous";
import { getBook } from "@/data/books";
import { verifiedNafahatKhaliliyyaHeadings } from "@/lib/nafahat-khaliliyya-index";
import {
  NafahatPrintedIndex, NAFAHAT_INDEX_FIRST, NAFAHAT_INDEX_LAST,
  NAFAHAT_INDEX_REFERENCES,
} from "@/components/NafahatPrintedIndex";
import { rtlSwipePageDelta, verticalPageTurn, type ScrollViewport } from "@/lib/book-paging";
import { readerGesturePageDelta, captureReaderPinchAnchor, scrollToReaderPinchAnchor } from "@/lib/reader-interaction";
import { twoFingerDistance, twoFingerCenter, zoomFromPinch, zoomFromWheel } from "@/lib/book-pinch";
import { useBookZoomPreference } from "@/lib/book-zoom-preference";
import { Button } from "@/components/ui/button";
import { requestedWirdPage } from "@/lib/wird-reminders";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  Maximize2,
  Minimize2,
  List,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

// Copied by prepare-pdf-assets.mjs from react-pdf's OWN pdfjs-dist version.
// Never import the top-level pdfjs-dist worker; it may have a different API.
pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";

// Optional PDF.js resources are prepared locally by scripts/prepare-pdf-assets.mjs.
const pdfOptions = {
  cMapUrl: "/pdfjs/cmaps/",
  cMapPacked: true,
  standardFontDataUrl: "/pdfjs/standard_fonts/",
};

type Props = {
  pdfUrl?: string;
  bookId?: string;
};

export default function PdfBookViewer({ pdfUrl = "/book.pdf", bookId = "nafahat" }: Props) {
  const PDF_URL = pdfUrl;
  const { immersive, setImmersive } = useBookImmersive();
  const [outline, setOutline] = useState<{ title: string; page: number }[]>([]);
  const [printedIndexOpen, setPrintedIndexOpen] = useState(false);
  const [printedIndexSheet, setPrintedIndexSheet] = useState(NAFAHAT_INDEX_FIRST);
  const [printedIndexZoom, setPrintedIndexZoom] = useBookZoomPreference();
  const isOfflineAndroid = import.meta.env.VITE_MOBILE === "true";
  const [localBytes, setLocalBytes] = useState<Uint8Array<ArrayBuffer> | null>(null);
  const [sourceError, setSourceError] = useState("");
  const [readerError, setReaderError] = useState("");
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!isOfflineAndroid) return;
    const controller = new AbortController();
    setLocalBytes(null);
    setSourceError("");
    setReaderError("");
    void loadLocalBookPdf(PDF_URL, controller.signal).then((bytes) => {
      if (!controller.signal.aborted) setLocalBytes(bytes);
    }).catch((error: unknown) => {
      if (!controller.signal.aborted) setSourceError(
        error instanceof Error ? error.message : "تعذّر قراءة ملف الكتاب المدمج."
      );
    });
    return () => controller.abort();
  }, [PDF_URL, isOfflineAndroid, retry]);

  // PDF.js may transfer and detach the supplied Uint8Array buffer to its
  // worker. Preserve the original in React state and supply a fresh copy
  // when the fullscreen portal remounts the PDF document on Android.
  const readerSource = useMemo(
    () => isOfflineAndroid ? (localBytes ? { data: new Uint8Array(localBytes) } : null) : PDF_URL,
    [isOfflineAndroid, localBytes, PDF_URL, immersive],
  );
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [scale, setScale] = useBookZoomPreference();
  // Continuous reading: book pages flow into each other in one scrollable stack.
  const [mode] = useState<ReaderMode>("continuous");
  useEffect(() => { persistReaderMode(bookId, mode); }, [bookId, mode]);
  const [pageRatios, setPageRatios] = useState<Record<number, number>>({});
  const recordPageRatio = useCallback((target: number, width: number, height: number) => {
    const ratio = sourcePageRatio(width, height);
    setPageRatios(previous => previous[target] === ratio ? previous : {...previous, [target]: ratio});
  }, []);
  const continuousRef = useRef<ContinuousBookHandle>(null);
  const [pageWidth, setPageWidth] = useState(360);
  const renderedWidth = Math.max(1, Math.floor(pageWidth * scale));
  const continuousLayout=useMemo(()=>createContinuousLayout(numPages,renderedWidth,target=>pageRatios[target] ?? 1.415,12),[numPages,renderedWidth,pageRatios]);
  const printedIndexWidth = Math.max(1, Math.round(pageWidth * printedIndexZoom));
  const printedIndexLayout = useMemo(
    () => createContinuousLayout(NAFAHAT_INDEX_LAST - NAFAHAT_INDEX_FIRST + 1, printedIndexWidth, () => 841.68 / 595.32, 12),
    [printedIndexWidth],
  );
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ distance: number; zoom: number; printed: boolean; anchor: {contentX:number;contentY:number} } | null>(null);
  const lastWheelTurn = useRef(0);
  const { toolbarVisible, setToolbarVisible, onSurfaceClick, onSurfaceKeyDown, suppressSurfaceTap } = useBookReaderChrome(
    immersive, viewerRef, printedIndexOpen ? printedIndexZoom : scale,
    next => { if (printedIndexOpen) setPrintedIndexZoom(next); else setScale(next); },
  );

  const swipeThreshold = 80; // Natural medium sensitivity, constant across devices.

  // Resume last reading position per book
  const POS_KEY = `reader.page.${bookId}`;
  const [restoredBookId, setRestoredBookId] = useState<string | null>(null);
  useEffect(() => {
    let saved = 1;
    try {
      saved = parseSavedPage(localStorage.getItem(POS_KEY));
    } catch {
      // Fall back to the first page when storage is blocked.
    }
    setNumPages(0);
    setPageRatios({});
    const direct = typeof window === "undefined" ? null : requestedWirdPage(bookId, window.location);
    setPage(direct ?? saved);
    setRestoredBookId(bookId);
  }, [bookId, POS_KEY]);
  useEffect(() => {
    // Do not overwrite a bookmark with the default first page before restoration,
    // or with an out-of-range page before PDF metadata has loaded.
    if (restoredBookId !== bookId || numPages < 1) return;
    const validPage = clampPage(page, numPages);
    if (validPage !== page) {
      setPage(validPage);
      return;
    }
    try {
      localStorage.setItem(POS_KEY, String(validPage));
    } catch {
      // Reader remains usable without persistent storage.
    }
  }, [bookId, restoredBookId, POS_KEY, page, numPages]);


  // Light haptic feedback on every successful page change (mobile only)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }, [page]);

  useEffect(() => {
    const update = () => {
      const viewer = containerRef.current;
      if (!viewer) return;
      const styles = window.getComputedStyle(viewer);
      setPageWidth(availableReaderWidth(viewer.clientWidth,
        Number.parseFloat(styles.paddingLeft) || 0,
        Number.parseFloat(styles.paddingRight) || 0));
    };
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    const main = containerRef.current?.closest<HTMLElement>(".book-reader-main");
    if (observer && containerRef.current) observer.observe(containerRef.current);
    if (observer && main) observer.observe(main);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [immersive, toolbarVisible]);

  const goTo = useCallback(
    (p: number) => {
      if (numPages < 1) return;
      const destination=clampPage(p,numPages);
      setPage(destination);
      if(mode==="continuous" && !printedIndexOpen)continuousRef.current?.jumpToPage(destination);
      else viewerRef.current?.scrollTo({top:0,left:0});
    },
    [numPages,mode,printedIndexOpen]
  );

  // Match the printed Arabic Mushaf: swipe RIGHT for the next page;
  // swipe LEFT for previous. Keep existing up/down gestures as secondary controls.
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let active = false;
    let startedAt: ScrollViewport | null = null;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        suppressSurfaceTap();
        const center = twoFingerCenter(e.touches);
        const rect = el.getBoundingClientRect();
        const startingZoom = printedIndexOpen ? printedIndexZoom : scale;
        if (center) pinchRef.current = {
          distance: twoFingerDistance(e.touches), zoom: startingZoom, printed: printedIndexOpen,
          anchor: captureReaderPinchAnchor({left:rect.left,top:rect.top,scrollLeft:el.scrollLeft,scrollTop:el.scrollTop},center,startingZoom),
        };
        active = false;
        startedAt = null;
        return;
      }
      if (e.touches.length !== 1) return;
      startedAt = { scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight };
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      active = true;
    };
    const onMove = (e: TouchEvent) => {
      if (e.touches.length === 2 && pinchRef.current && pinchRef.current.distance > 0) {
        if (e.cancelable) e.preventDefault();
        const next = zoomFromPinch(pinchRef.current, e.touches, 1, 4);
        const center = twoFingerCenter(e.touches);
        if (!center) return;
        const rect = el.getBoundingClientRect();
        const target = scrollToReaderPinchAnchor(pinchRef.current.anchor,center,{left:rect.left,top:rect.top},next);
        if (pinchRef.current.printed) setPrintedIndexZoom(next);
        else setScale(next);
        requestAnimationFrame(() => {
          if (el.isConnected) el.scrollTo({left:target.left,top:target.top,behavior:"auto"});
        });
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (pinchRef.current) { pinchRef.current = null; active = false; return; }
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      if (Math.hypot(dx,dy) > 12) suppressSurfaceTap();
      if (!startedAt) return;
      if (printedIndexOpen) {
        // The seven original printed index sheets also turn by touch instead of arrows.
        const horizontal = Math.abs(dx) > Math.abs(dy) && printedIndexZoom <= 1;
        const delta = horizontal
          ? rtlSwipePageDelta(dx, swipeThreshold)
          : verticalPageTurn(dy, swipeThreshold, startedAt);
        if (delta) setPrintedIndexSheet(current =>
          Math.min(NAFAHAT_INDEX_LAST, Math.max(NAFAHAT_INDEX_FIRST, current + delta)));
        return;
      }
      const turn = readerGesturePageDelta({
        page, maxPage: numPages, zoom: scale, scroll: startedAt,
      }, {dx, dy, threshold: swipeThreshold});
      if (turn && mode==="paged") goTo(page + turn);
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    const onCancel = () => { suppressSurfaceTap(); pinchRef.current = null; active = false; };
    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.cancelable) e.preventDefault();
        if (printedIndexOpen) setPrintedIndexZoom(value => zoomFromWheel(value, e.deltaY));
        else setScale(value => zoomFromWheel(value, e.deltaY));
        return;
      }
      if (mode==="continuous") return;
      const now = Date.now();
      if (now - lastWheelTurn.current < 500) return;
      const activeZoom = printedIndexOpen ? printedIndexZoom : scale;
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY) && activeZoom <= 1;
      if (!horizontal && Math.abs(e.deltaY) < 12) return;
      const direction = horizontal
        ? rtlSwipePageDelta(-e.deltaX, swipeThreshold)
        : verticalPageTurn(-e.deltaY, 12, {
          scrollTop: el.scrollTop, scrollHeight: el.scrollHeight, clientHeight: el.clientHeight,
        });
      if (direction) {
        if (e.cancelable) e.preventDefault();
        lastWheelTurn.current = now;
        if (printedIndexOpen) {
          setPrintedIndexSheet(current =>
            Math.min(NAFAHAT_INDEX_LAST, Math.max(NAFAHAT_INDEX_FIRST, current + direction)));
        } else {
          goTo(page + direction);
        }
      }
    };
    el.addEventListener("touchcancel", onCancel);
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
      el.removeEventListener("touchmove", onMove);
      el.removeEventListener("touchcancel", onCancel);
      el.removeEventListener("wheel", onWheel);
    };
  }, [page, goTo, swipeThreshold, scale, printedIndexOpen, printedIndexZoom, numPages, suppressSurfaceTap, mode]);
  useEffect(() => { if(mode==="paged")viewerRef.current?.scrollTo({top:0,left:0}); }, [page, bookId, mode]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.defaultPrevented || e.altKey || e.ctrlKey || e.metaKey ||
          target?.closest('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === "ArrowRight") goTo(page + 1); // Quran: right = next
      else if (e.key === "ArrowLeft") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  const fullscreen = () => setImmersive(value => !value);

  const neighbors = useMemo<number[]>(() => {
    // Hidden PDF canvases can exhaust WebView memory on larger offline books.
    if (!numPages || isOfflineAndroid || mode==="continuous") return [];
    const set = new Set<number>();
    [page - 1, page + 1, page - 2, page + 2].forEach((p) => {
      if (p >= 1 && p <= numPages && p !== page) set.add(p);
    });
    return Array.from(set);
  }, [page, numPages, isOfflineAndroid, mode]);


  return (
    <BookReaderLayout immersive={immersive} toolbarVisible={toolbarVisible}
      onRevealToolbar={() => setToolbarVisible(true)} onExit={() => setImmersive(false)}
      label="قارئ الكتاب" audioPage={bookId === "ward" ? page : undefined}
      onAudioJump={bookId === "ward" ? goTo : undefined}>
      {/* Index floats outside the toolbar; zoom buttons live only in Settings. */}
      <div className="book-reader-workspace" dir="ltr">
        <aside className="book-reader-page-rail" aria-label="التنقل بين صفحات الكتاب">
          <BookReaderNavigation
            bookId={bookId}
            page={printedIndexOpen ? printedIndexSheet - NAFAHAT_INDEX_FIRST + 1 : page}
            maxPage={printedIndexOpen ? NAFAHAT_INDEX_LAST - NAFAHAT_INDEX_FIRST + 1 : numPages}
            immersive={immersive}
            indexMode={printedIndexOpen}
            headings={outline.length ? outline : verifiedNafahatKhaliliyyaHeadings(bookId, numPages)}
            onJump={printedIndexOpen
              ? target => {
                  setPrintedIndexSheet(NAFAHAT_INDEX_FIRST + target - 1);
                  continuousRef.current?.jumpToPage(target);
                }
              : goTo}
          />
        </aside>
        <div className="book-reader-main" dir="rtl">
        <div className="reader-floating-index">
          {bookId === "nafahat" ? (
            <Button type="button" variant="outline" size="icon" className="reader-floating-index__button"
              aria-label={printedIndexOpen ? "إغلاق الفهرس" : "فهرس جامع النفحات"}
              title="فهرس جامع النفحات" aria-expanded={printedIndexOpen}
              onClick={() => { setPrintedIndexSheet(NAFAHAT_INDEX_FIRST); setPrintedIndexOpen(v => !v); }}>
              {printedIndexOpen ? <X size={19}/> : <List size={19}/>}
            </Button>
          ) : (
            <BookQuickIndex compact maxPage={numPages} page={page}
              headings={outline.length ? outline : verifiedNafahatKhaliliyyaHeadings(bookId, numPages)}
              onJump={goTo} />
          )}
          <Button variant="outline" size="icon"
            type="button"
            onClick={fullscreen}
            className="reader-floating-index__button"
            aria-label={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
            title={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
          >
            {immersive ? <Minimize2 size={19} aria-hidden="true" /> : <Maximize2 size={19} aria-hidden="true" />}
          </Button>
        </div>
      <div className="reader-topbar reader-toolbar glass mb-2 flex items-center gap-2 rounded-xl px-2 py-2" dir="rtl">
        <h2 className="reader-topbar__title font-display" title={getBook(bookId)?.title}>{getBook(bookId)?.title}</h2>
      </div>

      {/* Viewer */}
      <div
        ref={(el) => {
          containerRef.current = el;
          viewerRef.current = el;
        }}
        className="reader-surface book-pdf-stage rounded-xl p-2 flex flex-col justify-start items-start min-h-[65vh] select-none overflow-auto"
        onClick={onSurfaceClick}
          onKeyDown={onSurfaceKeyDown}
          tabIndex={0}
          role="region"
          aria-label="محتوى صفحة الكتاب — Enter أو المسافة لإظهار أدوات القراءة أو إخفائها"
      >
        {isOfflineAndroid && !readerSource ? (
          <div role={sourceError ? "alert" : "status"} className="rounded-xl p-6 text-center font-body text-sm text-gold-soft">
            <p>{sourceError || "جارٍ تجهيز النسخة المحلية للكتاب…"}</p>
            {sourceError && <button type="button" className="mt-3 rounded-lg border border-gold/30 px-4 py-2"
              onClick={() => setRetry((n) => n + 1)}>إعادة المحاولة</button>}
          </div>
        ) : <Document
          key={`${bookId}-${retry}`}
          file={readerSource ?? PDF_URL}
          onLoadSuccess={(document) => {
            const n = document.numPages;
            setReaderError("");
            setNumPages(n);
            setPage((current) => clampPage(current, n));
            void document.getPage(1).then(first=>{
              const vp=first.getViewport({scale:1});
              recordPageRatio(1, vp.width, vp.height);
            }).catch(()=>{ /* preserve a safe aspect ratio fallback */ });
            setOutline([]);
            // Read actual PDF bookmark destinations. Do not manufacture poem
            // titles or index positions in the books of madih.
            void (async () => {
              try {
                const items = await document.getOutline();
                const found: { title: string; page: number }[] = [];
                // PDF outlines are trees. Visit every real nested bookmark, not
                // only root-level entries, while retaining source page numbers.
                const queue = [...(items ?? [])];
                for (let i = 0; i < queue.length; i++) {
                  const item = queue[i];
                  if (item.items?.length) queue.splice(i + 1, 0, ...item.items);
                  if (!item.dest || typeof item.title !== "string") continue;
                  const dest = typeof item.dest === "string"
                    ? await document.getDestination(item.dest) : item.dest;
                  if (!Array.isArray(dest) || !dest.length) continue;
                  const zeroBased = typeof dest[0] === "number"
                    ? dest[0] : await document.getPageIndex(dest[0]);
                  const target = zeroBased + 1;
                  if (Number.isSafeInteger(target) && target >= 1 && target <= n) {
                    found.push({ title: item.title, page: target });
                  }
                }
                setOutline(found);
              } catch {
                // Bookmark metadata is optional: readable page navigation remains.
                setOutline([]);
              }
            })();
          }}
          options={pdfOptions}
          onLoadError={(error) => {
            console.error("[Book PDF] failed to open", bookId, error);
            setReaderError(error instanceof Error ? error.message : String(error));
          }}
          onSourceError={(error) => {
            console.error("[Book PDF] failed to read source", bookId, error);
            setReaderError(error instanceof Error ? error.message : String(error));
          }}
          loading={
            <div className="flex flex-col items-center gap-3 py-8 w-full">
              <Skeleton className="w-full max-w-[800px] aspect-[1/1.4] rounded-lg" />
              <p className="text-sm font-body text-gold-soft/80">جارٍ تحميل الكتاب…</p>
            </div>
          }
          error={
            <div className="text-center py-12 px-4">
              <p className="text-sm text-muted-foreground font-body mb-3">
                تعذّر تحميل الكتاب.
                {readerError && <span className="block mt-2 text-xs break-words" dir="ltr">{readerError}</span>}
              </p>
              <button
                type="button"
                className="rounded-lg border border-gold/30 px-4 py-2 text-sm text-gold-soft"
                onClick={() => { setReaderError(""); setRetry((n) => n + 1); }}
              >
                إعادة المحاولة
              </button>
              {!isOfflineAndroid && (
                <a
                  href={PDF_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="block mt-3 text-gold-soft underline text-sm"
                >
                  فتحه في نافذة جديدة
                </a>
              )}
            </div>
          }
        >
          {bookId === "nafahat" && printedIndexOpen ? (
            <ContinuousBookStack
              key="printed-index"
              ref={continuousRef}
              layout={printedIndexLayout}
              width={printedIndexWidth}
              initialPage={printedIndexSheet - NAFAHAT_INDEX_FIRST + 1}
              overscan={printedIndexZoom < 1.75 ? 1 : 0}
              viewportRef={viewerRef}
              onActivePage={indexPage => setPrintedIndexSheet(NAFAHAT_INDEX_FIRST + indexPage - 1)}
              renderPage={indexPage => (
                <NafahatPrintedIndex
                  sheet={NAFAHAT_INDEX_FIRST + indexPage - 1}
                  width={printedIndexWidth}
                  onJump={target => {
                    goTo(target);
                    setPrintedIndexOpen(false);
                  }}
                />
              )}
            />
          ) : mode==="continuous" && numPages>0 ? (
            <ContinuousBookStack key="book-pages" ref={continuousRef} layout={continuousLayout} width={renderedWidth}
              initialPage={page} overscan={scale < 1.75 ? 1 : 0} viewportRef={viewerRef} onActivePage={setPage}
              renderPage={(target)=>(
                <Page key={target} pageNumber={target} width={renderedWidth}
                  onLoadSuccess={source => {
                    const viewport = source.getViewport({scale: 1});
                    recordPageRatio(target, viewport.width, viewport.height);
                  }}
                  renderTextLayer={false} renderAnnotationLayer={false}
                  loading={<Skeleton style={{width:renderedWidth,height:continuousLayout.heights[target-1]}} />}
                  className="reader-paper" />
              )} />
          ) : (
            <Page
              key={page}
              pageNumber={page}
              width={pageWidth * scale}
              renderTextLayer={false}
              renderAnnotationLayer={false}
              loading={
                <Skeleton
                  className="rounded-lg"
                  style={{
                    width: pageWidth * scale,
                    height: pageWidth * scale * 1.4,
                  }}
                />
              }
              className="reader-paper book-page-arrive rounded-lg overflow-hidden"
            />
          )}
          <div
            aria-hidden
            style={{
              position: "absolute",
              width: 0,
              height: 0,
              overflow: "hidden",
              opacity: 0,
              pointerEvents: "none",
            }}
          >
            {neighbors.map((p) => (
              <Page
                key={`pre-${p}`}
                pageNumber={p}
                width={pageWidth * scale}
                renderTextLayer={false}
                renderAnnotationLayer={false}
              />
            ))}
          </div>
        </Document>}
      </div>
        </div>
      </div>

    </BookReaderLayout>
  );
}
