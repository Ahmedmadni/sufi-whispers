import { useEffect, useRef, useState } from "react";
import { ChevronDown, ChevronUp, Headphones, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
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
      className="wird-audio-player wird-audio-player--compact font-body">
      <div className="wird-audio-player__header">
        <span className="wird-audio-player__heading">
          <Headphones size={17} strokeWidth={2.1} aria-hidden="true" />
          <span>ورد الاستغفار</span>
        </span>
        <div className="wird-audio-player__chapters" role="group" aria-label="اختيار الحزب">
          {(["first", "second"] as const).map(id => (
            <button key={id} type="button" onClick={() => choose(id)}
              aria-pressed={part === id}
              aria-label={"اختيار " + WIRD_AUDIO_TRACKS[id].label}
              title={WIRD_AUDIO_TRACKS[id].label}
              className="wird-audio-player__chapter">
              {id === "first" ? "١" : "٢"}
            </button>
          ))}
        </div>
        {!expanded && (
          <button type="button" aria-expanded={false} onClick={() => setExpanded(true)}
            aria-label="إظهار أدوات الاستماع" title="إظهار المشغل"
            className="wird-audio-player__icon-button wird-audio-player__expand">
            <ChevronDown size={21} aria-hidden="true" />
          </button>
        )}
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
        <div className="wird-audio-player__body">
          <div className="wird-audio-player__timeline">
            <span>ص {track.page}</span>
            <span dir="ltr" className="wird-audio-player__clock">{clock(elapsed)} / {clock(durationDisplay)}</span>
          </div>
          <input type="range" min={0} max={Math.max(1, durationDisplay)} step={1}
            value={Math.min(elapsed, Math.max(1, durationDisplay))} disabled={!duration}
            aria-label={"موضع تشغيل " + track.label}
            onChange={event => seek(Number(event.currentTarget.value))}
            className="wird-audio-player__progress" dir="ltr" />
          <div className="wird-audio-player__controls" role="group" aria-label="التحكم في التسجيل">
            <button type="button" aria-label="سرعة التشغيل" title="تغيير سرعة التشغيل"
              onClick={() => {
                const next = speed === 1 ? 1.25 : speed === 1.25 ? .75 : 1;
                if (audio.current) audio.current.playbackRate = next;
                setSpeed(next);
              }} className="wird-audio-player__icon-button wird-audio-player__speed">
              <span dir="ltr">{speed}×</span>
            </button>
            <button type="button" onClick={() => seek((audio.current?.currentTime || 0) - 15)}
              disabled={!duration} aria-label="رجوع 15 ثانية" title="رجوع 15 ثانية"
              className="wird-audio-player__icon-button wird-audio-player__skip">
              <RotateCcw size={23} aria-hidden="true" />
              <span className="wird-audio-player__skip-number" aria-hidden="true">15</span>
            </button>
            <button type="button" onClick={() => void togglePlay()}
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل " + track.label}
              title={playing ? "إيقاف مؤقت" : "تشغيل"}
              className="wird-audio-player__icon-button wird-audio-player__play">
              {playing ? <Pause size={27} fill="currentColor" aria-hidden="true" />
                : <Play size={27} fill="currentColor" aria-hidden="true" />}
            </button>
            <button type="button" onClick={() => seek((audio.current?.currentTime || 0) + 15)}
              disabled={!duration} aria-label="تقديم 15 ثانية" title="تقديم 15 ثانية"
              className="wird-audio-player__icon-button wird-audio-player__skip">
              <RotateCw size={23} aria-hidden="true" />
              <span className="wird-audio-player__skip-number" aria-hidden="true">15</span>
            </button>
            <button type="button" aria-expanded={true} onClick={() => setExpanded(false)}
              aria-label="تصغير مشغل الورد" title="تصغير المشغل"
              className="wird-audio-player__icon-button wird-audio-player__collapse">
              <ChevronUp size={23} aria-hidden="true" />
            </button>
          </div>
          {error && <p role="alert" className="wird-audio-player__error">{error}</p>}
        </div>
      )}
    </section>
  );
}
