import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { BookOpen, Feather, ScrollText, ChevronDown } from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { Particles } from "@/components/Particles";
import { MosqueSilhouette, Ornament, IslamicPattern } from "@/components/Decorations";
import { bookMeta, poems } from "@/data/poems";
import { useEffect, useState } from "react";
import greenDome from "@/assets/green-dome.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "جامع النفحات في مدح سيد السادات ﷺ — الديوان الرقمي" },
      { name: "description", content: "تجربة قراءة سينمائية روحانية فاخرة لديوان صوفي في مدح سيد السادات ﷺ." },
      { property: "og:title", content: "جامع النفحات في مدح سيد السادات ﷺ" },
      { property: "og:description", content: "ديوان رقمي صوفي فاخر." },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const quotes = [
  "محمدٌ سيّدُ الكَونَين والثَّقَلَيْن",
  "يا نورَ كلِّ الكائناتِ بأسرِها",
  "بجاهك يا طه النبيِّ محمدِ",
  "سلامٌ عليك رسولَ الإلهْ",
];

function Home() {
  const [qi, setQi] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setQi((i) => (i + 1) % quotes.length), 4500);
    return () => clearInterval(id);
  }, []);

  const totalVerses = poems.reduce((s, p) => s + p.verses.length, 0);

  return (
    <div className="min-h-screen relative">
      <SiteHeader />

      {/* HERO */}
      <section className="relative min-h-[92vh] flex items-center justify-center overflow-hidden">
        {/* Green Dome backdrop — Al-Masjid An-Nabawi */}
        <div className="absolute inset-0">
          <img
            src={greenDome}
            alt="القبة الخضراء — المسجد النبوي الشريف"
            width={1920}
            height={1080}
            className="w-full h-full object-cover object-center opacity-55"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/55 via-background/70 to-background" />
        </div>
        {/* aura */}
        <div className="absolute inset-0 [background:radial-gradient(ellipse_60%_50%_at_50%_30%,oklch(0.42_0.08_160/0.45),transparent_70%)]" />
        {/* islamic pattern */}
        <IslamicPattern className="absolute inset-0 w-full h-full text-gold/30 opacity-30" />
        {/* particles */}
        <Particles count={30} />

        {/* crescent glow */}
        <motion.div
          className="absolute top-20 right-[15%] w-32 h-32 rounded-full"
          style={{ background: "radial-gradient(circle, var(--gold) 0%, transparent 70%)", opacity: 0.3 }}
          animate={{ scale: [1, 1.1, 1], opacity: [0.25, 0.4, 0.25] }}
          transition={{ duration: 6, repeat: Infinity }}
        />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2 }}
          >
            <Ornament className="w-48 mx-auto mb-6 text-gold" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, delay: 0.2 }}
            className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-[1.4] text-gradient-gold drop-shadow-[0_0_30px_oklch(0.78_0.12_80/0.4)]"
          >
            {bookMeta.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 1 }}
            className="mt-6 text-base sm:text-lg text-beige/80 font-body"
          >
            {bookMeta.subtitle}
          </motion.p>

          <div className="mt-10 h-12 flex items-center justify-center">
            <motion.p
              key={qi}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.8 }}
              className="font-quran text-lg sm:text-xl text-gold-soft italic"
            >
              ﴿ {quotes[qi]} ﴾
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2, duration: 0.8 }}
            className="mt-10 flex flex-wrap justify-center gap-4"
          >
            <Link
              to="/poems"
              className="group relative inline-flex items-center gap-3 px-8 py-4 rounded-full glass-gold text-gold-soft font-body text-base hover:scale-105 transition-all duration-500"
            >
              <span className="absolute inset-0 rounded-full animate-shimmer opacity-50" />
              <BookOpen className="w-5 h-5 relative z-10" />
              <span className="relative z-10">ابدأ القراءة</span>
            </Link>
            <Link
              to="/about"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-full border border-gold/30 text-foreground/90 font-body text-base hover:border-gold/60 hover:bg-gold/5 transition-all"
            >
              <ScrollText className="w-5 h-5" />
              عن الكتاب
            </Link>
          </motion.div>
        </div>

        {/* scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <ChevronDown className="w-6 h-6 text-gold/60" />
        </motion.div>
      </section>

      {/* STATS */}
      <section className="relative py-20 px-4">
        <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[
            { icon: BookOpen, label: "قصائد", value: poems.length },
            { icon: Feather, label: "أبيات شعرية", value: totalVerses },
            { icon: ScrollText, label: "صفحات في الأصل المطبوع", value: bookMeta.pages },
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.7 }}
              className="glass rounded-2xl p-8 text-center group hover:glow-gold transition-all duration-500"
            >
              <s.icon className="w-8 h-8 mx-auto text-gold mb-3 group-hover:scale-110 transition-transform" />
              <div className="font-display text-4xl text-gradient-gold">{s.value}</div>
              <div className="mt-2 text-sm text-muted-foreground font-body">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* FEATURED VERSES */}
      <section className="relative py-20 px-4">
        <div className="max-w-4xl mx-auto text-center mb-12">
          <Ornament className="w-40 mx-auto mb-4 text-gold/70" />
          <h2 className="font-display text-3xl sm:text-4xl text-gradient-gold">من نفحات الديوان</h2>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {poems.slice(0, 4).map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.6 }}
            >
              <Link
                to="/poems/$id"
                params={{ id: String(p.id) }}
                className="block glass rounded-2xl p-8 hover:glow-gold transition-all duration-500 group h-full"
              >
                <div className="text-xs text-gold/80 font-body mb-2">{p.category}</div>
                <h3 className="font-display text-2xl text-gold-soft mb-4 group-hover:text-gradient-gold transition-all">
                  {p.title}
                </h3>
                <p className="verse-line text-foreground/85 text-base">
                  {p.verses[0].text}
                </p>
                <div className="mt-4 text-xs text-muted-foreground font-body">
                  {p.verses.length} بيتًا · {p.meter ?? "—"}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            to="/poems"
            className="inline-flex items-center gap-2 text-gold-soft hover:text-gold font-body transition-colors"
          >
            تصفّح الديوان كاملًا
            <BookOpen className="w-4 h-4" />
          </Link>
        </div>
      </section>

      <footer className="relative py-10 px-4 border-t border-gold/10 mt-10">
        <div className="max-w-5xl mx-auto text-center">
          <Ornament className="w-32 mx-auto mb-4 text-gold/50" />
          <p className="text-xs text-muted-foreground font-body">
            {bookMeta.publisher} · جميع الحقوق محفوظة
          </p>
        </div>
      </footer>
    </div>
  );
}
