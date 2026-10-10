import { useEffect, useRef, useState, type CSSProperties } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Play,
  Pause,
  RotateCcw,
  Timer,
  Gauge,
  Flame,
  Check,
  Clock,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  DHIKR_NAMES,
  NAME_TARGET,
  currentWird,
  WIRD_SALAWAT,
  WIRD_ISTIGHFAR,
  WIRD_ASMA,
} from "@/data/dhikr";
import { useDhikr, formatDuration, formatNumber, MILESTONES } from "@/lib/dhikr-store";
import { TasbihIcon } from "@/components/TasbihIcon";
import { DHIKR_SOUND_PREF, playDhikrTap } from "@/lib/dhikr-sound";

const TITLE = "لوحة الذكر — الجمعية الخليلية الإسلامية";
const DESCRIPTION =
  "لوحة متابعة أوراد الطريق الخليلي: الصلاة على النبي ﷺ من الفجر إلى العصر، والاستغفار من العصر إلى المغرب، والذكر بأسماء الله الحسنى مائة ألف مرة لكل اسم مع عدّاد ومؤشرات أداء.";

export const Route = createFileRoute("/dhikr")({
  head: () => ({
    meta: [
      { title: TITLE },
      { name: "description", content: DESCRIPTION },
      { property: "og:title", content: TITLE },
      { property: "og:description", content: DESCRIPTION },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: TITLE },
      { name: "twitter:description", content: DESCRIPTION },
    ],
  }),
  component: DhikrPage,
});

