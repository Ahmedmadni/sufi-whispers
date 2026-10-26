import { BookOpen, ChevronDown, ChevronUp, SlidersHorizontal, SkipBack, SkipForward } from "lucide-react";
import { currentReadingSection, readingSections, summarizedBookIndex, type OriginalBookHeading } from "@/lib/book-index";

type Props = { bookId: string; page: number; maxPage: number; immersive?: boolean; headings?: OriginalBookHeading[]; onJump: (page: number) => void };

/** Page-specific navigation rail for the book reader, independent of site navigation. */
export function BookReaderNavigation({ bookId, page, maxPage, immersive = false, headings = [], onJump }: Props) {
  const limits = maxPage || 1;
  const poemSections = bookId === "nafahat-khaliliyya"
    ? readingSections(maxPage, summarizedBookIndex(maxPage, headings)).filter(item => item.kind === "poem")
    : [];
  const currentPoem = currentReadingSection(poemSections, page);
  const previousPoem = [...poemSections].reverse().find(item => item.page < (currentPoem?.page ?? page));
  const nextPoem = poemSections.find(item => item.page > page);

  return (
    <nav className="book-reader-nav reader-page-rail__nav" dir="ltr" aria-label="التحكم في صفحات الكتاب">
      <button type="button" className="reader-page-rail__button" disabled={!maxPage || page >= maxPage}
        onClick={() => onJump(page + 1)} aria-label="الصفحة التالية" title="الصفحة التالية">
        <ChevronUp size={20} aria-hidden="true" />
      </button>
      <span className="reader-page-rail__counter tabular-nums" dir="ltr" aria-live="polite" aria-label={`صفحة ${page} من ${maxPage}`}>
        <span>{page}</span>
        <small>/{maxPage || "…"}</small>
      </span>
      <button type="button" className="reader-page-rail__button" disabled={page <= 1}
        onClick={() => onJump(page - 1)} aria-label="الصفحة السابقة" title="الصفحة السابقة">
        <ChevronDown size={20} aria-hidden="true" />
      </button>
      {!immersive && (
        <details className="reader-nav-popover reader-page-rail__popover">
          <summary className="reader-page-rail__button cursor-pointer" aria-label="الانتقال السريع بين الصفحات" title="الانتقال السريع">
            <SlidersHorizontal size={19} aria-hidden="true" />
          </summary>
          <div className="reader-nav-popover__body reader-page-rail__popover-body" dir="rtl">
            <input className="reader-page-scrubber" type="range" dir="ltr" min={1} max={limits} step={1}
              value={Math.min(page, limits)} disabled={maxPage < 2}
              aria-label="شريط الانتقال السريع بين صفحات الكتاب"
              onChange={event => onJump(Number(event.currentTarget.value))} />
            <div className="flex items-center justify-between gap-1 pt-2">
              {bookId === "ward" && (
                <>
                  <button type="button" className="reader-icon-button" onClick={() => onJump(4)} disabled={maxPage < 4}
                    aria-label="الحزب الأول صفحة 4" title="الحزب الأول"><BookOpen size={18}/><span className="sr-only">4</span></button>
                  <button type="button" className="reader-icon-button" onClick={() => onJump(22)} disabled={maxPage < 22}
                    aria-label="الحزب الثاني صفحة 22" title="الحزب الثاني"><BookOpen size={18}/><span className="sr-only">22</span></button>
                </>
              )}
              {poemSections.length > 0 && (
                <>
                  <button type="button" className="reader-icon-button" disabled={!previousPoem}
                    onClick={() => previousPoem && onJump(previousPoem.page)}
                    aria-label="القصيدة السابقة" title="القصيدة السابقة"><SkipBack size={18}/></button>
                  <button type="button" className="reader-icon-button" disabled={!nextPoem}
                    onClick={() => nextPoem && onJump(nextPoem.page)}
                    aria-label="القصيدة التالية" title="القصيدة التالية"><SkipForward size={18}/></button>
                </>
              )}
            </div>
          </div>
        </details>
      )}
    </nav>
  );
}
