import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Maximize2, Minimize2, SlidersHorizontal } from "lucide-react";
import { BookQuickIndex } from "@/components/BookQuickIndex";
import { verifiedNafahatKhaliliyyaHeadings } from "@/lib/nafahat-khaliliyya-index";
import { BookReaderNavigation } from "@/components/BookReaderNavigation";
import { BookReaderLayout, useBookImmersive } from "@/components/BookReaderLayout";
import { rtlSwipePageDelta } from "@/lib/book-paging";
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
  const startX = useRef<number | null>(null);
  const pinch = useRef<{ distance: number; zoom: number } | null>(null);
  const [swipeThreshold, setSwipeThreshold] = useState(75);
  useEffect(() => { try { const n = Number(localStorage.getItem("reader.swipeThreshold")); if (n >= 30 && n <= 200) setSwipeThreshold(n); } catch { /* optional */ } }, []);
  const scroll = useRef<HTMLDivElement>(null);

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
    setPage(clampPage(target, maxPage));
    scroll.current?.scrollTo({ left: 0, top: 0 });
  };
  const image = useMemo(() => entry?.pages[page - 1], [entry, page]);
  const imageUrl = image ? `/offline-books/${encodeURIComponent(bookId)}/${image.name}${imageRetry ? `?retry=${imageRetry}` : ""}` : "";

  return (
    <BookReaderLayout immersive={immersive} label="قارئ الكتاب دون إنترنت">
      <div className="reader-toolbar glass mb-2 flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2">
        <div className="flex items-center gap-2">
          <button type="button" className="rounded-lg border border-gold/25 p-2 text-gold-soft" aria-label="تصغير"
            onClick={() => setZoom(value => Math.max(1, +(value - 0.25).toFixed(2)))}><ZoomOut size={17} /></button>
          <span className="min-w-10 text-center text-xs tabular-nums">{Math.round(zoom * 100)}٪</span>
          <button type="button" className="rounded-lg border border-gold/25 p-2 text-gold-soft" aria-label="تكبير"
            onClick={() => setZoom(value => Math.min(3, +(value + 0.25).toFixed(2)))}><ZoomIn size={17} /></button>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-body text-foreground/80">صفحة {page} من {maxPage || "…"}</span>
          <details className="relative text-sm">
            <summary className="inline-flex min-h-11 min-w-11 cursor-pointer items-center justify-center rounded-lg border border-gold/30 text-gold-soft" aria-label="إعداد حساسية تقليب الصفحات" title="حساسية التمرير">
              <SlidersHorizontal size={18} />
            </summary>
            <div className="absolute left-0 top-full z-30 mt-1 w-52 rounded-xl border border-gold/25 bg-card p-3 shadow-lg">
              <label className="grid gap-2 text-xs text-foreground">حساسية تقليب الصفحات
                <input type="range" min="30" max="200" step="5" value={swipeThreshold} aria-label="مسافة التمرير باللمس"
                  onChange={event => { const v = Number(event.currentTarget.value); setSwipeThreshold(v);
                    try { localStorage.setItem("reader.swipeThreshold", String(v)); } catch { /* optional */ }
                  }} />
                <span>{swipeThreshold} بكسل — الأصغر أكثر حساسية</span>
              </label>
            </div>
          </details>
          <button type="button" onClick={() => setImmersive(value => !value)}
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-gold/30 text-gold-soft"
            aria-label={immersive ? "الخروج من ملء الشاشة" : "ملء الشاشة"}>
            {immersive ? <Minimize2 size={19} /> : <Maximize2 size={19} />}
          </button>
        </div>
      </div>
      <BookQuickIndex maxPage={maxPage} page={page} headings={entry?.toc?.length ? entry.toc : verifiedNafahatKhaliliyyaHeadings(bookId, maxPage, entry?.sourceSha256)}
        onJump={goTo} />
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
          style={{ maxHeight: immersive ? "none" : "min(77dvh, 970px)", minHeight: immersive ? 0 : "55vh", touchAction: "pan-x pan-y pinch-zoom" }}
          onTouchStart={e => {
            startX.current = e.touches.length === 1 ? e.touches[0].clientX : null;
            if (e.touches.length === 2) {
              const distance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
              pinch.current = { distance, zoom };
            }
          }}
          onTouchMove={e => {
            if (e.touches.length === 2 && pinch.current && pinch.current.distance > 0) {
              const distance = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
              setZoom(Math.max(1, Math.min(3, Math.round(100 * pinch.current.zoom * distance / pinch.current.distance) / 100)));
            }
          }}
          onTouchEnd={e => {
            if (pinch.current) { pinch.current = null; startX.current = null; return; }
            if (zoom > 1 || startX.current === null || e.changedTouches.length !== 1) return;
            const delta = e.changedTouches[0].clientX - startX.current;
            startX.current = null;
            const deltaPages = rtlSwipePageDelta(delta, swipeThreshold);
            if (deltaPages) goTo(page + deltaPages);
          }}
        >
          <img key={imageUrl} src={imageUrl} alt={`صفحة ${page} من الكتاب`}
            width={image.width} height={image.height} draggable={false}
            className="book-page-arrive mx-auto block h-auto max-w-none select-none"
            style={{ width: `${zoom * 100}%`, minWidth: zoom > 1 ? `${zoom * 100}%` : undefined }}
            onError={() => setError("تعذّر عرض صفحة الكتاب من الملفات المحلية.")}
          />
        </div>
      )}
      <BookReaderNavigation bookId={bookId} page={page} maxPage={maxPage} onJump={goTo} />
      {error && image && <button type="button" className="mt-2 text-xs text-gold-soft"
        onClick={() => { setError(""); setImageRetry(n => n + 1); }}>أعد عرض الصفحة</button>}
    </BookReaderLayout>
  );
}
