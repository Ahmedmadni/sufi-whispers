import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import {
  ChevronRight,
  ChevronLeft,
  Search,
  Maximize2,
  ZoomIn,
  ZoomOut,
  Settings2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const pdfOptions = {
  cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

type Props = {
  pdfUrl?: string;
  bookId?: string;
};

export default function PdfBookViewer({ pdfUrl = "/book.pdf", bookId = "nafahat" }: Props) {
  const PDF_URL = pdfUrl;
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(360);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(String(page));
  }, [page]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 8;
        setPageWidth(Math.min(900, Math.max(280, w)));
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const goTo = useCallback(
    (p: number) => {
      const clamped = Math.max(1, Math.min(numPages || 1, p));
      setPage(clamped);
    },
    [numPages]
  );

  // Swipe navigation. User preference: swipe down OR swipe right → next page;
  // swipe up OR swipe left → previous page.
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;
    let startX = 0;
    let startY = 0;
    let active = false;
    const onStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      active = true;
    };
    const onEnd = (e: TouchEvent) => {
      if (!active) return;
      active = false;
      const t = e.changedTouches[0];
      const dx = t.clientX - startX;
      const dy = t.clientY - startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      if (Math.max(absX, absY) < 50) return;
      if (absX >= absY) {
        if (dx > 0) goTo(page + 1); // right → next
        else goTo(page - 1);
      } else {
        if (dy > 0) goTo(page + 1); // down → next
        else goTo(page - 1);
      }
    };
    el.addEventListener("touchstart", onStart, { passive: true });
    el.addEventListener("touchend", onEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onStart);
      el.removeEventListener("touchend", onEnd);
    };
  }, [page, goTo]);

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(page + 1); // RTL: left = next
      else if (e.key === "ArrowRight") goTo(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [page, goTo]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(input.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) goTo(n);
  };

  const fullscreen = () => {
    viewerRef.current?.requestFullscreen?.();
  };

  const neighbors = useMemo<number[]>(() => {
    if (!numPages) return [];
    const set = new Set<number>();
    [page - 1, page + 1, page - 2, page + 2].forEach((p) => {
      if (p >= 1 && p <= numPages && p !== page) set.add(p);
    });
    return Array.from(set);
  }, [page, numPages]);

  const bookmarks = useMemo(() => {
    if (bookId === "nafahat") {
      return [
        { label: "الغلاف", page: 1 },
        { label: "المقدمة", page: 6 },
        { label: "القصائد", page: 20 },
        { label: "الفهرس", page: 425 },
      ];
    }
    if (bookId === "ward") {
      return [
        { label: "المقدمة", page: 1 },
        { label: "الحزب الأول", page: 4 },
        { label: "الحزب الثاني", page: 22 },
        { label: "إلى باب الكريم", page: 37 },
        { label: "أوراد السادة الخليلية", page: 40 },
        { label: "الغلاف", page: 47 },
      ];
    }
    return [];
  }, [bookId]);

  return (
    <>
      {bookmarks.length > 0 && (
        <div className="glass rounded-xl p-2 mb-2 flex flex-nowrap items-center gap-1.5 overflow-x-auto">
          {bookmarks.map((b) => (
            <button
              key={b.label}
              onClick={() => goTo(b.page)}
              className={`shrink-0 px-2.5 py-1 rounded-md text-[11px] font-body transition-all ${
                page === b.page
                  ? "glass-gold text-gold-soft"
                  : "text-gold-soft/80 hover:text-gold-soft"
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>
      )}

      {/* Controls */}
      <div className="glass rounded-xl p-2 mb-2 flex items-center gap-2 justify-between">
        <form onSubmit={onSubmit} className="flex items-center gap-1.5 min-w-0">
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
            انتقل
          </button>
        </form>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
            className="p-1.5 rounded-md glass text-gold-soft"
            aria-label="تصغير"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
            className="p-1.5 rounded-md glass text-gold-soft"
            aria-label="تكبير"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={fullscreen}
            className="p-1.5 rounded-md glass text-gold-soft"
            aria-label="ملء الشاشة"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={(el) => {
          containerRef.current = el;
          viewerRef.current = el;
        }}
        className="glass rounded-xl p-1 flex flex-col justify-center items-center min-h-[70vh] bg-velvet/30 touch-pan-y select-none"
      >
        <Document
          file={PDF_URL}
          onLoadSuccess={({ numPages: n }) => setNumPages(n)}
          options={pdfOptions}
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
              </p>
              <a
                href={PDF_URL}
                target="_blank"
                rel="noreferrer"
                className="text-gold-soft underline text-sm"
              >
                فتحه في نافذة جديدة
              </a>
            </div>
          }
        >
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
            className="shadow-xl rounded-lg overflow-hidden"
          />
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
        </Document>
      </div>

      {/* Bottom pager */}
      <div className="glass rounded-xl p-2 mt-2 flex items-center justify-between gap-2">
        <button
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          className="flex items-center gap-1 px-3 py-2 rounded-md glass disabled:opacity-30 text-gold-soft text-sm"
          aria-label="السابق"
        >
          <ChevronRight className="w-4 h-4" />
          السابق
        </button>
        <span className="text-sm font-display text-gold-soft tabular-nums">
          {page}{numPages ? ` / ${numPages}` : ""}
        </span>
        <button
          onClick={() => goTo(page + 1)}
          disabled={!numPages || page >= numPages}
          className="flex items-center gap-1 px-3 py-2 rounded-md glass disabled:opacity-30 text-gold-soft text-sm"
          aria-label="التالي"
        >
          التالي
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>
    </>
  );
}
