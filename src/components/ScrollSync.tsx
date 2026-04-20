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
 * settles — gently eases the whole group onto the nearest hour boundary.
 *
 * Two deliberate design choices:
 *
 * 1. Consumers register via a ref *callback*, not a ref *object*. React
 *    calls a ref callback on every mount and unmount; a ref object is
 *    written to silently and never triggers a re-register. That means
 *    toggling list-view off and back on — which unmounts/remounts the bar
 *    divs — keeps the scroll group accurate instead of silently losing
 *    the new bars.
 *
 * 2. The settle animation is driven by a *single* requestAnimationFrame
 *    loop that updates every bar's scrollLeft inside one frame. The
 *    browser's own smooth-scroll easing runs each element on its own
 *    schedule, which produces a visible "ripple" across the rows; doing
 *    the work ourselves guarantees lock-step.
 */
type Ctx = {
  register: (el: HTMLElement) => () => void;
};

const ScrollSyncCtx = createContext<Ctx | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** Pixel width of one hour column. If set, we settle every bar onto the
   *  nearest multiple after the user stops scrolling. */
  snapWidth?: number;
  /** How long to wait after the last scroll event before settling. */
  snapIdleMs?: number;
  /** Settle animation duration. */
  settleMs?: number;
};

export function ScrollSyncProvider({
  children,
  snapWidth,
  snapIdleMs = 110,
  settleMs = 220,
}: ProviderProps) {
  const nodesRef = useRef<Set<HTMLElement>>(new Set());
  const applyingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSourceRef = useRef<HTMLElement | null>(null);

  const cancelAnim = useCallback(() => {
    if (animFrameRef.current != null) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
  }, []);

  // Mirror is synchronous: we want every bar to move within the same paint
  // cycle as the source. Doing it inside requestAnimationFrame would queue
  // the mirror behind the source's natural scroll, which is what creates
  // the "ripple" feeling.
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
      if (Math.abs(target - raw) < 0.5) return;

      // Snapshot every connected bar's start position so we can tween them
      // all in lock-step. This is the key to "no ripple": one RAF callback
      // updates every bar to the same eased value within one frame.
      const elements: HTMLElement[] = [];
      const starts = new Map<HTMLElement, number>();
      nodesRef.current.forEach((el) => {
        if (!el.isConnected) return;
        elements.push(el);
        starts.set(el, el.scrollLeft);
      });
      if (elements.length === 0) return;

      cancelAnim();
      applyingRef.current = true;
      const startTime = performance.now();
      const tick = (now: number) => {
        const t = Math.min(1, (now - startTime) / settleMs);
        const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
        for (const el of elements) {
          const start = starts.get(el) ?? 0;
          el.scrollLeft = start + (target - start) * eased;
        }
        if (t < 1) {
          animFrameRef.current = requestAnimationFrame(tick);
        } else {
          animFrameRef.current = null;
          // Final exact snap to clear any sub-pixel residue.
          for (const el of elements) el.scrollLeft = target;
          applyingRef.current = false;
        }
      };
      animFrameRef.current = requestAnimationFrame(tick);
    }, snapIdleMs);
  }, [snapWidth, snapIdleMs, settleMs, cancelAnim]);

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
      cancelAnim();
    };
  }, [cancelAnim]);

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
