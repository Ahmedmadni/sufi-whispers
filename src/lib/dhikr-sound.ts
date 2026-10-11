/** A short offline click with enough mid-range harmonics for phone speakers. */
let context: AudioContext | null = null;

function scheduleTap(audio: AudioContext): void {
  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const gain = audio.createGain();
  // A triangle wave is more audible on small Android speakers than a quiet sine.
  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(880, now);
  oscillator.frequency.exponentialRampToValueAtTime(680, now + 0.09);
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.16, now + 0.008);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);
  oscillator.connect(gain);
  gain.connect(audio.destination);
  oscillator.start(now);
  oscillator.stop(now + 0.115);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}

/**
 * Invoke synchronously from a tap/click handler so Android allows audio unlock.
 * Never schedule into a suspended AudioContext: wait for resume to finish.
 */
export function playDhikrTap(): boolean {
  if (typeof window === "undefined" || !window.AudioContext) return false;
  try {
    if (!context || context.state === "closed") context = new window.AudioContext();
    const audio = context;
    if (audio.state === "running") {
      scheduleTap(audio);
      return true;
    }
    if (audio.state === "suspended") {
      // Called within the user's gesture, not from a delayed effect.
      void audio.resume().then(() => {
        if (audio.state === "running") scheduleTap(audio);
      }).catch(() => {
        // A failed device/audio focus unlock must never break the counter.
      });
      return true;
    }
  } catch {
    // A restricted WebView can still count dhikr without audio.
  }
  return false;
}

export const DHIKR_SOUND_PREF = "rihab:dhikr:tap-sound:v1";
