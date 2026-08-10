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

  const ayat = useMemo(() => (data ? getSura(data, sura.no) : []), [data, sura.no]);

  useEffect(() => {
    if (ayat.length > 0) {
      saveReadingPosition({
        suraNo: sura.no,
        suraNameAr: sura.nameAr,
        ayaNo: ayat[0].aya_no,
        page: ayat[0].page,
      });
    }
  }, [ayat, sura]);

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
            params={{ page: String(sura.startPage) }}
            className="text-xs text-gold-soft/80 hover:text-gold-soft font-body"
          >
            عرض الصفحة {sura.startPage}
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

        {ayat.length > 0 && (
          <article className="mt-4 glass rounded-2xl px-3 sm:px-5 py-5">
            <div className="mushaf-text text-[1.05rem] sm:text-[1.2rem] text-foreground">

              {ayat.map((a) => (
                <span key={a.id} id={`aya-${a.aya_no}`} className="inline">
                  {a.aya_text}{" "}
                </span>
              ))}
            </div>
          </article>
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
