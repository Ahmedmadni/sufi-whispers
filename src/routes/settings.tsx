import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowRight, BellRing, Copy, Download, FileUp, HardDriveDownload, ShieldCheck } from "lucide-react";
import { useEffect } from "react";
import { enableWirdReminders, disableWirdReminders, nativeReminders, replaceWirdSchedule, WIRD_REMINDER_KEY, WIRD_TIMES_KEY, readWirdTimes, updateWirdTimes, type WirdTimes } from "@/lib/wird-reminders";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import {
  exportPersonalBackup, parsePersonalBackup, restorePersonalBackup,
  PERSONAL_BACKUP_MAX_BYTES, type PersonalBackup,
} from "@/lib/personal-backup";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "الإعدادات والنسخ الاحتياطي — رحاب الخليلية" },
      { name: "description", content: "حفظ واستعادة مواضع القراءة وعدادات الذكر دون حساب أو إنترنت." },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const [backup, setBackup] = useState("");
  const [restoreText, setRestoreText] = useState("");
  const [candidate, setCandidate] = useState<PersonalBackup | null>(null);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const pickFile = useRef<HTMLInputElement>(null);
  const [reminderStatus, setReminderStatus] = useState("off");
  const [wirdTimes, setWirdTimes] = useState<WirdTimes>({ first: "09:00", second: "21:00" });
  const [reminderBusy, setReminderBusy] = useState(false);
  const [reminderNotice, setReminderNotice] = useState("");
  const [remindersAvailable, setRemindersAvailable] = useState(false);
  useEffect(() => {
    setRemindersAvailable(Boolean(nativeReminders()));
    setWirdTimes(readWirdTimes());
    try { setReminderStatus(localStorage.getItem(WIRD_REMINDER_KEY) === "on" ? "on" : "off"); } catch { /* optional */ }
  }, []);
  async function toggleReminder() {
    setReminderBusy(true);
    setReminderNotice("");
    try {
      if (reminderStatus === "on") {
        await disableWirdReminders(); setReminderStatus("off"); setReminderNotice("تم إيقاف تذكيري الورد.");
      } else {
        setReminderNotice(await enableWirdReminders(wirdTimes)); setReminderStatus("on");
      }
    } catch (reason) { setReminderNotice(reason instanceof Error ? reason.message : "تعذّر ضبط التذكير."); }
    finally { setReminderBusy(false); }
  }

  async function saveReminderTimes() {
    setReminderBusy(true);
    setReminderNotice("");
    try {
      const saved = await updateWirdTimes(wirdTimes);
      setWirdTimes(saved);
      setReminderNotice(reminderStatus === "on"
        ? "تم تحديث مواعيد الإشعارات اليومية في Android."
        : "تم حفظ المواعيد على الجهاز. يمكنك تفعيل الإشعارات في Android لاحقًا.");
    } catch (reason) {
      setReminderNotice(reason instanceof Error ? reason.message : "تعذّر تحديث مواعيد التذكير.");
    } finally { setReminderBusy(false); }
  }

  function clearMessages() { setNotice(""); setError(""); }
  function prepareBackup(): string | null {
    clearMessages();
    try {
      const json = exportPersonalBackup(window.localStorage);
      setBackup(json);
      return json;
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "تعذر إنشاء النسخة.");
      return null;
    }
  }

  async function shareOrDownload() {
    const content = prepareBackup();
    if (!content) return;
    const fileName = `rihab-backup-${new Date().toISOString().slice(0, 10)}.json`;
    const file = new File([content], fileName, { type: "application/json" });
    try {
      // On supported Android, native share opens Files / Drive / other user choice.
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({ files: [file], title: "نسخة رحاب الخليلية الاحتياطية" });
        setNotice("تمت مشاركة النسخة مع الوجهة التي اخترتها.");
        return;
      }
    } catch (reason) {
      if (reason instanceof Error && reason.name === "AbortError") return;
      // A WebView may not support sharing files: offer regular download.
    }
    const url = URL.createObjectURL(file);
    try {
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      setNotice("تم طلب تنزيل النسخة. إذا لم يحفظها الهاتف، استخدم زر «نسخ النص» واحتفظ بها في مكان آمن.");
    } finally {
      window.setTimeout(() => URL.revokeObjectURL(url), 10000);
    }
  }

  async function copyBackup() {
    const content = backup || prepareBackup();
    if (!content) return;
    try {
      await navigator.clipboard.writeText(content);
      setNotice("تم نسخ البيانات. الصقها في ملاحظة خاصة واحفظها في مكان آمن.");
      setError("");
    } catch {
      setError("تعذر النسخ تلقائيًا. يمكنك تحديد النص من الحقل أدناه ونسخه يدويًا.");
    }
  }

  async function loadFile(file?: File) {
    clearMessages();
    setCandidate(null);
    if (!file) return;
    if (file.size > PERSONAL_BACKUP_MAX_BYTES) {
      setError("ملف النسخة أكبر من الحد المسموح 128 كيلوبايت.");
      return;
    }
    try {
      const value = await file.text();
      setRestoreText(value);
      const parsed = parsePersonalBackup(value);
      setCandidate(parsed);
      setNotice("تم فحص الملف. الاستعادة لم تبدأ بعد.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "الملف غير صالح.");
    }
  }
  function inspectPaste() {
    clearMessages();
    setCandidate(null);
    try {
      setCandidate(parsePersonalBackup(restoreText));
      setNotice("النسخة سليمة مبدئيًا. راجع تفاصيلها ثم أكد الاستعادة.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "النص ليس نسخة احتياطية مدعومة.");
    }
  }
  async function importData() {
    clearMessages();
    if (!candidate) { setError("افحص الملف أولًا."); return; }
    const remindersEnabled = localStorage.getItem(WIRD_REMINDER_KEY) === "on";
    const previousTimes = readWirdTimes();
    try {
      // Only restore the exact inspected payload, never unchecked edited text.
      const count = restorePersonalBackup(JSON.stringify(candidate), window.localStorage);
      // Restoring reminder times in localStorage alone does NOT update Android
      // scheduled notifications. Reschedule with the previous schedule as a
      // rollback target, and never claim the new times were applied otherwise.
      if (remindersEnabled && candidate.data[WIRD_TIMES_KEY] !== undefined) {
        const native = nativeReminders();
        try {
          if (!native) throw new Error("خدمة إشعارات Android غير متاحة.");
          await replaceWirdSchedule(native, readWirdTimes(), previousTimes);
        } catch (reason) {
          // Keep persisted times consistent with the old alarms if Android
          // rejected the restored ones; other backup data stays restored.
          localStorage.setItem(WIRD_TIMES_KEY, JSON.stringify(previousTimes));
          setWirdTimes(previousTimes);
          setReminderNotice("لم يمكن تغيير التذكيرات من النسخة الاحتياطية؛ احتفظنا بمواعيدها القديمة.");
          setError("استُعيدت بقية البيانات، لكن تعذّر تحديث إشعارات الورد. راجع المواعيد من الإعدادات.");
          return;
        }
      }
      setNotice(`اكتملت استعادة ${count} بندًا. سيتم تحديث الواجهة الآن.`);
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "فشلت الاستعادة.");
    }
  }

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      <SiteHeader />
      <main className="mx-auto w-full max-w-2xl px-3 sm:px-6 py-6 sm:py-10 space-y-5">
        <Link to="/" className="inline-flex items-center gap-2 text-xs text-gold-soft font-body">
          <ArrowRight size={15} /> الرئيسية
        </Link>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-display text-foreground leading-relaxed">الإعدادات والنسخ الاحتياطي</h1>
          <p className="font-body text-sm text-muted-foreground leading-7">
            احتفظ بنسخة من عدادات الذكر والجلسات، ومواعيد الأوراد، وإشارات المصحف وآخر موضع قراءة للكتب.
            جميع البيانات تظل على جهازك، ولا تُرسل إلى أي خادم تلقائيًا.
          </p>
        </div>

        <section className="glass rounded-2xl p-4 sm:p-6 space-y-3" aria-labelledby="wird-reminders-heading">
          <div className="flex items-center gap-2">
            <BellRing size={20} className="text-gold-soft" />
            <h2 id="wird-reminders-heading" className="font-display text-lg">تذكير ورد الاستغفار</h2>
          </div>
          <p className="text-sm text-muted-foreground">اختر الموعد المناسب لكل حزب. يفتح الإشعار الحزب الأول عند الصفحة 4 والثاني عند الصفحة 22.</p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm text-foreground">
              <span>الحزب الأول</span>
              <input type="time" dir="ltr" value={wirdTimes.first}
                onChange={event => setWirdTimes(old => ({ ...old, first: event.currentTarget.value }))}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground"
                aria-label="موعد تذكير الحزب الأول" />
            </label>
            <label className="flex flex-col gap-1.5 text-sm text-foreground">
              <span>الحزب الثاني</span>
              <input type="time" dir="ltr" value={wirdTimes.second}
                onChange={event => setWirdTimes(old => ({ ...old, second: event.currentTarget.value }))}
                className="min-h-11 w-full rounded-xl border border-border bg-background px-3 text-foreground"
                aria-label="موعد تذكير الحزب الثاني" />
            </label>
          </div>
          <button type="button" onClick={() => void saveReminderTimes()} disabled={reminderBusy}
            className="inline-flex min-h-11 items-center rounded-xl border border-gold/35 px-4 py-2 text-sm text-foreground disabled:opacity-40">
            حفظ مواعيد الأوراد
          </button>
          <p className="text-xs text-muted-foreground">الإشعارات اختيارية وتعمل دون خادم أو حساب. قد يتأخر ظهورها مع توفير طاقة البطارية؛ لا نطلب صلاحية المنبّه الدقيق.</p>
          <button type="button" onClick={() => void toggleReminder()} disabled={!remindersAvailable || reminderBusy}
            aria-pressed={reminderStatus === "on"}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm text-primary-foreground disabled:opacity-40">
            <BellRing size={16} />
            {reminderBusy ? "جارٍ ضبط الإشعارات…" : reminderStatus === "on" ? "إيقاف التذكير اليومي" : "تفعيل التذكير اليومي"}
          </button>
          {!remindersAvailable && <p className="text-xs text-muted-foreground">تفعيل الإشعارات متاح في تطبيق Android فقط.</p>}
          {reminderNotice && <p role="status" className="text-sm text-gold-soft">{reminderNotice}</p>}
        </section>

        <section className="glass rounded-2xl p-4 sm:p-6 space-y-3" aria-labelledby="backup-export-heading">
          <div className="flex items-center gap-2">
            <HardDriveDownload size={20} className="text-gold-soft" />
            <h2 id="backup-export-heading" className="font-display text-lg text-foreground">إنشاء نسخة احتياطية</h2>
          </div>
          <p className="font-body text-xs text-muted-foreground leading-7">
            في أندرويد، يمكنك مشاركة الملف مع تطبيق الملفات أو التخزين السحابي إذا أتاح الهاتف ذلك،
            أو نسخ البيانات يدويًا كبديل مضمون. الملف يحتوي بياناتك الشخصية ولا يحتوي أي صور أو كتب.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => void shareOrDownload()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl glass-gold px-4 py-2 text-sm font-body text-gold-soft">
              <Download size={17} /> مشاركة أو تنزيل ملف
            </button>
            <button type="button" onClick={() => void copyBackup()}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-gold/20 px-4 py-2 text-sm font-body text-foreground">
              <Copy size={17} /> نسخ البيانات
            </button>
          </div>
          {backup && (
            <details className="rounded-xl border border-gold/15 p-3">
              <summary className="cursor-pointer text-xs text-gold-soft">عرض النسخة للنسخ اليدوي</summary>
              <textarea readOnly dir="ltr" value={backup} rows={5} aria-label="نص النسخة الاحتياطية"
                className="mt-3 w-full min-w-0 rounded-lg border border-gold/15 bg-background p-2 text-xs text-foreground" />
            </details>
          )}
        </section>

        <section className="glass rounded-2xl p-4 sm:p-6 space-y-3" aria-labelledby="backup-import-heading">
          <div className="flex items-center gap-2">
            <FileUp size={20} className="text-gold-soft" />
            <h2 id="backup-import-heading" className="font-display text-lg text-foreground">استعادة نسخة احتياطية</h2>
          </div>
          <p className="text-xs text-muted-foreground font-body leading-7">
            اختر ملفًا سابقًا أو الصق محتواه. سنفحص البيانات أولًا، ولن يغيّر الفحص أية بيانات.
            الاستعادة تستبدل القيم الموجودة فقط للبنود المشمولة بالنسخة.
          </p>
          <input ref={pickFile} type="file" accept=".json,application/json" className="sr-only"
            onChange={event => void loadFile(event.target.files?.[0])} aria-label="ملف النسخة الاحتياطية" />
          <button type="button" onClick={() => pickFile.current?.click()}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-gold/25 px-4 py-2 text-sm text-foreground">
            <FileUp size={17} /> اختيار ملف النسخة
          </button>
          <label className="block text-xs text-muted-foreground font-body" htmlFor="backup-paste">أو الصق النص المحفوظ</label>
          <textarea id="backup-paste" dir="ltr" value={restoreText} rows={4}
            onChange={e => { setRestoreText(e.target.value); setCandidate(null); clearMessages(); }}
            placeholder="Paste backup JSON here…"
            className="block w-full min-w-0 rounded-xl border border-gold/20 bg-background/80 p-3 text-xs text-foreground placeholder:text-muted-foreground" />
          <button type="button" onClick={inspectPaste}
            className="min-h-11 rounded-xl border border-gold/25 px-4 py-2 text-sm text-foreground">فحص البيانات</button>
          {candidate && (
            <div className="space-y-2 rounded-xl border border-gold/25 bg-background/65 p-4 text-sm">
              <p className="inline-flex items-center gap-2 text-gold-soft font-display"><ShieldCheck size={17} /> نسخة مدعومة وصالحة مبدئيًا</p>
              <p className="text-xs text-muted-foreground">تاريخ النسخة: {new Date(candidate.createdAt).toLocaleString("ar")}</p>
              <p className="text-xs text-muted-foreground">عدد بنود الحفظ: {Object.keys(candidate.data).length}</p>
              <button type="button" onClick={importData}
                className="min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-body text-primary-foreground">
                تأكيد الاستعادة واستبدال البيانات
              </button>
            </div>
          )}
        </section>

        {(notice || error) && <p role={error ? "alert" : "status"}
          className={`rounded-xl border p-3 text-sm font-body leading-7 ${error ? "border-destructive/40 text-destructive" : "border-gold/20 text-foreground"}`}>
          {error || notice}
        </p>}
        <p className="text-xs text-muted-foreground font-body leading-7">
          تأكد من حفظ نسخة احتياطية قبل مسح بيانات التطبيق أو تغيير الهاتف. المشاركة إلى Google Drive أو غيره
          تتطلب اختيارك وموافقتك؛ لا توجد مزامنة سحابية تلقائية في هذا الإصدار.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
