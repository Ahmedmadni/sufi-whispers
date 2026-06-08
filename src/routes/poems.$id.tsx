import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, ArrowLeft, ClipboardCopy, Copy, Heart, Minus, Plus, Share2 } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { SiteHeader } from "@/components/SiteHeader";
import { Ornament } from "@/components/Decorations";
import { poems, type Poem } from "@/data/poems";
import { useFavorites } from "@/hooks/use-favorites";
import {
  buildPoemPlainText,
  groupPoemVerses,
  type Stanza,
} from "@/lib/poem-layout";

export const Route = createFileRoute("/poems/$id")({
  loader: ({ params }) => {
    const p = poems.find((x) => x.id === Number(params.id));
    if (!p) throw notFound();
    return p;
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: `${loaderData?.title ?? "قصيدة"} — جامع النفحات` },
      { name: "description", content: loaderData?.intro ?? "قصيدة من ديوان جامع النفحات." },
      { property: "og:title", content: loaderData?.title ?? "" },
      { property: "og:description", content: loaderData?.intro ?? "" },
    ],
  }),
  component: PoemReader,
  notFoundComponent: () => (
    <div className="min-h-screen flex items-center justify-center">
      <p className="font-body text-muted-foreground">القصيدة غير موجودة</p>
    </div>
  ),
});

