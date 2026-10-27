import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "rihab-font-scale";
const SCALES = [100, 115, 130, 145];

function applyScale(value: number) {
  if (typeof document !== "undefined") {
    document.documentElement.style.setProperty("--reader-scale", String(value / 100));
  }
}

/** Apply the saved preference at app startup, even though controls live in Settings. */
export function applySavedFontScale(): number {
  let initial = 100;
  try {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    if (SCALES.includes(saved)) initial = saved;
  } catch { /* default font size remains available without storage */ }
  applyScale(initial);
  return initial;
}

export function FontSizeControl() {
  const [scale, setScale] = useState(100);

  useEffect(() => {
    setScale(applySavedFontScale());
  }, []);

  const update = (next: number) => {
    setScale(next);
    applyScale(next);
    try { localStorage.setItem(STORAGE_KEY, String(next)); } catch { /* apply for this session */ }
  };

  const index = SCALES.indexOf(scale);

  return (
    <div className="font-size-controls flex items-center gap-1" role="group" aria-label="ضبط حجم الخط">
      <Type className="font-size-controls__type h-4 w-4" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => update(SCALES[Math.max(0, index - 1)] ?? 100)}
        disabled={index <= 0}
        aria-label="تصغير الخط"
        title="تصغير الخط"
        className="font-size-controls__button h-11 w-11 sm:h-10 sm:w-10"
      >
        <Minus className="h-5 w-5" strokeWidth={2.8} />
      </Button>
      <span className="font-size-controls__value min-w-12 text-center text-sm font-body" aria-live="polite">
        {scale}٪
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => update(SCALES[Math.min(SCALES.length - 1, index + 1)] ?? 145)}
        disabled={index >= SCALES.length - 1}
        aria-label="تكبير الخط"
        title="تكبير الخط"
        className="font-size-controls__button h-11 w-11 sm:h-10 sm:w-10"
      >
        <Plus className="h-5 w-5" strokeWidth={2.8} />
      </Button>
      {scale !== 100 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => update(100)}
          aria-label="إعادة حجم الخط الطبيعي"
          title="الحجم الطبيعي"
          className="font-size-controls__button h-11 w-11 sm:h-10 sm:w-10"
        >
          <RotateCcw />
        </Button>
      )}
    </div>
  );
}