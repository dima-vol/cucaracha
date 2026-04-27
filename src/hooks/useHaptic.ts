import { useCallback } from "react";

// Module-level constant — evaluated once, stable across renders and SSR-safe.
const _supported =
  typeof navigator !== "undefined" && "vibrate" in navigator;

/** Fire a haptic pulse of `ms` milliseconds. Silent no-op on iOS and any
 *  environment that does not support the Web Vibration API. */
export function hapticPulse(ms: number): void {
  try {
    if (_supported) navigator.vibrate(ms);
  } catch {
    // Some Android WebViews throw instead of silently returning false.
  }
}

/** React hook that returns a stable `hapticPulse` callback. Use in
 *  components that need to fire haptics from event handlers. */
export function useHaptic(): (ms: number) => void {
  return useCallback(hapticPulse, []);
}
