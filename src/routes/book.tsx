import { createFileRoute } from "@tanstack/react-router";
import { useState, useRef, useEffect } from "react";
import { ChevronRight, ChevronLeft, Search, Download, Maximize2 } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";

const TOTAL_PAGES = 432;

export const Route = createFileRoute("/book")({
  head: () => ({
    meta: [
      { title: "استعراض الكتاب — جامع النفحات" },
      {
        name: "description",
        content:
          "تصفّح كتاب جامع النفحات في مدح سيد السادات ﷺ صفحةً صفحةً، مع البحث عبر رقم الصفحة في الفهرس.",
      },
      { property: "og:title", content: "استعراض الكتاب — جامع النفحات" },
      {
        property: "og:description",
        content: "نسخة رقمية كاملة من الكتاب مع بحث عبر رقم الصفحة.",
      },
    ],
  }),
  component: BookViewer,
});

function BookViewer() {
  const [page, setPage] = useState(1);
  const [input, setInput] = useState("1");
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    setInput(String(page));
  }, [page]);

  const goTo = (p: number) => {
    const clamped = Math.max(1, Math.min(TOTAL_PAGES, p));
    setPage(clamped);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = parseInt(input.replace(/[^\d]/g, ""), 10);
    if (!Number.isNaN(n)) goTo(n);
  };

  const fullscreen = () => {
    iframeRef.current?.requestFullscreen?.();
  };

  const pdfSrc = `/book.pdf#page=${page}&view=FitH&toolbar=0&navpanes=0`;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="max-w-6xl mx-auto px-4 py-8 sm:py-12">
        <header className="text-center mb-8">
          <div className="text-xs text-gold/80 font-body tracking-widest mb-2 uppercase">
            النسخة الرقمية الكاملة
          </div>
          <h1 className="font-display text-3xl sm:text-4xl text-gradient-gold">
            استعراض الكتاب
          </h1>
          <p className="mt-3 text-sm text-muted-foreground font-body">
            ابدأ من الفهرس، ثم أدخل رقم الصفحة الظاهر أمام كل قصيدة للانتقال إليها مباشرة.
          </p>
        </header>

        {/* Controls */}
        <div className="glass rounded-2xl p-4 sm:p-5 mb-5 flex flex-wrap items-center gap-3 justify-between">
          <form onSubmit={onSubmit} className="flex items-center gap-2">
            <label className="text-xs font-body text-muted-foreground hidden sm:block">
              رقم الصفحة:
            </label>
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/60 pointer-events-none" />
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                type="text"
                inputMode="numeric"
                className="w-32 bg-velvet/40 border border-gold/20 rounded-lg pr-9 pl-3 py-2 text-sm font-body text-gold-soft focus:outline-none focus:border-gold/60"
                placeholder="مثال: ٢٥"
                aria-label="ابحث برقم الصفحة"
              />
            </div>
            <button
              type="submit"
              className="glass-gold rounded-lg px-4 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
            >
              انتقل
            </button>
            <span className="text-xs text-muted-foreground font-body hidden sm:inline">
              من أصل {TOTAL_PAGES}
            </span>
          </form>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goTo(page - 1)}
              disabled={page <= 1}
              className="p-2 rounded-lg glass hover:glow-gold disabled:opacity-30 disabled:cursor-not-allowed text-gold-soft"
              aria-label="الصفحة السابقة"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <span className="text-sm font-display text-gold-soft min-w-[3rem] text-center">
              {page}
            </span>
            <button
              onClick={() => goTo(page + 1)}
              disabled={page >= TOTAL_PAGES}
              className="p-2 rounded-lg glass hover:glow-gold disabled:opacity-30 disabled:cursor-not-allowed text-gold-soft"
              aria-label="الصفحة التالية"
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
            <a
              href="/book.pdf"
              download
              className="p-2 rounded-lg glass hover:glow-gold text-gold-soft"
              aria-label="تحميل الكتاب"
            >
              <Download className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Quick index shortcuts */}
        <div className="flex flex-wrap items-center gap-2 mb-5 text-xs font-body">
          <span className="text-muted-foreground">انتقال سريع:</span>
          {[
            { label: "الغلاف", p: 1 },
            { label: "الفهرس", p: 5 },
            { label: "بداية القصائد", p: 25 },
            { label: "المنتصف", p: Math.floor(TOTAL_PAGES / 2) },
            { label: "النهاية", p: TOTAL_PAGES },
          ].map((s) => (
            <button
              key={s.label}
              onClick={() => goTo(s.p)}
              className="px-3 py-1.5 rounded-full border border-gold/20 text-gold-soft hover:bg-gold/10 hover:border-gold/50 transition-colors"
            >
              {s.label} <span className="text-gold/50">({s.p})</span>
            </button>
          ))}
        </div>

        {/* Viewer */}
        <div className="glass rounded-2xl p-2 sm:p-3 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at top, oklch(0.78 0.12 80 / 0.25), transparent 60%)",
            }}
          />
          <iframe
            ref={iframeRef}
            key={page}
            src={pdfSrc}
            title={`الكتاب — صفحة ${page}`}
            className="relative w-full rounded-xl bg-white"
            style={{ height: "min(85vh, 1000px)", minHeight: "500px" }}
          />
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground font-body">
          إن لم يظهر الكتاب أعلاه، يمكنك{" "}
          <a href="/book.pdf" target="_blank" rel="noreferrer" className="text-gold-soft underline">
            فتحه في نافذة جديدة
          </a>
          .
        </p>
      </section>
    </div>
  );
}
