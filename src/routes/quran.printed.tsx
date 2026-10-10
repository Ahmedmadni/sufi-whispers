import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState, type TouchEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, Bookmark, BookmarkCheck, Check, ChevronLeft,
  ChevronRight, Copy, List, LoaderCircle, Minus, Plus, RefreshCcw,
  Search, X,
} from "lucide-react";
import {
  adjacentPrintedPages, printedPageImageUrl,
  validateOfflineMushafManifest, MOBILE_OFFLINE_MUSHAF_URL,
  PRINTED_PAGE_IMAGE_HEIGHT, PRINTED_PAGE_IMAGE_WIDTH,
  type OfflinePrintedMushafManifest,
} from "@/lib/printed-mushaf-pages";
import { SURA_INDEX, quranQueryOptions, searchQuran } from "@/lib/quran";
import {
  clampMushafPage, matchesSuraFilter, parseLastPrintedPage,
  parsePrintedBookmarks, PRINTED_BOOKMARK_KEY, PRINTED_LAST_PAGE_KEY,
  suraAtMushafPage, surasOnMushafPage, togglePrintedBookmark,
  type PrintedBookmark,
} from "@/lib/printed-mushaf";
import {
  clampReaderZoom, distanceBetweenTouches, exactPageText, exactVerseText,
  originalVersesOnPage, pinchReaderZoom, rtlPageFromSwipe,
} from "@/lib/mushaf-reader-controls";

type Panel = "index" | "bookmarks" | "search" | "copy";
type Swipe = { x: number; y: number } | null;
type Pinch = { startDistance: number; startZoom: number };

function validPage(raw: unknown): number {
  const text = typeof raw === "number" ? String(raw) : raw;
  return typeof text === "string" && /^[1-9]\d*$/.test(text)
    ? clampMushafPage(Number(text)) : 1;
}

/** The PNG/PDF is NEVER parsed for text. Copy only source aya_text verbatim. */
async function copyVerbatim(value: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      return;
    } catch { /* Android WebView/browser permissions may deny Clipboard API. */ }
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();
  if (!copied) throw new Error("تعذّر النسخ التلقائي؛ يمكنك تحديد النص يدويًا من النافذة.");
}

export const Route = createFileRoute("/quran/printed")({
  validateSearch: (search: Record<string, unknown>) => ({ page: validPage(search.page) }),
  head: () => ({
    meta: [
      { title: "المصحف المطبوع — عرض كامل | رحاب الخليلية" },
      { name: "description", content: "المصحف المطبوع بكامل الشاشة، تكبير بإصبعين، العلامات المرجعية ونسخ الآيات بالرسم العثماني." },
    ],
  }),
  component: PrintedMushafReader,
});

