/**
 * Lovable's .asset.json descriptors are pointers, not binary source files.
 * On Android we package the verified downloads at stable local URLs.
 * Keep production web URLs unchanged.
 */
export function contentAssetUrl(asset: { url: string; original_filename: string }): string {
  if (import.meta.env.VITE_MOBILE === "true") {
    return `/mobile-assets/${encodeURIComponent(asset.original_filename)}`;
  }
  return asset.url;
}
