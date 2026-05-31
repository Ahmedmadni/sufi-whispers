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
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

const PDF_URL = "/book.pdf";

const pdfOptions = {
  cMapUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/cmaps/`,
  cMapPacked: true,
  standardFontDataUrl: `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
};

export default function PdfBookViewer() {
  const [numPages, setNumPages] = useState<number>(0);
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("1");
  const [scale, setScale] = useState(1);
  const [pageWidth, setPageWidth] = useState(800);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInput(String(page));
  }, [page]);

  useEffect(() => {
    const update = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth - 24;
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

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(input.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) goTo(n);
  };

  const fullscreen = () => {
    containerRef.current?.requestFullscreen?.();
  };

  const neighbors = useMemo<number[]>(() => {
    if (!numPages) return [];
    const set = new Set<number>();
    [page - 1, page + 1, page - 2, page + 2].forEach((p) => {
      if (p >= 1 && p <= numPages && p !== page) set.add(p);
    });
    return Array.from(set);
  }, [page, numPages]);

  return (
    <>
      {/* Controls */}
      <div className="glass rounded-2xl p-4 sm:p-5 mb-5 flex flex-wrap items-center gap-3 justify-between">
        <form onSubmit={onSubmit} className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60 pointer-events-none" />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              type="text"
              inputMode="numeric"
              className="w-28 bg-velvet/40 border border-gold/20 rounded-lg pr-9 pl-3 py-2 text-sm font-body text-gold-soft focus:outline-none focus:border-gold/60"
              placeholder="صفحة"
              aria-label="ابحث برقم الصفحة"
            />
          </div>
          <button
            type="submit"
            className="glass-gold rounded-lg px-4 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
          >
            انتقل
          </button>
          {numPages > 0 && (
            <span className="text-xs text-muted-foreground font-body hidden sm:inline">
              من أصل {numPages}
            </span>
          )}
        </form>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setScale((s) => Math.max(0.5, +(s - 0.15).toFixed(2)))}
            className="p-2 rounded-lg glass hover:glow-gold text-gold-soft"
            aria-label="تصغير"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-body text-gold-soft min-w-[3rem] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={() => setScale((s) => Math.min(2.5, +(s + 0.15).toFixed(2)))}
            className="p-2 rounded-lg glass hover:glow-gold text-gold-soft"
            aria-label="تكبير"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gold/20 mx-1" />
          <button
            onClick={() => goTo(page - 1)}
            disabled={page <= 1}
            className="p-2 rounded-lg glass hover:glow-gold disabled:opacity-30 text-gold-soft"
            aria-label="السابق"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <span className="text-sm font-display text-gold-soft min-w-[3.5rem] text-center">
            {page}
            {numPages ? ` / ${numPages}` : ""}
          </span>
          <button
            onClick={() => goTo(page + 1)}
            disabled={!numPages || page >= numPages}
            className="p-2 rounded-lg glass hover:glow-gold disabled:opacity-30 text-gold-soft"
            aria-label="التالي"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="w-px h-6 bg-gold/20 mx-1" />
          <button
            onClick={fullscreen}
            className="p-2 rounded-lg glass hover:glow-gold text-gold-soft"
            aria-label="ملء الشاشة"
          >
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Viewer */}
      <div
        ref={containerRef}
        className="glass rounded-2xl p-3 flex justify-center items-center min-h-[60vh] bg-velvet/30"
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
            <div className="text-center py-12">
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
          {/* Preload adjacent pages off-screen for instant navigation */}
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
    </>
  );
}
