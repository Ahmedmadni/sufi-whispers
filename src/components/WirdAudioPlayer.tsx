import { useEffect, useRef, useState } from "react";
import { Headphones, Pause, Play, RotateCcw, RotateCw, Volume2 } from "lucide-react";
import {
  WIRD_AUDIO_TRACKS, requestedWirdListening, safeWirdAudioPosition,
  wirdAudioPositionKey, wirdPartForPage, type WirdPart,
} from "@/lib/wird-audio";

function clock(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return Math.floor(safe / 60) + ":" + String(safe % 60).padStart(2, "0");
}

/** Shared reader feature: one HTMLAudioElement plays only one hizb at a time.
 * Never autoplay on navigation, from a notification, or after a restore.
 * HTMLAudio is compatible with web, Capacitor WebView and Electron.
 */
export function WirdAudioPlayer({ page, onJump }: { page: number; onJump?: (page: number) => void }) {
  const inferred = wirdPartForPage(page);
  const [part, setPart] = useState<WirdPart>(inferred);
  const [expanded, setExpanded] = useState(() =>
    typeof window !== "undefined" && requestedWirdListening(window.location));
  const [playing, setPlaying] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [error, setError] = useState("");
  const audio = useRef<HTMLAudioElement>(null);
  const lastSaved = useRef(-1);
  const manuallySelected = useRef(false);
  const track = WIRD_AUDIO_TRACKS[part];
  const durationDisplay = duration || track.durationSeconds;

  // Only an explicit chapter landing may select another track. Continuous scrolling
  // across page 22 must not interrupt a recording already in progress.
  useEffect(() => {
    if (!manuallySelected.current && (page === 4 || page === 22) && audio.current?.paused !== false) {
      setPart(wirdPartForPage(page));
    }
  }, [page]);

  // Capture the audio element belonging to *this* selected track. An effect
  // with [] would keep the FIRST element forever: switching to the second
  // recording would leave that new element playing after reader unmount.
  useEffect(() => {
    const player = audio.current;
    if (!player) return;
    player.pause();
    setPlaying(false);
    setElapsed(0);
    setDuration(0);
    setSpeed(1);
    setError("");
    lastSaved.current = -1;
    return () => {
      const position = player.ended ? 0 : player.currentTime;
      player.pause();
      if (Number.isFinite(position) && position >= 0) {
        try {
          localStorage.setItem(wirdAudioPositionKey(part), String(Math.round(position * 1000) / 1000));
        } catch { /* Retain playback safety if storage is disabled. */ }
      }
    };
  }, [part]);

  function savePosition(value: number, force = false) {
    if (!Number.isFinite(value) || value < 0) return;
    if (!force && Math.abs(value - lastSaved.current) < 5) return;
    try {
      localStorage.setItem(wirdAudioPositionKey(part), String(Math.round(value * 1000) / 1000));
      lastSaved.current = value;
    } catch { /* Playback still works if device storage is unavailable. */ }
  }

  async function togglePlay() {
    const player = audio.current;
    if (!player) return;
    setError("");
    if (!player.paused) {
      player.pause();
      savePosition(player.currentTime, true);
      return;
    }
    try {
      await player.play();
    } catch {
      setPlaying(false);
      setError("تعذّر تشغيل التسجيل. تحقق من توفر ملف الصوت على الجهاز وأعد المحاولة.");
    }
  }

  function choose(next: WirdPart) {
    setExpanded(true);
    manuallySelected.current = true;
    // Keep the printed book aligned with the selected recording.
    onJump?.(WIRD_AUDIO_TRACKS[next].page);
    if (next === part) return;
    const previous = audio.current;
    if (previous) {
      savePosition(previous.ended ? 0 : previous.currentTime, true);
      previous.pause();
    }
    setPart(next);
  }

  function seek(value: number) {
    const player = audio.current;
    if (!player || !Number.isFinite(player.duration)) return;
    const to = Math.min(Math.max(value, 0), player.duration);
    player.currentTime = to;
    setElapsed(to);
    savePosition(to, true);
  }

  return (
    <section dir="rtl" aria-label="الاستماع إلى ورد الاستغفار"
      className="wird-audio-player reader-toolbar mb-2 rounded-2xl border border-gold/25 bg-background/90 p-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 text-sm font-semibold text-foreground">
          <Headphones size={18} aria-hidden="true" /> الاستماع إلى ورد الاستغفار
        </span>
        <div className="flex flex-wrap gap-2">
          {(["first", "second"] as const).map((id) => (
            <button key={id} type="button" onClick={() => choose(id)}
              aria-pressed={expanded && part === id}
              aria-label={"عرض تسجيل " + WIRD_AUDIO_TRACKS[id].label}
              className={"inline-flex min-h-11 items-center gap-1.5 rounded-lg border px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary " +
                (part === id && expanded ? "border-gold/60 bg-primary text-primary-foreground" : "border-border bg-background text-foreground")}>
              <Headphones size={15} aria-hidden="true" /> {WIRD_AUDIO_TRACKS[id].label}
            </button>
          ))}
          <button type="button" aria-expanded={expanded} onClick={() => setExpanded(v => !v)}
            className="min-h-11 rounded-lg border border-border px-3 text-xs text-foreground">
            {expanded ? "إخفاء المشغّل" : "عرض المشغّل"}
          </button>
        </div>
      </div>
      <audio key={track.src} ref={audio} src={track.src} preload="metadata"
        onLoadedMetadata={event => {
          const player = event.currentTarget;
          const total = Number.isFinite(player.duration) ? player.duration : 0;
          setDuration(total);
          try {
            const saved = safeWirdAudioPosition(localStorage.getItem(wirdAudioPositionKey(part)));
            if (saved > 0 && saved < total - 2) { player.currentTime = saved; setElapsed(saved); }
          } catch { /* Ignore unavailable local storage. */ }
        }}
        onTimeUpdate={event => {
          const value = event.currentTarget.currentTime;
          setElapsed(value);
          savePosition(value);
        }}
        onPlay={() => setPlaying(true)}
        onPause={event => {
          setPlaying(false);
          savePosition(event.currentTarget.ended ? 0 : event.currentTarget.currentTime, true);
        }}
        onEnded={event => {
          setPlaying(false);
          savePosition(0, true);
          event.currentTarget.currentTime = 0;
          setElapsed(0);
        }}
        onError={() => {
          setPlaying(false);
          setError("ملف التسجيل غير متاح. يرجى التأكد من تضمين التسجيلين في نسخة التطبيق.");
        }}
      />
      {expanded && (
        <div className="mt-3 space-y-3 border-t border-border pt-3">
          <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
            <span>تسجيل {track.label} — صفحة {track.page}</span>
            <span dir="ltr" className="tabular-nums">{clock(elapsed)} / {clock(durationDisplay)}</span>
          </div>
          <input type="range" min={0} max={Math.max(1, durationDisplay)} step={1}
            value={Math.min(elapsed, Math.max(1, durationDisplay))} disabled={!duration}
            aria-label={"موضع تشغيل " + track.label}
            onChange={event => seek(Number(event.currentTarget.value))}
            className="w-full accent-primary" dir="ltr" />
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button type="button" onClick={() => seek((audio.current?.currentTime || 0) - 15)}
              disabled={!duration} aria-label="رجوع 15 ثانية"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-border text-foreground disabled:opacity-40">
              <RotateCcw size={18} aria-hidden="true" /><span className="text-xs">15</span>
            </button>
            <button type="button" onClick={() => void togglePlay()}
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل " + track.label}
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-xl bg-primary px-5 font-medium text-primary-foreground">
              {playing ? <Pause size={19} aria-hidden="true"/> : <Play size={19} aria-hidden="true"/>}
              {playing ? "إيقاف مؤقت" : "تشغيل"}
            </button>
            <button type="button" onClick={() => seek((audio.current?.currentTime || 0) + 15)}
              disabled={!duration} aria-label="تقديم 15 ثانية"
              className="inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg border border-border text-foreground disabled:opacity-40">
              <RotateCw size={18} aria-hidden="true"/><span className="text-xs">15</span>
            </button>
            <button type="button" aria-label="سرعة التشغيل" title="تغيير سرعة التشغيل"
              onClick={() => {
                const next = speed === 1 ? 1.25 : speed === 1.25 ? .75 : 1;
                if (audio.current) audio.current.playbackRate = next;
                setSpeed(next);
              }} className="min-h-11 rounded-lg border border-border px-3 text-sm text-foreground">
              <Volume2 size={15} aria-hidden="true" className="inline-block ml-1"/>{speed}×
            </button>
          </div>
          {error && <p role="alert" className="text-center text-xs text-destructive">{error}</p>}
          <p className="text-center text-xs text-muted-foreground">
            يُحفظ موضع الاستماع على جهازك. التشغيل يبدأ باختيارك ولا يبدأ تلقائيًا من الإشعارات.
          </p>
        </div>
      )}
    </section>
  );
}
