import { describe, expect, test } from "bun:test";
import {
  APPROXIMATE_TIMES, currentWirdPhase, parseClockMinutes, validatePrayerTimes, wirdTimeWindowLabel,
} from "../src/lib/wird-times";
import { currentWird } from "../src/data/dhikr";

const sample = { fajr: "05:04", asr: "15:28", maghrib: "18:01" };
const at = (hours: number, minutes = 0) => new Date(2026, 9, 15, hours, minutes);

describe("custom local prayer time windows", () => {
  test("accepts valid HH:mm settings and rejects malformed/out of order times", () => {
    expect(validatePrayerTimes(sample)).toEqual(sample);
    expect(parseClockMinutes("23:59")).toBe(1439);
    expect(parseClockMinutes("24:00")).toBeNull();
    expect(parseClockMinutes("3:05")).toBeNull();
    expect(() => validatePrayerTimes({ ...sample, asr: "04:00" })).toThrow();
    expect(() => validatePrayerTimes({ ...sample, maghrib: "14:00" })).toThrow();
    expect(() => validatePrayerTimes({ ...sample, fajr: "invalid" })).toThrow();
  });
  test("switches exactly at prayer boundaries, including night rollover", () => {
    expect(currentWirdPhase(at(5, 3), sample)).toBe("asma");
    expect(currentWirdPhase(at(5, 4), sample)).toBe("salawat");
    expect(currentWirdPhase(at(15, 27), sample)).toBe("salawat");
    expect(currentWirdPhase(at(15, 28), sample)).toBe("istighfar");
    expect(currentWirdPhase(at(18, 1), sample)).toBe("asma");
    expect(currentWirdPhase(at(23, 59), sample)).toBe("asma");
  });
  test("saved prayer boundaries are visible in the daily dhikr and home widgets", () => {
    expect(wirdTimeWindowLabel("salawat", sample)).toBe("الفجر 05:04 – العصر 15:28");
    expect(wirdTimeWindowLabel("istighfar", sample)).toBe("العصر 15:28 – المغرب 18:01");
    expect(wirdTimeWindowLabel("asma", sample)).toBe("المغرب 18:01 – الفجر 05:04");
    expect(wirdTimeWindowLabel("asma", null)).toContain("18:00");
  });
  test("existing callers keep explicitly approximate fallback until configured", () => {
    expect(APPROXIMATE_TIMES).toEqual({ fajr: "04:00", asr: "15:00", maghrib: "18:00" });
    expect(currentWird(at(4)).phase).toBe("salawat");
    expect(currentWird(at(15)).phase).toBe("istighfar");
    expect(currentWird(at(18)).phase).toBe("asma");
    expect(currentWird(at(4), sample).phase).toBe("asma");
    expect(currentWird(at(5, 4), sample).phase).toBe("salawat");
  });
});
