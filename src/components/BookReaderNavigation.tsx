import { useCallback, useRef } from "react";
import { BookOpen, ChevronDown, ChevronUp, SlidersHorizontal, SkipBack, SkipForward } from "lucide-react";
import { currentReadingSection, readingSections, summarizedBookIndex, type OriginalBookHeading } from "@/lib/book-index";

type Props = { bookId: string; page: number; maxPage: number; immersive?: boolean; indexMode?: boolean; headings?: OriginalBookHeading[]; onJump: (page: number) => void };

/** Slim scrollbar-style page rail for the book reader: a thin draggable track
 * with a small thumb, tiny chevrons and a compact counter — minimal screen use. */
export function BookReaderNavigation({ bookId, page, maxPage, immersive = false, indexMode = false, headings = [], onJump }: Props) {
  const limits = maxPage || 1;
  const trackRef = useRef<HTMLDivElement>(null);
  const poemSections = !indexMode && bookId === "nafahat-khaliliyya"
    ? readingSections(maxPage, summarizedBookIndex(maxPage, headings)).filter(item => item.kind === "poem")
    : [];
  const currentPoem = currentReadingSection(poemSections, page);
  const previousPoem = [...poemSections].reverse().find(item => item.page < (currentPoem?.page ?? page));
  const nextPoem = poemSections.find(item => item.page > page);

  const pageFromPointer = useCallback((clientY: number) => {
    const track = trackRef.current;
    if (!track || maxPage < 2) return null;
    const rect = track.getBoundingClientRect();
    if (rect.height < 1) return null;
    const ratio = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    return Math.round(1 + ratio * (maxPage - 1));
  }, [maxPage]);

  const onTrackPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (maxPage < 2) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const target = pageFromPointer(event.clientY);
    if (target && target !== page) onJump(target);
  };
  const onTrackPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
    const target = pageFromPointer(event.clientY);
    if (target && target !== page) onJump(target);
  };
  const onTrackKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.stopPropagation();
    event.preventDefault();
    onJump(Math.min(limits, Math.max(1, page + (event.key === "ArrowUp" ? 1 : -1))));
  };

  const progress = maxPage > 1 ? (page - 1) / (maxPage - 1) : 0;
  const THUMB = 26;

  return (
    <nav className="book-reader-nav reader-page-rail__nav" dir="ltr" aria-label="التحكم في صفحات الكتاب">
      <button type="button" className="reader-page-rail__button" disabled={!maxPage || page >= maxPage}
        onClick={() => onJump(page + 1)} aria-label="الصفحة التالية" title="الصفحة التالية">
        <ChevronUp size={16} aria-hidden="true" />
      </button>
      <div
        ref={trackRef}
        className="reader-page-rail__track"
        role="slider"
        aria-label="شريط الانتقال بين صفحات الكتاب"
        aria-valuemin={1}
        aria-valuemax={limits}
        aria-valuenow={page}
        aria-valuetext={`صفحة ${page} من ${limits}`}
        aria-orientation="vertical"
        tabIndex={maxPage < 2 ? -1 : 0}
        onPointerDown={onTrackPointerDown}
        onPointerMove={onTrackPointerMove}
        onKeyDown={onTrackKeyDown}
      >
        <div
          className="reader-page-rail__thumb"
          style={{ top: `calc(${(progress * 100).toFixed(2)}% - ${(progress * THUMB).toFixed(1)}px)` }}
        />
      </div>
      <button type="button" className="reader-page-rail__button" disabled={page <= 1}
        onClick={() => onJump(page - 1)} aria-label="الصفحة السابقة" title="الصفحة السابقة">
        <ChevronDown size={16} aria-hidden="true" />
      </button>
      <span className="reader-page-rail__counter tabular-nums" dir="ltr" aria-live="polite" aria-label={`صفحة ${page} من ${maxPage}`}>
        {page}<small>/{maxPage || "…"}</small>
      </span>
      {!immersive && (
        <details className="reader-nav-popover reader-page-rail__popover">
          <summary className="reader-page-rail__button cursor-pointer" aria-label="الانتقال السريع بين الصفحات" title="الانتقال السريع">
            <SlidersHorizontal size={15} aria-hidden="true" />
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
