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
    <div className="flex items-center gap-1" aria-label="ضبط حجم الخط">
      <Type className="hidden sm:block h-4 w-4 text-gold-soft" aria-hidden="true" />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => update(SCALES[Math.max(0, index - 1)] ?? 100)}
        disabled={index <= 0}
        aria-label="تصغير الخط"
        title="تصغير الخط"
        className="h-10 w-10 border border-gold/20 text-gold-soft"
      >
        <Minus />
      </Button>
      <span className="hidden min-w-10 text-center text-xs font-body text-foreground/80 sm:inline" aria-live="polite">
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
        className="h-10 w-10 border border-gold/20 text-gold-soft"
      >
        <Plus />
      </Button>
      {scale !== 100 && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => update(100)}
          aria-label="إعادة حجم الخط الطبيعي"
          title="الحجم الطبيعي"
          className="h-10 w-10 text-muted-foreground"
        >
          <RotateCcw />
        </Button>
      )}
    </div>
  );
}