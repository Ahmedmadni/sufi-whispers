/**
 * Fail-closed removal of exact alarm permissions after cap sync.
 * Reminder notifications are deliberately INEXACT. Third-party Capacitor
 * plugins sometimes write the permission into the app's generated manifest
 * before Android's manifest merger, so checking only "includes" is unsafe.
 * Root-level tools:node="remove" overrides transitive library declarations.
 */
const EXACT_ALARMS = [
  "android.permission.SCHEDULE_EXACT_ALARM",
  "android.permission.USE_EXACT_ALARM",
];

export function enforceInexactAndroidReminders(xml) {
  if (typeof xml !== "string") {
    throw new TypeError("Expected AndroidManifest.xml");
  }
  const root = xml.match(/<manifest\b[^>]*>/);
  if (!root) throw new Error("Android generated manifest is missing its root");

  let cleaned = xml;
  for (const name of EXACT_ALARMS) {
    const escaped = name.replace(/\./g, "\\.");
    const declaration = new RegExp(
      `(?:\\r?\\n[ \\t]*)?<uses-permission(?:-sdk-23)?\\b(?=[^>]*\\bandroid:name\\s*=\\s*["']${escaped}["'])[^>]*(?:\\/>|>[\\s\\S]*?<\\/uses-permission\\s*>)`,
      "g",
    );
    cleaned = cleaned.replace(declaration, "");
  }

  const manifestTag = cleaned.match(/<manifest\b[^>]*>/)?.[0];
  if (!manifestTag) throw new Error("Cannot patch Android manifest");
  const withTools = manifestTag.includes("xmlns:tools=")
    ? manifestTag
    : manifestTag.replace(/>$/, ' xmlns:tools="http://schemas.android.com/tools">');
  const removalRules = EXACT_ALARMS.map(name =>
    `  <uses-permission android:name="${name}" tools:node="remove" />`).join("\n");
  const next = cleaned.replace(manifestTag, withTools + "\n" + removalRules);
  if (next.match(/tools:node="remove"/g)?.length !== EXACT_ALARMS.length) {
    throw new Error("Required Android manifest permission removals were not applied");
  }
  return next;
}
