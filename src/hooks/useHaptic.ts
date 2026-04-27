import { useCallback } from "react";

const _isIOS =
  typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);

const _hasVibrate =
  typeof navigator !== "undefined" && "vibrate" in navigator;

// iOS haptic via hidden range input trick.
// When a range input steps, iOS Safari fires its native selection haptic
// (Taptic Engine) — silent, no AudioContext required.
let _rangeEl: HTMLInputElement | null = null;
let _rangeStep = 0;

function _getRange(): HTMLInputElement | null {
  if (typeof document === "undefined") return null;
  if (_rangeEl) return _rangeEl;
  try {
    const el = document.createElement("input");
    el.type = "range";
    el.min = "0";
    el.max = "100";
    el.step = "1";
    el.value = "50";
    el.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;";
    document.body.appendChild(el);
    _rangeEl = el;
  } catch {
    _rangeEl = null;
  }
  return _rangeEl;
}

function _iosHaptic(): void {
  const el = _getRange();
  if (!el) return;
  try {
    // Alternate step direction to stay within bounds and keep triggering.
    _rangeStep = (_rangeStep + 1) % 2;
    if (_rangeStep === 0) {
      el.stepUp();
    } else {
      el.stepDown();
    }
    // Dispatch input event so iOS registers the change.
    el.dispatchEvent(new Event("input", { bubbles: true }));
  } catch {
    // Silently ignore if the trick isn't supported.
  }
}

/** Fire a haptic pulse.
 *  - Android / Chrome: Web Vibration API — true vibe motor.
 *  - iOS Safari / PWA: hidden range input stepUp/stepDown — fires native
 *    Taptic Engine selection feedback, silent, no AudioContext needed.
 *  - Other: silent no-op. */
export function hapticPulse(_ms?: number): void {
  if (_isIOS) {
    _iosHaptic();
  } else if (_hasVibrate) {
    try {
      navigator.vibrate(_ms ?? 8);
    } catch {
      // Some Android WebViews throw instead of silently returning false.
    }
  }
}

/** React hook returning a stable hapticPulse callback. */
export function useHaptic(): (ms?: number) => void {
  return useCallback(hapticPulse, []);
}