function PrintedMushafReader() {
  const { page } = Route.useSearch();
  const navigate = useNavigate();
  const [panel, setPanel] = useState<Panel | null>(null);
  const [suraFilter, setSuraFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [bookmarks, setBookmarks] = useState<PrintedBookmark[]>([]);
  const [lastPage, setLastPage] = useState(1);
  const [draftPage, setDraftPage] = useState(String(page));
  const [zoom, setZoom] = useState(1);
  const [fitWidth, setFitWidth] = useState(400);
  const [slideDirection, setSlideDirection] = useState<"next" | "previous">("next");
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [retry, setRetry] = useState(0);
  const [offlineManifest, setOfflineManifest] = useState<OfflinePrintedMushafManifest | null>(null);
  const [offlineError, setOfflineError] = useState("");
  const [copyStatus, setCopyStatus] = useState("");

  const viewport = useRef<HTMLDivElement>(null);
  const startSwipe = useRef<Swipe>(null);
  const pinch = useRef<Pinch | null>(null);
  const pinched = useRef(false);
  const lastZoom = useRef(1);

  const isAndroid = import.meta.env.VITE_MOBILE === "true";
  const source = printedPageImageUrl(page, offlineManifest);
  const bookmarked = bookmarks.some((mark) => mark.page === page);

  useEffect(() => {
    try {
      setBookmarks(parsePrintedBookmarks(localStorage.getItem(PRINTED_BOOKMARK_KEY)));
      setLastPage(parseLastPrintedPage(localStorage.getItem(PRINTED_LAST_PAGE_KEY)));
    } catch { /* Optional preference persistence. */ }
  }, []);

  useEffect(() => {
    if (!isAndroid) return;
    const controller = new AbortController();
    fetch(MOBILE_OFFLINE_MUSHAF_URL, { signal: controller.signal })
      .then((response) => {
        if (!response.ok) throw new Error("تعذّر العثور على صفحات المصحف المدمجة داخل التطبيق.");
        return response.json() as Promise<unknown>;
      })
      .then((value) => {
        if (!controller.signal.aborted) {
          setOfflineManifest(validateOfflineMushafManifest(value));
          setOfflineError("");
        }
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          setOfflineError(error instanceof Error ? error.message : "تعذّر قراءة المصحف المحلي.");
        }
      });
    return () => controller.abort();
  }, [isAndroid]);

  useEffect(() => {
    setDraftPage(String(page));
    setImageLoading(true);
    setImageError(false);
    setCopyStatus("");
  }, [page, retry]);

  useEffect(() => {
    if (!source || imageLoading || imageError || offlineError) return;
    for (const neighbour of adjacentPrintedPages(page)) {
      const preview = new Image();
      preview.decoding = "async";
      preview.src = printedPageImageUrl(neighbour, offlineManifest);
    }
  }, [page, imageLoading, imageError, offlineManifest, source, offlineError]);

  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const measure = () => setFitWidth(Math.max(200, Math.min(
      node.clientWidth - 4,
      (node.clientHeight - 4) * PRINTED_PAGE_IMAGE_WIDTH / PRINTED_PAGE_IMAGE_HEIGHT,
    )));
    measure();
    const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(measure) : null;
    if (observer) observer.observe(node);
    else window.addEventListener("resize", measure);
    return () => {
      observer?.disconnect();
      if (!observer) window.removeEventListener("resize", measure);
    };
  }, []);

  // Keep the center of the enlarged image within the user's viewport.
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const ratio = zoom / lastZoom.current;
    node.scrollLeft = (node.scrollLeft + node.clientWidth / 2) * ratio - node.clientWidth / 2;
    node.scrollTop = (node.scrollTop + node.clientHeight / 2) * ratio - node.clientHeight / 2;
    lastZoom.current = zoom;
  }, [zoom]);

  const go = useCallback((targetPage: number) => {
    const target = clampMushafPage(targetPage);
    if (target === page) return;
    setSlideDirection(target > page ? "next" : "previous");
    setZoom(1);
    try { localStorage.setItem(PRINTED_LAST_PAGE_KEY, String(target)); } catch { /* Optional */ }
    setLastPage(target);
    setPanel(null);
    void navigate({ to: "/quran/printed", search: { page: target } });
  }, [page, navigate]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey ||
        (event.target instanceof Element && event.target.closest("input,textarea,select,[contenteditable=true]"))) return;
      // Arabic book order: ArrowRight / swipe to the right advances a page.
      if (event.key === "ArrowRight") go(page + 1);
      if (event.key === "ArrowLeft") go(page - 1);
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, page]);

  const toggleMark = () => {
    const next = togglePrintedBookmark(bookmarks, page, Date.now());
    setBookmarks(next);
    try { localStorage.setItem(PRINTED_BOOKMARK_KEY, JSON.stringify(next)); } catch { /* Optional */ }
  };

  const openPanel = (next: Panel) => {
    setCopyStatus("");
    setPanel((existing) => existing === next ? null : next);
  };

  const copyRequested = panel === "copy";
  const searchRequested = panel === "search" && searchText.trim().length >= 2;
  const { data: verses, isLoading: versesLoading, isError: versesError, refetch } = useQuery({
    ...quranQueryOptions,
    enabled: copyRequested || searchRequested,
  });
  const currentVerses = useMemo(
    () => verses && copyRequested ? originalVersesOnPage(verses, page) : [],
    [verses, copyRequested, page],
  );
  const results = useMemo(
    () => verses && searchRequested ? searchQuran(verses, searchText, 80) : [],
    [verses, searchRequested, searchText],
  );
  const suras = useMemo(() => SURA_INDEX.filter((sura) =>
    matchesSuraFilter(sura.nameAr, suraFilter) ||
    String(sura.no) === suraFilter.trim()
  ), [suraFilter]);

  const copyText = async (text: string, label: string) => {
    setCopyStatus("");
    try {
      await copyVerbatim(text);
      setCopyStatus(`تم نسخ ${label} بالتشكيل الكامل`);
    } catch (error) {
      setCopyStatus(error instanceof Error ? error.message : "تعذّر النسخ.");
    }
  };

  const beginTouch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      pinch.current = {
        startDistance: distanceBetweenTouches(event.touches[0], event.touches[1]),
        startZoom: zoom,
      };
      pinched.current = true;
      startSwipe.current = null;
    } else if (event.touches.length === 1 && !pinched.current) {
      startSwipe.current = { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
  };

  const moveTouch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length !== 2 || !pinch.current) return;
    const size = distanceBetweenTouches(event.touches[0], event.touches[1]);
    setZoom(pinchReaderZoom(pinch.current.startZoom, pinch.current.startDistance, size));
  };

  const finishTouch = (event: TouchEvent<HTMLDivElement>) => {
    if (event.touches.length > 0) return;
    if (pinched.current) {
      pinched.current = false;
      pinch.current = null;
      startSwipe.current = null;
      return;
    }
    const start = startSwipe.current;
    startSwipe.current = null;
    if (!start || zoom > 1.03 || event.changedTouches.length !== 1) return;
    const end = event.changedTouches[0];
    const target = rtlPageFromSwipe(page, end.clientX - start.x, end.clientY - start.y);
    if (target !== page) go(target);
  };

  const button = "printed-immersive__button";
  const selectedSuras = surasOnMushafPage(page);

  return (
    <div className="printed-immersive" dir="rtl" aria-label="قارئ المصحف بكامل الشاشة">
      <header className="printed-immersive__top">
        <Link to="/quran" className={button} aria-label="الخروج من القراءة الكاملة إلى فهرس المصحف">
          <ArrowRight size={18} /> <span className="printed-immersive__optional">خروج</span>
        </Link>
        <div className="printed-immersive__chapter" title={selectedSuras.map((s) => s.nameAr).join(" • ")}>
          <strong>المصحف الشريف</strong>
          <span>صفحة {page} / ٦٠٤ · {selectedSuras.map((s) => s.nameAr).join(" • ")}</span>
        </div>
        <div className="printed-immersive__tools">
          <button type="button" className={button} onClick={() => openPanel("index")} aria-label="فهرس السور" aria-expanded={panel === "index"}><List size={19} /></button>
          <button type="button" className={button} onClick={() => openPanel("search")} aria-label="البحث في المصحف" aria-expanded={panel === "search"}><Search size={19} /></button>
          <button type="button" className={button} onClick={() => openPanel("copy")} aria-label="نسخ الآيات بالتشكيل" aria-expanded={panel === "copy"}><Copy size={19} /></button>
          <button type="button" className={`${button} ${bookmarked ? "is-bookmarked" : ""}`}
            aria-label={bookmarked ? "إزالة العلامة المرجعية من الصفحة" : "وضع علامة مرجعية على الصفحة"}
            aria-pressed={bookmarked} onClick={toggleMark}>
            {bookmarked ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
          </button>
        </div>
      </header>

      <main className="printed-immersive__stage">
        <div className="printed-immersive__viewport" ref={viewport}
          onTouchStart={beginTouch} onTouchMove={moveTouch}
          onTouchEnd={finishTouch} onTouchCancel={() => { pinch.current = null; pinched.current = false; startSwipe.current = null; }}
          aria-label={`صورة الصفحة ${page}، مرّر إلى اليمين للصفحة التالية، أو قرّب بإصبعين للتكبير`}>
          <div className="printed-immersive__image" style={{ width: Math.round(fitWidth * zoom) }}>
            {imageLoading && !imageError && !offlineError && (
              <div role="status" className="printed-immersive__loading"><LoaderCircle size={21} className="animate-spin" /> جارٍ عرض الصفحة…</div>
            )}
            {imageError || offlineError ? (
              <div role="alert" className="printed-immersive__failure">
                <p>{offlineError || (isAndroid ? "تعذّر قراءة صفحة المصحف المدمجة." : "تعذّر تحميل الصفحة. تحقق من الاتصال بالإنترنت.")}</p>
                {!offlineError && <button className={button} onClick={() => setRetry((n) => n + 1)}><RefreshCcw size={18}/> إعادة المحاولة</button>}
                <Link className={button} to="/quran/page/$page" params={{ page: String(page) }}>القراءة النصية</Link>
              </div>
            ) : source ? (
              <img key={`${page}-${retry}`} src={source}
                alt={`صورة الصفحة ${page} الأصلية من مصحف المدينة`}
                width={PRINTED_PAGE_IMAGE_WIDTH} height={PRINTED_PAGE_IMAGE_HEIGHT}
                className={`printed-immersive__original ${imageLoading ? "is-loading" : ""} ${slideDirection === "next" ? "enter-next" : "enter-previous"}`}
                draggable={false} decoding="async" loading="eager"
                onLoad={() => { setImageLoading(false); setImageError(false); }}
                onError={() => { setImageLoading(false); setImageError(true); }} />
            ) : null}
          </div>
        </div>
        <button type="button" className={`printed-immersive__ribbon ${bookmarked ? "is-bookmarked" : ""}`}
          onClick={toggleMark} aria-pressed={bookmarked}
          aria-label={bookmarked ? "إزالة الإشارة المرجعية" : "حفظ الصفحة كعلامة مرجعية"}>
          {bookmarked ? <BookmarkCheck size={21} /> : <Bookmark size={21} />}
        </button>
      </main>

      <footer className="printed-immersive__bottom">
        <button type="button" className={button} disabled={page >= 604} onClick={() => go(page + 1)}
          aria-label="الصفحة التالية، باتجاه اليمين"><ChevronRight size={20}/><span className="printed-immersive__direction-label">التالية</span></button>
        <div className="printed-immersive__page-tools">
          <button type="button" className={button} onClick={() => setZoom((z) => clampReaderZoom(z - .3))}
            disabled={zoom <= 1} aria-label="تصغير المصحف"><Minus size={17}/></button>
          <output className="printed-immersive__zoom" aria-label="نسبة تكبير الصفحة">{Math.round(zoom * 100)}٪</output>
          <button type="button" className={button} onClick={() => setZoom((z) => clampReaderZoom(z + .3))}
            disabled={zoom >= 3.5} aria-label="تكبير المصحف"><Plus size={17}/></button>
          <button type="button" className={button} onClick={() => setZoom(1)} aria-label="إعادة ضبط التكبير">١:١</button>
          <form className="printed-immersive__page-jump" onSubmit={(event) => { event.preventDefault(); go(validPage(draftPage)); }}>
            <label className="sr-only" htmlFor="printed-immersive-page">رقم الصفحة</label>
            <input id="printed-immersive-page" type="number" min={1} max={604} inputMode="numeric"
              value={draftPage} onChange={(event) => setDraftPage(event.target.value)} />
            <button type="submit" className="sr-only">اذهب إلى الصفحة</button>
          </form>
        </div>
        <button type="button" className={button} disabled={page <= 1} onClick={() => go(page - 1)}
          aria-label="الصفحة السابقة، باتجاه اليسار"><span className="printed-immersive__direction-label">السابقة</span><ChevronLeft size={20}/></button>
      </footer>

      <aside className={`printed-immersive__drawer ${panel ? "is-open" : ""}`}
        aria-hidden={!panel} aria-label="فهرس المصحف والآيات">
        <div className="printed-immersive__drawer-head">
          <strong>{panel === "index" ? "فهرس السور" : panel === "bookmarks" ? "العلامات المرجعية" : panel === "search" ? "البحث" : "نسخ الآيات بالتشكيل"}</strong>
          <button type="button" className={button} onClick={() => setPanel(null)} aria-label="إغلاق اللوحة"><X size={20}/></button>
        </div>
        <nav className="printed-immersive__tabs" aria-label="أدوات المصحف">
          {([["index", "السور"], ["bookmarks", "الإشارات"], ["search", "البحث"], ["copy", "النسخ"]] as const).map(([tab, name]) => (
            <button key={tab} type="button" className={panel === tab ? "is-current" : ""}
              onClick={() => openPanel(tab)} aria-current={panel === tab ? "page" : undefined}>{name}</button>
          ))}
        </nav>
        {panel === "index" && (
          <>
            <input className="printed-immersive__input" aria-label="البحث في أسماء السور" placeholder="ابحث عن السورة…" value={suraFilter} onChange={(event) => setSuraFilter(event.target.value)} />
            <div className="printed-immersive__drawer-scroll">
              {suras.map((sura) => (
                <button type="button" key={sura.no} className="printed-immersive__item" onClick={() => go(sura.startPage)}>
                  <span>{sura.no}. سورة {sura.nameAr}</span><small>ص {sura.startPage}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {panel === "bookmarks" && (
          <div className="printed-immersive__drawer-scroll">
            {bookmarks.length === 0 && <p className="printed-immersive__hint">اضغط علامة الإشارة أعلى الصفحة لحفظ موضعك.</p>}
            {bookmarks.map((item) => (
              <button type="button" className="printed-immersive__item" key={item.page} onClick={() => go(item.page)}>
                <span>صفحة {item.page}</span><small>{suraAtMushafPage(item.page).nameAr}</small>
              </button>
            ))}
            <button type="button" className="printed-immersive__item" onClick={() => go(lastPage)}>
              <span><Check size={15} /> متابعة آخر قراءة</span><small>ص {lastPage}</small>
            </button>
          </div>
        )}
        {panel === "search" && (
          <>
            <input className="printed-immersive__input" aria-label="البحث في الآيات" type="search"
              placeholder="كلمة أو جزء من آية…" value={searchText} onChange={(event) => setSearchText(event.target.value)} />
            <div className="printed-immersive__drawer-scroll">
              {versesLoading && <p role="status" className="printed-immersive__hint">جارٍ تحميل الفهرس القرآني…</p>}
              {versesError && <button type="button" onClick={() => void refetch()} className={button}>تعذّر تحميل الفهرس — إعادة المحاولة</button>}
              {searchRequested && !versesLoading && !versesError && !results.length && <p className="printed-immersive__hint">لا توجد نتائج.</p>}
              {results.map((aya) => (
                <button type="button" className="printed-immersive__verse" key={aya.id} onClick={() => go(aya.page)}>
                  <span lang="ar" className="printed-immersive__arabic">{aya.aya_text}</span>
                  <small>سورة {aya.sura_name_ar} · آية {aya.aya_no} · صفحة {aya.page}</small>
                </button>
              ))}
            </div>
          </>
        )}
        {panel === "copy" && (
          <>
            <p className="printed-immersive__hint">النص أدناه من القرآن العثماني المعتمد مباشرة، بكل حروفه وحركاته وعلاماته، وليس مستخرجًا من الصورة.</p>
            {versesLoading && <p role="status" className="printed-immersive__hint">جارٍ تحميل نص الصفحة…</p>}
            {versesError && <button type="button" onClick={() => void refetch()} className={button}>تعذّر تحميل النص — إعادة المحاولة</button>}
            {currentVerses.length > 0 && (
              <button type="button" className="printed-immersive__copy-all"
                onClick={() => void copyText(exactPageText(verses ?? [], page), `صفحة ${page}`)}>
                <Copy size={18} /> نسخ آيات الصفحة كاملة بالتشكيل
              </button>
            )}
            <p role="status" aria-live="polite" className="printed-immersive__copy-status">{copyStatus}</p>
            <div className="printed-immersive__drawer-scroll">
              {currentVerses.map((aya) => (
                <div className="printed-immersive__verse" key={aya.id}>
                  <p className="printed-immersive__arabic" lang="ar" dir="rtl">{exactVerseText(aya)}</p>
                  <div className="printed-immersive__verse-actions">
                    <small>{aya.sura_name_ar} · آية {aya.aya_no}</small>
                    <button type="button" className={button} onClick={() => void copyText(exactVerseText(aya), `الآية ${aya.aya_no}`)}>
                      <Copy size={15}/> نسخ الآية
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </aside>
      {panel && <button className="printed-immersive__scrim" type="button" aria-label="إغلاق الأدوات" onClick={() => setPanel(null)} />}
    </div>
  );
}
