import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  SURA_INDEX,
  quranQueryOptions,
  getSura,
  saveReadingPosition,
  BASMALA,
  hasBasmala,
} from "@/lib/quran";

export const Route = createFileRoute("/quran/surah/$suraNo")({
  loader: ({ params }) => {
    const no = Number(params.suraNo);
    const sura = SURA_INDEX.find((s) => s.no === no);
    if (!sura) throw notFound();
    return { sura };
  },
  head: ({ params }) => {
    const sura = SURA_INDEX.find((s) => s.no === Number(params.suraNo));
    const title = sura
      ? `سورة ${sura.nameAr} — المصحف الشريف | رحاب الخليلية`
      : "سورة — المصحف الشريف";
    const description = sura
      ? `اقرأ سورة ${sura.nameAr} كاملة (${sura.ayaCount} آية) بالرسم العثماني من مجمع الملك فهد لطباعة المصحف الشريف.`
      : "قراءة سور المصحف الشريف بالرسم العثماني.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "article" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:title", content: title },
        { name: "twitter:description", content: description },
      ],
    };
  },
  component: SurahPage,
});

function SurahPage() {
  const { sura } = Route.useLoaderData();
  const { data, isLoading, error } = useQuery(quranQueryOptions);
  const [pageIdx, setPageIdx] = useState(0);

  const ayat = useMemo(() => (data ? getSura(data, sura.no) : []), [data, sura.no]);

  /** Split the sura into mushaf pages, exactly as printed. */
  const pages = useMemo(() => {
    const map = new Map<number, typeof ayat>();
    for (const a of ayat) {
      const arr = map.get(a.page);
      if (arr) arr.push(a);
      else map.set(a.page, [a]);
    }
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([page, list]) => ({ page, list }));
  }, [ayat]);

  useEffect(() => setPageIdx(0), [sura.no]);

  const current = pages[Math.min(pageIdx, Math.max(pages.length - 1, 0))];

  useEffect(() => {
    if (current && current.list.length > 0) {
      saveReadingPosition({
        suraNo: sura.no,
        suraNameAr: sura.nameAr,
        ayaNo: current.list[0].aya_no,
        page: current.page,
      });
    }
  }, [current, sura]);

  const goNext = () => setPageIdx((i) => Math.min(i + 1, pages.length - 1));
  const goPrev = () => setPageIdx((i) => Math.max(i - 1, 0));

  const prev = SURA_INDEX.find((s) => s.no === sura.no - 1);
  const next = SURA_INDEX.find((s) => s.no === sura.no + 1);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-5 py-4">
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/quran"
            className="inline-flex items-center gap-1 text-xs text-gold-soft/80 hover:text-gold-soft font-body"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>فهرس السور</span>
          </Link>
          <Link
            to="/quran/page/$page"
            params={{ page: String(current?.page ?? sura.startPage) }}
            className="text-xs text-gold-soft/80 hover:text-gold-soft font-body"
          >
            عرض الصفحة {current?.page ?? sura.startPage}
          </Link>
        </div>

        <header className="mt-4 text-center glass-gold rounded-2xl py-4 px-3">
          <h1 className="font-display text-xl sm:text-2xl text-gradient-gold">
            سورة {sura.nameAr}
          </h1>
          <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground font-body">
            {sura.ayaCount} آية — رواية حفص عن عاصم
          </p>
        </header>

        {isLoading && (
          <p className="text-center text-xs text-muted-foreground font-body py-10">
            جارٍ تحميل نص المصحف…
          </p>
        )}
        {error && (
          <p className="text-center text-xs text-destructive font-body py-10">
            تعذّر تحميل نص المصحف، تحقّق من الاتصال ثم أعد المحاولة.
          </p>
        )}

        {current && (
          <article className="mt-4 glass rounded-2xl px-3 sm:px-5 py-5">
            {pageIdx === 0 && hasBasmala(sura.no) && (
              <p className="mushaf-text mb-4 text-center text-[1.05rem] sm:text-[1.2rem] text-gold-soft [text-align-last:center]">
                {BASMALA}
              </p>
            )}
            <div className="mushaf-text text-[1.05rem] sm:text-[1.2rem] text-foreground">
              {current.list.map((a) => (
                <span key={a.id} id={`aya-${a.aya_no}`} className="inline">
                  {a.aya_text}{" "}
                </span>
              ))}
            </div>
            <p className="mt-6 text-center text-[11px] text-gold-soft/70 font-body">
              صفحة {current.page} — {pageIdx + 1} من {pages.length}
            </p>
          </article>
        )}

        {pages.length > 1 && (
          <nav className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={goNext}
              disabled={pageIdx >= pages.length - 1}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-2 text-xs font-body text-foreground/85 hover:text-gold-soft disabled:opacity-40"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              الصفحة التالية
            </button>
            <button
              onClick={goNext}
              disabled={pageIdx >= pages.length - 1}
              aria-label="الانتقال للصفحة التالية"
              className="inline-flex items-center justify-center rounded-full border border-gold/25 w-9 h-9 text-gold-soft/80 hover:text-gold-soft disabled:opacity-40"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
            <button
              onClick={goPrev}
              disabled={pageIdx <= 0}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-2 text-xs font-body text-foreground/85 hover:text-gold-soft disabled:opacity-40"
            >
              الصفحة السابقة
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        )}

        <nav className="mt-5 flex items-center justify-between gap-2">
          {next ? (
            <Link
              to="/quran/surah/$suraNo"
              params={{ suraNo: String(next.no) }}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-2 text-xs font-body text-foreground/85 hover:text-gold-soft"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              سورة {next.nameAr}
            </Link>
          ) : (
            <span />
          )}
          {prev ? (
            <Link
              to="/quran/surah/$suraNo"
              params={{ suraNo: String(prev.no) }}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-2 text-xs font-body text-foreground/85 hover:text-gold-soft"
            >
              سورة {prev.nameAr}
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          ) : (
            <span />
          )}
        </nav>

      </main>
      <SiteFooter />
    </div>
  );
}
