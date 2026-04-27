import { useCallback } from "react";

const _isIOS =
  typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);

const _hasVibrate =
  typeof navigator !== "undefined" && "vibrate" in navigator;

// Shared AudioContext for iOS haptic — created lazily on first user gesture.
let _audioCtx: AudioContext | null = null;

function _getAudioCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!_audioCtx) {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AC) _audioCtx = new AC();
    }
    if (_audioCtx?.state === "suspended") void _audioCtx.resume();
    return _audioCtx ?? null;
  } catch {
    return null;
  }
}

function _iosHaptic(ms: number): void {
  const ctx = _getAudioCtx();
  if (!ctx) return;
  try {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 200;
    const dur = Math.max(ms, 10) / 1000;
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch {
    // AudioContext may be in a bad state; ignore.
  }
}

/** Fire a haptic pulse of `ms` milliseconds.
 *  - Android / Chrome: Web Vibration API (true haptic).
 *  - iOS PWA: AudioContext 200 Hz sine pulse through speaker.
 *    Requires phone NOT to be on silent mode. */
export function hapticPulse(ms: number): void {
  if (_isIOS) {
    _iosHaptic(ms);
  } else if (_hasVibrate) {
    try {
      navigator.vibrate(ms);
    } catch {
      // Some Android WebViews throw instead of silently returning false.
    }
  }
}

/** React hook that returns a stable `hapticPulse` callback. */
export function useHaptic(): (ms: number) => void {
  return useCallback(hapticPulse, []);
}
