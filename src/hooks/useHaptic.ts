import { useCallback } from "react";

const _isIOS =
  typeof navigator !== "undefined" && /iP(hone|ad|od)/.test(navigator.userAgent);

const _hasVibrate =
  typeof navigator !== "undefined" && "vibrate" in navigator;

// iOS haptic via checkbox switch + label.click() (Safari 17.4+).
// <input type="checkbox" switch> triggers native Taptic Engine selection
// feedback when its associated <label> is clicked — silent, no AudioContext.
// Must be called from within a user-gesture handler (e.g. touchmove, touchstart).
const _CB_ID = "__cucaracha_haptic_cb__";
let _labelEl: HTMLLabelElement | null = null;

function _getLabel(): HTMLLabelElement | null {
  if (typeof document === "undefined") return null;
  if (_labelEl) return _labelEl;
  try {
    const cb = document.createElement("input");
    cb.type = "checkbox";
    cb.id = _CB_ID;
    cb.setAttribute("switch", "");
    cb.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;clip:rect(0,0,0,0);";

    const label = document.createElement("label");
    label.htmlFor = _CB_ID;
    label.style.cssText =
      "position:absolute;width:1px;height:1px;opacity:0;pointer-events:none;clip:rect(0,0,0,0);";

    document.body.appendChild(cb);
    document.body.appendChild(label);
    _labelEl = label;
  } catch {
    _labelEl = null;
  }
  return _labelEl;
}

function _iosHaptic(): void {
  const label = _getLabel();
  if (!label) return;
  try {
    label.click();
  } catch {
    // Silently ignore if the trick isn't supported.
  }
}

/** Fire a haptic pulse.
 *  - Android / Chrome: Web Vibration API — true vibe motor.
 *  - iOS Safari / PWA (17.4+): hidden checkbox switch + label.click() — fires
 *    native Taptic Engine selection feedback, silent, no AudioContext needed.
 *    Must be called from a user-gesture handler (touchmove/touchstart).
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
