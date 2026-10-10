import { useId, type CSSProperties, type ReactNode } from "react";
import { SignatureRosette } from "@/components/MushafSignatureArt";

type Side = "top" | "bottom" | "left" | "right";

/** Original vector illumination, outside the Quran text layer. */
function ManuscriptBorder({ side }: { side: Side }) {
  const isHorizontal = side === "top" || side === "bottom";
  const rawId = useId();
  const patternId = `rihab-border-${rawId.replace(/[^a-zA-Z0-9-]/g, "")}`;
  return (
    <svg
      className={`mushaf-printed-border mushaf-printed-border--${side}`}
      viewBox={isHorizontal ? "0 0 600 26" : "0 0 26 680"}
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false"
    >
      <defs>
        <pattern id={patternId} width="26" height="26" patternUnits="userSpaceOnUse">
          <rect width="26" height="26" fill="#f1e5cc" />
          <path d="M0 0 L26 26 M26 0 L0 26" stroke="#8a7e68" strokeWidth=".5" opacity=".45" />
          <path d="M13 2 Q18 7 13 13 Q8 7 13 2Z M13 24 Q8 19 13 13 Q18 19 13 24Z"
            fill="#a75657" stroke="#714748" strokeWidth=".75" />
          <path d="M2 13 Q7 8 13 13 Q7 18 2 13Z M24 13 Q19 18 13 13 Q19 8 24 13Z"
            fill="#a75657" stroke="#714748" strokeWidth=".75" />
          <path d="M4 4 Q10 3 11 10 Q4 10 4 4Z M22 4 Q16 3 15 10 Q22 10 22 4Z
            M4 22 Q10 23 11 16 Q4 16 4 22Z M22 22 Q16 23 15 16 Q22 16 22 22Z"
            fill="#799081" stroke="#617566" strokeWidth=".5" />
          <circle cx="13" cy="13" r="4" fill="#dfbd81" stroke="#956b41" strokeWidth="1" />
          <circle cx="13" cy="13" r="1.6" fill="#7e423f" />
          <circle cx="1.5" cy="1.5" r="1" fill="#b78063" />
          <circle cx="24.5" cy="24.5" r="1" fill="#b78063" />
        </pattern>
      </defs>
      <rect width={isHorizontal ? 600 : 26} height={isHorizontal ? 26 : 680} fill={`url(#${patternId})`} />
      {isHorizontal ? (
        <>
          <path d="M0 1 H600 M0 25 H600" stroke="#9d713e" strokeWidth="1.6" />
          <path d="M0 4 H600 M0 22 H600" stroke="#f7e6bb" strokeWidth=".7" />
        </>
      ) : (
        <>
          <path d="M1 0 V680 M25 0 V680" stroke="#9d713e" strokeWidth="1.6" />
          <path d="M4 0 V680 M22 0 V680" stroke="#f7e6bb" strokeWidth=".7" />
        </>
      )}
    </svg>
  );
}

function PrintedCorner({ side }: { side: "tl" | "tr" | "bl" | "br" }) {
  return (
    <span className={`mushaf-printed-corner mushaf-printed-corner--${side}`} aria-hidden="true">
      <SignatureRosette small />
    </span>
  );
}

export type MushafPrintedPageFrameProps = {
  page: number;
  suraName: string;
  juz?: number;
  night?: boolean;
  style?: CSSProperties;
  children: ReactNode;
};

/**
 * The printed frame is decorative. Its children are the canonical, unchanged
 * Quran data (aya_text). Page and juz come from the same authoritative rows.
 * This component does not split, normalize, reflow or rewrite the Quran text.
 */
export function MushafPrintedPageFrame({
  page, suraName, juz, night = false, style, children,
}: MushafPrintedPageFrameProps) {
  return (
    <article
      className={`mushaf-printed-page mushaf-premium ${night ? "mushaf-midnight" : "mushaf-parchment"}`}
      style={style}
      aria-label={`صفحة ${page} من المصحف الشريف`}
      data-testid="printed-mushaf-page"
    >
      <PrintedCorner side="tl" />
      <ManuscriptBorder side="top" />
      <PrintedCorner side="tr" />
      <ManuscriptBorder side="left" />
      <div className="mushaf-printed-page__interior">
        <header className="mushaf-printed-page__running-head" aria-label="رأس صفحة المصحف">
          <span className="mushaf-printed-page__running-label">سورة {suraName}</span>
          <SignatureRosette small />
          <span className="mushaf-printed-page__running-label">{juz ? `الجزء ${juz}` : "المصحف الشريف"}</span>
        </header>
        <div className="mushaf-printed-page__text" data-testid="canonical-quran-text">
          {children}
        </div>
        <footer className="mushaf-printed-page__folio">
          <span aria-label={`رقم الصفحة ${page}`}>{page.toLocaleString("ar-EG", { useGrouping: false })}</span>
        </footer>
      </div>
      <ManuscriptBorder side="right" />
      <PrintedCorner side="bl" />
      <ManuscriptBorder side="bottom" />
      <PrintedCorner side="br" />
    </article>
  );
}
