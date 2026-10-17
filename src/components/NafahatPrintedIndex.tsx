import { Page } from "react-pdf";
import indexMap from "@/data/nafahat-printed-index.json";

type Entry = {
  page: number;
  column: "left" | "right";
  top: number;
  height: number;
};

type Props = {
  sheet: number;
  width: number;
  onJump: (page: number) => void;
};

/** Show the ORIGINAL printed Arabic titles, not broken text extracted from
 * legacy font subsets. Every printed reference row is an interactive hit area,
 * placed from actual number positions measured in the PDF. The same original
 * PDF is already loaded by the surrounding react-pdf Document.
 */
export function NafahatPrintedIndex({ sheet, width, onJump }: Props) {
  const sheets = indexMap.sheets as Record<string, Entry[]>;
  const rows = sheets[String(sheet)] ?? [];
  const h = width * 841.68 / 595.32;

  return (
    <div
      className="relative mx-auto max-w-full overflow-hidden rounded-lg border border-gold/35 bg-[#fffaf0]"
      style={{ width, height: h }}
      dir="rtl"
      aria-label={`الفهرس المطبوع الأصلي، صفحة ${sheet} من الكتاب، ${rows.length} عنوانًا قابلًا للفتح`}
    >
      <Page
        key={sheet}
        pageNumber={sheet}
        width={width}
        renderTextLayer={false}
        renderAnnotationLayer={false}
        loading={<div className="p-5 text-center text-sm text-emerald-900">جارٍ عرض صفحة الفهرس الأصلية…</div>}
      />
      {rows.map((item, i) => (
        <button
          key={`${sheet}-${item.column}-${item.top}-${i}`}
          type="button"
          onClick={() => onJump(item.page)}
          title={`الذهاب إلى صفحة ${item.page}`}
          aria-label={`فتح العنوان المطبوع في صفحة ${item.page}`}
          className="absolute z-10 cursor-pointer rounded-sm bg-transparent text-transparent outline-offset-0 transition-colors hover:bg-[#d0a85d]/20 focus-visible:bg-[#d0a85d]/25 focus-visible:outline-2 focus-visible:outline-[#ad7730]"
          style={{
            left: item.column === "left" ? "6.7%" : "49.5%",
            width: item.column === "left" ? "42.5%" : "43.5%",
            top: `${item.top * 100}%`,
            height: `${item.height * 100}%`,
          }}
        >
          <span className="sr-only">صفحة {item.page}</span>
        </button>
      ))}
    </div>
  );
}

export const NAFAHAT_INDEX_FIRST = indexMap.printedIndexFirstPage;
export const NAFAHAT_INDEX_LAST = indexMap.printedIndexLastPage;
export const NAFAHAT_INDEX_REFERENCES = indexMap.references;
