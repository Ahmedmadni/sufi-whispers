import { motion } from "framer-motion";
import { Link } from "@tanstack/react-router";
import { BookOpen, Star, Sparkles } from "lucide-react";

type Virtue = {
  suraNo: number;
  name: string;
  aya: string;
  virtue: string;
  source: string;
};

const VIRTUES: Virtue[] = [
  {
    suraNo: 1,
    name: "الفاتحة",
    aya: "ٱلْحَمْدُ لِلَّهِ رَبِّ ٱلْعَٰلَمِينَ",
    virtue: "أمُّ الكتاب والسبعُ المثاني، ما أُنزل في التوراة ولا في الإنجيل مثلُها، وهي شفاءٌ ورقية.",
    source: "صحيح البخاري",
  },
  {
    suraNo: 2,
    name: "البقرة",
    aya: "ذَٰلِكَ ٱلْكِتَٰبُ لَا رَيْبَ ۛ فِيهِ",
    virtue: "«اقرؤوا سورة البقرة؛ فإن أخذها بركة وتركها حسرة»، ولا تدخل الشياطين بيتاً تُقرأ فيه.",
    source: "صحيح مسلم",
  },
  {
    suraNo: 18,
    name: "الكهف",
    aya: "ٱلْحَمْدُ لِلَّهِ ٱلَّذِىٓ أَنزَلَ عَلَىٰ عَبْدِهِ ٱلْكِتَٰبَ",
    virtue: "من قرأها يوم الجمعة أضاء له من النور ما بين الجمعتين، ومن حفظ عشر آيات من أولها عُصم من الدجّال.",
    source: "صحيح مسلم والحاكم",
  },
  {
    suraNo: 36,
    name: "يس",
    aya: "يسٓ ۝ وَٱلْقُرْءَانِ ٱلْحَكِيمِ",
    virtue: "قلب القرآن، تُقرأ للتيسير وتفريج الكروب وطلب الرحمة.",
    source: "أثرٌ مشهور عند أهل الطريق",
  },
  {
    suraNo: 67,
    name: "الملك",
    aya: "تَبَٰرَكَ ٱلَّذِى بِيَدِهِ ٱلْمُلْكُ",
    virtue: "سورةٌ شفعت لصاحبها حتى غُفر له، تُقرأ كل ليلة قبل النوم.",
    source: "سنن الترمذي",
  },
  {
    suraNo: 112,
    name: "الإخلاص",
    aya: "قُلْ هُوَ ٱللَّهُ أَحَدٌ",
    virtue: "تعدل ثلثَ القرآن، ومن أحبّها أدخله الله الجنّة.",
    source: "صحيح البخاري",
  },
];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 26, filter: "blur(6px)" },
  show: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: { duration: 0.65, ease: [0.22, 1, 0.36, 1] as const },
  },
};

export function SurahVirtues() {
  return (
    <section
      dir="rtl"
      className="relative mx-auto w-full max-w-5xl px-3 sm:px-6 py-10 sm:py-16"
    >
      <div className="text-center mb-8">
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-center gap-2 mb-2 text-gold-soft"
        >
          <Star className="w-4 h-4" />
          <span className="text-xs sm:text-sm font-body tracking-widest">
            من نور التنزيل
          </span>
        </motion.div>
        <h2 className="font-display text-2xl sm:text-3xl text-gradient-gold">
          فضائل السُّور
        </h2>
        <div className="mt-3 mx-auto ornament-divider w-2/3 max-w-sm" />
      </div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5"
      >
        {VIRTUES.map((v) => (
          <motion.article
            key={v.suraNo}
            variants={item}
            whileHover={{ y: -6, transition: { duration: 0.3 } }}
            className="group relative glass rounded-2xl p-4 sm:p-5 overflow-hidden"
          >
            <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-gold/10 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

            <div className="relative flex items-center justify-between gap-2 mb-2.5">
              <h3 className="font-display text-gold-soft text-base sm:text-lg leading-tight">
                سورة {v.name}
              </h3>
              <span className="shrink-0 grid place-items-center w-7 h-7 rounded-full glass-gold text-[11px] text-gold-soft font-body tabular-nums">
                {v.suraNo}
              </span>
            </div>

            <p className="relative font-quran text-sm sm:text-base text-foreground/90 leading-[2] text-center py-2 border-y border-gold/15">
              {v.aya}
            </p>

            <p className="relative mt-3 text-xs sm:text-sm font-body text-foreground/85 leading-relaxed">
              {v.virtue}
            </p>

            <div className="relative mt-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] text-muted-foreground font-body">
                <Sparkles className="w-3 h-3" />
                {v.source}
              </span>
              <Link
                to="/quran/surah/$suraNo"
                params={{ suraNo: String(v.suraNo) }}
                className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-2.5 py-1 text-[11px] sm:text-xs font-body text-gold-soft hover:border-gold/60 hover:bg-gold/10 transition-colors"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>اقرأ السورة</span>
              </Link>
            </div>
          </motion.article>
        ))}
      </motion.div>

      <div className="mt-8 flex justify-center">
        <Link
          to="/quran"
          className="inline-flex items-center gap-2 rounded-lg glass-gold px-5 py-2.5 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
        >
          <BookOpen className="w-4 h-4" />
          <span>افتح المصحف الشريف</span>
        </Link>
      </div>
    </section>
  );
}
