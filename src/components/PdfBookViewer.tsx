import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import { clampPage, parseSavedPage } from "@/lib/reading-page";
import { loadLocalBookPdf } from "@/lib/book-pdf-source";
import { BookReaderLayout, useBookImmersive } from "@/components/BookReaderLayout";
import { BookQuickIndex } from "@/components/BookQuickIndex";
import { getBook } from "@/data/books";
import { verifiedNafahatKhaliliyyaHeadings } from "@/lib/nafahat-khaliliyya-index";
import { BookReaderNavigation } from "@/components/BookReaderNavigation";
import {
  NafahatPrintedIndex, NAFAHAT_INDEX_FIRST, NAFAHAT_INDEX_LAST,
  NAFAHAT_INDEX_REFERENCES,
} from "@/components/NafahatPrintedIndex";
import { rtlSwipePageDelta, verticalPageTurn, type ScrollViewport } from "@/lib/book-paging";
import { twoFingerDistance, zoomFromPinch, zoomFromWheel, boundedBookZoom } from "@/lib/book-pinch";
import { requestedWirdPage } from "@/lib/wird-reminders";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Settings2,
  CornerDownLeft,
  List,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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
  const [printedIndexZoom, setPrintedIndexZoom] = useState(1);
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
  const [input, setInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(360);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const pinchRef = useRef<{ distance: number; zoom: number; printed: boolean } | null>(null);

  // Swipe sensitivity: smaller threshold = more sensitive.
  // Higher values reduce accidental navigation.
  const SENS_KEY = "reader.swipeThreshold";
  const [swipeThreshold, setSwipeThreshold] = useState<number>(80);
  const [swipeLoaded, setSwipeLoaded] = useState(false);
  useEffect(() => {
    try {
      const v = Number(localStorage.getItem(SENS_KEY));
      if (v >= 30 && v <= 200) setSwipeThreshold(v);
    } catch {
      // Storage may be unavailable in restricted browser contexts.
    }
    setSwipeLoaded(true);
  }, []);
  useEffect(() => {
    if (!swipeLoaded) return;
    try {
      localStorage.setItem(SENS_KEY, String(swipeThreshold));
    } catch {
      // Keep the in-memory setting if persistence is disabled.
    }
  }, [swipeThreshold, swipeLoaded]);

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

  useEffect(() => {
    setInput(String(page));
  }, [page]);


  // Light haptic feedback on every successful page change (mobile only)
  useEffect(() => {
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      navigator.vibrate(12);
    }
  }, [page]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 8;
        setPageWidth(Math.min(900, Math.max(200, w)));
      }
    };
    update();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(update) : null;
    if (observer && containerRef.current) observer.observe(containerRef.current);
    window.addEventListener("resize", update);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [immersive]);

  const goTo = useCallback(
    (p: number) => {
      if (numPages < 1) return;
      setPage(clampPage(p, numPages));
      viewerRef.current?.scrollTo({ top: 0, left: 0 });
    },
    [numPages]
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
        pinchRef.current = { distance: twoFingerDistance(e.touches), zoom: printedIndexOpen ? printedIndexZoom : scale, printed: printedIndexOpen };
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
        if (pinchRef.current.printed) setPrintedIndexZoom(next);
        else setScale(next);
      }
    };
    const onEnd = (e: TouchEvent) => {
      if (pinchRef.current) { pinchRef.current = null; active = false; return; }
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < swipeThreshold) return;
      if (absY >= absX) {
        const turn = startedAt ? verticalPageTurn(dy, swipeThreshold, startedAt) : 0;
        if (turn) goTo(page + turn);
      } else if (scale <= 1 && !printedIndexOpen) {
        const next = rtlSwipePageDelta(dx, swipeThreshold);
        if (next) goTo(page + next);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    el.addEventListener("touchmove", onMove, { passive: false });
    const onCancel = () => { pinchRef.current = null; active = false; };
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      if (e.cancelable) e.preventDefault();
      if (printedIndexOpen) setPrintedIndexZoom(value => zoomFromWheel(value, e.deltaY));
      else setScale(value => zoomFromWheel(value, e.deltaY));
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
  }, [page, goTo, swipeThreshold, scale, printedIndexOpen, printedIndexZoom]);
  useEffect(() => { viewerRef.current?.scrollTo({ top: 0, left: 0 }); }, [page, bookId]);

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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(input.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) goTo(n);
  };

  const fullscreen = () => setImmersive(value => !value);

  const neighbors = useMemo<number[]>(() => {
    // Hidden PDF canvases can exhaust WebView memory on larger offline books.
    if (!numPages || isOfflineAndroid) return [];
    const set = new Set<number>();
    [page - 1, page + 1, page - 2, page + 2].forEach((p) => {
      if (p >= 1 && p <= numPages && p !== page) set.add(p);
    });
    return Array.from(set);
  }, [page, numPages, isOfflineAndroid]);


  return (
    <BookReaderLayout immersive={immersive} label="قارئ الكتاب">
      {/* Single reader bar: title, index, zoom, paging and exit only. */}
      <div className="reader-topbar reader-toolbar glass mb-2 flex items-center gap-2 rounded-xl px-2 py-2" dir="rtl">
        <h2 className="reader-topbar__title font-display" title={getBook(bookId)?.title}>{getBook(bookId)?.title}</h2>
        <div className="reader-topbar__actions" dir="ltr">
          {bookId === "nafahat" ? (
            <button type="button" className="reader-icon-button"
              aria-label={printedIndexOpen ? "إغلاق الفهرس" : "فهرس جامع النفحات"}
              title="فهرس جامع النفحات"
              aria-expanded={printedIndexOpen}
              onClick={() => { setPrintedIndexSheet(NAFAHAT_INDEX_FIRST); setPrintedIndexOpen(v => !v); }}>
              {printedIndexOpen ? <X size={19}/> : <List size={19}/>}
            </button>
          ) : (
            <BookQuickIndex compact maxPage={numPages} page={page}
              headings={outline.length ? outline : verifiedNafahatKhaliliyyaHeadings(bookId, numPages)}
              onJump={goTo} />
          )}
          {printedIndexOpen && bookId === "nafahat" && (
            <>
              <button type="button" className="reader-icon-button" disabled={printedIndexSheet <= NAFAHAT_INDEX_FIRST}
                onClick={() => setPrintedIndexSheet(n => Math.max(NAFAHAT_INDEX_FIRST,n-1))}
                aria-label="صفحة الفهرس السابقة" title="السابق"><ChevronRight size={19}/></button>
              <span className="reader-topbar__page tabular-nums" dir="ltr">{printedIndexSheet - NAFAHAT_INDEX_FIRST + 1}/7</span>
              <button type="button" className="reader-icon-button" disabled={printedIndexSheet >= NAFAHAT_INDEX_LAST}
                onClick={() => setPrintedIndexSheet(n => Math.min(NAFAHAT_INDEX_LAST,n+1))}
                aria-label="صفحة الفهرس التالية" title="التالي"><ChevronLeft size={19}/></button>
            </>
          )}

        <form onSubmit={onSubmit} className="reader-page-form flex items-center gap-1 min-w-0">
          <div className="relative">
            <Search className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gold/60 pointer-events-none" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              inputMode="numeric"
              className="w-16 bg-velvet/40 border border-gold/20 rounded-md pr-7 pl-2 py-1.5 text-xs font-body text-gold-soft focus:outline-none focus:border-gold/60"
              placeholder="صفحة"
              aria-label="رقم الصفحة"
            />
          </div>
          <button
            type="submit"
            className="glass-gold rounded-md px-2.5 py-1.5 text-xs font-body text-gold-soft"
          >
            <CornerDownLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">الانتقال إلى رقم الصفحة</span>
          </button>
        </form>

        <div className="flex items-center gap-1">
          <button
            onClick={() => printedIndexOpen ? setPrintedIndexZoom(v => boundedBookZoom(v - .25)) : setScale(v => boundedBookZoom(v - .25))}
            className="p-1.5 rounded-md glass text-gold-soft"
            aria-label="تصغير"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => printedIndexOpen ? setPrintedIndexZoom(v => boundedBookZoom(v + .25)) : setScale(v => boundedBookZoom(v + .25))}
            className="p-1.5 rounded-md glass text-gold-soft"
            aria-label="تكبير"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fullscreen}
            className="p-1.5 rounded-md glass text-gold-soft"
            aria-label={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}
          >
            {immersive ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
          </button>
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-1.5 rounded-md glass text-gold-soft"
                aria-label="إعدادات القراءة"
              >
                <Settings2 className="w-3.5 h-3.5" />
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              className="w-64 glass border-gold/20 text-gold-soft"
            >
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-display mb-1">حساسية التمرير باللمس</p>
                  <p className="text-[10px] text-gold-soft/60 font-body leading-relaxed">
                    كلما زادت المسافة قلّ الانتقال العرَضي بين الصفحات.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[
                    { label: "عالية", value: 40 },
                    { label: "متوسطة", value: 80 },
                    { label: "منخفضة", value: 140 },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setSwipeThreshold(opt.value)}
                      className={`px-2 py-1.5 rounded-md text-[11px] font-body transition-all ${
                        swipeThreshold === opt.value
                          ? "glass-gold text-gold-soft"
                          : "glass text-gold-soft/80 hover:text-gold-soft"
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={30}
                    max={200}
                    step={5}
                    value={swipeThreshold}
                    onChange={(e) => setSwipeThreshold(Number(e.target.value))}
                    className="flex-1 accent-[hsl(var(--gold))]"
                    aria-label="ضبط دقيق للحساسية"
                  />
                  <span className="text-[10px] font-body tabular-nums w-10 text-left">
                    {swipeThreshold}px
                  </span>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <BookReaderNavigation bookId={bookId} page={page} maxPage={numPages} immersive={immersive}
            headings={outline.length ? outline : verifiedNafahatKhaliliyyaHeadings(bookId, numPages)} onJump={goTo} />
        </div>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={(el) => {
          containerRef.current = el;
          viewerRef.current = el;
        }}
        className="reader-surface book-pdf-stage rounded-xl p-2 flex flex-col justify-start items-start min-h-[65vh] select-none overflow-auto"
      >
        {isOfflineAndroid && !readerSource ? (
          <div role={sourceError ? "alert" : "status"} className="rounded-xl p-6 text-center font-body text-sm text-gold-soft">
            <p>{sourceError || "جارٍ تجهيز النسخة المحلية للكتاب…"}</p>
            {sourceError && <button type="button" className="mt-3 rounded-lg border border-gold/30 px-4 py-2"
              onClick={() => setRetry((n) => n + 1)}>إعادة المحاولة</button>}
          </div>
        ) : <Document
          key={`${bookId}-${retry}`}
          file={readerSource!}
          onLoadSuccess={(document) => {
            const n = document.numPages;
            setReaderError("");
            setNumPages(n);
            setPage((current) => clampPage(current, n));
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
            <NafahatPrintedIndex
              sheet={printedIndexSheet}
              width={Math.round(Math.max(240, Math.min(900, pageWidth)) * printedIndexZoom)}
              onJump={(target) => {
                goTo(target);
                setPrintedIndexOpen(false);
              }}
            />
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

    </BookReaderLayout>
  );
}
