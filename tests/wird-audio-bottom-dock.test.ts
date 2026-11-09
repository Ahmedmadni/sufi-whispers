import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
const player = read("src/components/WirdAudioPlayer.tsx");
const css = read("src/rihab-identity.css");
const layout = read("src/components/BookReaderLayout.tsx");
const root = read("src/routes/__root.tsx");

describe("Wird mini player — viewport-bottom dock regressions", () => {
  test("playback controls sit below pages and above the five-item navigation", () => {
    expect(player).toContain("wird-audio-player--dock");
    expect(css).toContain(".wird-audio-player.wird-audio-player--compact.wird-audio-player--dock {");
    expect(css).toContain("position: fixed !important;");
    expect(css).toContain("bottom: calc(77px + env(safe-area-inset-bottom, 0px))");
    expect(css).toContain("transform: translateX(-50%)");
    expect(css).toContain("width: min(420px, calc(100vw - 20px))");
    expect(css).toContain("backdrop-filter: blur(18px)");
    expect(css).toContain(".wird-audio-player--dock[data-playing=\"true\"] .wird-audio-player__play");
    expect(css).toContain("background: linear-gradient(135deg");
    expect(css).toContain("max-height: min(35dvh, 124px)");
  });

  test("the main play button is visually centered between both chapter controls", () => {
    expect(css).toContain("grid-template-columns: minmax(0, 1fr) 56px minmax(0, 1fr)");
    expect(css).toContain(".wird-audio-player--dock .wird-audio-player__minimal-controls");
    expect(player).toContain('onClick={() => choose("first")}');
    expect(player).toContain('onClick={() => choose("second")}');
    expect(player).toContain('className="wird-audio-player__play"');
    expect(player).toContain('aria-pressed={part === "first"}');
    expect(player).toContain('aria-pressed={part === "second"}');
  });

  test("scroll margins and floating index remain above the smaller bar", () => {
    expect(layout).toContain('audioPage !== undefined ? "book-reader--with-wird"');
    expect(layout).toContain("<WirdAudioPlayer page={audioPage} onJump={onAudioJump} />");
    expect(css).toContain(".book-reader-layout.book-reader--with-wird .book-reader-workspace :where(.book-pdf-stage, .offline-book-stage)");
    expect(css).toContain("padding-bottom: 170px;");
    expect(css).toContain("scroll-padding-bottom: 165px;");
    expect(css).toContain(".book-reader-layout.book-reader--with-wird .reader-floating-index");
    expect(css).toContain(".book-reader--immersive > .wird-audio-player.wird-audio-player--dock");
    expect(css).toContain("bottom: max(12px, env(safe-area-inset-bottom, 0px))");
    expect(read("src/printed-pdf-reader.css")).toContain(".book-reader--chrome-hidden > .wird-audio-player");
  });

  test("Android entrance animation does not displace fixed playback", () => {
    expect(root).toContain('pathname !== "/quran/printed" && pathname !== "/books/ward"');
    expect(read("mobile/main.tsx")).toContain('import "../src/rihab-identity.css"');
    expect(root).toContain('{ rel: "stylesheet", href: identityCss }');
  });

  test("thin timeline, seeking, speed, no autoplay or redundant buttons", () => {
    expect(player).toContain("elapsed / durationDisplay * 100");
    expect(player).toContain('--wird-progress');
    expect(css).toContain("var(--wird-progress, 0%)");
    expect(player).toContain('className="wird-audio-player__mini-bottom"');
    expect(player).toContain('aria-label={"سرعة التشغيل " + speed');
    expect(player).toContain("onClick={() => void togglePlay()}");
    expect(player).toContain("onJump?.(WIRD_AUDIO_TRACKS[next].page)");
    expect(player).toContain("wirdAudioPositionKey(part)");
    expect(player).toContain("player.pause()");
    expect(player).not.toContain("autoPlay");
    expect(player).not.toContain("RotateCcw");
    expect(player).not.toContain("ChevronUp");
    expect(css).toContain("min-width: 44px");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("background: transparent;");
    expect(css).toContain(":focus-visible");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("original Quran artwork and original recordings remain untouched", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(read("src/lib/wird-audio.ts")).toContain('src: "/audio/wird/hizb-1.mp3"');
    expect(read("src/lib/wird-audio.ts")).toContain('src: "/audio/wird/hizb-2.mp3"');
  });
});
