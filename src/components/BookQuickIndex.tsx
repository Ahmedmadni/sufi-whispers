import { useMemo, useState } from "react";
import { List, ChevronDown } from "lucide-react";
import { summarizedBookIndex, type OriginalBookHeading } from "@/lib/book-index";

type Props = {
  maxPage: number;
  page: number;
  headings?: OriginalBookHeading[];
  onJump: (page: number) => void;
};

/** Labels are taken from actual PDF bookmarks; fallback labels are page landmarks. */
export function BookQuickIndex({ maxPage, page, headings = [], onJump }: Props) {
  const [open, setOpen] = useState(false);
  const entries = useMemo(() => summarizedBookIndex(maxPage, headings), [maxPage, headings]);
  if (!maxPage || !entries.length) return null;
  return (
    <div className="book-quick-index relative mb-2 rounded-xl border border-gold/20 bg-card/60 p-2" dir="rtl">
      <button type="button" onClick={() => setOpen(current => !current)}
        aria-expanded={open} aria-controls="book-index-entries"
        className="flex min-h-10 w-full items-center justify-between gap-2 rounded-lg px-2 text-right text-sm font-body text-gold-soft">
        <span className="flex items-center gap-2"><List size={17} aria-hidden="true" /> فهرس الكتاب المختصر</span>
        <ChevronDown size={17} aria-hidden="true" className={open ? "rotate-180 transition-transform" : "transition-transform"} />
      </button>
      {open && (
        <div id="book-index-entries" className="mt-2">
          <p className="px-2 pb-2 text-[11px] font-body text-muted-foreground">
            عناوين من الفهرس الأصلي للكتاب
          </p>
          <div className="grid max-h-[min(38vh,280px)] grid-cols-1 gap-1 overflow-y-auto sm:grid-cols-2" aria-label="عناصر فهرس الكتاب">
            {entries.map(item => (
              <button key={`${item.page}-${item.label}`} type="button"
                onClick={() => { onJump(item.page); setOpen(false); }}
                aria-current={page === item.page ? "location" : undefined}
                className={`flex min-h-10 items-center justify-between gap-3 rounded-lg px-3 py-2 text-right font-body text-xs transition-colors ${page === item.page ? "bg-gold/15 text-gold-soft" : "text-foreground/85 hover:bg-gold/10"}`}>
                <span className="min-w-0 break-words">{item.label}</span>
                <span className="shrink-0 tabular-nums text-gold-soft">{item.page}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
