import { useEffect, useState } from "react";
import { Minus, Plus, RotateCcw, Type } from "lucide-react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "rihab-font-scale";
const SCALES = [100, 115, 130, 145];

function applyScale(value: number) {
  document.documentElement.style.setProperty("--reader-scale", String(value / 100));
}

export function FontSizeControl() {
  const [scale, setScale] = useState(100);

  useEffect(() => {
    const saved = Number(localStorage.getItem(STORAGE_KEY));
    const initial = SCALES.includes(saved) ? saved : 100;
    setScale(initial);
    applyScale(initial);
  }, []);

  const update = (next: number) => {
    setScale(next);
    applyScale(next);
    localStorage.setItem(STORAGE_KEY, String(next));
  };

  const index = SCALES.indexOf(scale);

  return (
    <div className="header-font-controls flex items-center gap-1" role="group" aria-label="ضبط حجم الخط">
      <Type className="header-font-controls__type hidden sm:block h-4 w-4" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => update(SCALES[Math.max(0, index - 1)] ?? 100)}
        disabled={index <= 0}
        aria-label="تصغير الخط"
        title="تصغير الخط"
        className="header-font-controls__button h-11 w-11 sm:h-10 sm:w-10"
      >
        <Minus className="h-5 w-5" strokeWidth={2.8} />
      </Button>
      <span className="header-font-controls__value hidden min-w-10 text-center text-xs font-body sm:inline" aria-live="polite">
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
        className="header-font-controls__button h-11 w-11 sm:h-10 sm:w-10"
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
          className="header-font-controls__button h-11 w-11 sm:h-10 sm:w-10"
        >
          <RotateCcw />
        </Button>
      )}
    </div>
  );
}