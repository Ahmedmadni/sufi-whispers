import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const player = readFileSync("src/components/WirdAudioPlayer.tsx", "utf8");
const identity = readFileSync("src/rihab-identity.css", "utf8");

describe("Compact Wird audio player redesign", () => {
  test("the original recording and bookmarks survive the visual refactor", () => {
    expect(player).toContain('<audio key={track.src} ref={audio} src={track.src} preload="metadata"');
    expect(player).toContain("onJump?.(WIRD_AUDIO_TRACKS[next].page)");
    expect(player).toContain("player.pause()");
    expect(player).toContain("previous.pause()");
    expect(player).toContain("wirdAudioPositionKey(part)");
    expect(player).toContain("safeWirdAudioPosition(");
    expect(player).toContain("savePosition(to, true)");
    expect(player).toContain("event.currentTarget.ended ? 0");
    expect(player).not.toContain("autoPlay");
  });

  test("controls are available immediately and never autoplay", () => {
    expect(player).toContain("const [expanded, setExpanded] = useState(true)");
    expect(player).toContain("async function togglePlay()");
    expect(player).toContain("await player.play()");
    expect(player).toContain("onClick={() => void togglePlay()}");
    expect(player).toContain('aria-label="تصغير مشغل الورد"');
    expect(player).toContain('aria-label="إظهار أدوات الاستماع"');
  });

  test("compact chapter selectors and bottom-row icons replace large labels", () => {
    expect(player).toContain('aria-label="اختيار الحزب"');
    expect(player).toContain('aria-label={"اختيار " + WIRD_AUDIO_TRACKS[id].label}');
    expect(player).toContain('id === "first" ? "١" : "٢"');
    expect(player).toContain('className="wird-audio-player__progress"');
    expect(player).toContain('className="wird-audio-player__controls"');
    expect(player).toContain('aria-label="رجوع 15 ثانية"');
    expect(player).toContain('aria-label="تقديم 15 ثانية"');
    expect(player).toContain('aria-label="سرعة التشغيل"');
    expect(player).toContain('<ChevronUp size={23}');
    expect(player).not.toContain("يُحفظ موضع الاستماع على جهازك.");
    expect(player).not.toContain("إخفاء المشغّل</button>");
    expect(player).not.toContain('className="mt-3 space-y-3 border-t border-border pt-3"');
  });

  test("the player and its buttons are transparent, with accessible touch targets", () => {
    expect(identity).toContain(".wird-audio-player.wird-audio-player--compact {");
    expect(identity).toContain(".wird-audio-player__controls {");
    expect(identity).toContain(".wird-audio-player__icon-button {");
    expect(identity).toContain("min-width: 44px;");
    expect(identity).toContain("min-height: 44px;");
    expect(identity).toContain("background: transparent;");
    expect(identity).toContain("border: 0;");
    expect(identity).toContain(".wird-audio-player__icon-button:focus-visible");
    expect(identity).toContain(".wird-audio-player__progress::-webkit-slider-runnable-track");
    expect(identity).not.toContain(".mushaf-sheet");
    expect(identity).not.toContain(".mushaf-text");
  });

  test("preserves the audio element across collapse and renders errors as alerts", () => {
    expect(player.indexOf("<audio key={track.src}")).toBeLessThan(player.indexOf("{expanded && ("));
    expect(player).toContain('role="alert" className="wird-audio-player__error"');
    expect(player).toContain("setError(");
    expect(player).toContain("setExpanded(false)");
  });
});
