import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Heart, Search as SearchIcon, BookOpen } from "lucide-react";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { Ornament } from "@/components/Decorations";
import { categories, poems } from "@/data/poems";
import { useFavorites } from "@/hooks/use-favorites";

export const Route = createFileRoute("/poems/")({
  head: () => ({
    meta: [
      { title: "فهرس القصائد — جامع النفحات" },
      { name: "description", content: "تصفّح قصائد ديوان جامع النفحات في مدح سيد السادات ﷺ." },
      { property: "og:title", content: "فهرس القصائد — جامع النفحات" },
      { property: "og:description", content: "ديوان كامل من المدائح النبوية الصوفية." },
    ],
    links: [{ rel: "canonical", href: "/poems" }],
  }),
  component: PoemsIndex,
});

function PoemsIndex() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string | null>(null);
  const { isFav, toggle } = useFavorites();

  const filtered = useMemo(() => {
    return poems.filter((p) => {
      if (cat && p.category !== cat) return false;
      if (q && !p.title.includes(q) && !p.category.includes(q)) return false;
      return true;
    });
  }, [q, cat]);

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <section className="relative pt-16 pb-10 px-4 text-center">
        <Ornament className="w-40 mx-auto mb-4 text-gold/70" />
        <h1 className="font-display text-4xl sm:text-5xl text-gradient-gold">فهرس الديوان</h1>
        <p className="mt-3 text-muted-foreground font-body">اختر قصيدة لتبدأ القراءة</p>
      </section>

      <div className="max-w-5xl mx-auto px-4 mb-8 space-y-4">
        <div className="glass rounded-2xl p-3 flex items-center gap-3">
          <SearchIcon className="w-5 h-5 text-gold ms-2" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم القصيدة أو التصنيف..."
            className="flex-1 bg-transparent outline-none font-body placeholder:text-muted-foreground"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setCat(null)}
            className={`px-4 py-2 rounded-full text-sm font-body transition-all ${
              !cat ? "glass-gold text-gold-soft" : "border border-gold/20 text-muted-foreground hover:text-gold-soft"
            }`}
          >
            الكل
          </button>
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-full text-sm font-body transition-all ${
                cat === c
                  ? "glass-gold text-gold-soft"
                  : "border border-gold/20 text-muted-foreground hover:text-gold-soft"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-5xl mx-auto px-4 pb-20 grid grid-cols-1 md:grid-cols-2 gap-5">
        {filtered.map((p, i) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05, duration: 0.5 }}
            className="relative glass rounded-2xl p-6 hover:glow-gold transition-all duration-500 group"
          >
            <button
              onClick={() => toggle(p.id)}
              className="absolute top-4 left-4 p-2 rounded-full hover:bg-gold/10 transition-colors"
              aria-label="إضافة للمفضلة"
            >
              <Heart
                className={`w-5 h-5 transition-all ${
                  isFav(p.id) ? "fill-gold text-gold" : "text-muted-foreground"
                }`}
              />
            </button>
            <Link to="/poems/$id" params={{ id: String(p.id) }} className="block pe-10">
              <div className="text-xs text-gold/80 font-body mb-2">{p.category}</div>
              <h3 className="font-display text-2xl text-gold-soft group-hover:text-gradient-gold transition-all">
                {p.title}
              </h3>
              {p.intro && (
                <p className="mt-3 text-sm text-muted-foreground font-body line-clamp-2">{p.intro}</p>
              )}
              <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground font-body">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {p.verses.length} بيتًا</span>
                {p.meter && <span>· {p.meter}</span>}
              </div>
            </Link>
          </motion.div>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-full text-center py-20 text-muted-foreground font-body">
            لا توجد قصائد مطابقة
          </div>
        )}
      </section>
    </div>
  );
}
