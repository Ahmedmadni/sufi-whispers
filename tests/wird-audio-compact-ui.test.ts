import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";

const player = readFileSync("src/components/WirdAudioPlayer.tsx", "utf8");
const identity = readFileSync("src/rihab-identity.css", "utf8");

describe("Ultra-compact Wird audio player", () => {
  test("original playback, saved positions and pause-on-unmount survive", () => {
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

  test("player remains visible but only plays from a deliberate gesture", () => {
    expect(player).toContain("async function togglePlay()");
    expect(player).toContain("await player.play()");
    expect(player).toContain("onClick={() => void togglePlay()}");
    expect(player).not.toContain("setExpanded(");
    expect(player).not.toContain("ChevronUp");
    expect(player).not.toContain("ChevronDown");
  });

  test("play is exactly between the first and second hizbs", () => {
    const first = player.indexOf('onClick={() => choose("first")}');
    const play = player.indexOf('onClick={() => void togglePlay()}');
    const second = player.indexOf('onClick={() => choose("second")}');
    expect(first).toBeGreaterThan(0);
    expect(first).toBeLessThan(play);
    expect(play).toBeLessThan(second);
    expect(player).toContain('aria-pressed={part === "first"}');
    expect(player).toContain('aria-pressed={part === "second"}');
    expect(player).toContain('className="wird-audio-player__minimal-controls"');
    expect(player).toContain('className="wird-audio-player__play"');
    expect(player).toContain("الحزب ١");
    expect(player).toContain("الحزب ٢");
  });

  test("progress and speed occupy only one second row", () => {
    expect(player).toContain('className="wird-audio-player__mini-bottom"');
    expect(player).toContain('className="wird-audio-player__clock"');
    expect(player).toContain('className="wird-audio-player__progress"');
    expect(player).toContain('className="wird-audio-player__speed"');
    expect(player).toContain('onChange={event => seek(Number(event.currentTarget.value))}');
    expect(player).toContain("audio.current.playbackRate = next");
    expect(player).not.toContain("رجوع 15 ثانية");
    expect(player).not.toContain("تقديم 15 ثانية");
    expect(player).not.toContain("يُحفظ موضع الاستماع على جهازك");
  });

  test("premium dock uses a small footprint and bare chapter/speed buttons", () => {
    expect(identity).toContain(".wird-audio-player.wird-audio-player--compact.wird-audio-player--dock {");
    expect(identity).toContain("grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr)");
    expect(identity).toContain("max-height: min(35dvh, 124px)");
    expect(identity).toContain("min-height: 44px;");
    expect(identity).toContain(".wird-audio-player--dock .wird-audio-player__chapter[aria-pressed=\"true\"]");
    expect(identity).toContain(".wird-audio-player--dock .wird-audio-player__progress::-webkit-slider-runnable-track");
    expect(identity).toContain("border: 0;");
    expect(identity).toContain("background: transparent;");
    expect(identity).toContain(":focus-visible");
    expect(identity).not.toContain(".mushaf-sheet");
    expect(identity).not.toContain(".mushaf-text");
  });

  test("audio errors remain accessible regardless of playback state", () => {
    expect(player).toContain('role="alert" className="wird-audio-player__error"');
    expect(player).toContain("setError(");
    expect(player).toContain("onError={() =>");
  });
});