function DhikrPage() {
  const d = useDhikr();
  const [wird, setWird] = useState(() => currentWird());
  const [manual, setManual] = useState("");
  const [soundOn, setSoundOn] = useState(true);
  useEffect(() => {
    try { setSoundOn(localStorage.getItem(DHIKR_SOUND_PREF) !== "off"); } catch { /* optional */ }
  }, []);
  const changeSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    try { localStorage.setItem(DHIKR_SOUND_PREF, next ? "on" : "off"); } catch { /* optional */ }
    if (next) playDhikrTap();
  };
  const lastMilestone = useRef(0);

  useEffect(() => {
    const id = setInterval(() => setWird(currentWird()), 60000);
    return () => clearInterval(id);
  }, []);

  const pct = d.activeProgress.count / NAME_TARGET;

  useEffect(() => {
    if (!d.hydrated) return;
    const reached = MILESTONES.filter((m) => pct >= m).pop() ?? 0;
    if (reached > lastMilestone.current) {
      lastMilestone.current = reached;
      if (reached < 1) {
        toast("بارك الله فيك", {
          description: `بلغتَ ${Math.round(reached * 100)}٪ من ذكر اسم «${d.active.name}» — واصِل على بركة الله.`,
        });
      }
    }
  }, [pct, d.hydrated, d.active.name]);

  function bump(n: number) {
    if (wird.phase === "asma") {
      const before = d.activeProgress.count;
      d.addToName(n);
      if (before + n >= NAME_TARGET) {
        lastMilestone.current = 0;
        toast("تمّ إتمام الاسم", {
          description: `أتممتَ ذكر «${d.active.name}» مائة ألف مرة. انتقل إلى الاسم التالي.`,
          duration: 9000,
        });
      }
    } else {
      d.addDaily(wird.phase === "salawat" ? "salawat" : "istighfar", n);
    }
    if (soundOn) playDhikrTap();
    if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(12);
  }

  const dailyCount = wird.phase === "salawat" ? d.state.daily.salawat : d.state.daily.istighfar;

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />

      <main className="mx-auto w-full max-w-3xl px-3 sm:px-6 py-5 sm:py-8 space-y-5">
        <header className="text-center">
          <span className="inline-flex items-center gap-2 rounded-full glass-gold px-4 py-1.5 text-[11px] font-body text-gold-soft">
            <TasbihIcon className="w-3.5 h-3.5" />
            أوراد الطريق الخليلي
          </span>
          <h1 className="mt-3 font-display text-2xl sm:text-3xl text-gradient-gold leading-[1.6]">
            لوحة الذكر
          </h1>
          <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground font-body leading-7">
            تابع وردك، واحفظ عدّك ومدّتك، وسِر على بركة الله من اسمٍ إلى اسم.
          </p>
        </header>

        {/* ورد الوقت الحالي */}
        <section className="glass dhikr-stage rounded-2xl p-4 sm:p-6 text-center">
          <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground font-body">
            <Clock className="w-3.5 h-3.5" />
            <span>{wird.window}</span>
          </div>
          <h2 className="mt-1.5 font-display text-gold-soft text-lg sm:text-xl leading-[1.6]">
            {wird.label}
          </h2>

          <p className="mt-3 font-display text-sm sm:text-base leading-9 text-foreground/90">
            {wird.phase === "asma" ? d.active.name : wird.text}
          </p>
          {wird.phase === "asma" && (
            <p className="mt-1 text-xs text-muted-foreground font-body">{d.active.meaning}</p>
          )}

          <button type="button" onClick={changeSound} aria-pressed={soundOn}
            className="mt-3 inline-flex min-h-10 items-center gap-2 rounded-full border border-gold/30 px-3 py-1.5 text-xs font-body text-gold-soft">
            {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundOn ? "صوت اللمس: يعمل" : "صوت اللمس: مغلق"}
          </button>

          {/* العدّاد */}
          <div
            className="dhikr-dial mt-6"
            style={{
              "--dhikr-progress": `${wird.phase === "asma" ? Math.min(100, Math.max(0, pct * 100)) : 0}%`,
            } as CSSProperties}
          >
            <button
              type="button"
              onClick={() => bump(1)}
              className="dhikr-dial__button"
              aria-label="زيادة العدّ مرة واحدة"
            >
              <TasbihIcon className="h-6 w-6 opacity-80" />
              <span className="dhikr-dial__number font-display text-2xl sm:text-3xl">
                {formatNumber(wird.phase === "asma" ? d.activeProgress.count : dailyCount)}
              </span>
              <span className="dhikr-dial__hint">اضغط للتسبيح</span>
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            {[10, 33, 100, 1000].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => bump(n)}
                className="rounded-lg border border-gold/25 px-3 py-1.5 text-xs font-body text-foreground/85 hover:text-gold-soft hover:border-gold/60 transition-colors"
              >
                +{formatNumber(n)}
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const v = parseInt(manual, 10);
                if (Number.isFinite(v) && v > 0) bump(v);
                setManual("");
              }}
              className="flex items-center gap-1"
            >
              <input
                value={manual}
                onChange={(e) => setManual(e.target.value)}
                inputMode="numeric"
                placeholder="عدد"
                className="w-20 rounded-lg border border-gold/25 bg-transparent px-2 py-1.5 text-xs font-body text-foreground/90 placeholder:text-muted-foreground focus:outline-none focus:border-gold/60"
              />
              <button
                type="submit"
                className="rounded-lg glass-gold px-3 py-1.5 text-xs font-body text-gold-soft"
              >
                إضافة
              </button>
            </form>
          </div>

          {/* المؤقّت */}
          <div className="mt-5 flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={d.running ? d.stopSession : d.startSession}
              className="inline-flex items-center gap-1.5 rounded-lg glass-gold px-4 py-2 text-sm font-body text-gold-soft"
            >
              {d.running ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {d.running ? "إيقاف الجلسة" : "بدء الجلسة"}
            </button>
            <span className="inline-flex items-center gap-1.5 text-sm font-body text-foreground/80 tabular-nums">
              <Timer className="w-4 h-4 text-gold-soft" />
              {formatDuration(d.sessionMs)}
            </span>
          </div>
        </section>

        {/* التقدّم في الاسم الحالي */}
        <section className="glass rounded-2xl p-4 sm:p-6">
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-display text-gold-soft text-base sm:text-lg">
                تقدّمك في اسم «{d.active.name}»
              </h3>
              <span className="text-[11px] text-muted-foreground font-body shrink-0">
                {formatNumber(d.activeProgress.count)} / {formatNumber(NAME_TARGET)}
              </span>
            </div>
            <div className="mt-3 h-2 w-full rounded-full bg-foreground/10 overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-gold/75"
                animate={{ width: `${Math.min(100, pct * 100)}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-center">
              <Stat icon={Gauge} label="معدّل الذكر" value={`${formatNumber(d.stats.rate)}/د`} />
              <Stat icon={Timer} label="مدّة هذا الاسم" value={formatDuration(d.activeProgress.elapsedMs + d.sessionMs)} />
              <Stat
                icon={Clock}
                label="المتبقّي زمنًا"
                value={d.stats.etaMinutes ? `${formatNumber(d.stats.etaMinutes)} د` : "—"}
              />
              <Stat icon={Flame} label="أيام متتابعة" value={formatNumber(d.state.streak)} />
            </div>

            <p className="mt-3 text-[11px] text-muted-foreground font-body leading-6">
              المتبقّي لإتمام الاسم: {formatNumber(d.stats.remaining)} مرة — إجمالي ما ذكرتَه في كل
              الأسماء: {formatNumber(d.stats.totalCount)} مرة خلال {formatDuration(d.stats.totalElapsed)}.
            </p>
        </section>

        {/* الأسماء الثلاثة عشر */}
        <section className="glass rounded-2xl p-4 sm:p-6">
          <h3 className="font-display text-gold-soft text-base sm:text-lg">الأسماء الثلاثة عشر</h3>
          <p className="mt-1 text-[11px] text-muted-foreground font-body leading-6">
            {WIRD_ASMA.text}
          </p>
          <ul className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DHIKR_NAMES.map((n, i) => {
              const p = d.state.names[n.id];
              const done = (p?.count ?? 0) >= NAME_TARGET;
              const isActive = i === d.state.activeIndex;
              return (
                <li key={n.id}>
                  <button
                    type="button"
                    onClick={() => d.setActiveIndex(i)}
                    className={`w-full rounded-xl border p-2.5 text-right transition-colors ${
                      isActive ? "border-gold/60 bg-gold/10" : "border-gold/15 hover:border-gold/40"
                    }`}
                  >
                    <span className="flex items-center justify-between gap-1">
                      <span className="font-display text-sm text-gold-soft truncate">{n.name}</span>
                      {done && <Check className="w-3.5 h-3.5 text-gold shrink-0" />}
                    </span>
                    <span className="mt-1 block text-[10px] text-muted-foreground font-body truncate">
                      {n.meaning}
                    </span>
                    <span className="mt-1.5 block h-1 w-full rounded-full bg-foreground/10 overflow-hidden">
                      <span
                        className="block h-full rounded-full bg-gold/70"
                        style={{ width: `${Math.min(100, ((p?.count ?? 0) / NAME_TARGET) * 100)}%` }}
                      />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {/* جدول الأوراد */}
        <section className="glass rounded-2xl p-4 sm:p-6">
          <h3 className="font-display text-gold-soft text-base sm:text-lg">جدول الأوراد اليومي</h3>
          <ul className="mt-3 space-y-3">
            {[WIRD_SALAWAT, WIRD_ISTIGHFAR, WIRD_ASMA].map((w) => (
              <li
                key={w.phase}
                className={`rounded-xl border p-3 ${
                  w.phase === wird.phase ? "border-gold/50 bg-gold/5" : "border-gold/15"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-display text-sm text-gold-soft">{w.label}</span>
                  <span className="text-[10px] text-muted-foreground font-body shrink-0">
                    {w.window}
                  </span>
                </div>
                <p className="mt-1.5 text-xs font-body leading-7 text-foreground/85">{w.text}</p>
                <p className="mt-1 text-[10px] text-muted-foreground font-body">{w.hint}</p>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex items-center justify-between gap-2 text-[11px] font-body text-muted-foreground">
            <span>
              اليوم: صلاة {formatNumber(d.state.daily.salawat)} — استغفار{" "}
              {formatNumber(d.state.daily.istighfar)}
            </span>
            <button
              type="button"
              onClick={() => {
                d.reset();
                lastMilestone.current = 0;
                toast("تمت إعادة الضبط");
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-gold/25 px-2.5 py-1.5 hover:text-gold-soft transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              إعادة الضبط
            </button>
          </div>
        </section>

      </main>

      <SiteFooter />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-gold/15 p-2.5">
      <Icon className="mx-auto w-4 h-4 text-gold-soft" />
      <p className="mt-1 font-display text-sm text-foreground/90 tabular-nums">{value}</p>
      <p className="text-[10px] text-muted-foreground font-body">{label}</p>
    </div>
  );
}