function PoemReader() {
  const poem = Route.useLoaderData() as Poem;
  const { isFav, toggle } = useFavorites();
  const [fontSize, setFontSize] = useState(20);
  const [progress, setProgress] = useState(0);

  const layout = useMemo(() => groupPoemVerses(poem), [poem]);

  const { prev, next } = useMemo(() => {
    const idx = poems.findIndex((p) => p.id === poem.id);
    return { prev: poems[idx - 1], next: poems[idx + 1] };
  }, [poem.id]);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const scrolled = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, scrolled)));
    };
    window.addEventListener("scroll", onScroll);
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const copyVerse = async (text: string) => {
    try { await navigator.clipboard.writeText(text); toast.success("تم النسخ"); } catch {}
  };

  const shareVerse = async (text: string) => {
    if (navigator.share) {
      try { await navigator.share({ title: poem.title, text }); } catch {}
    } else {
      copyVerse(text);
    }
  };

  const copyAll = async () => {
    const text = buildPoemPlainText(poem, layout);
    try {
      await navigator.clipboard.writeText(text);
      toast.success("تم نسخ القصيدة كاملة");
    } catch {
      toast.error("تعذّر النسخ");
    }
  };

  return (
    <div className="min-h-screen">
      <SiteHeader />

      {/* progress bar */}
      <div className="sticky top-16 z-30 h-[2px] bg-gold/10">
        <div
          className="h-full bg-gradient-to-l from-gold via-gold-soft to-gold transition-[width] duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <article className="max-w-3xl mx-auto px-4 py-12 sm:py-20">
        <motion.header
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="text-xs text-gold/80 font-body tracking-widest mb-3 uppercase">
            {poem.category}
          </div>
          <Ornament className="w-44 mx-auto mb-5 text-gold/70" />
          <h1 className="font-display text-3xl sm:text-5xl text-gradient-gold leading-tight">
            {poem.title}
          </h1>
          {poem.intro && (
            <p className="mt-5 text-muted-foreground font-body italic">{poem.intro}</p>
          )}
          {poem.meter && (
            <p className="mt-2 text-xs text-gold/60 font-body">على بحر {poem.meter}</p>
          )}
        </motion.header>

        <div className="glass rounded-3xl p-6 sm:p-12 relative overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none opacity-20"
            style={{
              background:
                "radial-gradient(ellipse at top, oklch(0.78 0.12 80 / 0.3), transparent 60%)",
            }}
          />
          <div className="relative space-y-2">
            {layout.kind === "couplets" &&
              layout.verses.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.6, delay: Math.min(i * 0.06, 0.4) }}
                  className="group flex items-start gap-3 py-3 border-b border-gold/10 last:border-0"
                >
                  <span className="text-gold/40 font-display text-sm w-8 mt-2 shrink-0">
                    {v.id}.
                  </span>
                  <div
                    className="verse-line flex-1 grid grid-cols-2 gap-x-3 sm:gap-x-6 text-foreground/95"
                    style={{ ["--verse-base" as any]: `${fontSize}px` }}
                  >
                    <Hemistich text={v.sadr} className="pl-2 sm:pl-3 border-l border-gold/15" />
                    <Hemistich text={v.ajuz ?? ""} />
                  </div>

                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => copyVerse(`${v.sadr}${v.ajuz ? "  ―  " + v.ajuz : ""}`)}
                      className="p-1.5 rounded hover:bg-gold/10 text-muted-foreground hover:text-gold"
                      aria-label="نسخ"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => shareVerse(`${v.sadr}${v.ajuz ? "  ―  " + v.ajuz : ""}`)}
                      className="p-1.5 rounded hover:bg-gold/10 text-muted-foreground hover:text-gold"
                      aria-label="مشاركة"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))}

            {layout.kind === "mukhammas" &&
              layout.stanzas.map((stanza, i) => (
                <StanzaBlock
                  key={i}
                  index={i}
                  stanza={stanza}
                  fontSize={fontSize}
                  onCopy={copyVerse}
                  onShare={shareVerse}
                />
              ))}

            {layout.kind === "stream" && (
              <div
                className="verse-line text-foreground/95"
                style={{ ["--verse-base" as any]: `${fontSize}px` }}
              >
                {(() => {
                  // group rows into stanzas, breaking after each refrain
                  const stanzas: (typeof layout.rows)[] = [];
                  let cur: typeof layout.rows = [];
                  for (const r of layout.rows) {
                    cur.push(r);
                    if (r.type === "refrain") {
                      stanzas.push(cur);
                      cur = [];
                    }
                  }
                  if (cur.length) stanzas.push(cur);

                  return stanzas.map((rows, si) => (
                    <div key={si} className="mukhammas-stanza space-y-2">
                      {rows.map((row, i) => {
                        if (row.type === "refrain") {
                          return (
                            <Hemistich
                              key={i}
                              text={row.text.text}
                              className="hemistich-refrain py-1"
                            />
                          );
                        }
                        if (row.type === "pair") {
                          return (
                            <div key={i} className="grid grid-cols-2 gap-x-3 sm:gap-x-6">
                              <Hemistich
                                text={row.a.text}
                                className="pl-2 sm:pl-3 border-l border-gold/15"
                              />
                              <Hemistich text={row.b.text} />
                            </div>
                          );
                        }
                        return (
                          <div key={i} className="grid grid-cols-2 gap-x-3 sm:gap-x-6">
                            <Hemistich
                              text={row.a.text}
                              className="pl-2 sm:pl-3 border-l border-gold/15"
                            />
                            <span />
                          </div>
                        );
                      })}
                    </div>
                  ));
                })()}
              </div>
            )}


          </div>
          <Ornament className="w-32 mx-auto mt-10 text-gold/40" />
        </div>

        {/* nav between poems */}
        <nav className="mt-12 flex items-center justify-between gap-4">
          {prev ? (
            <Link
              to="/poems/$id"
              params={{ id: String(prev.id) }}
              className="flex items-center gap-2 glass rounded-xl px-5 py-3 text-sm font-body hover:glow-gold transition-all flex-1 max-w-[45%]"
            >
              <ArrowRight className="w-4 h-4 text-gold" />
              <div className="text-right">
                <div className="text-xs text-muted-foreground">السابقة</div>
                <div className="text-gold-soft font-display truncate">{prev.title}</div>
              </div>
            </Link>
          ) : <div />}
          {next ? (
            <Link
              to="/poems/$id"
              params={{ id: String(next.id) }}
              className="flex items-center gap-2 glass rounded-xl px-5 py-3 text-sm font-body hover:glow-gold transition-all flex-1 max-w-[45%] justify-end"
            >
              <div className="text-left">
                <div className="text-xs text-muted-foreground">التالية</div>
                <div className="text-gold-soft font-display truncate">{next.title}</div>
              </div>
              <ArrowLeft className="w-4 h-4 text-gold" />
            </Link>
          ) : <div />}
        </nav>
      </article>

      {/* floating controls */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 glass-gold rounded-full px-3 py-2 flex items-center gap-1 shadow-2xl">
        <button
          onClick={() => setFontSize((s) => Math.max(14, s - 2))}
          className="p-2 rounded-full hover:bg-gold/15 text-gold-soft"
          aria-label="تصغير الخط"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-xs font-body text-gold-soft w-8 text-center">{fontSize}</span>
        <button
          onClick={() => setFontSize((s) => Math.min(36, s + 2))}
          className="p-2 rounded-full hover:bg-gold/15 text-gold-soft"
          aria-label="تكبير الخط"
        >
          <Plus className="w-4 h-4" />
        </button>
        <div className="w-px h-5 bg-gold/30 mx-1" />
        <button
          onClick={copyAll}
          className="p-2 rounded-full hover:bg-gold/15 text-gold-soft"
          aria-label="نسخ القصيدة كاملة"
          title="نسخ القصيدة كاملة"
        >
          <ClipboardCopy className="w-4 h-4" />
        </button>
        <button
          onClick={() => toggle(poem.id)}
          className="p-2 rounded-full hover:bg-gold/15"
          aria-label="مفضلة"
        >
          <Heart className={`w-4 h-4 ${isFav(poem.id) ? "fill-gold text-gold" : "text-gold-soft"}`} />
        </button>
      </div>
    </div>
  );
}

