/** A soft offline tap sound generated at user-interaction time: no media file or network. */
let context: AudioContext | null = null;
export function playDhikrTap(): boolean {
  if (typeof window === "undefined") return false;
  const AudioClass = window.AudioContext;
  if (!AudioClass) return false;
  try {
    const audio = context ?? new AudioClass();
    context = audio;
    if (audio.state === "suspended") void audio.resume().catch(() => {});
    const now = audio.currentTime;
    const oscillator = audio.createOscillator();
    const gain = audio.createGain();
    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(780, now);
    oscillator.frequency.exponentialRampToValueAtTime(620, now + 0.045);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.09, now + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
    oscillator.connect(gain);
    gain.connect(audio.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.075);
    oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); };
    return true;
  } catch {
    return false;
  }
}
export const DHIKR_SOUND_PREF = "rihab:dhikr:tap-sound:v1";
