import { Link } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight, House } from "lucide-react";

type Props = { bookId: string; page: number; maxPage: number; onJump: (page: number) => void };
/** One accessible pager for scanned PDFs and the original PDF.js reader. */
export function BookReaderNavigation({ bookId, page, maxPage, onJump }: Props) {
  const limits = maxPage || 1;
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
