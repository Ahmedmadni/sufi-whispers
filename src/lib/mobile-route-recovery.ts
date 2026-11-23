/** Recovery from stale on-device WebView JavaScript chunks after an APK update.
 * Does not clear reading progress, downloads, localStorage or user preferences.
 */
export function isModuleLoadFailure(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /failed to fetch dynamically imported module|importing a module script failed|loading chunk .+ failed|chunkloaderror|failed to load module script/i.test(message);
}

export function freshMobileAppUrl(href: string, marker: string): string | null {
  const address = new URL(href);
  if (!/^https?:$/.test(address.protocol)) return null;
  if (address.searchParams.get("rihab-assets") === marker) return null;
  address.searchParams.set("rihab-assets", marker);
  return address.href; // preserve #/books/... and all user progress in storage
}
