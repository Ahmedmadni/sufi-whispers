import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Search, BookMarked } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  SURA_INDEX,
  quranQueryOptions,
  searchQuran,
  readReadingPosition,
  type ReadingPosition,
} from "@/lib/quran";

export const Route = createFileRoute("/quran/")({
  head: () => ({
    meta: [
      { title: "المصحف الشريف — رواية حفص | مكتبة النفحات" },
      {
        name: "description",
        content:
          "تصفّح المصحف الشريف كاملاً بالرسم العثماني من مجمع الملك فهد لطباعة المصحف الشريف: فهرس السور، القراءة بالصفحات، والبحث في الآيات.",
      },
      { property: "og:title", content: "المصحف الشريف — رواية حفص | مكتبة النفحات" },
      {
        property: "og:description",
        content: "المصحف كاملاً بالرسم العثماني الرسمي مع فهرس السور والبحث والقراءة بالصفحات.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "المصحف الشريف — رواية حفص" },
      {
        name: "twitter:description",
        content: "المصحف كاملاً بالرسم العثماني الرسمي مع فهرس السور والبحث والقراءة بالصفحات.",
      },
    ],
  }),
  component: QuranIndexPage,
});

function QuranIndexPage() {
  const [query, setQuery] = useState("");
  const [last, setLast] = useState<ReadingPosition | null>(null);
  useEffect(() => setLast(readReadingPosition()), []);

  const searching = query.trim().length >= 2;
  const { data, isLoading } = useQuery({ ...quranQueryOptions, enabled: searching });

  const results = useMemo(
    () => (searching && data ? searchQuran(data, query) : []),
    [searching, data, query],
  );

  const suras = useMemo(() => {
    const q = query.trim();
    if (!q || searching) return SURA_INDEX;
    return SURA_INDEX.filter((s) => s.nameAr.includes(q));
  }, [query, searching]);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="flex-1 w-full max-w-4xl mx-auto px-3 sm:px-5 py-5">
        <header className="text-center">
          <h1 className="font-display text-2xl sm:text-3xl text-gradient-gold">المصحف الشريف</h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-body">
            بالرسم العثماني — رواية حفص عن عاصم
          </p>
        </header>

        {last && (
          <Link
            to="/quran/surah/$suraNo"
            params={{ suraNo: String(last.suraNo) }}
            className="mt-5 flex items-center justify-between gap-3 rounded-xl glass-gold px-4 py-3 hover:scale-[1.01] transition-transform"
          >
            <span className="flex items-center gap-2 text-sm font-body text-gold-soft">
              <BookMarked className="w-4 h-4 shrink-0" />
              متابعة القراءة
            </span>
            <span className="text-xs text-foreground/80 font-body truncate">
              سورة {last.suraNameAr} — آية {last.ayaNo}
            </span>
          </Link>
        )}

        <div className="mt-5 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold-soft/70" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            dir="rtl"
            placeholder="ابحث عن سورة أو آية…"
            aria-label="بحث في المصحف"
            className="w-full rounded-xl glass border border-gold/20 bg-velvet/40 py-2.5 pr-10 pl-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold/50"
          />
        </div>

        {searching ? (
          <section className="mt-5">
            {isLoading && (
              <p className="text-center text-xs text-muted-foreground font-body py-8">
                جارٍ تحميل نص المصحف…
              </p>
            )}
            {!isLoading && results.length === 0 && (
              <p className="text-center text-xs text-muted-foreground font-body py-8">
                لا توجد نتائج مطابقة.
              </p>
            )}
            <ul className="space-y-2">
              {results.map((a) => (
                <li key={a.id}>
                  <Link
                    to="/quran/surah/$suraNo"
                    params={{ suraNo: String(a.sura_no) }}
                    hash={`aya-${a.aya_no}`}
                    className="block rounded-xl glass border border-gold/15 px-4 py-3 hover:border-gold/40 transition-colors"
                  >
                    <p className="mushaf-text text-[0.95rem] sm:text-[1.05rem] text-foreground">{a.aya_text}</p>
                    <p className="mt-1.5 text-center text-[11px] text-gold-soft/80 font-body">
                      سورة {a.sura_name_ar} — الآية {a.aya_no} — صفحة {a.page}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : (
          <ul className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {suras.map((s) => (
              <li key={s.no}>
                <Link
                  to="/quran/surah/$suraNo"
                  params={{ suraNo: String(s.no) }}
                  className="flex items-center gap-3 rounded-xl glass border border-gold/15 px-3 py-2.5 hover:border-gold/40 transition-colors"
                >
                  <span className="shrink-0 w-8 h-8 rounded-full glass-gold flex items-center justify-center text-[11px] font-body text-gold-soft">
                    {s.no}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-display text-sm text-gold-soft truncate">
                      سورة {s.nameAr}
                    </span>
                    <span className="block text-[11px] text-muted-foreground font-body">
                      {s.ayaCount} آية — تبدأ صفحة {s.startPage}
                    </span>
                  </span>
                  <BookOpen className="w-4 h-4 shrink-0 text-gold-soft/60" />
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-6 text-center">
          <Link
            to="/quran/page/$page"
            params={{ page: "1" }}
            className="inline-flex items-center gap-2 rounded-lg border border-gold/25 px-4 py-2 text-sm font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
          >
            القراءة بنظام الصفحات (٦٠٤ صفحة)
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
