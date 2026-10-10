import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adjacentPrintedPages, printedPageImageUrl, PRINTED_PAGE_IMAGE_HEIGHT, PRINTED_PAGE_IMAGE_WIDTH } from "@/lib/printed-mushaf-pages";
import {
  Bookmark, BookmarkCheck, BookOpen, Check, ChevronLeft, ChevronRight,
  List, LoaderCircle, Minus, Plus, Search, RefreshCcw,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SURA_INDEX, quranQueryOptions, searchQuran } from "@/lib/quran";
import {
  PRINTED_BOOKMARK_KEY, PRINTED_LAST_PAGE_KEY,
  clampMushafPage, parseLastPrintedPage, parsePrintedBookmarks,
  suraAtMushafPage, surasOnMushafPage, matchesSuraFilter, togglePrintedBookmark,
  type PrintedBookmark,
} from "@/lib/printed-mushaf";

type Tab = "index" | "bookmarks" | "search";

function parseRequestedPage(raw: unknown): number {
  const str = typeof raw === "number" ? String(raw) : raw;
  return typeof str === "string" && /^[1-9]\d*$/.test(str)
    ? clampMushafPage(Number(str))
    : 1;
}

export const Route = createFileRoute("/quran/printed")({
  validateSearch: (search: Record<string, unknown>) => ({
    page: parseRequestedPage(search.page),
  }),
  head: () => ({
    meta: [
      { title: "المصحف المطبوع — طبعة المدينة ١٤٤١هـ | رحاب الخليلية" },
      { name: "description", content: "اقرأ مصحف المدينة المطبوع بإطاراته الأصلية مع فهرس السور والإشارات المرجعية والبحث في الآيات." },
    ],
  }),
  component: PrintedMushafReader,
});

