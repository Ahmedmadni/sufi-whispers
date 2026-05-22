import { AnimatePresence, motion } from "framer-motion";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { poems } from "@/data/poems";

function normalize(s: string) {
  return s
    .replace(/[\u064B-\u065F\u0670]/g, "") // diacritics
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}

export function SearchModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const nq = normalize(q);
    const out: { poemId: number; poemTitle: string; verse?: string; verseId?: number }[] = [];
    for (const p of poems) {
      if (normalize(p.title).includes(nq)) {
        out.push({ poemId: p.id, poemTitle: p.title });
      }
      for (const v of p.verses) {
        if (normalize(v.text).includes(nq)) {
          out.push({ poemId: p.id, poemTitle: p.title, verse: v.text, verseId: v.id });
        }
      }
    }
    return out.slice(0, 30);
  }, [q]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-velvet/80 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl glass rounded-2xl overflow-hidden shadow-2xl"
          >
            <div className="flex items-center gap-3 p-4 border-b border-gold/15">
              <Search className="w-5 h-5 text-gold" />
              <input
                autoFocus
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="ابحث في القصائد والأبيات..."
                className="flex-1 bg-transparent outline-none font-body text-foreground placeholder:text-muted-foreground"
              />
              <button onClick={onClose} className="text-muted-foreground hover:text-gold">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="max-h-[60vh] overflow-y-auto">
              {q && results.length === 0 && (
                <p className="p-8 text-center text-muted-foreground font-body">لا توجد نتائج</p>
              )}
              {results.map((r, i) => (
                <Link
                  key={i}
                  to="/poems/$id"
                  params={{ id: String(r.poemId) }}
                  onClick={onClose}
                  className="block px-5 py-3 hover:bg-gold/5 border-b border-gold/10 transition-colors"
                >
                  <div className="text-xs text-gold font-display mb-1">{r.poemTitle}</div>
                  {r.verse && (
                    <div className="font-quran text-sm text-foreground/90 leading-relaxed">
                      {r.verse}
                    </div>
                  )}
                </Link>
              ))}
              {!q && (
                <p className="p-8 text-center text-muted-foreground font-body text-sm">
                  اكتب كلمة للبحث في الديوان
                </p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
