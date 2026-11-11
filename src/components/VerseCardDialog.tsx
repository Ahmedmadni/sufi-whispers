import { useEffect, useMemo, useRef, useState } from "react";
import { Copy, Download, Feather, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { books } from "@/data/books";
import logoUrl from "@/assets/rihab-logo-clean.png";
import {
  drawVerseCard, loadVerseCardFonts, parseVerses, versesToText,
  VERSE_CARD_MAX_LINES, type VerseCardFormat, type VerseCardTheme,
} from "@/lib/verse-card";

const THEMES: { id: VerseCardTheme; label: string }[] = [
  { id: "emerald", label: "زمردي" },
  { id: "paper", label: "ورقي" },
  { id: "night", label: "ليلي" },
];
const FORMATS: { id: VerseCardFormat; label: string }[] = [
  { id: "square", label: "مربعة" },
  { id: "story", label: "حالة / ستوري" },
];

type Props = { bookId: string; page: number };

/** Floating reader button that designs the chosen verses as a shareable card. */
export function VerseCardButton({ bookId, page }: Props) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="icon" className="reader-floating-index__button"
        aria-label="تصميم بطاقة أبيات" title="تصميم بطاقة أبيات" onClick={() => setOpen(true)}>
        <Feather size={19} aria-hidden="true" />
      </Button>
      {open && <VerseCardDialog bookId={bookId} page={page} open={open} onOpenChange={setOpen} />}
    </>
  );
}

