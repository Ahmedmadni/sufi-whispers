/**
 * Applied AFTER every Capacitor sync. Android's checked-in project is
 * generated, so editing a local manifest by hand would not survive CI.
 * fullUser (ActivityInfo = 13) honors auto-rotate and user rotation lock
 * while allowing normal/reverse portrait and landscape on phones/tablets.
 */
export const ANDROID_ORIENTATION = "fullUser";

export function enableAdaptiveAndroidOrientation(xml) {
  if (typeof xml !== "string" || !xml.includes("<manifest")) {
    throw new TypeError("Expected the generated AndroidManifest.xml document");
  }
  const activityTags = [...xml.matchAll(/<activity\b[^>]*>/g)];
  const mainActivities = activityTags.filter(([tag]) =>
    /\bandroid:name\s*=\s*["'][^"']*\.?MainActivity["']/.test(tag));
  if (mainActivities.length !== 1) {
    throw new Error("Cannot safely enable Android landscape: expected exactly one MainActivity");
  }
  const original = mainActivities[0][0];
  const updated = /\bandroid:screenOrientation\s*=/.test(original)
    ? original.replace(/\bandroid:screenOrientation\s*=\s*["'][^"']*["']/, `android:screenOrientation="${ANDROID_ORIENTATION}"`)
    : original.replace(/>$/, ` android:screenOrientation="${ANDROID_ORIENTATION}">`);
  if (updated === original || !updated.includes('android:screenOrientation="fullUser"')) {
    throw new Error("The Android orientation attribute could not be applied");
  }
  return xml.replace(original, updated);
}