function StanzaBlock({
  index,
  stanza,
  fontSize,
  onCopy,
  onShare,
}: {
  index: number;
  stanza: Stanza;
  fontSize: number;
  onCopy: (t: string) => void;
  onShare: (t: string) => void;
}) {
  const stanzaText =
    `${stanza.pairs[0][0].text}  ―  ${stanza.pairs[0][1].text}\n` +
    `${stanza.pairs[1][0].text}  ―  ${stanza.pairs[1][1].text}\n` +
    `${stanza.tail.text}`;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.6, delay: Math.min(index * 0.06, 0.4) }}
      className="group flex items-start gap-3 py-4 border-b border-gold/10 last:border-0"
    >
      <span className="text-gold/40 font-display text-sm w-8 mt-2 shrink-0">
        {index + 1}.
      </span>
      <div
        className="verse-line flex-1 text-foreground/95 space-y-1"
        style={{ ["--verse-base" as any]: `${fontSize}px` }}
      >
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6">
          <Hemistich text={stanza.pairs[0][0].text} className="pl-2 sm:pl-3 border-l border-gold/15" />
          <Hemistich text={stanza.pairs[0][1].text} />
        </div>
        <div className="grid grid-cols-2 gap-x-3 sm:gap-x-6">
          <Hemistich text={stanza.pairs[1][0].text} className="pl-2 sm:pl-3 border-l border-gold/15" />
          <Hemistich text={stanza.pairs[1][1].text} />
        </div>
        <Hemistich text={stanza.tail.text} className="hemistich-refrain pt-1" />
      </div>

      <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onCopy(stanzaText)}
          className="p-1.5 rounded hover:bg-gold/10 text-muted-foreground hover:text-gold"
          aria-label="نسخ المقطع"
        >
          <Copy className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => onShare(stanzaText)}
          className="p-1.5 rounded hover:bg-gold/10 text-muted-foreground hover:text-gold"
          aria-label="مشاركة المقطع"
        >
          <Share2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

function Hemistich({ text, className = "" }: { text: string; className?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  const words = useMemo(
    () => (text ?? "").trim().split(/\s+/).filter(Boolean),
    [text],
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    const inner = innerRef.current;
    if (!container || !inner) return;

    const fit = () => {
      inner.style.transform = "scale(1)";
      inner.style.width = "100%";
      const cw = container.clientWidth;
      // natural width without justification: temporarily collapse flex
      inner.style.justifyContent = "flex-end";
      const natural = inner.scrollWidth;
      // restore (CSS class handles default)
      inner.style.justifyContent = "";
      if (natural <= cw || cw === 0) {
        setScale(1);
        return;
      }
      const s = Math.max(0.55, cw / natural);
      inner.style.transform = `scale(${s})`;
      inner.style.width = `${100 / s}%`;
      setScale(s);
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(container);
    window.addEventListener("resize", fit);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", fit);
    };
  }, [text]);

  return (
    <div
      ref={containerRef}
      className={`hemistich ${className}`}
      style={{ fontSize: "var(--verse-base, 20px)" }}
    >
      <div
        ref={innerRef}
        className={`hemistich-inner ${words.length <= 1 ? "single" : ""}`}
        style={{
          transform: `scale(${scale})`,
          width: scale < 1 ? `${100 / scale}%` : "100%",
        }}
      >
        {words.map((w, i) => (
          <span key={i}>{w}</span>
        ))}
      </div>
    </div>
  );
}