function VerseCardDialog({ bookId, page, open, onOpenChange }: Props & { open: boolean; onOpenChange: (v: boolean) => void }) {
  const book = books.find(b => b.id === bookId);
  const draftKey = `verse-card.draft.${bookId}`;
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(draftKey) ?? ""; } catch { return ""; }
  });
  const [theme, setTheme] = useState<VerseCardTheme>("emerald");
  const [format, setFormat] = useState<VerseCardFormat>("square");
  const [title, setTitle] = useState(book?.title ?? "");
  const [preview, setPreview] = useState("");
  const [logo, setLogo] = useState<HTMLImageElement | null>(null);
  const [fontsReady, setFontsReady] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const lines = useMemo(() => parseVerses(text), [text]);
  const source = book ? `${book.title} · صفحة ${page}` : `صفحة ${page}`;

  useEffect(() => {
    try { localStorage.setItem(draftKey, text); } catch { /* storage may be full */ }
  }, [draftKey, text]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => setLogo(img);
    img.src = logoUrl;
    void loadVerseCardFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    if (!fontsReady) return;
    const id = window.setTimeout(() => {
      const canvas = canvasRef.current ?? document.createElement("canvas");
      canvasRef.current = canvas;
      drawVerseCard(canvas, { lines, theme, format, title: title.trim() || undefined, source, logo });
      setPreview(canvas.toDataURL("image/jpeg", 0.85));
    }, 160);
    return () => window.clearTimeout(id);
  }, [lines, theme, format, title, source, logo, fontsReady]);

  const getBlob = () => new Promise<Blob | null>(resolve => {
    const canvas = canvasRef.current;
    if (!canvas) return resolve(null);
    canvas.toBlob(resolve, "image/png");
  });
  const fileName = `رحاب-الخليلية-${bookId}-${page}.png`;
  const hasVerses = lines.length > 0;

  const save = async () => {
    const blob = await getBlob();
    if (!blob) return;
    const file = new File([blob], fileName, { type: "image/png" });
    // Android apps often ignore downloads; the share sheet offers "Save to gallery".
    if (import.meta.env.VITE_MOBILE === "true" && navigator.canShare?.({ files: [file] })) {
      try { await navigator.share({ files: [file], title: title || "بطاقة أبيات" }); } catch { /* cancelled */ }
      return;
    }
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = fileName; document.body.appendChild(a); a.click(); a.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 2000);
    toast.success("حُفظت البطاقة على جهازك");
  };

  const share = async () => {
    const blob = await getBlob();
    const shareText = versesToText(lines, source);
    try {
      if (blob) {
        const file = new File([blob], fileName, { type: "image/png" });
        if (navigator.canShare?.({ files: [file] })) {
          await navigator.share({ files: [file], title: title || "بطاقة أبيات", text: shareText });
          return;
        }
      }
      if (navigator.share) { await navigator.share({ title: title || "أبيات", text: shareText }); return; }
      await navigator.clipboard.writeText(shareText);
      toast.success("المشاركة غير متاحة هنا، فنُسخت الأبيات بدلًا منها");
    } catch (error) {
      if ((error as Error)?.name !== "AbortError") toast.error("تعذّرت المشاركة، جرّب حفظ البطاقة");
    }
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(versesToText(lines, source)); toast.success("نُسخت الأبيات"); }
    catch { toast.error("تعذّر النسخ"); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir="rtl" overlayClassName="z-[10040]"
        className="verse-card-dialog z-[10050] max-h-[92dvh] w-[calc(100vw-16px)] max-w-2xl overflow-y-auto rounded-2xl p-4 sm:p-6">
        <DialogHeader className="text-right sm:text-right">
          <DialogTitle className="font-display">بطاقة أبيات</DialogTitle>
          <DialogDescription>
            اكتب الأبيات التي اخترتها من الصفحة {page}، وافصل بين الشطرين بعلامة | أو اكتب كل شطر في سطر.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr]">
          <div className="space-y-3">
            <Textarea value={text} onChange={e => setText(e.target.value)} rows={6} dir="rtl"
              aria-label="الأبيات" className="min-h-[140px] resize-y text-base leading-loose"
              placeholder={"أتاني زماني بما أرتضي | فبالله يا دهر لا تنقضي"} />
            <p className="text-xs text-muted-foreground">
              {hasVerses ? `${lines.length} من ${VERSE_CARD_MAX_LINES} أبيات كحد أقصى` : `حتى ${VERSE_CARD_MAX_LINES} أبيات`}
            </p>
            <label className="block text-sm">
              <span className="mb-1 block text-muted-foreground">العنوان أعلى البطاقة</span>
              <input value={title} onChange={e => setTitle(e.target.value)} dir="rtl"
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" />
            </label>
            <fieldset>
              <legend className="mb-1 text-sm text-muted-foreground">النمط</legend>
              <div className="flex flex-wrap gap-2">
                {THEMES.map(t => (
                  <Button key={t.id} type="button" size="sm" variant={theme === t.id ? "default" : "outline"}
                    aria-pressed={theme === t.id} onClick={() => setTheme(t.id)}>{t.label}</Button>
                ))}
              </div>
            </fieldset>
            <fieldset>
              <legend className="mb-1 text-sm text-muted-foreground">المقاس</legend>
              <div className="flex flex-wrap gap-2">
                {FORMATS.map(f => (
                  <Button key={f.id} type="button" size="sm" variant={format === f.id ? "default" : "outline"}
                    aria-pressed={format === f.id} onClick={() => setFormat(f.id)}>{f.label}</Button>
                ))}
              </div>
            </fieldset>
          </div>

          <div className="flex flex-col items-center gap-3">
            <div className="flex w-full items-center justify-center rounded-xl border border-border bg-muted/40 p-2">
              {preview ? (
                <img src={preview} alt="معاينة بطاقة الأبيات"
                  className={format === "story" ? "max-h-[46dvh] w-auto rounded-lg" : "w-full max-w-[340px] rounded-lg"} />
              ) : (
                <div className="aspect-square w-full max-w-[340px] animate-pulse rounded-lg bg-muted" />
              )}
            </div>
            <div className="grid w-full grid-cols-3 gap-2">
              <Button type="button" onClick={save} disabled={!hasVerses}><Download size={16} aria-hidden="true" />حفظ</Button>
              <Button type="button" variant="secondary" onClick={share} disabled={!hasVerses}><Share2 size={16} aria-hidden="true" />مشاركة</Button>
              <Button type="button" variant="outline" onClick={copy} disabled={!hasVerses}><Copy size={16} aria-hidden="true" />نسخ</Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
