import { describe, expect, test } from "bun:test";
import { wirdReminderDestination, requestedWirdPage } from "../src/lib/wird-reminders";
import { readFileSync } from "node:fs";
import {
  WIRD_AUDIO_POSITION_KEYS, WIRD_AUDIO_TRACKS, requestedWirdListening,
  safeWirdAudioPosition, wirdAudioPositionKey, wirdPartForPage,
} from "../src/lib/wird-audio";

describe("Wird audio routing and persistence", () => {
  test("maps first and second book chapters to distinct tracks", () => {
    expect(wirdPartForPage(4)).toBe("first");
    expect(wirdPartForPage(21)).toBe("first");
    expect(wirdPartForPage(22)).toBe("second");
    expect(WIRD_AUDIO_TRACKS.first.src).not.toBe(WIRD_AUDIO_TRACKS.second.src);
    expect(WIRD_AUDIO_TRACKS.first.page).toBe(4);
    expect(WIRD_AUDIO_TRACKS.second.page).toBe(22);
  });
  test("listening deep links are explicit and never imply autoplay", () => {
    expect(requestedWirdListening({ hash: "#/books/ward?wird=4&listen=1", search: "" })).toBe(true);
    expect(requestedWirdListening({ hash: "#/books/ward?wird=22", search: "" })).toBe(false);
    expect(requestedWirdListening({ hash: "", search: "?wird=22&listen=1" })).toBe(true);
  });
  test("notification buttons navigate only to approved chapter pages", () => {
    const first = wirdReminderDestination(4, "listen-wird");
    const second = wirdReminderDestination(22, "listen-wird");
    expect(first).toBe("#/books/ward?wird=4&listen=1");
    expect(second).toBe("#/books/ward?wird=22&listen=1");
    expect(wirdReminderDestination(4, "open-wird")).toBe("#/books/ward?wird=4");
    expect(wirdReminderDestination(22)).toBe("#/books/ward?wird=22");
    expect(wirdReminderDestination(99, "listen-wird")).toBeNull();
    expect(wirdReminderDestination("22", "listen-wird")).toBeNull();
    expect(requestedWirdPage("ward", { hash: second!, search: "" })).toBe(22);
  });
  test("player always requires an explicit gesture and stops detached audio", () => {
    const player = readFileSync("src/components/WirdAudioPlayer.tsx", "utf8");
    expect(player).toContain("player?.pause()");
    expect(player).toContain("previous.pause()");
    expect(player).toContain("event.currentTarget.ended ? 0");
    expect(player).toContain("manuallySelected.current = true");
    expect(player).not.toContain("autoPlay");
  });
  test("supports a distinct validated checkpoint per hizb", () => {
    expect(wirdAudioPositionKey("first")).toBe(WIRD_AUDIO_POSITION_KEYS[0]);
    expect(wirdAudioPositionKey("second")).toBe(WIRD_AUDIO_POSITION_KEYS[1]);
    expect(safeWirdAudioPosition("123.456")).toBe(123.456);
    expect(safeWirdAudioPosition("")).toBe(0);
    expect(safeWirdAudioPosition("NaN")).toBe(0);
    expect(safeWirdAudioPosition("-2")).toBe(0);
    expect(safeWirdAudioPosition("9000")).toBe(0);
  });
});
