/**
 * User-supplied local prayer times (HH:mm).
 * Prayer times vary by location/date: never claim that the legacy fixed values
 * are calculated prayer times. This works entirely offline and without location access.
 */
export type PrayerTimeSettings = { fajr: string; asr: string; maghrib: string };
export const PRAYER_TIMES_KEY = "rihab-prayer-times-v1";
export const APPROXIMATE_TIMES: PrayerTimeSettings = {
  fajr: "04:00", asr: "15:00", maghrib: "18:00",
};

export function parseClockMinutes(time: unknown): number | null {
  if (typeof time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return null;
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function validatePrayerTimes(value: unknown): PrayerTimeSettings {
  if (!value || typeof value !== "object") throw new Error("أدخل وقت الفجر والعصر والمغرب.");
  const data = value as Partial<PrayerTimeSettings>;
  const fajr = parseClockMinutes(data.fajr);
  const asr = parseClockMinutes(data.asr);
  const maghrib = parseClockMinutes(data.maghrib);
  if (fajr === null || asr === null || maghrib === null || !(fajr < asr && asr < maghrib)) {
    throw new Error("يجب أن تكون الأوقات صحيحة وبالترتيب: الفجر ثم العصر ثم المغرب.");
  }
  return { fajr: data.fajr!, asr: data.asr!, maghrib: data.maghrib! };
}

export function readPrayerTimes(): PrayerTimeSettings | null {
  try {
    const raw = localStorage.getItem(PRAYER_TIMES_KEY);
    return raw ? validatePrayerTimes(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
}
export function savePrayerTimes(value: unknown): PrayerTimeSettings {
  const valid = validatePrayerTimes(value);
  localStorage.setItem(PRAYER_TIMES_KEY, JSON.stringify(valid));
  return valid;
}
export function clearPrayerTimes(): void {
  localStorage.removeItem(PRAYER_TIMES_KEY);
}

/** Show real saved time boundaries, not only unchanging descriptive prayer names. */
export function wirdTimeWindowLabel(phase: "salawat" | "istighfar" | "asma", saved?: PrayerTimeSettings | null): string {
  const { fajr, asr, maghrib } = saved ?? APPROXIMATE_TIMES;
  if (phase === "salawat") return `الفجر ${fajr} – العصر ${asr}`;
  if (phase === "istighfar") return `العصر ${asr} – المغرب ${maghrib}`;
  return `المغرب ${maghrib} – الفجر ${fajr}`;
}

export function currentWirdPhase(now: Date, value?: PrayerTimeSettings | null):
  "salawat" | "istighfar" | "asma" {
  const times = value ?? APPROXIMATE_TIMES;
  const minute = now.getHours() * 60 + now.getMinutes();
  const fajr = parseClockMinutes(times.fajr);
  const asr = parseClockMinutes(times.asr);
  const maghrib = parseClockMinutes(times.maghrib);
  // Defensive: a corrupt or stale saved schedule may not change the daily wird.
  if (fajr === null || asr === null || maghrib === null || !(fajr < asr && asr < maghrib)) {
    return currentWirdPhase(now, APPROXIMATE_TIMES);
  }
  if (minute >= fajr && minute < asr) return "salawat";
  if (minute >= asr && minute < maghrib) return "istighfar";
  return "asma";
}
