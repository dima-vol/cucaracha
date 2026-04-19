"use client";

import { useState, useSyncExternalStore } from "react";
import { Share, X } from "lucide-react";

const DISMISS_KEY = "cucaracha-tz:install-hint-dismissed";

type Platform = "ios" | "android" | "desktop" | "standalone" | "unknown";

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "unknown";
  const standalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    // @ts-expect-error iOS Safari-only
    window.navigator.standalone === true;
  if (standalone) return "standalone";
  const ua = window.navigator.userAgent;
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

// Never-changing external sources: subscribe is a no-op, snapshot is evaluated
// once on the client and never on the server. This keeps platform/dismissed
// state out of useEffect without causing hydration mismatches.
const noop = () => () => {};
const getPlatformSnapshot = () => detectPlatform();
const getDismissedSnapshot = () =>
  typeof window !== "undefined" &&
  window.localStorage.getItem(DISMISS_KEY) === "1";

export function InstallHint() {
  const platform = useSyncExternalStore(
    noop,
    getPlatformSnapshot,
    () => "unknown" as Platform
  );
  const initiallyDismissed = useSyncExternalStore(
    noop,
    getDismissedSnapshot,
    () => true
  );
  const [manuallyDismissed, setManuallyDismissed] = useState(false);
  const dismissed = initiallyDismissed || manuallyDismissed;

  if (
    dismissed ||
    platform === "standalone" ||
    platform === "desktop" ||
    platform === "unknown"
  ) {
    return null;
  }

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {}
    setManuallyDismissed(true);
  };

  return (
    <div className="bg-[var(--accent-soft)] border-b border-[var(--border)] px-4 py-2.5 flex items-center gap-3 text-[13px]">
      <Share size={16} className="text-[var(--accent)] flex-none" />
      {platform === "ios" ? (
        <span className="flex-1 text-slate-700">
          Add to Home Screen: tap <b>Share</b>, then <b>Add to Home Screen</b>.
        </span>
      ) : (
        <span className="flex-1 text-slate-700">
          Install app: open the browser menu and tap <b>Install app</b>.
        </span>
      )}
      <button
        type="button"
        aria-label="Dismiss"
        onClick={dismiss}
        className="w-6 h-6 rounded-full text-slate-400 hover:text-slate-700 flex items-center justify-center"
      >
        <X size={14} />
      </button>
    </div>
  );
}
