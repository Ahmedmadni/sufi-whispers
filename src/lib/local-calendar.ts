/**
 * Use the user's calendar day, not UTC: counters must not roll over early
 * for readers in time zones ahead of UTC (for example Asia/Riyadh).
 */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Calendar subtraction rather than a 24-hour offset (DST-safe). */
export function previousLocalDateKey(date: Date = new Date()): string {
  return localDateKey(new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1));
}
