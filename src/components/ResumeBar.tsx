import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { BookOpen, Bookmark } from "lucide-react";
import { books } from "@/data/books";

type QuranPos = { suraNo: number; suraNameAr: string; ayaNo: number; page: number; at: number };
type BookPos = { id: string; title: string; page: number };

export function ResumeBar() {
  const [quran, setQuran] = useState<QuranPos | null>(null);
  const [book, setBook] = useState<BookPos | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("quran:last-position");
      if (raw) setQuran(JSON.parse(raw) as QuranPos);
    } catch {
      /* ignore */
    }
    try {
      let best: BookPos | null = null;
      for (const b of books) {
        const v = Number(localStorage.getItem(`reader.page.${b.id}`));
        if (Number.isFinite(v) && v > 1 && (!best || v > best.page)) {
          best = { id: b.id, title: b.title, page: v };
        }
      }
      setBook(best);
    } catch {
      /* ignore */
    }
  }, []);

  if (!quran && !book) return null;

  return (
    <div className="mx-auto w-full max-w-5xl px-3 sm:px-6 pt-4" dir="rtl">
      <div className="glass rounded-xl px-3 py-2.5 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-body text-muted-foreground">
          <Bookmark className="w-3.5 h-3.5 text-gold-soft" />
          متابعة القراءة
        </span>
        {quran && (
          <Link
            to="/quran/page/$page"
            params={{ page: String(quran.page) }}
            className="rounded-lg glass-gold px-3 py-1.5 text-xs sm:text-sm font-body text-gold-soft"
          >
            المصحف — سورة {quran.suraNameAr} · صفحة {quran.page}
          </Link>
        )}
        {book && (
          <Link
            to="/books/$bookId"
            params={{ bookId: book.id }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gold/25 px-3 py-1.5 text-xs sm:text-sm font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
          >
            <BookOpen className="w-3.5 h-3.5" />
            {book.title} — صفحة {book.page}
          </Link>
        )}
      </div>
    </div>
  );
}
