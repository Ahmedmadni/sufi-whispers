/** Immutable identity and source mapping for the two original Wird al-Istighfar recordings. */
export type WirdPart = "first" | "second";
export type WirdAudioTrack = {
  id: WirdPart;
  label: string;
  page: number;
  src: string;
  durationSeconds: number;
  bytes: number;
  sha256: string;
};
export const WIRD_AUDIO_TRACKS: Record<WirdPart, WirdAudioTrack> = {
  first: {
    id: "first", label: "الحزب الأول", page: 4,
    src: "/audio/wird/hizb-1.mp3", durationSeconds: 1169.476,
    bytes: 9357687, sha256: "92f50015584fe52add33cc919e4371785957e9bacb54131597294b4a61a095c1",
  },
  second: {
    id: "second", label: "الحزب الثاني", page: 22,
    src: "/audio/wird/hizb-2.mp3", durationSeconds: 944.3,
    bytes: 11343344, sha256: "e973da3691fd34f60f7047028c646226d9c205245ae7c5a819f6469a40b5abaf",
  },
};
export const WIRD_AUDIO_POSITION_KEYS = ["rihab:wird-audio:position:first", "rihab:wird-audio:position:second"] as const;
export function wirdAudioPositionKey(part: WirdPart): string {
  return part === "first" ? WIRD_AUDIO_POSITION_KEYS[0] : WIRD_AUDIO_POSITION_KEYS[1];
}
export function wirdPartForPage(page: number): WirdPart {
  return page >= 22 ? "second" : "first";
}
export function requestedWirdListening(location: Pick<Location, "search" | "hash">): boolean {
  const query = location.hash.includes("?") ? location.hash.split("?").slice(1).join("?") : location.search.replace(/^\?/, "");
  return new URLSearchParams(query).get("listen") === "1";
}
export function safeWirdAudioPosition(raw: string | null): number {
  if (!raw || !/^\d+(?:\.\d{1,3})?$/.test(raw)) return 0;
  const value = Number(raw);
  return Number.isFinite(value) && value >= 0 && value <= 7200 ? value : 0;
}
