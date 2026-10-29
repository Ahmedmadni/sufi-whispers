import { RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveBookZoom, useBookZoomPreference } from "@/lib/book-zoom-preference";

export function BookPageZoomControl() {
  const [zoom, setZoom] = useBookZoomPreference();
  const update = (value: number) => setZoom(saveBookZoom(value));
  return (
    <div className="flex flex-wrap items-center gap-2" role="group" aria-label="حجم صفحات الكتب">
      <Button variant="outline" size="icon" className="h-11 w-11" disabled={zoom <= 1}
        onClick={() => update(zoom - .25)} aria-label="تصغير الصفحة" title="تصغير الصفحة"><ZoomOut /></Button>
      <output className="min-w-16 text-center font-body text-sm tabular-nums" aria-live="polite">{Math.round(zoom * 100)}٪</output>
      <Button variant="outline" size="icon" className="h-11 w-11" disabled={zoom >= 4}
        onClick={() => update(zoom + .25)} aria-label="تكبير الصفحة" title="تكبير الصفحة"><ZoomIn /></Button>
      <Button variant="ghost" size="icon" className="h-11 w-11" disabled={zoom === 1}
        onClick={() => update(1)} aria-label="إعادة حجم الصفحة الطبيعي" title="الحجم الطبيعي"><RotateCcw /></Button>
    </div>
  );
}