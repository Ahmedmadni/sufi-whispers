import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, House } from "lucide-react";
import { currentReadingSection, readingSections, summarizedBookIndex, type OriginalBookHeading } from "@/lib/book-index";

type Props = { bookId: string; page: number; maxPage: number; headings?: OriginalBookHeading[]; onJump: (page: number) => void };
/** One accessible pager for scanned PDFs and the original PDF.js reader. */
export function BookReaderNavigation({ bookId, page, maxPage, headings = [], onJump }: Props) {
  const limits = maxPage || 1;
  const poemSections = bookId === "nafahat-khaliliyya"
    ? readingSections(maxPage, summarizedBookIndex(maxPage, headings)).filter(item => item.kind === "poem")
    : [];
  const currentPoem = currentReadingSection(poemSections, page);
  const previousPoem = [...poemSections].reverse().find(item => item.page < (currentPoem?.page ?? page));
  const nextPoem = poemSections.find(item => item.page > page);
  return (
    <nav className="book-reader-nav mt-2 flex flex-col gap-2" dir="rtl" aria-label="التنقل بين صفحات الكتاب">
      {bookId === "ward" && (
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs">
          <button type="button" className="reader-quick-jump" onClick={() => onJump(4)} disabled={maxPage < 4}>
            الحزب الأول · ص 4
          </button>
          <button type="button" className="reader-quick-jump" onClick={() => onJump(22)} disabled={maxPage < 22}>
            الحزب الثاني · ص 22
          </button>
        </div>
      )}
      {poemSections.length > 0 && (
        <div className="space-y-2 border-b border-border pb-2">
          <p className="px-1 text-xs leading-relaxed text-muted-foreground" aria-live="polite">
            {currentPoem ? <>القصيدة الحالية: <strong className="text-foreground">{currentPoem.label}</strong> (ص {currentPoem.page}{currentPoem.endPage > currentPoem.page ? `–${currentPoem.endPage}` : ""})</> : "اختر قصيدة من الفهرس"}
          </p>
          <div className="flex flex-wrap justify-between gap-2">
            <button type="button" disabled={!previousPoem} onClick={() => previousPoem && onJump(previousPoem.page)}
              aria-label="الانتقال إلى القصيدة السابقة"
              className="reader-quick-jump text-xs disabled:opacity-40"><ChevronRight size={15} aria-hidden="true" className="inline" /> القصيدة السابقة</button>
            <button type="button" disabled={!nextPoem} onClick={() => nextPoem && onJump(nextPoem.page)}
              aria-label="الانتقال إلى القصيدة التالية"
              className="reader-quick-jump text-xs disabled:opacity-40">القصيدة التالية <ChevronLeft size={15} aria-hidden="true" className="inline" /></button>
          </div>
        </div>
      )}
      <div className="flex min-w-0 items-center justify-between gap-2">
        <button type="button" className="reader-icon-button" disabled={!maxPage || page >= maxPage}
          onClick={() => onJump(page + 1)} aria-label="الصفحة التالية" title="الصفحة التالية">
          <ChevronRight size={20} aria-hidden="true" />
        </button>
        <span className="min-w-0 text-center text-sm tabular-nums text-foreground" aria-live="polite">صفحة {page} / {maxPage || "…"}</span>
        <button type="button" className="reader-icon-button" disabled={page <= 1}
          onClick={() => onJump(page - 1)} aria-label="الصفحة السابقة" title="الصفحة السابقة">
          <ChevronLeft size={20} aria-hidden="true" />
        </button>
        <Link to="/" className="reader-icon-button text-gold-soft" aria-label="الرجوع إلى الصفحة الرئيسية" title="الرئيسية">
          <House size={19} aria-hidden="true" />
        </Link>
      </div>
      <label className="flex flex-col gap-1 text-xs text-muted-foreground">
        <span>انتقال سريع إلى صفحة {page} من {maxPage || "…"}</span>
        <input className="reader-page-scrubber" type="range" dir="ltr" min={1} max={limits} step={1}
          value={Math.min(page, limits)} disabled={!maxPage || maxPage < 2}
          aria-label="شريط الانتقال السريع بين صفحات الكتاب"
          onChange={event => onJump(Number(event.currentTarget.value))} />
      </label>
    </nav>
  );
}
