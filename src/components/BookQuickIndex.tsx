import { useId, useMemo, useState } from "react";
import { List, X } from "lucide-react";
import { summarizedBookIndex, type OriginalBookHeading } from "@/lib/book-index";

type Props = { maxPage: number; page: number; headings?: OriginalBookHeading[]; onJump: (page: number) => void };
/** A complete index of authentic PDF bookmarks, never invented page fractions. */
export function BookQuickIndex({ maxPage, page, headings = [], onJump }: Props) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const entries = useMemo(() => summarizedBookIndex(maxPage, headings), [maxPage, headings]);
  const hasPoems = entries.some(item => item.kind === "poem");
  const chapters = hasPoems ? entries.filter(item => item.kind === "poem") : entries;
  const appendix = hasPoems ? entries.filter(item => item.kind === "other") : [];
  const renderRow = (item: typeof entries[number], index: number) => (
    <button key={`${item.page}-${item.label}-${index}`} type="button"
      onClick={() => { onJump(item.page); setOpen(false); }}
      aria-current={page === item.page ? "location" : undefined}
      className={`flex min-h-11 items-center justify-between gap-3 rounded-lg px-3 py-2 text-right font-body text-sm ${page === item.page ? "bg-gold/15 text-gold-soft" : "text-foreground/85 hover:bg-gold/10"}`}>
      <span className="min-w-0 break-words">{item.label}</span>
      <span className="shrink-0 tabular-nums text-gold-soft">{item.page}</span>
    </button>
  );
  return (
    <div className="book-quick-index relative mb-2 rounded-xl border border-gold/20 bg-card/60 p-2" dir="rtl">
      <div className="flex items-center justify-between">
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls={id}
          aria-label={open ? "إغلاق الفهرس" : "فتح فهرس الكتاب"} title="الفهرس"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gold-soft">
          {open ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
        </button>
        <span className="text-xs text-muted-foreground">{hasPoems ? `${chapters.length} قصيدة · فهرس صفحات موثّق` : entries.length ? `${entries.length} عنوانًا مرتبطًا بالصفحات` : "لا توجد عناوين مفهرسة في ملف الكتاب"}</span>
      </div>
      {open && (
        <div id={id} className="mt-2 max-h-[min(65dvh,650px)] overflow-y-auto overscroll-contain rounded-xl" aria-label="فهرس الكتاب الكامل">
          {entries.length ? (
            <div className="space-y-3">
              {hasPoems && <h3 className="px-3 pt-2 font-display text-sm text-gold-soft">القصائد — اضغط على عنوان لفتحها</h3>}
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {chapters.map(renderRow)}
              </div>
              {appendix.length > 0 && (
                <>
                  <h3 className="border-t border-gold/20 px-3 pt-3 font-display text-sm text-gold-soft">المقدمة والأوراد</h3>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {appendix.map(renderRow)}
                  </div>
                </>
              )}
            </div>
          ) : <p className="p-3 text-sm text-muted-foreground">نسخة الكتاب لا تحتوي فهرسًا إلكترونيًا أصليًا. استخدم شريط الانتقال بين الصفحات أدناه.</p>}
        </div>
          ) : <p className="p-3 text-sm text-muted-foreground">نسخة الكتاب لا تحتوي فهرسًا إلكترونيًا أصليًا. استخدم شريط الانتقال بين الصفحات أدناه.</p>}
        </div>
      )}
    </div>
  );
}
