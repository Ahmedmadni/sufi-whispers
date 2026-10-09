import { Link } from "@tanstack/react-router";
import { motion, useReducedMotion } from "framer-motion";
import { Clock, ChevronLeft } from "lucide-react";
import { TasbihIcon } from "@/components/TasbihIcon";
import { useEffect, useState } from "react";
import { currentWird, NAME_TARGET } from "@/data/dhikr";
import { useDhikr, formatNumber } from "@/lib/dhikr-store";

/** بطاقة «ورد هذه الساعة» في الصفحة الرئيسية. */
export function DhikrCard() {
  const reducedMotion = useReducedMotion();
  const { hydrated, active, activeProgress, state } = useDhikr();
  // Fixed initial date keeps SSR and first client render identical (no hydration mismatch)
  const [wird, setWird] = useState(() => currentWird(new Date(2000, 0, 1, 12)));

  useEffect(() => {
    setWird(currentWird());
    const id = setInterval(() => setWird(currentWird()), 60000);
    return () => clearInterval(id);
  }, []);

  const pct = Math.min(100, (activeProgress.count / NAME_TARGET) * 100);

  return (
    <section dir="rtl" className="mx-auto w-full max-w-5xl px-3 sm:px-6 py-4 sm:py-6">
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 14 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.5 }}
        className="glass rounded-2xl p-4 sm:p-6"
      >
        <div className="flex items-center justify-between gap-3">
          <span className="inline-flex items-center gap-2 text-gold-soft font-display text-base sm:text-lg">
            <TasbihIcon className="w-4 h-4 shrink-0" />
            ورد هذه الساعة
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground font-body shrink-0">
            <Clock className="w-3.5 h-3.5" />
            {wird.window}
          </span>
        </div>

        <p className="mt-3 font-display text-sm sm:text-base leading-9 text-foreground/90">
          {wird.phase === "asma" ? active.name : wird.text}
        </p>
        <p className="mt-1 text-[11px] sm:text-xs text-muted-foreground font-body">
          {wird.phase === "asma" ? `${active.meaning} — ${wird.hint}` : wird.hint}
        </p>

        {wird.phase === "asma" && hydrated && (
          <div className="mt-3">
            <div className="h-1.5 w-full rounded-full bg-foreground/10 overflow-hidden">
              <div className="h-full rounded-full bg-gold/70" style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-1.5 text-[11px] text-muted-foreground font-body">
              {formatNumber(activeProgress.count)} من {formatNumber(NAME_TARGET)} — الاسم{" "}
              {formatNumber(state.activeIndex + 1)} من ١٣
            </p>
          </div>
        )}

        <Link
          to="/dhikr"
          className="mt-4 inline-flex items-center gap-1.5 rounded-lg glass-gold px-4 py-2 text-sm font-body text-gold-soft hover:scale-105 transition-transform"
        >
          <span>افتح لوحة الذكر</span>
          <ChevronLeft className="w-4 h-4" />
        </Link>
      </motion.div>
    </section>
  );
}
