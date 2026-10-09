import { useEffect, useState, type CSSProperties } from "react";
import { Minus, Plus, RotateCcw } from "lucide-react";

export type MushafViewSettings = { scale: number; parchment: boolean };
const KEY = "rihab-mushaf-view-v2";
const DEFAULT: MushafViewSettings = { scale: 100, parchment: true };
const SCALES = [90, 100, 115, 130, 145];

export function useMushafView() {
  const [view, setView] = useState<MushafViewSettings>(DEFAULT);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || "null") as Partial<MushafViewSettings> | null;
      if (!saved) return;
      setView({
        scale: SCALES.includes(Number(saved.scale)) ? Number(saved.scale) : DEFAULT.scale,
        parchment: saved.parchment !== false,
      });
    } catch {
      // Reader preferences are optional, never prevent Quran reading.
    }
  }, []);

  const update = (next: MushafViewSettings) => {
    setView(next);
    try { localStorage.setItem(KEY, JSON.stringify(next)); } catch { /* private mode */ }
  };

  const paperStyle = {
    "--mushaf-scale": String(view.scale / 100),
  } as CSSProperties;

  return { view, update, paperStyle };
}

export function MushafReadingToolbar({
  view,
  onChange,
}: {
  view: MushafViewSettings;
  onChange: (next: MushafViewSettings) => void;
}) {
  const index = SCALES.indexOf(view.scale);
  const button = "mushaf-reader-control inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-gold/25 px-2 text-sm font-body text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40";

  return (
    <div className="mushaf-reading-toolbar" role="group" aria-label="إعدادات عرض المصحف">
      <span className="text-[11px] font-body text-muted-foreground">حجم الخط العثماني</span>
      <div className="flex items-center gap-1.5">
        <button type="button" className={button} disabled={index <= 0} aria-label="تصغير الخط العثماني"
          onClick={() => onChange({ ...view, scale: SCALES[Math.max(0, index - 1)] })}>
          <Minus className="h-4 w-4" />
        </button>
        <output aria-live="polite" className="min-w-12 text-center text-xs tabular-nums text-foreground">{view.scale}٪</output>
        <button type="button" className={button} disabled={index >= SCALES.length - 1} aria-label="تكبير الخط العثماني"
          onClick={() => onChange({ ...view, scale: SCALES[Math.min(SCALES.length - 1, index + 1)] })}>
          <Plus className="h-4 w-4" />
        </button>
        <button type="button" className={button} disabled={view.scale === 100} aria-label="إعادة حجم الخط الأصلي"
          onClick={() => onChange({ ...view, scale: 100 })}>
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
      <button type="button" className={`${button} px-3`} aria-pressed={view.parchment}
        onClick={() => onChange({ ...view, parchment: !view.parchment })}>
        {view.parchment ? "ورق كريمي" : "مظهر داكن"}
      </button>
    </div>
  );
}
