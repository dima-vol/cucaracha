"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

type Ctx = {
  registerScroller: (el: HTMLElement) => () => void;
  registerContainer: (el: HTMLElement | null) => void;
};

const ScrollSyncCtx = createContext<Ctx | null>(null);

type ProviderProps = {
  children: ReactNode;
  /** If set, the scroll is debounced-snapped to the nearest multiple of
   *  this pixel value on scroll end. Feels like iOS picker wheels: free
   *  momentum, then a gentle settle onto the grid. */
  snapWidth?: number;
  /** Debounce in ms before we consider scrolling "ended". */
  snapIdleMs?: number;
};

export function ScrollSyncProvider({
  children,
  snapWidth,
  snapIdleMs = 110,
}: ProviderProps) {
  const nodesRef = useRef<Set<HTMLElement>>(new Set());
  const containerRef = useRef<HTMLElement | null>(null);
  const applyingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const lastSourceRef = useRef<HTMLElement | null>(null);

  const broadcast = useCallback((left: number) => {
    const c = containerRef.current;
    if (c) c.style.setProperty("--scroll-x", `${left}px`);
  }, []);

  const scheduleSnap = useCallback(() => {
    if (!snapWidth) return;
    if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    idleTimerRef.current = window.setTimeout(() => {
      const src = lastSourceRef.current;
      if (!src) return;
      const raw = src.scrollLeft;
      const snapped = Math.round(raw / snapWidth) * snapWidth;
      if (Math.abs(snapped - raw) < 0.5) {
        // Already on grid — still propagate to be safe.
        applyingRef.current = true;
        nodesRef.current.forEach((el) => {
          if (el !== src) el.scrollLeft = snapped;
        });
        broadcast(snapped);
        requestAnimationFrame(() => {
          applyingRef.current = false;
        });
        return;
      }
      // Smooth-ease the source to the nearest hour; mirror that target on
      // siblings instantly so they stay locked to the source visually even
      // while it's easing.
      applyingRef.current = true;
      try {
        src.scrollTo({ left: snapped, behavior: "smooth" });
      } catch {
        src.scrollLeft = snapped;
      }
      nodesRef.current.forEach((el) => {
        if (el === src) return;
        try {
          el.scrollTo({ left: snapped, behavior: "smooth" });
        } catch {
          el.scrollLeft = snapped;
        }
      });
      broadcast(snapped);
      // Release the guard after the smooth animation would have finished
      // (~300ms is a safe upper bound).
      window.setTimeout(() => {
        applyingRef.current = false;
      }, 320);
    }, snapIdleMs);
  }, [snapWidth, snapIdleMs, broadcast]);

  const handleScroll = useCallback(
    (e: Event) => {
      if (applyingRef.current) return;
      const src = e.currentTarget as HTMLElement;
      const left = src.scrollLeft;
      lastSourceRef.current = src;
      applyingRef.current = true;
      nodesRef.current.forEach((el) => {
        if (el !== src) el.scrollLeft = left;
      });
      broadcast(left);
      requestAnimationFrame(() => {
        applyingRef.current = false;
      });
      scheduleSnap();
    },
    [broadcast, scheduleSnap]
  );

  const registerScroller = useCallback(
    (el: HTMLElement) => {
      nodesRef.current.add(el);
      el.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        el.removeEventListener("scroll", handleScroll);
        nodesRef.current.delete(el);
      };
    },
    [handleScroll]
  );

  const registerContainer = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
    if (el) el.style.setProperty("--scroll-x", "0px");
  }, []);

  useEffect(() => {
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current);
    };
  }, []);

  return (
    <ScrollSyncCtx.Provider value={{ registerScroller, registerContainer }}>
      {children}
    </ScrollSyncCtx.Provider>
  );
}

export function useScrollSync(ref: React.RefObject<HTMLElement | null>) {
  const ctx = useContext(ScrollSyncCtx);
  useEffect(() => {
    if (!ctx || !ref.current) return;
    return ctx.registerScroller(ref.current);
  }, [ctx, ref]);
  return ctx;
}

export function useScrollSyncContainer(
  ref: React.RefObject<HTMLElement | null>
) {
  const ctx = useContext(ScrollSyncCtx);
  useEffect(() => {
    if (!ctx) return;
    ctx.registerContainer(ref.current);
    return () => ctx.registerContainer(null);
  }, [ctx, ref]);
}
