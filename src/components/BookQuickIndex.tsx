import { useId, useMemo, useState } from "react";
import { List, Search, X } from "lucide-react";
import { currentReadingSection, readingSections, summarizedBookIndex, type OriginalBookHeading, type BookReadingSection } from "@/lib/book-index";

type Props = { maxPage: number; page: number; compact?: boolean; headings?: OriginalBookHeading[]; onJump: (page: number) => void };
/** Full source-grounded PDF index. Khaliliya poems show genuine page ranges;
 * ordinary books keep their authentic PDF bookmark titles and page numbers. */
export function BookQuickIndex({ maxPage, page, compact = false, headings = [], onJump }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const id = useId();
  const entries = useMemo(() => summarizedBookIndex(maxPage, headings), [maxPage, headings]);
  const sections = useMemo(() => readingSections(maxPage, entries), [maxPage, entries]);
  const hasPoems = sections.some(item => item.kind === "poem");
  const poems = hasPoems ? sections.filter(item => item.kind === "poem") : [];
  const appendix = hasPoems ? sections.filter(item => item.kind === "other") : [];
  const term = search.trim().toLocaleLowerCase("ar");
  const visiblePoems = term ? poems.filter(p => p.label.toLocaleLowerCase("ar").includes(term)) : poems;
  const visibleAppendix = term ? appendix.filter(p => p.label.toLocaleLowerCase("ar").includes(term)) : appendix;
  const current = currentReadingSection(sections, page);

  const renderRow = (item: BookReadingSection, index: number, poemNumber?: number) => {
    const isCurrent = current?.page === item.page && current?.label === item.label;
    const pageLabel = hasPoems && item.endPage > item.page
      ? `ص ${item.page}–${item.endPage}`
      : `ص ${item.page}`;
    return (
      <button key={`${item.page}-${item.label}-${index}`} type="button"
        onClick={() => { onJump(item.page); setOpen(false); }}
        aria-current={isCurrent ? "location" : undefined}
        aria-label={`${item.label}، ${pageLabel}`}
        className={`flex min-h-12 w-full items-center justify-between gap-3 rounded-xl border px-3 py-2.5 text-right font-body text-sm transition-colors ${isCurrent ? "border-gold/40 bg-gold/15 text-gold-soft" : "border-transparent text-foreground/85 hover:border-gold/15 hover:bg-gold/10"}`}>
        <span className="min-w-0">
          {poemNumber && <span className="mb-0.5 block text-[11px] font-medium text-muted-foreground">قصيدة {poemNumber}</span>}
          <span className="block break-words leading-relaxed">{item.label}</span>
        </span>
        <span className="shrink-0 whitespace-nowrap rounded-md bg-muted px-2 py-1 text-xs tabular-nums text-gold-soft" dir="rtl">{pageLabel}</span>
      </button>
    );
  };

  return (
    <div className={compact ? "book-quick-index book-quick-index--compact relative" : "book-quick-index relative mb-2 rounded-xl border border-gold/20 bg-card/60 p-2"} dir="rtl">
      <div className={compact ? "flex items-center" : "flex items-center justify-between"}>
        <button type="button" onClick={() => setOpen(v => !v)} aria-expanded={open} aria-controls={id}
          aria-label={open ? "إغلاق الفهرس" : "فتح فهرس الكتاب"} title="الفهرس"
          className={compact ? "reader-icon-button" : "inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg text-gold-soft"}>
          {open ? <X size={20} aria-hidden="true" /> : <List size={20} aria-hidden="true" />}
        </button>
        {!compact && <span className="text-xs text-muted-foreground">
          {hasPoems ? `${poems.length} قصيدة · حسب صفحات النسخة الأصلية` : entries.length ? `${entries.length} عنوانًا مرتبطًا بالصفحات` : "لا توجد عناوين مفهرسة في ملف الكتاب"}
        </span>}
      </div>
      {open && (
        <div id={id} className={compact ? "reader-index-popover max-h-[min(66dvh,600px)] overflow-y-auto overscroll-contain rounded-xl" : "mt-2 max-h-[min(65dvh,650px)] overflow-y-auto overscroll-contain rounded-xl"} aria-label="فهرس الكتاب الكامل">
          {sections.length ? (
            <div className="space-y-3">
              {hasPoems && (
                <>
                  <h3 className="px-3 pt-2 font-display text-sm text-gold-soft">القصائد — اضغط على عنوان لفتحها</h3>
                  <label className="mx-2 flex min-h-11 items-center gap-2 rounded-xl border border-border bg-background px-3 text-muted-foreground">
                    <Search size={16} aria-hidden="true" />
                    <input type="search" value={search} onChange={e => setSearch(e.currentTarget.value)}
                      placeholder="ابحث عن قصيدة أو فصل" aria-label="البحث في فهرس قصائد النفحات الخليلية"
                      className="min-w-0 flex-1 bg-transparent py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground" />
                  </label>
                </>
              )}
              <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                {(hasPoems ? visiblePoems : sections).map((item,index) => renderRow(item,index,
                  hasPoems ? poems.findIndex(p => p.page === item.page && p.label === item.label) + 1 : undefined))}
              </div>
              {hasPoems && visiblePoems.length === 0 && (
                <p className="px-3 py-2 text-sm text-muted-foreground">لا توجد قصيدة مطابقة للبحث.</p>
              )}
              {visibleAppendix.length > 0 && (
                <>
                  <h3 className="border-t border-gold/20 px-3 pt-3 font-display text-sm text-gold-soft">المقدمة والأوراد</h3>
                  <div className="grid grid-cols-1 gap-1 sm:grid-cols-2">
                    {visibleAppendix.map((item,index) => renderRow(item,index))}
                  </div>
                </>
              )}
            </div>
          ) : <p className="p-3 text-sm text-muted-foreground">نسخة الكتاب لا تحتوي فهرسًا إلكترونيًا أصليًا. استخدم شريط الانتقال بين الصفحات أدناه.</p>}
        </div>
      )}
    </div>
  );
}
