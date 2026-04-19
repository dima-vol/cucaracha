"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

/**
 * Keeps the horizontal scroll position of every registered bar in lock-step
 * with whatever bar the user is actively touching, and — after the scroll
 * settles — gently eases the whole group onto the nearest hour boundary so
 * the grid always lines up.
 *
 * Two deliberate design choices:
 *
 * 1. Consumers register via a ref *callback*, not a ref *object*. React
 *    calls a ref callback on every mount and unmount; a ref object is
 *    written to silently and never triggers a re-register. That means
 *    toggling list-view off and back on — which unmounts/remounts the bar
 *    divs — keeps the scroll group accurate instead of silently losing the
 *    new bars.
 *
 * 2. No overlay or CSS variable shares scroll state with anything outside
 *    the bars themselves. Current-hour / tapped-hour indicators live as
 *    box-shadows on the cells, so they're part of the bar's own
 *    compositor layer and have zero lag relative to the scroll.
 */
type Ctx = {
  register: (el: HTMLElement) => () => void;
};

const ScrollSyncCtx = createContext<Ctx | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Pixel width of one hour column. If set, we debounce-settle every bar
   *  onto the nearest multiple of this after the user stops scrolling. */
  snapWidth?: number;
  /** How long to wait after the last scroll event before settling. */
  snapIdleMs?: number;
};

export function ScrollSyncProvider({
  children,
  snapWidth,
  snapIdleMs = 120,
}: ProviderProps) {
  const nodesRef = useRef<Set<HTMLElement>>(new Set());
  const applyingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const lastSourceRef = useRef<HTMLElement | null>(null);

  const mirror = useCallback((src: HTMLElement, left: number) => {
    applyingRef.current = true;
    nodesRef.current.forEach((el) => {
      if (el !== src && el.scrollLeft !== left) el.scrollLeft = left;
    });
    requestAnimationFrame(() => {
      applyingRef.current = false;
    });
  }, []);

  const scheduleSnap = useCallback(() => {
    if (!snapWidth) return;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      const src = lastSourceRef.current;
      if (!src || !src.isConnected) return;
      const raw = src.scrollLeft;
      const target = Math.round(raw / snapWidth) * snapWidth;
      if (Math.abs(target - raw) < 0.5) return; // already on grid
      applyingRef.current = true;
      // Ease the source smoothly; mirror the exact target onto the others
      // so the column strip stays visually locked during the ease.
      try {
        src.scrollTo({ left: target, behavior: "smooth" });
      } catch {
        src.scrollLeft = target;
      }
      nodesRef.current.forEach((el) => {
        if (el === src) return;
        try {
          el.scrollTo({ left: target, behavior: "smooth" });
        } catch {
          el.scrollLeft = target;
        }
      });
      // Release the guard after the smooth easing is definitely done.
      window.setTimeout(() => {
        applyingRef.current = false;
      }, 320);
    }, snapIdleMs);
  }, [snapWidth, snapIdleMs]);

  const handleScroll = useCallback(
    (e: Event) => {
      if (applyingRef.current) return;
      const src = e.currentTarget as HTMLElement;
      lastSourceRef.current = src;
      mirror(src, src.scrollLeft);
      scheduleSnap();
    },
    [mirror, scheduleSnap]
  );

  const register = useCallback(
    (el: HTMLElement) => {
      if (nodesRef.current.has(el)) {
        // Defensive: idempotent register.
        return () => {
          el.removeEventListener("scroll", handleScroll);
          nodesRef.current.delete(el);
          if (lastSourceRef.current === el) lastSourceRef.current = null;
        };
      }
      // When a new bar mounts (e.g. list-view toggled back on), land it at
      // whatever scrollLeft the live group is using so it slides in at the
      // same position instead of jumping to 0.
      const anchor = firstLive(nodesRef.current);
      if (anchor && anchor.scrollLeft !== el.scrollLeft) {
        el.scrollLeft = anchor.scrollLeft;
      }
      nodesRef.current.add(el);
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleScroll);
        nodesRef.current.delete(el);
        if (lastSourceRef.current === el) lastSourceRef.current = null;
      };
    },
    [handleScroll]
  );

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <ScrollSyncCtx.Provider value={{ register }}>
      {children}
    </ScrollSyncCtx.Provider>
  );
}

function firstLive(set: Set<HTMLElement>): HTMLElement | null {
  for (const el of set) {
    if (el.isConnected) return el;
  }
  return null;
}

/**
 * Returns a ref *callback*. Attach it to the scrollable bar div — React
 * calls it on every mount with the element and on every unmount with
 * null, which keeps the sync group accurate across list-view toggles,
 * drag-drop reorders, and anything else that can re-mount the bar.
 */
export function useScrollSync() {
  const ctx = useContext(ScrollSyncCtx);
  const cleanupRef = useRef<(() => void) | null>(null);
  return useCallback(
    (el: HTMLElement | null) => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
      if (el && ctx) {
        cleanupRef.current = ctx.register(el);
      }
    },
    [ctx]
  );
}
