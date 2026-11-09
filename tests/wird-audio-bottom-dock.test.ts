import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
const read = (path: string) => readFileSync(path, "utf8");
const player = read("src/components/WirdAudioPlayer.tsx");
const css = read("src/rihab-identity.css");
const layout = read("src/components/BookReaderLayout.tsx");
const root = read("src/routes/__root.tsx");

describe("Wird audio — premium bottom dock regression checks", () => {
  test("the full playback control is docked to the viewport bottom, not above original book pages", () => {
    expect(player).toContain("wird-audio-player--dock");
    expect(css).toContain(".wird-audio-player.wird-audio-player--compact.wird-audio-player--dock {");
    expect(css).toContain("position: fixed !important;");
    expect(css).toContain("bottom: calc(77px + env(safe-area-inset-bottom, 0px))");
    expect(css).toContain("transform: translateX(-50%)");
    expect(css).toContain("width: min(460px, calc(100vw - 20px))");
    expect(css).toContain("backdrop-filter: blur(20px)");
    expect(css).toContain(".wird-audio-player--dock[data-playing=\"true\"]");
    expect(css).toContain(".wird-audio-player--dock::before");
    expect(css).toContain("background: linear-gradient(132deg");
  });

  test("book readers preserve bottom scrolling space and keep floating index accessible", () => {
    expect(layout).toContain('audioPage !== undefined ? "book-reader--with-wird"');
    expect(layout).toContain("<WirdAudioPlayer page={audioPage} onJump={onAudioJump} />");
    expect(css).toContain(".book-reader-layout.book-reader--with-wird .book-reader-workspace :where(.book-pdf-stage, .offline-book-stage)");
    expect(css).toContain("padding-bottom: 190px;");
    expect(css).toContain("scroll-padding-bottom: 175px;");
    expect(css).toContain(".book-reader-layout.book-reader--with-wird .reader-floating-index");
    expect(css).toContain(".book-reader--immersive > .wird-audio-player.wird-audio-player--dock");
    expect(css).toContain("bottom: max(12px, env(safe-area-inset-bottom, 0px))");
    expect(read("src/printed-pdf-reader.css")).toContain(".book-reader--chrome-hidden > .wird-audio-player");
  });

  test("Android route animation cannot redirect a position-fixed player from the viewport", () => {
    expect(root).toContain('pathname !== "/quran/printed" && pathname !== "/books/ward"');
    expect(read("mobile/main.tsx")).toContain('import "../src/rihab-identity.css"');
    expect(root).toContain('{ rel: "stylesheet", href: identityCss }');
  });

  test("progress is real, five icon-only bottom controls survive, no autoplay", () => {
    expect(player).toContain("elapsed / durationDisplay * 100");
    expect(player).toContain('--wird-progress');
    expect(css).toContain("var(--wird-progress, 0%)");
    expect(player).toContain('className="wird-audio-player__controls"');
    expect(player).toContain('aria-label="رجوع 15 ثانية"');
    expect(player).toContain('aria-label="تقديم 15 ثانية"');
    expect(player).toContain('aria-label="سرعة التشغيل"');
    expect(player).toContain("onClick={() => void togglePlay()}");
    expect(player).toContain('aria-label="تصغير مشغل الورد"');
    expect(player).toContain("onJump?.(WIRD_AUDIO_TRACKS[next].page)");
    expect(player).toContain("wirdAudioPositionKey(part)");
    expect(player).toContain("player.pause()");
    expect(player).not.toContain("autoPlay");
    expect(css).toContain("min-width: 44px");
    expect(css).toContain("min-height: 44px");
    expect(css).toContain("background: transparent;");
    expect(css).toContain(".wird-audio-player--dock .wird-audio-player__icon-button:focus-visible");
    expect(css).toContain("@media (prefers-reduced-motion: reduce)");
  });

  test("original Quran, printed book artwork and original tracks are not edited", () => {
    expect(css).not.toContain(".mushaf-text");
    expect(css).not.toContain(".react-pdf__Page");
    expect(read("src/lib/wird-audio.ts")).toContain('src: "/audio/wird/hizb-1.mp3"');
    expect(read("src/lib/wird-audio.ts")).toContain('src: "/audio/wird/hizb-2.mp3"');
  });
});
