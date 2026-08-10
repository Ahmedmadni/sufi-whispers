import { createFileRoute, Link, notFound, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, ChevronLeft, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  MAX_PAGE,
  quranQueryOptions,
  getPage,
  saveReadingPosition,
  BASMALA,
  hasBasmala,
  type Aya,
} from "@/lib/quran";

export const Route = createFileRoute("/quran/page/$page")({
  loader: ({ params }): { page: number } => {
    const page = Number(params.page);
    if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) throw notFound();
    return { page };
  },
  head: ({ params }) => {
    const title = `صفحة ${params.page} من المصحف الشريف | رحاب الخليلية`;
    const description = `اقرأ الصفحة ${params.page} من المصحف الشريف بالرسم العثماني الرسمي، رواية حفص عن عاصم.`;
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
  component: QuranPageView,
});

function QuranPageView() {
  const { page } = Route.useLoaderData();
  const navigate = useNavigate();
  const { data, isLoading, error } = useQuery(quranQueryOptions);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const ayat = useMemo(() => (data ? getPage(data, page) : []), [data, page]);

  const go = (target: number) => {
    if (target < 1 || target > MAX_PAGE) return;
    navigate({ to: "/quran/page/$page", params: { page: String(target) } });
  };

  useEffect(() => {
    if (ayat.length > 0) {
      const first = ayat[0];
      saveReadingPosition({
        suraNo: first.sura_no,
        suraNameAr: first.sura_name_ar,
        ayaNo: first.aya_no,
        page,
      });
    }
  }, [ayat, page]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") go(page + 1);
      if (e.key === "ArrowRight") go(page - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  /** Consecutive runs of ayat belonging to the same sura on this page. */
  const groups = useMemo(() => {
    const out: { suraNo: number; suraNameAr: string; startsSura: boolean; list: Aya[] }[] = [];
    for (const a of ayat) {
      const last = out[out.length - 1];
      if (last && last.suraNo === a.sura_no) last.list.push(a);
      else
        out.push({
          suraNo: a.sura_no,
          suraNameAr: a.sura_name_ar,
          startsSura: a.aya_no === 1,
          list: [a],
        });
    }
    return out;
  }, [ayat]);

  const suraNames = useMemo(
    () => Array.from(new Set(ayat.map((a) => a.sura_name_ar))),
    [ayat],
  );
  const juz = ayat[0]?.jozz;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main
        className="flex-1 w-full max-w-3xl mx-auto px-3 sm:px-5 py-4"
        onTouchStart={(e) => {
          const t = e.touches[0];
          touchStart.current = { x: t.clientX, y: t.clientY };
        }}
        onTouchEnd={(e) => {
          const s = touchStart.current;
          if (!s) return;
          const t = e.changedTouches[0];
          const dx = t.clientX - s.x;
          const dy = t.clientY - s.y;
          touchStart.current = null;
          if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy)) return;
          go(dx > 0 ? page - 1 : page + 1);
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/quran"
            className="inline-flex items-center gap-1 text-xs text-gold-soft/80 hover:text-gold-soft font-body"
          >
            <ChevronRight className="w-3.5 h-3.5" />
            <span>فهرس السور</span>
          </Link>
          <span className="text-[11px] text-muted-foreground font-body truncate">
            {suraNames.length > 0 && `سورة ${suraNames.join(" • ")}`}
            {juz ? ` — الجزء ${juz}` : ""}
          </span>
        </div>

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

        {ayat.length > 0 && (
          <article className="mt-3 glass rounded-2xl px-3 sm:px-5 py-5">
            {groups.map((g) => (
              <div key={`${g.suraNo}-${g.list[0].id}`} className="mt-4 first:mt-0">
                {g.startsSura && (
                  <>
                    <p className="font-display text-center text-base sm:text-lg text-gradient-gold">
                      سورة {g.suraNameAr}
                    </p>
                    {hasBasmala(g.suraNo) && (
                      <p className="mushaf-text my-3 text-center text-[1.05rem] sm:text-[1.2rem] text-gold-soft [text-align-last:center]">
                        {BASMALA}
                      </p>
                    )}
                  </>
                )}
                <div className="mushaf-text text-[1.05rem] sm:text-[1.2rem] text-foreground">
                  {g.list.map((a) => (
                    <span key={a.id} id={`aya-${a.sura_no}-${a.aya_no}`} className="inline">
                      {a.aya_text}{" "}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <p className="mt-6 text-center text-[11px] text-gold-soft/70 font-body">
              صفحة {page} من {MAX_PAGE}
            </p>
          </article>
        )}

        <nav className="mt-5 flex items-center justify-between gap-2">
          <button
            onClick={() => go(page + 1)}
            disabled={page >= MAX_PAGE}
            className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-2 text-xs font-body text-foreground/85 hover:text-gold-soft disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            الصفحة التالية
          </button>
          <button
            onClick={() => go(page + 1)}
            disabled={page >= MAX_PAGE}
            aria-label="الانتقال للصفحة التالية"
            className="inline-flex items-center justify-center rounded-full border border-gold/25 w-9 h-9 text-gold-soft/80 hover:text-gold-soft disabled:opacity-40"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
          <button
            onClick={() => go(page - 1)}
            disabled={page <= 1}
            className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-3 py-2 text-xs font-body text-foreground/85 hover:text-gold-soft disabled:opacity-40"
          >
            الصفحة السابقة
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </nav>

      </main>
      <SiteFooter />
    </div>
  );
}