function PrintedMushafReader() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState<PrintedBookmark[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("index");
  const [searchText, setSearchText] = useState("");
  const [suraFilter, setSuraFilter] = useState("");
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [retry, setRetry] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [frameWidth, setFrameWidth] = useState(430);
  const [draftPage, setDraftPage] = useState(String(page));
  const [lastPage, setLastPage] = useState(1);
  const [showPanel, setShowPanel] = useState(true);
  const pdfContainerRef = useRef<HTMLDivElement>(null);
  const gestureStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    try {
      setBookmarks(parsePrintedBookmarks(localStorage.getItem(PRINTED_BOOKMARK_KEY)));
      setLastPage(parseLastPrintedPage(localStorage.getItem(PRINTED_LAST_PAGE_KEY)));
    } catch { /* optional local reader preferences */ }
  }, []);

  useEffect(() => {
    setImageError(false);
    setImageLoading(true);
  }, [page, retry]);

  // Only fetch the current page and its two immediate neighbours.
  // Browser caching handles repeat visits; no PDF file needs to be downloaded.
  useEffect(() => {
    for (const adjacent of adjacentPrintedPages(page)) {
      const nearby = new Image();
      nearby.decoding = "async";
      nearby.src = printedPageImageUrl(adjacent);
    }
  }, [page]);

  // Never overwrite yesterday's saved place just by opening the home link.
  useEffect(() => {
    setDraftPage(String(page));
  }, [page]);

  useEffect(() => {
    if (window.matchMedia?.("(max-width: 768px)").matches) setShowPanel(false);
  }, []);

  useEffect(() => {
    const node = pdfContainerRef.current;
    if (!node) return;
    const update = () => setFrameWidth(Math.max(230, Math.min(900, node.clientWidth - 8)));
    update();
    if (typeof ResizeObserver !== "undefined") {
      const observer = new ResizeObserver(update);
      observer.observe(node);
      return () => observer.disconnect();
    }
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const go = useCallback((value: number) => {
    const target = clampMushafPage(value);
    try { localStorage.setItem(PRINTED_LAST_PAGE_KEY, String(target)); } catch { /* optional */ }
    void navigate({ to: "/quran/printed", search: { page: target } });
  }, [navigate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey ||
          (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable=true]"))) return;
      if (event.key === "ArrowLeft") go(page + 1);
      if (event.key === "ArrowRight") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const bookmarked = bookmarks.some((b) => b.page === page);
  const toggleBookmark = () => {
    const next = togglePrintedBookmark(bookmarks, page, Date.now());
    setBookmarks(next);
    try { localStorage.setItem(PRINTED_BOOKMARK_KEY, JSON.stringify(next)); } catch { /* optional */ }
  };

  const searching = activeTab === "search" && searchText.trim().length >= 2;
  const { data: quran, isLoading: searchingNow, isError: searchError, refetch } = useQuery({
    ...quranQueryOptions,
    enabled: searching,
  });
  const results = useMemo(
    () => searching && quran ? searchQuran(quran, searchText, 80) : [],
    [quran, searching, searchText],
  );
  const suras = useMemo(() => SURA_INDEX.filter((s) =>
    !suraFilter.trim() ||
    matchesSuraFilter(s.nameAr, suraFilter) ||
    String(s.no) === suraFilter.trim()
  ), [suraFilter]);

  const selectTab = (tab: Tab) => { setActiveTab(tab); setShowPanel(true); };
  const jumpFromPanel = (target: number) => {
    go(target);
    setShowPanel(false);
  };
  const smallButton = "printed-reader__control inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-gold/30 px-3 text-xs font-body text-foreground disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-gold";

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="printed-reader mx-auto w-full max-w-6xl flex-1 px-3 sm:px-5 py-5">
        <header className="printed-reader__heading">
          <div>
            <p className="text-xs text-gold-soft/80 font-body">مصحف المدينة النبوية · طبعة ١٤٤١هـ</p>
            <h1 className="font-display text-xl sm:text-3xl text-gold-soft mt-1">المصحف المطبوع</h1>
            <p className="text-xs text-muted-foreground font-body mt-1.5">اعرض صفحات المصحف المطبوع مباشرة دون تنزيل أو رفع أي ملفات.</p>
          </div>
          <Link to="/quran" className={smallButton}><BookOpen className="h-4 w-4" /> القراءة النصية</Link>
        </header>

        <section className="printed-reader__toolbar" aria-label="أدوات المصحف">
          <button type="button" className={smallButton} onClick={() => { setShowPanel(!showPanel); if (!showPanel) setActiveTab("index"); }}
            aria-expanded={showPanel} aria-label="إظهار الفهرس">
            <List className="h-4 w-4" /> الفهرس
          </button>
          <button type="button" className={smallButton} onClick={() => selectTab("search")}>
            <Search className="h-4 w-4" /> بحث
          </button>
          <button type="button" className={smallButton} onClick={() => selectTab("bookmarks")}>
            <Bookmark className="h-4 w-4" /> الإشارات ({bookmarks.length})
          </button>
          <button type="button" className={`${smallButton} ${bookmarked ? "printed-reader__saved" : ""}`}
            onClick={toggleBookmark} aria-pressed={bookmarked} aria-label={bookmarked ? "حذف إشارة الصفحة" : "حفظ إشارة الصفحة"}>
            {bookmarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
            {bookmarked ? "محفوظة" : "حفظ الصفحة"}
          </button>
        </section>

        <div className={`printed-reader__layout ${showPanel ? "" : "printed-reader__layout--full"}`}>
          {showPanel && (
            <aside className="printed-reader__panel" aria-label="الفهرس والإشارات والبحث">
              <nav className="printed-reader__tabs" aria-label="أقسام أدوات المصحف">
                {([["index", "السور"], ["bookmarks", "الإشارات"], ["search", "البحث"]] as const).map(([tab, label]) => (
                  <button type="button" key={tab} className={activeTab === tab ? "is-active" : ""}
                    aria-current={activeTab === tab ? "page" : undefined} onClick={() => setActiveTab(tab)}>{label}</button>
                ))}
              </nav>
              {activeTab === "index" && (
                <>
                  <label htmlFor="printed-sura-filter" className="sr-only">ابحث عن سورة بالاسم أو الرقم</label>
                  <input id="printed-sura-filter" value={suraFilter} onChange={(e) => setSuraFilter(e.target.value)}
                    placeholder="ابحث عن سورة…" className="printed-reader__input" />
                  <p className="printed-reader__panel-count">{suras.length} سورة</p>
                  <ul className="printed-reader__results">
                    {suras.map((s) => (
                      <li key={s.no}>
                        <button type="button" className="printed-reader__entry" onClick={() => jumpFromPanel(s.startPage)}>
                          <span className="printed-reader__number">{s.no}</span>
                          <span className="min-w-0 flex-1 text-right">
                            <span className="block font-display text-sm text-gold-soft">{s.nameAr}</span>
                            <span className="block text-[11px] text-muted-foreground font-body">{s.ayaCount} آية</span>
                          </span>
                          <span className="text-[11px] font-body text-muted-foreground">ص {s.startPage}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {activeTab === "bookmarks" && (
                <div className="printed-reader__results">
                  {bookmarks.length === 0 && <p className="text-center text-sm text-muted-foreground font-body py-8">لا توجد إشارات بعد. افتح الصفحة واضغط «حفظ الصفحة».</p>}
                  {bookmarks.map((b) => (
                    <button type="button" key={b.page} className="printed-reader__entry w-full" onClick={() => jumpFromPanel(b.page)}>
                      <BookmarkCheck className="h-4 w-4 text-gold-soft" />
                      <span className="flex-1 text-right text-sm font-body">صفحة {b.page}</span>
                      <span className="text-xs text-muted-foreground">{suraAtMushafPage(b.page).nameAr}</span>
                    </button>
                  ))}
                </div>
              )}
              {activeTab === "search" && (
                <>
                  <label htmlFor="printed-quran-search" className="sr-only">ابحث في نص الآيات</label>
                  <input id="printed-quran-search" type="search" dir="rtl" value={searchText}
                    onChange={(e) => setSearchText(e.target.value)} placeholder="ابحث عن كلمة أو آية…" className="printed-reader__input" />
                  <p className="printed-reader__panel-count">يُستخدم فهرس النص العثماني الموجود، دون استخراج الكلمات من صور المصحف.</p>
                  {searchingNow && <p className="text-sm text-muted-foreground font-body py-4 text-center">جارٍ البحث…</p>}
                  {searchError && <div role="alert" className="text-center text-sm text-destructive py-3">تعذّر تحميل فهرس البحث. <button type="button" className="underline" onClick={() => void refetch()}>إعادة المحاولة</button></div>}
                  {searching && !searchingNow && !searchError && results.length === 0 && <p className="text-sm text-muted-foreground py-4">لا توجد نتائج.</p>}
                  <ul className="printed-reader__results">
                    {results.map((a) => (
                      <li key={a.id}>
                        <button type="button" onClick={() => jumpFromPanel(a.page)} className="printed-reader__search-result">
                          <span className="mushaf-text block text-right leading-loose text-foreground">{a.aya_text}</span>
                          <span className="block text-[11px] text-gold-soft font-body mt-2">سورة {a.sura_name_ar}، الآية {a.aya_no}، الصفحة {a.page}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </aside>
          )}

          <section className="printed-reader__book" aria-label="صفحات المصحف">
            <div className="printed-reader__status">
              <span className="text-sm font-display text-gold-soft">صفحة {page} من ٦٠٤</span>
              <span className="text-xs font-body text-muted-foreground">
              {surasOnMushafPage(page).length > 1 ? "سور " : "سورة "}
              {surasOnMushafPage(page).map((s) => s.nameAr).join(" • ")}
            </span>
            </div>

            <div className="printed-reader__reader-controls">
              <div className="flex items-center gap-1">
                <button type="button" className={smallButton} aria-label="تصغير الصفحة" disabled={zoom <= 1}
                  onClick={() => setZoom((z) => Math.max(1, +(z - .2).toFixed(2)))}><Minus className="h-4 w-4" /></button>
                <output className="text-xs text-muted-foreground min-w-11 text-center">{Math.round(zoom * 100)}٪</output>
                <button type="button" className={smallButton} aria-label="تكبير الصفحة" disabled={zoom >= 1.8}
                  onClick={() => setZoom((z) => Math.min(1.8, +(z + .2).toFixed(2)))}><Plus className="h-4 w-4" /></button>
              </div>
              <span className="text-xs text-muted-foreground font-body">عرض مباشر لصفحات المصحف الأصلية</span>
            </div>
            <div className="printed-reader__canvas-scroll" ref={pdfContainerRef}
              onTouchStart={(e) => {
                if (zoom !== 1 || e.touches.length !== 1) { gestureStartRef.current = null; return; }
                gestureStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
              }}
              onTouchEnd={(e) => {
                const start = gestureStartRef.current;
                gestureStartRef.current = null;
                if (!start || zoom !== 1 || e.changedTouches.length !== 1) return;
                const dx = e.changedTouches[0].clientX - start.x;
                const dy = e.changedTouches[0].clientY - start.y;
                if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.3) return;
                go(page + (dx < 0 ? 1 : -1));
              }}
              onTouchCancel={() => { gestureStartRef.current = null; }}
            >
              <div className="printed-reader__page-image" style={{ width: Math.round(frameWidth * zoom) }}>
                {imageLoading && !imageError && (
                  <div role="status" className="printed-reader__image-loading">
                    <LoaderCircle className="animate-spin h-5 w-5" />
                    جارٍ عرض الصفحة {page}…
                  </div>
                )}
                {imageError ? (
                  <div role="alert" className="printed-reader__empty">
                    <p className="font-body text-sm text-destructive leading-8">
                      تعذّر تحميل صورة الصفحة. تأكد من اتصال الإنترنت ثم أعد المحاولة.
                    </p>
                    <button type="button" className={smallButton}
                      onClick={() => { setImageError(false); setImageLoading(true); setRetry((value) => value + 1); }}>
                      <RefreshCcw className="w-4 h-4" /> إعادة المحاولة
                    </button>
                    <Link to="/quran/page/$page" params={{ page: String(page) }} className={smallButton}>
                      اقرأ الصفحة في الوضع النصي
                    </Link>
                  </div>
                ) : (
                  <img
                    key={`${page}-${retry}`}
                    src={printedPageImageUrl(page)}
                    alt={`الصفحة ${page} من مصحف المدينة الأصلي بالرسم العثماني`}
                    width={PRINTED_PAGE_IMAGE_WIDTH}
                    height={PRINTED_PAGE_IMAGE_HEIGHT}
                    decoding="async"
                    loading="eager"
                    draggable={false}
                    onLoad={() => { setImageLoading(false); setImageError(false); }}
                    onError={() => { setImageLoading(false); setImageError(true); }}
                    className={`printed-reader__original-page ${imageLoading ? "is-loading" : ""}`}
                  />
                )}
              </div>
            </div>
            <nav className="printed-reader__pagination" aria-label="التنقل في صفحات المصحف">
              <button type="button" className={smallButton} disabled={page >= 604} onClick={() => go(page + 1)}>
                <ChevronLeft className="h-4 w-4" /> التالية
              </button>
              <form onSubmit={(e) => { e.preventDefault(); go(parseRequestedPage(draftPage)); }}>
                <label htmlFor="printed-page-input" className="sr-only">رقم صفحة المصحف</label>
                <input id="printed-page-input" type="number" inputMode="numeric" min={1} max={604}
                  value={draftPage} onChange={(e) => setDraftPage(e.target.value)} />
                <button type="submit" className={smallButton}>انتقال</button>
              </form>
              <button type="button" className={smallButton} disabled={page <= 1} onClick={() => go(page - 1)}>
                السابقة <ChevronRight className="h-4 w-4" />
              </button>
            </nav>
            <button type="button" className="printed-reader__resume" onClick={() => go(lastPage)}>
              <Check className="w-4 h-4" /> متابعة من آخر صفحة ({lastPage})
            </button>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
