/**
 * Optional daily reminders, stored on-device with Capacitor Local Notifications.
 * Never request a permission until the user enables reminders in Settings.
 * Exact-alarm access is deliberately not requested (Google Play restricted).
 */
export const WIRD_REMINDER_KEY = "rihab:wird-reminders:v1";
const IDS = [904, 922] as const;
type Reminder = { id: number; title: string; body: string; schedule: { on: { hour: number; minute: number }; allowWhileIdle: boolean }; isExactNotification: boolean; actionTypeId: string; extra: { wird: number } };
type Permission = { display: "granted" | "denied" | "prompt" | "prompt-with-rationale" };
type Handle = { remove: () => Promise<void> };
type Native = {
  checkPermissions(): Promise<Permission>;
  requestPermissions(): Promise<Permission>;
  registerActionTypes(options: { types: Array<{ id: string; actions: Array<{ id: string; title: string; foreground: boolean }> }> }): Promise<void>;
  schedule(options: { notifications: Reminder[] }): Promise<unknown>;
  cancel(options: { notifications: Array<{ id: number }> }): Promise<void>;
  getPending(): Promise<{ notifications: Array<{ id: number }> }>;
  addListener(event: string, callback: (event: { notification?: { extra?: { wird?: number } } }) => void): Promise<Handle>;
};
type CapBridge = { Plugins?: { LocalNotifications?: Native }; registerPlugin?: (name: string) => Native; isNativePlatform?: () => boolean };
export function nativeReminders(): Native | null {
  if (typeof window === "undefined") return null;
  const cap = (window as Window & { Capacitor?: CapBridge }).Capacitor;
  if (!cap?.isNativePlatform?.()) return null;
  return cap.Plugins?.LocalNotifications ?? cap.registerPlugin?.("LocalNotifications") ?? null;
}
export function reminderItems(): Reminder[] {
  return [
    { id: IDS[0], title: "ورد الاستغفار — الحزب الأول", body: "حان وقت قراءة الحزب الأول. اضغط لفتح صفحة 4.",
      schedule: { on: { hour: 9, minute: 0 }, allowWhileIdle: true }, isExactNotification: false,
      actionTypeId: "RIHAB_WIRD_OPEN", extra: { wird: 4 } },
    { id: IDS[1], title: "ورد الاستغفار — الحزب الثاني", body: "حان وقت قراءة الحزب الثاني. اضغط لفتح صفحة 22.",
      schedule: { on: { hour: 21, minute: 0 }, allowWhileIdle: true }, isExactNotification: false,
      actionTypeId: "RIHAB_WIRD_OPEN", extra: { wird: 22 } },
  ];
}
export function requestedWirdPage(bookId: string, location: Pick<Location, "search" | "hash">): number | null {
  if (bookId !== "ward") return null;
  const query = location.hash.includes("?") ? location.hash.split("?").slice(1).join("?") : location.search.slice(1);
  const value = new URLSearchParams(query).get("wird");
  return value === "4" || value === "22" ? Number(value) : null;
}
export async function enableWirdReminders(): Promise<string> {
  const native = nativeReminders();
  if (!native) throw new Error("التذكير اليومي متاح عبر تطبيق Android فقط.");
  let permission = await native.checkPermissions();
  if (permission.display !== "granted") permission = await native.requestPermissions();
  if (permission.display !== "granted") throw new Error("لم تسمح بإظهار الإشعارات. يمكنك منح الإذن من إعدادات Android.");
  await native.registerActionTypes({ types: [{ id: "RIHAB_WIRD_OPEN",
    actions: [{ id: "open-wird", title: "فتح الورد", foreground: true }] }] });
  await native.cancel({ notifications: IDS.map(id => ({ id })) });
  await native.schedule({ notifications: reminderItems() });
  const pending = await native.getPending();
  if (!IDS.every(id => pending.notifications.some(n => n.id === id))) {
    throw new Error("لم يؤكد Android جدولة التذكيرين. أعد المحاولة.");
  }
  localStorage.setItem(WIRD_REMINDER_KEY, "on");
  return "تم تسجيل تذكيرين يوميًا عند 9 صباحًا و9 مساءً بتوقيت الهاتف. قد يؤخر Android الإشعار حسب وضع البطارية.";
}
export async function disableWirdReminders(): Promise<void> {
  const native = nativeReminders();
  if (native) await native.cancel({ notifications: IDS.map(id => ({ id })) });
  localStorage.setItem(WIRD_REMINDER_KEY, "off");
}
/** Runs only in mobile WebView; action works when app is already open or resumed. */
export async function listenForWirdOpens(): Promise<void> {
  const native = nativeReminders();
  if (!native) return;
  await native.registerActionTypes({ types: [{ id: "RIHAB_WIRD_OPEN",
    actions: [{ id: "open-wird", title: "فتح الورد", foreground: true }] }] });
  await native.addListener("localNotificationActionPerformed", event => {
    const page = event.notification?.extra?.wird;
    if (page !== 4 && page !== 22) return;
    const destination = `#/books/ward?wird=${page}`;
    if (window.location.hash === destination) {
      // Hash-routing the same book does not remount its restored page.
      window.location.reload();
    } else {
      window.location.hash = destination;
      window.location.reload();
    }
  });
}
